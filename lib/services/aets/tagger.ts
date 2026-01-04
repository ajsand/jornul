/**
 * AETS Tagger Service
 * Automatic Emergent Tag System - discovers tags from user content
 * No preset tags - all tags emerge from the user's actual data
 */

import * as SQLite from 'expo-sqlite';
import * as repos from '@/lib/storage/repositories';
import { MediaItem, Tag, TagKind, TagSource } from '@/lib/storage/types';
import {
  extractKeyphrases,
  extractTitleKeyphrases,
  extractDomainTokens,
  extractFilenameTokens,
  normalizeTagName,
} from './keyphrase';
import { isAnyStopword } from './wordLists';

// Maximum tags to assign per item
const MAX_TAGS_PER_ITEM = 5;

// Minimum score threshold for auto-tagging
const MIN_SCORE_THRESHOLD = 0.3;

export interface TagCandidate {
  name: string;
  score: number;
  source: TagSource;
}

export interface TaggingResult {
  itemId: string;
  tagsAssigned: number;
  tags: Array<{ name: string; score: number }>;
}

/**
 * Generate a slug from a tag name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Check if a candidate is a quality tag
 * Filters out stopwords and weak single-word tags
 */
function isQualityTag(name: string): boolean {
  const words = name.split(/\s+/);

  // Multi-word phrases are generally higher quality
  if (words.length >= 2) {
    // But still filter if all words are stopwords
    const meaningfulWords = words.filter(w => !isAnyStopword(w) && w.length >= 3);
    return meaningfulWords.length >= 1;
  }

  // For single words, apply stricter filtering
  const singleWord = words[0];

  // Must not be a stopword
  if (isAnyStopword(singleWord)) {
    return false;
  }

  // Must be at least 4 characters for single words
  if (singleWord.length < 4) {
    return false;
  }

  return true;
}

/**
 * Merge and deduplicate tag candidates, keeping highest score for each
 * Also applies quality filtering and boosts multi-word phrases
 */
function mergeCandidates(candidates: TagCandidate[]): TagCandidate[] {
  const merged = new Map<string, TagCandidate>();

  for (const candidate of candidates) {
    const normalized = normalizeTagName(candidate.name);
    if (!normalized || normalized.length < 3) continue;

    // Apply quality filtering
    if (!isQualityTag(normalized)) continue;

    // Boost score for multi-word phrases (they're more specific)
    const isMultiWord = normalized.includes(' ');
    const adjustedScore = isMultiWord ? candidate.score * 1.1 : candidate.score;

    const existing = merged.get(normalized);
    if (!existing || existing.score < adjustedScore) {
      merged.set(normalized, { ...candidate, name: normalized, score: adjustedScore });
    }
  }

  return Array.from(merged.values());
}

/**
 * Extract tag candidates from a media item
 */
export function extractTagCandidates(item: MediaItem): TagCandidate[] {
  const candidates: TagCandidate[] = [];

  // 1. Extract from URL domain (for link items)
  if (item.type === 'url' && item.source_url) {
    const domainTags = extractDomainTokens(item.source_url);
    candidates.push(...domainTags.map(kp => ({
      name: kp.phrase,
      score: kp.score,
      source: 'heuristic' as TagSource,
    })));
  }

  // 2. Extract from title
  if (item.title) {
    const titleTags = extractTitleKeyphrases(item.title);
    candidates.push(...titleTags.map(kp => ({
      name: kp.phrase,
      score: kp.score,
      source: 'heuristic' as TagSource,
    })));
  }

  // 3. Extract from text content (notes)
  if (item.type === 'text' && item.extracted_text) {
    const textTags = extractKeyphrases(item.extracted_text, 5);
    candidates.push(...textTags.map(kp => ({
      name: kp.phrase,
      score: kp.score,
      source: 'heuristic' as TagSource,
    })));
  }

  // 4. Extract from notes field
  if (item.notes) {
    const notesTags = extractKeyphrases(item.notes, 3);
    candidates.push(...notesTags.map(kp => ({
      name: kp.phrase,
      score: kp.score * 0.9,  // Slightly lower weight for notes
      source: 'heuristic' as TagSource,
    })));
  }

  // 5. Extract from local_uri filename (for file imports)
  if (item.local_uri) {
    const filename = item.local_uri.split('/').pop() || '';
    const fileTags = extractFilenameTokens(filename);
    candidates.push(...fileTags.map(kp => ({
      name: kp.phrase,
      score: kp.score,
      source: 'heuristic' as TagSource,
    })));
  }

  // 6. Add media type as a tag with medium confidence
  if (item.type && item.type !== 'text') {
    candidates.push({
      name: item.type,
      score: 0.5,
      source: 'heuristic' as TagSource,
    });
  }

  return mergeCandidates(candidates);
}

/**
 * Create or get a tag by name
 */
async function getOrCreateTag(
  db: SQLite.SQLiteDatabase,
  name: string,
  kind: TagKind = 'emergent'
): Promise<Tag> {
  // Try to find existing tag
  const existing = await repos.getTagByName(db, name);
  if (existing) {
    return existing;
  }

  // Create new tag
  return await repos.createTag(db, {
    name,
    slug: generateSlug(name),
    kind,
  });
}

/**
 * Assign tags to an item based on candidates
 */
export async function assignTags(
  db: SQLite.SQLiteDatabase,
  itemId: string,
  candidates: TagCandidate[],
  maxTags: number = MAX_TAGS_PER_ITEM
): Promise<TaggingResult> {
  // Sort by score descending
  const sortedCandidates = [...candidates]
    .filter(c => c.score >= MIN_SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxTags);

  const assignedTags: Array<{ name: string; score: number }> = [];

  for (const candidate of sortedCandidates) {
    try {
      // Get or create the tag
      const tag = await getOrCreateTag(db, candidate.name, 'emergent');

      // Attach to item with confidence score
      await repos.attachTagToItem(
        db,
        itemId,
        tag.id,
        candidate.score,
        candidate.source
      );

      assignedTags.push({
        name: candidate.name,
        score: candidate.score,
      });

      console.log(`[AETS] Assigned tag "${candidate.name}" to item ${itemId} (score: ${candidate.score.toFixed(2)})`);
    } catch (error) {
      console.error(`[AETS] Failed to assign tag "${candidate.name}":`, error);
    }
  }

  return {
    itemId,
    tagsAssigned: assignedTags.length,
    tags: assignedTags,
  };
}

/**
 * Main tagging function - extracts and assigns tags for a media item
 */
export async function tagItem(
  db: SQLite.SQLiteDatabase,
  item: MediaItem
): Promise<TaggingResult> {
  console.log(`[AETS] Tagging item: ${item.id} (type: ${item.type})`);

  // Extract candidates
  const candidates = extractTagCandidates(item);
  console.log(`[AETS] Found ${candidates.length} tag candidates`);

  // Assign tags
  const result = await assignTags(db, item.id, candidates);
  console.log(`[AETS] Assigned ${result.tagsAssigned} tags to item ${item.id}`);

  return result;
}

/**
 * Enhanced tagging with fetched content
 * Uses additional content and keywords from URL fetching
 */
export async function tagItemWithContent(
  db: SQLite.SQLiteDatabase,
  item: MediaItem,
  additionalContent: string[],
  additionalKeywords: string[]
): Promise<TaggingResult> {
  console.log(`[AETS] Enhanced tagging for item: ${item.id}`);
  console.log(`[AETS] Additional content pieces: ${additionalContent.length}, keywords: ${additionalKeywords.length}`);

  // Extract candidates from item itself
  const candidates = extractTagCandidates(item);

  // Add candidates from additional content
  for (const content of additionalContent) {
    if (content && content.length > 0) {
      const contentTags = extractKeyphrases(content, 5);
      candidates.push(...contentTags.map(kp => ({
        name: kp.phrase,
        score: kp.score * 0.9, // Slightly lower weight for fetched content
        source: 'heuristic' as TagSource,
      })));
    }
  }

  // Add candidates from additional keywords (high confidence since they're pre-extracted)
  for (const keyword of additionalKeywords) {
    const normalized = normalizeTagName(keyword);
    if (normalized && normalized.length >= 3) {
      candidates.push({
        name: normalized,
        score: 0.75, // Good confidence for pre-extracted keywords
        source: 'heuristic' as TagSource,
      });
    }
  }

  // Merge and deduplicate
  const mergedCandidates = mergeCandidates(candidates);
  console.log(`[AETS] Total merged candidates: ${mergedCandidates.length}`);

  // Assign more tags for multi-URL entries (up to 10)
  const maxTags = additionalContent.length > 1 ? 10 : MAX_TAGS_PER_ITEM;
  const result = await assignTags(db, item.id, mergedCandidates, maxTags);
  console.log(`[AETS] Assigned ${result.tagsAssigned} tags to item ${item.id}`);

  return result;
}

/**
 * Add a manual tag to an item (user-created)
 */
export async function addManualTag(
  db: SQLite.SQLiteDatabase,
  itemId: string,
  tagName: string
): Promise<Tag> {
  const normalized = normalizeTagName(tagName);
  if (!normalized || normalized.length < 2) {
    throw new Error('Tag name too short');
  }

  // Get or create tag as manual
  const tag = await getOrCreateTag(db, normalized, 'manual');

  // Attach with high confidence
  await repos.attachTagToItem(db, itemId, tag.id, 1.0, 'user');

  return tag;
}

/**
 * Remove a tag from an item
 */
export async function removeTagFromItem(
  db: SQLite.SQLiteDatabase,
  itemId: string,
  tagId: number
): Promise<boolean> {
  return await repos.detachTagFromItem(db, itemId, tagId);
}

/**
 * Get all tags for an item
 */
export async function getItemTags(
  db: SQLite.SQLiteDatabase,
  itemId: string
): Promise<Array<Tag & { confidence: number | null; source: TagSource }>> {
  return await repos.getTagsForItem(db, itemId);
}

/**
 * Merge two tags (moves all assignments from source to target, deletes source)
 */
export async function mergeTags(
  db: SQLite.SQLiteDatabase,
  sourceTagId: number,
  targetTagId: number
): Promise<void> {
  // Get all items with source tag
  const itemIds = await repos.getItemsForTag(db, sourceTagId);

  // Move assignments to target tag
  for (const itemId of itemIds) {
    // Check if target tag already assigned
    const existing = await repos.getTagsForItem(db, itemId);
    const hasTarget = existing.some(t => t.id === targetTagId);

    if (!hasTarget) {
      // Get source assignment details
      const sourceAssignment = existing.find(t => t.id === sourceTagId);
      if (sourceAssignment) {
        await repos.attachTagToItem(
          db,
          itemId,
          targetTagId,
          sourceAssignment.confidence,
          sourceAssignment.source
        );
      }
    }

    // Remove source tag from item
    await repos.detachTagFromItem(db, itemId, sourceTagId);
  }

  // Delete source tag
  await repos.deleteTag(db, sourceTagId);
}

/**
 * Rename a tag
 */
export async function renameTag(
  db: SQLite.SQLiteDatabase,
  tagId: number,
  newName: string
): Promise<boolean> {
  const normalized = normalizeTagName(newName);
  if (!normalized || normalized.length < 2) {
    throw new Error('Tag name too short');
  }

  // Check if new name already exists
  const existing = await repos.getTagByName(db, normalized);
  if (existing && existing.id !== tagId) {
    throw new Error('A tag with this name already exists');
  }

  return await repos.updateTag(db, tagId, {
    name: normalized,
    slug: generateSlug(normalized),
  });
}
