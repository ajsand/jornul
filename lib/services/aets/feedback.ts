/**
 * AETS Feedback Service
 * Connects swipe signals to tag confidence updates
 *
 * When users swipe on items, their implicit feedback (like/dislike)
 * adjusts the confidence scores of tags associated with those items.
 * This creates a feedback loop that improves future recommendations.
 */

import * as SQLite from 'expo-sqlite';
import { SwipeDecision } from '@/lib/storage/types';
import * as repos from '@/lib/storage/repositories';

// ============ Configuration ============

/** Weight factors for different swipe decisions */
const DECISION_FACTORS: Record<SwipeDecision, number> = {
  super_like: 1.15, // 15% boost
  like: 1.10,       // 10% boost
  dislike: 0.95,    // 5% reduction
  skip: 1.00,       // No change
};

/** Minimum confidence floor (never go below this) */
const CONFIDENCE_FLOOR = 0.1;

/** Maximum confidence ceiling */
const CONFIDENCE_CEILING = 1.0;

// ============ Types ============

export interface TagFeedbackResult {
  tag: string;
  tagId: number;
  oldConfidence: number;
  newConfidence: number;
  decision: SwipeDecision;
}

// ============ Main Functions ============

/**
 * Process swipe feedback and update tag confidence
 *
 * When a user swipes on an item:
 * - Like/Super-like: Boost confidence of item's tags
 * - Dislike: Reduce confidence of item's tags (but don't delete)
 * - Skip: No change
 *
 * This is a "soft" signal - it doesn't dramatically change preferences
 * but gradually shapes the tag universe based on user behavior.
 */
export async function processSwipeFeedback(
  db: SQLite.SQLiteDatabase,
  mediaId: string,
  decision: SwipeDecision,
  tagsJson: string | null
): Promise<TagFeedbackResult[]> {
  const results: TagFeedbackResult[] = [];

  // Skip processing for neutral decisions
  if (decision === 'skip') {
    return results;
  }

  // Parse tags from the media item
  const tags = parseTags(tagsJson);
  if (tags.length === 0) {
    return results;
  }

  const factor = DECISION_FACTORS[decision];

  for (const tagName of tags) {
    try {
      const result = await adjustTagConfidence(db, tagName, factor, decision);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.warn(`[AETS Feedback] Failed to adjust tag "${tagName}":`, error);
    }
  }

  if (results.length > 0) {
    console.log(
      `[AETS Feedback] Processed ${decision} for ${results.length} tags: ` +
      `${results.map(r => `${r.tag} (${r.oldConfidence.toFixed(2)} → ${r.newConfidence.toFixed(2)})`).join(', ')}`
    );
  }

  return results;
}

/**
 * Adjust confidence for a single tag across all items that have it
 * This is a global adjustment - it affects the tag's overall "strength"
 */
async function adjustTagConfidence(
  db: SQLite.SQLiteDatabase,
  tagName: string,
  factor: number,
  decision: SwipeDecision
): Promise<TagFeedbackResult | null> {
  // Get the tag by name
  const tag = await repos.getTagByName(db, tagName.toLowerCase());
  if (!tag) {
    // Tag doesn't exist in our system - this is for catalog items, not user items
    return null;
  }

  // Get current average confidence for this tag
  const avgConfidence = await getAverageTagConfidence(db, tag.id);
  if (avgConfidence === null) {
    return null;
  }

  // Calculate new confidence
  let newConfidence = avgConfidence * factor;
  newConfidence = Math.max(CONFIDENCE_FLOOR, Math.min(CONFIDENCE_CEILING, newConfidence));

  // Only update if there's a meaningful change
  if (Math.abs(newConfidence - avgConfidence) < 0.001) {
    return null;
  }

  // Update all item_tags entries for this tag with the adjustment factor
  await applyConfidenceAdjustment(db, tag.id, factor);

  return {
    tag: tagName,
    tagId: tag.id,
    oldConfidence: avgConfidence,
    newConfidence,
    decision,
  };
}

/**
 * Get average confidence for a tag across all items
 */
async function getAverageTagConfidence(
  db: SQLite.SQLiteDatabase,
  tagId: number
): Promise<number | null> {
  const result = await db.getFirstAsync<{ avg_conf: number | null }>(
    `SELECT AVG(confidence) as avg_conf FROM item_tags WHERE tag_id = ? AND confidence IS NOT NULL`,
    [tagId]
  );
  return result?.avg_conf ?? null;
}

/**
 * Apply a confidence adjustment factor to all items with a tag
 */
async function applyConfidenceAdjustment(
  db: SQLite.SQLiteDatabase,
  tagId: number,
  factor: number
): Promise<void> {
  // Clamp the result to [FLOOR, CEILING]
  await db.runAsync(
    `UPDATE item_tags
     SET confidence = MIN(?, MAX(?, confidence * ?))
     WHERE tag_id = ? AND confidence IS NOT NULL`,
    [CONFIDENCE_CEILING, CONFIDENCE_FLOOR, factor, tagId]
  );
}

// ============ Utility Functions ============

/**
 * Parse tags from JSON string safely
 */
function parseTags(tagsJson: string | null): string[] {
  if (!tagsJson) return [];
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed) ? parsed.filter(t => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Boost confidence for a specific tag (called externally if needed)
 */
export async function boostTagConfidence(
  db: SQLite.SQLiteDatabase,
  tagName: string,
  boostFactor: number = 1.1
): Promise<boolean> {
  const result = await adjustTagConfidence(db, tagName, boostFactor, 'like');
  return result !== null;
}

/**
 * Reduce confidence for a specific tag (called externally if needed)
 */
export async function reduceTagConfidence(
  db: SQLite.SQLiteDatabase,
  tagName: string,
  reduceFactor: number = 0.95
): Promise<boolean> {
  const result = await adjustTagConfidence(db, tagName, reduceFactor, 'dislike');
  return result !== null;
}

/**
 * Get feedback summary for debugging
 */
export async function getFeedbackSummary(
  db: SQLite.SQLiteDatabase
): Promise<{ tagCount: number; avgConfidence: number }> {
  const result = await db.getFirstAsync<{ tag_count: number; avg_conf: number }>(
    `SELECT COUNT(DISTINCT tag_id) as tag_count, AVG(confidence) as avg_conf
     FROM item_tags WHERE confidence IS NOT NULL`
  );
  return {
    tagCount: result?.tag_count ?? 0,
    avgConfidence: result?.avg_conf ?? 0,
  };
}
