/**
 * Tags Repository - CRUD operations for tags and item_tags
 */

import * as SQLite from 'expo-sqlite';
import {
  Tag,
  TagWithCount,
  CreateTagInput,
  UpdateTagInput,
  ListTagsOptions,
  TagSource,
  TagKind,
} from '../types';
import { upsertFtsEntry } from './ftsRepo';

// ============ Constants ============

const MAX_TAG_NAME_LENGTH = 100;
const MIN_TAG_NAME_LENGTH = 1;

// ============ Tags ============

/**
 * Validate and sanitize tag name
 * Returns sanitized name or throws error if invalid
 */
function validateTagName(name: string): string {
  const trimmed = name.trim();

  if (trimmed.length < MIN_TAG_NAME_LENGTH) {
    throw new Error(`Tag name must be at least ${MIN_TAG_NAME_LENGTH} character(s)`);
  }

  if (trimmed.length > MAX_TAG_NAME_LENGTH) {
    // Truncate instead of throwing to be forgiving for auto-generated tags
    return trimmed.slice(0, MAX_TAG_NAME_LENGTH);
  }

  return trimmed;
}

/**
 * Generate a URL-safe slug from a tag name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function createTag(
  db: SQLite.SQLiteDatabase,
  input: CreateTagInput
): Promise<Tag> {
  const now = Date.now();
  const validatedName = validateTagName(input.name);
  const slug = input.slug ?? generateSlug(validatedName);
  const kind = input.kind ?? 'manual';

  await db.runAsync(
    'INSERT INTO tags (name, slug, kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [validatedName, slug, kind, now, now]
  );

  const tag = await db.getFirstAsync<Tag>(
    'SELECT * FROM tags WHERE name = ?',
    [validatedName]
  );

  if (!tag) {
    throw new Error(`Failed to create tag: ${validatedName}`);
  }

  return tag;
}

export async function upsertTag(
  db: SQLite.SQLiteDatabase,
  name: string,
  kind: TagKind = 'manual'
): Promise<Tag> {
  const now = Date.now();
  const validatedName = validateTagName(name);
  const slug = generateSlug(validatedName);

  // Try to insert, ignore if exists
  await db.runAsync(
    'INSERT OR IGNORE INTO tags (name, slug, kind, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [validatedName, slug, kind, now, now]
  );

  const tag = await db.getFirstAsync<Tag>(
    'SELECT * FROM tags WHERE name = ?',
    [validatedName]
  );

  if (!tag) {
    throw new Error(`Failed to upsert tag: ${validatedName}`);
  }

  return tag;
}

export async function getTagById(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<Tag | null> {
  return await db.getFirstAsync<Tag>('SELECT * FROM tags WHERE id = ?', [id]);
}

export async function getTagByName(
  db: SQLite.SQLiteDatabase,
  name: string
): Promise<Tag | null> {
  return await db.getFirstAsync<Tag>('SELECT * FROM tags WHERE name = ?', [name]);
}

export async function getTagBySlug(
  db: SQLite.SQLiteDatabase,
  slug: string
): Promise<Tag | null> {
  return await db.getFirstAsync<Tag>('SELECT * FROM tags WHERE slug = ?', [slug]);
}

export async function updateTag(
  db: SQLite.SQLiteDatabase,
  id: number,
  updates: UpdateTagInput
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
    // Auto-update slug if name changes and slug not explicitly provided
    if (updates.slug === undefined) {
      fields.push('slug = ?');
      values.push(generateSlug(updates.name));
    }
  }
  if (updates.slug !== undefined) {
    fields.push('slug = ?');
    values.push(updates.slug);
  }
  if (updates.kind !== undefined) {
    fields.push('kind = ?');
    values.push(updates.kind);
  }

  if (fields.length === 0) return false;

  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  const result = await db.runAsync(
    `UPDATE tags SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return result.changes > 0;
}

export async function deleteTag(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM tags WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listTags(
  db: SQLite.SQLiteDatabase,
  options?: ListTagsOptions
): Promise<TagWithCount[]> {
  let query = `
    SELECT t.id, t.name, t.slug, t.kind, t.created_at, t.updated_at, COUNT(it.item_id) as usage_count
    FROM tags t
    LEFT JOIN item_tags it ON t.id = it.tag_id
    GROUP BY t.id, t.name, t.slug, t.kind, t.created_at, t.updated_at
  `;

  const params: any[] = [];

  if (options?.minUsageCount !== undefined) {
    query += ' HAVING usage_count >= ?';
    params.push(options.minUsageCount);
  }

  const sortBy = options?.sortBy ?? 'count';
  const sortDirection = options?.sortDirection ?? 'DESC';

  if (sortBy === 'count') {
    query += ` ORDER BY usage_count ${sortDirection}, t.name ASC`;
  } else {
    query += ` ORDER BY t.name ${sortDirection}`;
  }

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  return await db.getAllAsync<TagWithCount>(query, params);
}

export async function listTagsByKind(
  db: SQLite.SQLiteDatabase,
  kind: TagKind,
  limit?: number
): Promise<Tag[]> {
  let query = 'SELECT * FROM tags WHERE kind = ? ORDER BY name';
  const params: any[] = [kind];

  if (limit) {
    query += ' LIMIT ?';
    params.push(limit);
  }

  return await db.getAllAsync<Tag>(query, params);
}

export async function countTags(
  db: SQLite.SQLiteDatabase,
  kind?: TagKind
): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM tags';
  const params: any[] = [];

  if (kind) {
    query += ' WHERE kind = ?';
    params.push(kind);
  }

  const result = await db.getFirstAsync<{ count: number }>(query, params);
  return result?.count ?? 0;
}

// ============ Item-Tag Relationships ============

export async function attachTagToItem(
  db: SQLite.SQLiteDatabase,
  itemId: string,
  tagId: number,
  confidence: number | null,
  source: TagSource
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO item_tags
     (item_id, tag_id, confidence, source, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [itemId, tagId, confidence, source, Date.now()]
  );

  // Update FTS index with new tags
  await upsertFtsEntry(db, itemId);
}

export async function detachTagFromItem(
  db: SQLite.SQLiteDatabase,
  itemId: string,
  tagId: number
): Promise<boolean> {
  const result = await db.runAsync(
    'DELETE FROM item_tags WHERE item_id = ? AND tag_id = ?',
    [itemId, tagId]
  );

  // Update FTS index with removed tag
  if (result.changes > 0) {
    await upsertFtsEntry(db, itemId);
  }

  return result.changes > 0;
}

export async function detachAllTagsFromItem(
  db: SQLite.SQLiteDatabase,
  itemId: string
): Promise<number> {
  const result = await db.runAsync(
    'DELETE FROM item_tags WHERE item_id = ?',
    [itemId]
  );

  // Update FTS index with cleared tags
  if (result.changes > 0) {
    await upsertFtsEntry(db, itemId);
  }

  return result.changes;
}

export async function getTagsForItem(
  db: SQLite.SQLiteDatabase,
  itemId: string
): Promise<Array<Tag & { confidence: number | null; source: TagSource }>> {
  return await db.getAllAsync<any>(
    `SELECT t.id, t.name, t.slug, t.kind, t.created_at, t.updated_at, it.confidence, it.source
     FROM tags t
     INNER JOIN item_tags it ON t.id = it.tag_id
     WHERE it.item_id = ?
     ORDER BY t.name`,
    [itemId]
  );
}

export async function getItemsForTag(
  db: SQLite.SQLiteDatabase,
  tagId: number,
  limit?: number
): Promise<string[]> {
  let query = 'SELECT item_id FROM item_tags WHERE tag_id = ?';
  const params: any[] = [tagId];

  if (limit) {
    query += ' LIMIT ?';
    params.push(limit);
  }

  const results = await db.getAllAsync<{ item_id: string }>(query, params);
  return results.map(r => r.item_id);
}

export async function updateTagConfidence(
  db: SQLite.SQLiteDatabase,
  itemId: string,
  tagId: number,
  confidence: number
): Promise<boolean> {
  const result = await db.runAsync(
    'UPDATE item_tags SET confidence = ? WHERE item_id = ? AND tag_id = ?',
    [confidence, itemId, tagId]
  );
  return result.changes > 0;
}
