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
  TagSource,
} from '../types';

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

  return result.changes > 0;
}

export async function deleteMediaItem(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM media_items WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listMediaItems(
  db: SQLite.SQLiteDatabase,
  filters?: ListMediaItemsFilters
): Promise<MediaItem[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];

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

  let query = 'SELECT DISTINCT m.* FROM media_items m';

  if (filters?.tags && filters.tags.length > 0) {
    query += `
      INNER JOIN item_tags it ON m.id = it.item_id
      INNER JOIN tags t ON it.tag_id = t.id
    `;
    const tagPlaceholders = filters.tags.map(() => '?').join(',');
    whereClauses.push(`t.name IN (${tagPlaceholders})`);
    params.push(...filters.tags);

    if (filters.minTagConfidence !== undefined) {
      whereClauses.push('(it.confidence IS NULL OR it.confidence >= ?)');
      params.push(filters.minTagConfidence);
    }
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  const orderBy = filters?.orderBy ?? 'created_at';
  const orderDirection = filters?.orderDirection ?? 'DESC';
  query += ` ORDER BY m.${orderBy} ${orderDirection}`;

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
