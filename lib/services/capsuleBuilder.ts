/**
 * Capsule Builder Service
 * Iteration 24: Build minimized Compare Capsules from user's vault
 *
 * Builds filtered capsules based on consent config:
 * - Filter by selected topics (tags)
 * - Filter out sensitive items if toggle is off
 * - Select top 3-5 items per topic
 * - Extract title + excerpt (truncated)
 * - Aggregate swipe stats by theme
 * - Calculate token estimate
 */

import * as SQLite from 'expo-sqlite';
import {
  ConsentConfig,
  CompareCapsule,
  CapsuleItem,
  CapsuleSwipeSummary,
  ThemeCount,
  DeviceSignature,
  ShareLevel,
} from '../sync/types';
import { MediaItemWithTags, TagWithCount, SwipeEventWithMedia, SwipeDecision } from '../storage/types';
import * as repos from '../storage/repositories';

// Constants
const MAX_EXCERPT_LENGTH = 200;
const MAX_ITEMS_PER_TOPIC = 5;
const SENSITIVE_TAG_NAME = 'sensitive';

export interface BuildCapsuleOptions {
  sessionId: string;
  config: ConsentConfig;
  partnerSignature: DeviceSignature;
}

/**
 * Truncate text to max length, adding ellipsis if truncated
 */
function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength - 3) + '...';
}

/**
 * Extract excerpt from item (notes or extracted_text)
 */
function extractExcerpt(item: MediaItemWithTags): string {
  // Prefer notes, then extracted_text, then title
  const text = item.notes || item.extracted_text || item.title || '';
  return truncateText(text, MAX_EXCERPT_LENGTH);
}

/**
 * Check if item has the sensitive tag
 */
function isSensitiveItem(item: MediaItemWithTags): boolean {
  return item.tags.some(
    (t) => t.name.toLowerCase() === SENSITIVE_TAG_NAME || t.slug === SENSITIVE_TAG_NAME
  );
}

/**
 * Get tag names from an item
 */
function getTagNames(item: MediaItemWithTags): string[] {
  return item.tags.map((t) => t.name);
}

/**
 * Determine share level based on consent mode
 */
function determineShareLevel(mode: string): ShareLevel {
  switch (mode) {
    case 'friend':
      return 'snippet'; // More sharing
    case 'heart':
      return 'full'; // Maximum sharing
    case 'custom':
    default:
      return 'title'; // Minimal sharing
  }
}

/**
 * Get all available topics (tags with usage count > 0)
 */
export async function getAvailableTopics(
  db: SQLite.SQLiteDatabase
): Promise<TagWithCount[]> {
  return await repos.listTags(db, {
    minUsageCount: 1,
    sortBy: 'count',
    sortDirection: 'DESC',
    limit: 50,
  });
}

/**
 * Get items matching specific topics (tags)
 * Uses batch query to avoid N+1 performance issues
 */
async function getItemsForTopics(
  db: SQLite.SQLiteDatabase,
  topics: string[],
  limit: number = 50
): Promise<MediaItemWithTags[]> {
  if (topics.length === 0) return [];

  // Collect unique item IDs from all topics
  const itemIds = new Set<string>();

  for (const topic of topics) {
    const items = await repos.listMediaItems(db, {
      tags: [topic],
      limit,
      orderBy: 'created_at',
      orderDirection: 'DESC',
    });

    for (const item of items) {
      itemIds.add(item.id);
    }
  }

  if (itemIds.size === 0) return [];

  // Batch fetch all items with tags in a single query (avoids N+1)
  const fullItems = await repos.getMediaItemsBatch(db, Array.from(itemIds));

  return fullItems;
}

/**
 * Get swipe summary by theme/tag
 */
async function getSwipeSummaryByTheme(
  db: SQLite.SQLiteDatabase
): Promise<CapsuleSwipeSummary> {
  const likedThemes = new Map<string, number>();
  const dislikedThemes = new Map<string, number>();

  // Get recent swipe events with media data
  const events = await repos.getSwipeEventsWithMedia(db, { limit: 200 });

  for (const event of events) {
    if (!event.media_tags_json) continue;

    let tags: string[] = [];
    try {
      tags = JSON.parse(event.media_tags_json);
    } catch {
      continue;
    }

    for (const tag of tags) {
      if (event.decision === 'like' || event.decision === 'super_like') {
        likedThemes.set(tag, (likedThemes.get(tag) || 0) + 1);
      } else if (event.decision === 'dislike') {
        dislikedThemes.set(tag, (dislikedThemes.get(tag) || 0) + 1);
      }
    }
  }

  // Convert to sorted arrays (top 10)
  const likedArray: ThemeCount[] = Array.from(likedThemes.entries())
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const dislikedArray: ThemeCount[] = Array.from(dislikedThemes.entries())
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    likedThemes: likedArray,
    dislikedThemes: dislikedArray,
  };
}

/**
 * Estimate token count for a capsule
 * Rough estimate: ~4 chars per token
 */
export function estimateTokens(capsule: CompareCapsule): number {
  let chars = 0;

  for (const item of capsule.items) {
    chars += (item.title?.length || 0);
    chars += (item.excerpt?.length || 0);
    chars += item.tags.join(' ').length;
  }

  // Add swipe summary
  chars += JSON.stringify(capsule.swipeSummary).length;

  // Add some overhead for structure
  chars += 100;

  return Math.ceil(chars / 4);
}

/**
 * Estimate cost based on tokens and provider
 * Returns cost in cents (placeholder for Iteration 25)
 */
export function estimateCost(tokens: number, provider: string | null): number {
  if (!provider) return 0; // Local = free

  // Placeholder rates per 1K tokens (in cents)
  const rates: Record<string, number> = {
    openai: 0.2,    // $0.002 per 1K tokens
    gemini: 0.1,    // $0.001 per 1K tokens
    claude: 0.3,    // $0.003 per 1K tokens
  };

  return Math.ceil((tokens / 1000) * (rates[provider] || 0.2) * 100) / 100;
}

/**
 * Build a Compare Capsule based on consent configuration
 */
export async function buildCompareCapsule(
  db: SQLite.SQLiteDatabase,
  options: BuildCapsuleOptions
): Promise<CompareCapsule> {
  const { sessionId, config, partnerSignature } = options;

  // Determine topics to include
  let topics = config.selectedTopics;

  // If no topics selected, use partner's top tags as hints
  if (topics.length === 0 && partnerSignature.topTags.length > 0) {
    topics = partnerSignature.topTags.slice(0, 5);
  }

  // Get items matching selected topics
  const allItems = await getItemsForTopics(db, topics, 100);

  // Filter out sensitive items if toggle is off
  let filteredItems = allItems;
  if (!config.includeSensitive) {
    filteredItems = allItems.filter((item) => !isSensitiveItem(item));
  }

  // Group items by topic and select top N per topic
  const itemsByTopic = new Map<string, MediaItemWithTags[]>();

  for (const item of filteredItems) {
    const itemTags = getTagNames(item);
    for (const topic of topics) {
      if (itemTags.includes(topic)) {
        if (!itemsByTopic.has(topic)) {
          itemsByTopic.set(topic, []);
        }
        const topicItems = itemsByTopic.get(topic)!;
        if (topicItems.length < MAX_ITEMS_PER_TOPIC) {
          topicItems.push(item);
        }
      }
    }
  }

  // Deduplicate items across topics
  const selectedItemIds = new Set<string>();
  const capsuleItems: CapsuleItem[] = [];
  const shareLevel = determineShareLevel(config.mode);

  for (const [topic, items] of itemsByTopic) {
    for (const item of items) {
      if (selectedItemIds.has(item.id)) continue;
      selectedItemIds.add(item.id);

      capsuleItems.push({
        itemId: item.id,
        title: item.title || 'Untitled',
        excerpt: extractExcerpt(item),
        tags: getTagNames(item),
        shareLevel,
      });
    }
  }

  // Get swipe summary
  const swipeSummary = await getSwipeSummaryByTheme(db);

  // Build the capsule
  const capsule: CompareCapsule = {
    sessionId,
    mode: config.mode,
    items: capsuleItems,
    swipeSummary,
    tokenEstimate: 0, // Will be calculated below
    createdAt: Date.now(),
  };

  // Calculate token estimate
  capsule.tokenEstimate = estimateTokens(capsule);

  return capsule;
}

/**
 * Get category counts from capsule items
 * Groups by first tag (primary category)
 */
export function getCategoryCounts(capsule: CompareCapsule): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const item of capsule.items) {
    const primaryTag = item.tags[0] || 'uncategorized';
    counts[primaryTag] = (counts[primaryTag] || 0) + 1;
  }

  return counts;
}

/**
 * Default consent config
 */
export function getDefaultConsentConfig(): ConsentConfig {
  return {
    mode: 'friend',
    selectedTopics: [],
    includeSensitive: false,
    useCloud: false,
    cloudProvider: null,
  };
}
