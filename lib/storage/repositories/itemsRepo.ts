/**
 * Items Repository - CRUD operations for media_items and media_meta
 */

import * as SQLite from 'expo-sqlite';
import {
  MediaItem,
  MediaItemWithTags,
  MediaMeta,
  CreateMediaItemInput,
  UpdateMediaItemInput,
  CreateMediaMetaInput,
  UpdateMediaMetaInput,
  ListMediaItemsFilters,
} from '../types';
import { upsertFtsEntry, deleteFtsEntry } from './ftsRepo';

// ============ Media Items ============

export async function createMediaItem(
  db: SQLite.SQLiteDatabase,
  input: CreateMediaItemInput
): Promise<string> {
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO media_items
     (id, type, title, source_url, local_uri, notes, extracted_text, metadata_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.type,
      input.title ?? null,
      input.source_url ?? null,
      input.local_uri ?? null,
      input.notes ?? null,
      input.extracted_text ?? null,
      input.metadata_json ?? null,
      now,
      now,
    ]
  );

  // Update FTS index
  await upsertFtsEntry(db, input.id);

  return input.id;
}

export async function getMediaItem(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<MediaItemWithTags | null> {
  const item = await db.getFirstAsync<MediaItem>(
    'SELECT * FROM media_items WHERE id = ?',
    [id]
  );

  if (!item) return null;

  // Get associated tags
  const tags = await db.getAllAsync<any>(
    `SELECT t.id, t.name, t.slug, t.kind, t.created_at, t.updated_at, it.confidence, it.source
     FROM tags t
     INNER JOIN item_tags it ON t.id = it.tag_id
     WHERE it.item_id = ?
     ORDER BY t.name`,
    [id]
  );

  return {
    ...item,
    tags: tags.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      kind: t.kind || 'manual',
      created_at: t.created_at,
      updated_at: t.updated_at,
      confidence: t.confidence,
      source: t.source,
    })),
  };
}

/**
 * Batch fetch multiple items with their tags in a single efficient query
 * Avoids N+1 query problem when fetching many items
 */
export async function getMediaItemsBatch(
  db: SQLite.SQLiteDatabase,
  ids: string[]
): Promise<MediaItemWithTags[]> {
  if (ids.length === 0) return [];

  // Create placeholders for the IN clause
  const placeholders = ids.map(() => '?').join(',');

  // Fetch all items
  const items = await db.getAllAsync<MediaItem>(
    `SELECT * FROM media_items WHERE id IN (${placeholders})`,
    ids
  );

  if (items.length === 0) return [];

  // Fetch all tags for these items in a single query
  const tagsData = await db.getAllAsync<{
    item_id: string;
    id: number;
    name: string;
    slug: string | null;
    kind: string | null;
    created_at: number;
    updated_at: number | null;
    confidence: number | null;
    source: string;
  }>(
    `SELECT it.item_id, t.id, t.name, t.slug, t.kind, t.created_at, t.updated_at, it.confidence, it.source
     FROM tags t
     INNER JOIN item_tags it ON t.id = it.tag_id
     WHERE it.item_id IN (${placeholders})
     ORDER BY t.name`,
    ids
  );

  // Group tags by item_id
  const tagsByItemId = new Map<string, Array<{
    id: number;
    name: string;
    slug: string | null;
    kind: string;
    created_at: number;
    updated_at: number | null;
    confidence: number | null;
    source: string;
  }>>();

  for (const tag of tagsData) {
    if (!tagsByItemId.has(tag.item_id)) {
      tagsByItemId.set(tag.item_id, []);
    }
    tagsByItemId.get(tag.item_id)!.push({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      kind: tag.kind || 'manual',
      created_at: tag.created_at,
      updated_at: tag.updated_at,
      confidence: tag.confidence,
      source: tag.source,
    });
  }

  // Combine items with their tags
  return items.map(item => ({
    ...item,
    tags: tagsByItemId.get(item.id) || [],
  }));
}

export async function updateMediaItem(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: UpdateMediaItemInput
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.source_url !== undefined) {
    fields.push('source_url = ?');
    values.push(updates.source_url);
  }
  if (updates.local_uri !== undefined) {
    fields.push('local_uri = ?');
    values.push(updates.local_uri);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }
  if (updates.extracted_text !== undefined) {
    fields.push('extracted_text = ?');
    values.push(updates.extracted_text);
  }
  if (updates.metadata_json !== undefined) {
    fields.push('metadata_json = ?');
    values.push(updates.metadata_json);
  }

  if (fields.length === 0) {
    return false;
  }

  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  const result = await db.runAsync(
    `UPDATE media_items SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  // Update FTS index if item was modified
  if (result.changes > 0) {
    await upsertFtsEntry(db, id);
  }

  return result.changes > 0;
}

export async function deleteMediaItem(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  // Delete from FTS first
  await deleteFtsEntry(db, id);

  const result = await db.runAsync('DELETE FROM media_items WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listMediaItems(
  db: SQLite.SQLiteDatabase,
  filters?: ListMediaItemsFilters
): Promise<MediaItem[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];
  const joins: string[] = [];

  if (filters?.type) {
    whereClauses.push('m.type = ?');
    params.push(filters.type);
  }

  if (filters?.dateFrom) {
    whereClauses.push('m.created_at >= ?');
    params.push(filters.dateFrom);
  }

  if (filters?.dateTo) {
    whereClauses.push('m.created_at <= ?');
    params.push(filters.dateTo);
  }

  if (filters?.searchText) {
    whereClauses.push(
      '(m.title LIKE ? OR m.notes LIKE ? OR m.extracted_text LIKE ?)'
    );
    const searchPattern = `%${filters.searchText}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  // Handle source domain filtering (joins with media_meta)
  if (filters?.sourceDomain) {
    joins.push('LEFT JOIN media_meta mm ON m.id = mm.item_id');
    whereClauses.push('mm.source_domain = ?');
    params.push(filters.sourceDomain);
  }

  // Handle tag filtering
  if (filters?.tags && filters.tags.length > 0) {
    joins.push('INNER JOIN item_tags it ON m.id = it.item_id');
    joins.push('INNER JOIN tags t ON it.tag_id = t.id');
    const tagPlaceholders = filters.tags.map(() => '?').join(',');
    whereClauses.push(`t.name IN (${tagPlaceholders})`);
    params.push(...filters.tags);

    if (filters.minTagConfidence !== undefined) {
      whereClauses.push('(it.confidence IS NULL OR it.confidence >= ?)');
      params.push(filters.minTagConfidence);
    }
  }

  let query = 'SELECT DISTINCT m.* FROM media_items m';

  if (joins.length > 0) {
    query += ' ' + joins.join(' ');
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  // Validate orderBy and orderDirection to prevent SQL injection
  const VALID_ORDER_BY_FIELDS = ['created_at', 'updated_at', 'title', 'type'];
  const VALID_ORDER_DIRECTIONS = ['ASC', 'DESC'];

  const orderBy = filters?.orderBy ?? 'created_at';
  const orderDirection = filters?.orderDirection ?? 'DESC';

  if (!VALID_ORDER_BY_FIELDS.includes(orderBy)) {
    throw new Error(`Invalid orderBy field: ${orderBy}. Allowed: ${VALID_ORDER_BY_FIELDS.join(', ')}`);
  }
  if (!VALID_ORDER_DIRECTIONS.includes(orderDirection.toUpperCase())) {
    throw new Error(`Invalid orderDirection: ${orderDirection}. Allowed: ASC, DESC`);
  }

  query += ` ORDER BY m.${orderBy} ${orderDirection.toUpperCase()}`;

  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  if (filters?.offset) {
    query += ' OFFSET ?';
    params.push(filters.offset);
  }

  return await db.getAllAsync<MediaItem>(query, params);
}

export async function countMediaItems(
  db: SQLite.SQLiteDatabase,
  filters?: { type?: string }
): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM media_items';
  const params: any[] = [];

  if (filters?.type) {
    query += ' WHERE type = ?';
    params.push(filters.type);
  }

  const result = await db.getFirstAsync<{ count: number }>(query, params);
  return result?.count ?? 0;
}

// ============ Media Meta ============

export async function createMediaMeta(
  db: SQLite.SQLiteDatabase,
  input: CreateMediaMetaInput
): Promise<string> {
  await db.runAsync(
    `INSERT INTO media_meta
     (item_id, duration_ms, width, height, exif_json, ocr_status, asr_status, source_domain, extra_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.item_id,
      input.duration_ms ?? null,
      input.width ?? null,
      input.height ?? null,
      input.exif_json ?? null,
      input.ocr_status ?? null,
      input.asr_status ?? null,
      input.source_domain ?? null,
      input.extra_json ?? null,
    ]
  );
  return input.item_id;
}

export async function getMediaMeta(
  db: SQLite.SQLiteDatabase,
  itemId: string
): Promise<MediaMeta | null> {
  return await db.getFirstAsync<MediaMeta>(
    'SELECT * FROM media_meta WHERE item_id = ?',
    [itemId]
  );
}

export async function updateMediaMeta(
  db: SQLite.SQLiteDatabase,
  itemId: string,
  updates: UpdateMediaMetaInput
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.duration_ms !== undefined) {
    fields.push('duration_ms = ?');
    values.push(updates.duration_ms);
  }
  if (updates.width !== undefined) {
    fields.push('width = ?');
    values.push(updates.width);
  }
  if (updates.height !== undefined) {
    fields.push('height = ?');
    values.push(updates.height);
  }
  if (updates.exif_json !== undefined) {
    fields.push('exif_json = ?');
    values.push(updates.exif_json);
  }
  if (updates.ocr_status !== undefined) {
    fields.push('ocr_status = ?');
    values.push(updates.ocr_status);
  }
  if (updates.asr_status !== undefined) {
    fields.push('asr_status = ?');
    values.push(updates.asr_status);
  }
  if (updates.source_domain !== undefined) {
    fields.push('source_domain = ?');
    values.push(updates.source_domain);
  }
  if (updates.extra_json !== undefined) {
    fields.push('extra_json = ?');
    values.push(updates.extra_json);
  }

  if (fields.length === 0) return false;

  values.push(itemId);

  const result = await db.runAsync(
    `UPDATE media_meta SET ${fields.join(', ')} WHERE item_id = ?`,
    values
  );

  return result.changes > 0;
}

export async function upsertMediaMeta(
  db: SQLite.SQLiteDatabase,
  input: CreateMediaMetaInput
): Promise<string> {
  await db.runAsync(
    `INSERT OR REPLACE INTO media_meta
     (item_id, duration_ms, width, height, exif_json, ocr_status, asr_status, source_domain, extra_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.item_id,
      input.duration_ms ?? null,
      input.width ?? null,
      input.height ?? null,
      input.exif_json ?? null,
      input.ocr_status ?? null,
      input.asr_status ?? null,
      input.source_domain ?? null,
      input.extra_json ?? null,
    ]
  );
  return input.item_id;
}

export async function deleteMediaMeta(
  db: SQLite.SQLiteDatabase,
  itemId: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM media_meta WHERE item_id = ?', [itemId]);
  return result.changes > 0;
}

/**
 * Get unique source domains from media_meta
 */
export async function getUniqueSourceDomains(
  db: SQLite.SQLiteDatabase
): Promise<string[]> {
  const results = await db.getAllAsync<{ source_domain: string }>(
    `SELECT DISTINCT source_domain FROM media_meta
     WHERE source_domain IS NOT NULL AND source_domain != ''
     ORDER BY source_domain`
  );
  return results.map(r => r.source_domain);
}

/**
 * Get unique media types from media_items
 */
export async function getUniqueMediaTypes(
  db: SQLite.SQLiteDatabase
): Promise<string[]> {
  const results = await db.getAllAsync<{ type: string }>(
    `SELECT DISTINCT type FROM media_items ORDER BY type`
  );
  return results.map(r => r.type);
}

/**
 * Get items that need URL enrichment (pendingUrlFetch = true in metadata)
 * Used for retry logic and showing enrichment status in UI
 */
export async function getItemsNeedingEnrichment(
  db: SQLite.SQLiteDatabase,
  options?: { limit?: number }
): Promise<MediaItem[]> {
  let query = `
    SELECT * FROM media_items
    WHERE metadata_json IS NOT NULL
      AND (
        json_extract(metadata_json, '$.pendingUrlFetch') = 1
        OR json_extract(metadata_json, '$.pendingUrlFetch') = 'true'
      )
    ORDER BY created_at DESC
  `;

  const params: any[] = [];

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  return await db.getAllAsync<MediaItem>(query, params);
}

/**
 * Count items that need URL enrichment
 */
export async function countItemsNeedingEnrichment(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM media_items
     WHERE metadata_json IS NOT NULL
       AND (
         json_extract(metadata_json, '$.pendingUrlFetch') = 1
         OR json_extract(metadata_json, '$.pendingUrlFetch') = 'true'
       )`
  );
  return result?.count ?? 0;
}
