/**
 * Swipe Ranker Service
 * Intelligent ranking for swipe deck with explore/exploit balance
 *
 * Features:
 * - Cold start: Stratified sampling across types from top popularity
 * - Warm start: Preference-weighted scoring from swipe history
 * - Diversity constraint: Avoid repeating same type/tag too often
 * - Epsilon-greedy exploration: Random exploration items
 */

import { SwipeMedia, SwipeEventWithMedia, SwipeDecision, TagWithCount, MediaType } from '@/lib/storage/types';

// ============ Configuration ============

export interface RankerConfig {
  /** Probability of showing a random "explore" item (0-1) */
  epsilonExplore: number;
  /** How many recent items to check for diversity (avoid same type/tag) */
  diversityWindow: number;
  /** Number of swipes before personalization kicks in */
  coldStartThreshold: number;
  /** Half-life for recency decay in milliseconds (older swipes count less) */
  decayHalfLife: number;
}

export const DEFAULT_CONFIG: RankerConfig = {
  epsilonExplore: 0.15,
  diversityWindow: 3,
  coldStartThreshold: 10,
  decayHalfLife: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ============ Types ============

export type RankReason = 'trending' | 'preference' | 'explore' | 'diverse';

export interface RankedItem {
  item: SwipeMedia;
  score: number;
  reason: RankReason;
  matchedTags?: string[];
}

export interface TagPreference {
  weight: number;
  count: number;
}

export interface TypePreference {
  weight: number;
  count: number;
}

export interface PreferenceProfile {
  tags: Map<string, TagPreference>;
  types: Map<string, TypePreference>;
  totalSwipes: number;
  lastUpdated: number;
}

// ============ Preference Computation ============

/**
 * Convert swipe decision to a numerical weight
 */
function decisionToWeight(decision: SwipeDecision): number {
  switch (decision) {
    case 'super_like':
      return 2.0;
    case 'like':
      return 1.0;
    case 'dislike':
      return -0.5;
    case 'skip':
      return 0;
    default:
      return 0;
  }
}

/**
 * Calculate recency decay factor (exponential decay)
 */
function recencyDecay(timestamp: number, now: number, halfLife: number): number {
  const age = now - timestamp;
  return Math.exp((-age * Math.LN2) / halfLife);
}

/**
 * Parse tags from JSON string safely
 */
function parseTags(tagsJson: string | null): string[] {
  if (!tagsJson) return [];
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Compute user preferences from swipe history
 */
export function computePreferences(
  events: SwipeEventWithMedia[],
  config: RankerConfig = DEFAULT_CONFIG
): PreferenceProfile {
  const now = Date.now();
  const tagScores = new Map<string, { positive: number; negative: number; count: number }>();
  const typeScores = new Map<string, { positive: number; negative: number; count: number }>();

  for (const event of events) {
    const baseWeight = decisionToWeight(event.decision);
    const recency = recencyDecay(event.created_at, now, config.decayHalfLife);
    const weight = baseWeight * recency;

    // Accumulate tag scores
    const tags = parseTags(event.media_tags_json);
    for (const tag of tags) {
      const existing = tagScores.get(tag) || { positive: 0, negative: 0, count: 0 };
      if (weight > 0) {
        existing.positive += weight;
      } else if (weight < 0) {
        existing.negative += Math.abs(weight);
      }
      existing.count += 1;
      tagScores.set(tag, existing);
    }

    // Accumulate type scores
    const type = event.media_type;
    const existingType = typeScores.get(type) || { positive: 0, negative: 0, count: 0 };
    if (weight > 0) {
      existingType.positive += weight;
    } else if (weight < 0) {
      existingType.negative += Math.abs(weight);
    }
    existingType.count += 1;
    typeScores.set(type, existingType);
  }

  // Normalize scores to [-1, +1] range
  const tagPrefs = new Map<string, TagPreference>();
  for (const [tag, scores] of tagScores) {
    const total = scores.positive + scores.negative;
    const weight = total > 0 ? (scores.positive - scores.negative) / total : 0;
    tagPrefs.set(tag, { weight: Math.max(-1, Math.min(1, weight)), count: scores.count });
  }

  const typePrefs = new Map<string, TypePreference>();
  for (const [type, scores] of typeScores) {
    const total = scores.positive + scores.negative;
    const weight = total > 0 ? (scores.positive - scores.negative) / total : 0;
    typePrefs.set(type, { weight: Math.max(-1, Math.min(1, weight)), count: scores.count });
  }

  return {
    tags: tagPrefs,
    types: typePrefs,
    totalSwipes: events.length,
    lastUpdated: now,
  };
}

// ============ Ranking Functions ============

/**
 * Calculate diversity penalty based on recent history
 */
function calculateDiversityPenalty(
  candidate: SwipeMedia,
  recentMedia: SwipeMedia[],
  config: RankerConfig
): number {
  let penalty = 0;
  const candidateTags = parseTags(candidate.tags_json);

  // Check type repetition
  const recentTypes = recentMedia.slice(0, config.diversityWindow).map((m) => m.type);
  const typeRepeatCount = recentTypes.filter((t) => t === candidate.type).length;
  if (typeRepeatCount >= 2) {
    penalty -= 0.3;
  }

  // Check tag repetition
  const recentTags: string[] = [];
  for (const m of recentMedia.slice(0, config.diversityWindow)) {
    recentTags.push(...parseTags(m.tags_json));
  }
  for (const tag of candidateTags) {
    const tagRepeatCount = recentTags.filter((t) => t === tag).length;
    if (tagRepeatCount >= 2) {
      penalty -= 0.1;
    }
  }

  return penalty;
}

/**
 * Score a single candidate item
 */
function scoreItem(
  candidate: SwipeMedia,
  preferences: PreferenceProfile,
  recentMedia: SwipeMedia[],
  config: RankerConfig
): { score: number; reason: RankReason; matchedTags: string[] } {
  // Base score from popularity (0-0.3)
  const popularityScore = candidate.popularity_score * 0.3;

  // Preference score (only if warm start)
  let preferenceScore = 0;
  const matchedTags: string[] = [];

  if (preferences.totalSwipes >= config.coldStartThreshold) {
    const candidateTags = parseTags(candidate.tags_json);

    // Tag matching (0-0.5)
    for (const tag of candidateTags) {
      const tagPref = preferences.tags.get(tag);
      if (tagPref && tagPref.weight > 0) {
        preferenceScore += tagPref.weight * 0.1; // Up to 0.1 per matching tag
        matchedTags.push(tag);
      }
    }
    preferenceScore = Math.min(preferenceScore, 0.5);

    // Type matching (0-0.2)
    const typePref = preferences.types.get(candidate.type);
    if (typePref && typePref.weight > 0) {
      preferenceScore += typePref.weight * 0.2;
    }
  }

  // Diversity penalty (-0.4 to 0)
  const diversityPenalty = calculateDiversityPenalty(candidate, recentMedia, config);

  // Total score
  const totalScore = popularityScore + preferenceScore + diversityPenalty;

  // Determine reason
  let reason: RankReason = 'trending';
  if (preferenceScore > 0.2) {
    reason = 'preference';
  } else if (diversityPenalty < -0.2) {
    reason = 'diverse';
  }

  return { score: totalScore, reason, matchedTags };
}

/**
 * Rank all candidate items
 */
export function rankItems(
  candidates: SwipeMedia[],
  preferences: PreferenceProfile,
  recentMedia: SwipeMedia[],
  config: RankerConfig = DEFAULT_CONFIG
): RankedItem[] {
  // Score all candidates
  const scored: RankedItem[] = candidates.map((item) => {
    const { score, reason, matchedTags } = scoreItem(item, preferences, recentMedia, config);
    return { item, score, reason, matchedTags };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Apply epsilon-greedy exploration
  for (let i = 0; i < scored.length; i++) {
    if (Math.random() < config.epsilonExplore) {
      // Swap with a random item from lower positions
      const swapIndex = i + Math.floor(Math.random() * (scored.length - i));
      if (swapIndex !== i && swapIndex < scored.length) {
        const temp = scored[i];
        scored[i] = scored[swapIndex];
        scored[swapIndex] = temp;
        scored[i].reason = 'explore';
      }
    }
  }

  return scored;
}

/**
 * Get a cold start batch - stratified sample across types from top popularity
 */
export function getColdStartBatch(
  candidates: SwipeMedia[],
  batchSize?: number
): RankedItem[] {
  // Group by type
  const byType = new Map<string, SwipeMedia[]>();
  for (const item of candidates) {
    const existing = byType.get(item.type) || [];
    existing.push(item);
    byType.set(item.type, existing);
  }

  // Sort each type by popularity and take top 2
  const result: RankedItem[] = [];
  for (const [, items] of byType) {
    const sorted = [...items].sort((a, b) => b.popularity_score - a.popularity_score);
    for (const item of sorted.slice(0, 2)) {
      result.push({
        item,
        score: item.popularity_score,
        reason: 'trending',
      });
    }
  }

  // Shuffle for variety
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  // Limit if specified
  if (batchSize && batchSize < result.length) {
    return result.slice(0, batchSize);
  }

  return result;
}

/**
 * Get a warm batch - personalized ranking with preferences
 */
export function getWarmBatch(
  candidates: SwipeMedia[],
  preferences: PreferenceProfile,
  recentMedia: SwipeMedia[],
  batchSize?: number,
  config: RankerConfig = DEFAULT_CONFIG
): RankedItem[] {
  const ranked = rankItems(candidates, preferences, recentMedia, config);

  if (batchSize && batchSize < ranked.length) {
    return ranked.slice(0, batchSize);
  }

  return ranked;
}

/**
 * Convenience function to get a ranked batch based on swipe history
 * Automatically chooses cold start or warm start based on history size
 */
export function getRankedBatch(
  candidates: SwipeMedia[],
  events: SwipeEventWithMedia[],
  recentMedia: SwipeMedia[],
  config: RankerConfig = DEFAULT_CONFIG
): RankedItem[] {
  const preferences = computePreferences(events, config);

  if (preferences.totalSwipes < config.coldStartThreshold) {
    console.log('[Ranker] Cold start mode - stratified sampling');
    return getColdStartBatch(candidates);
  }

  console.log(`[Ranker] Warm start mode - ${preferences.totalSwipes} swipes analyzed`);
  return getWarmBatch(candidates, preferences, recentMedia, undefined, config);
}

// ============ Vault Integration ============

/**
 * Vault item summary for preference computation
 */
export interface VaultItemSummary {
  id: string;
  type: MediaType;
  tags: string[];
  created_at: number;
}

/**
 * Compute preference signals from vault (saved) items
 * Vault items are treated as implicit "likes" since the user chose to save them
 */
export function computeVaultPreferences(
  vaultItems: VaultItemSummary[],
  config: RankerConfig = DEFAULT_CONFIG
): PreferenceProfile {
  const now = Date.now();
  const tagScores = new Map<string, { positive: number; count: number }>();
  const typeScores = new Map<string, { positive: number; count: number }>();

  // Vault items are weighted lower than explicit swipes (0.5 vs 1.0 for likes)
  const baseWeight = 0.5;

  for (const item of vaultItems) {
    const recency = recencyDecay(item.created_at, now, config.decayHalfLife);
    const weight = baseWeight * recency;

    // Accumulate tag scores (positive only - saved items are implicit likes)
    for (const tag of item.tags) {
      const existing = tagScores.get(tag) || { positive: 0, count: 0 };
      existing.positive += weight;
      existing.count += 1;
      tagScores.set(tag, existing);
    }

    // Accumulate type scores
    const existingType = typeScores.get(item.type) || { positive: 0, count: 0 };
    existingType.positive += weight;
    existingType.count += 1;
    typeScores.set(item.type, existingType);
  }

  // Convert to preference format (all positive since vault = implicit likes)
  const tagPrefs = new Map<string, TagPreference>();
  for (const [tag, scores] of tagScores) {
    // Normalize by sqrt of count to avoid over-weighting common tags
    const normalizedWeight = scores.positive / Math.sqrt(Math.max(1, scores.count));
    tagPrefs.set(tag, { weight: Math.min(1, normalizedWeight), count: scores.count });
  }

  const typePrefs = new Map<string, TypePreference>();
  for (const [type, scores] of typeScores) {
    const normalizedWeight = scores.positive / Math.sqrt(Math.max(1, scores.count));
    typePrefs.set(type, { weight: Math.min(1, normalizedWeight), count: scores.count });
  }

  return {
    tags: tagPrefs,
    types: typePrefs,
    totalSwipes: vaultItems.length, // Treat each vault item as 1 "swipe equivalent"
    lastUpdated: now,
  };
}

/**
 * Merge swipe-based preferences with vault-based preferences
 * Swipe preferences are weighted more heavily (explicit signals)
 * Vault preferences provide additional context (implicit signals)
 */
export function mergePreferences(
  swipePrefs: PreferenceProfile,
  vaultPrefs: PreferenceProfile,
  swipeWeight: number = 0.7,
  vaultWeight: number = 0.3
): PreferenceProfile {
  const mergedTags = new Map<string, TagPreference>();
  const mergedTypes = new Map<string, TypePreference>();

  // Collect all unique tags
  const allTags = new Set([...swipePrefs.tags.keys(), ...vaultPrefs.tags.keys()]);
  for (const tag of allTags) {
    const swipePref = swipePrefs.tags.get(tag);
    const vaultPref = vaultPrefs.tags.get(tag);

    let combinedWeight = 0;
    let combinedCount = 0;

    if (swipePref) {
      combinedWeight += swipePref.weight * swipeWeight;
      combinedCount += swipePref.count;
    }
    if (vaultPref) {
      combinedWeight += vaultPref.weight * vaultWeight;
      combinedCount += vaultPref.count;
    }

    mergedTags.set(tag, {
      weight: Math.max(-1, Math.min(1, combinedWeight)),
      count: combinedCount,
    });
  }

  // Collect all unique types
  const allTypes = new Set([...swipePrefs.types.keys(), ...vaultPrefs.types.keys()]);
  for (const type of allTypes) {
    const swipePref = swipePrefs.types.get(type);
    const vaultPref = vaultPrefs.types.get(type);

    let combinedWeight = 0;
    let combinedCount = 0;

    if (swipePref) {
      combinedWeight += swipePref.weight * swipeWeight;
      combinedCount += swipePref.count;
    }
    if (vaultPref) {
      combinedWeight += vaultPref.weight * vaultWeight;
      combinedCount += vaultPref.count;
    }

    mergedTypes.set(type, {
      weight: Math.max(-1, Math.min(1, combinedWeight)),
      count: combinedCount,
    });
  }

  return {
    tags: mergedTags,
    types: mergedTypes,
    totalSwipes: swipePrefs.totalSwipes + vaultPrefs.totalSwipes,
    lastUpdated: Date.now(),
  };
}
