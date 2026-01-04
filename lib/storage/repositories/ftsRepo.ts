/**
 * FTS Repository - Full-text search operations
 */

import * as SQLite from 'expo-sqlite';
import { MediaItem, TagWithCount } from '../types';

export interface FtsSearchResult {
  item_id: string;
  rank: number;
}

export interface FtsSearchOptions {
  limit?: number;
  offset?: number;
}

/**
 * Check if FTS is available (table exists)
 */
let ftsAvailable: boolean | null = null;

async function isFtsAvailable(db: SQLite.SQLiteDatabase): Promise<boolean> {
  if (ftsAvailable !== null) return ftsAvailable;

  try {
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='items_fts'"
    );
    ftsAvailable = (result?.count ?? 0) > 0;
  } catch {
    ftsAvailable = false;
  }
  return ftsAvailable;
}

/**
 * Upsert an item into the FTS index
 * Call this after creating or updating a media item, or after tag changes
 */
export async function upsertFtsEntry(
  db: SQLite.SQLiteDatabase,
  itemId: string
): Promise<void> {
  // Skip if FTS is not available (e.g., on web)
  if (!(await isFtsAvailable(db))) {
    return;
  }

  // First delete existing entry if any
  await db.runAsync('DELETE FROM items_fts WHERE item_id = ?', [itemId]);

  // Get item data with tags
  const item = await db.getFirstAsync<{
    id: string;
    title: string | null;
    extracted_text: string | null;
    notes: string | null;
    source_url: string | null;
  }>(
    'SELECT id, title, extracted_text, notes, source_url FROM media_items WHERE id = ?',
    [itemId]
  );

  if (!item) return;

  // Get source domain from media_meta
  const meta = await db.getFirstAsync<{ source_domain: string | null }>(
    'SELECT source_domain FROM media_meta WHERE item_id = ?',
    [itemId]
  );

  // Get tags as space-separated text
  const tagsResult = await db.getAllAsync<{ name: string }>(
    `SELECT t.name FROM tags t
     INNER JOIN item_tags it ON t.id = it.tag_id
     WHERE it.item_id = ?`,
    [itemId]
  );
  const tagsText = tagsResult.map(t => t.name).join(' ');

  // Insert into FTS
  await db.runAsync(
    `INSERT INTO items_fts (item_id, title, text, url, domain, tags_text)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.title || '',
      (item.extracted_text || '') + ' ' + (item.notes || ''),
      item.source_url || '',
      meta?.source_domain || '',
      tagsText,
    ]
  );
}

/**
 * Delete an item from the FTS index
 */
export async function deleteFtsEntry(
  db: SQLite.SQLiteDatabase,
  itemId: string
): Promise<void> {
  // Skip if FTS is not available (e.g., on web)
  if (!(await isFtsAvailable(db))) {
    return;
  }
  await db.runAsync('DELETE FROM items_fts WHERE item_id = ?', [itemId]);
}

/**
 * Search the FTS index
 * Returns item IDs ordered by relevance
 */
export async function searchFts(
  db: SQLite.SQLiteDatabase,
  query: string,
  options?: FtsSearchOptions
): Promise<FtsSearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  // Fall back to LIKE search if FTS is not available
  if (!(await isFtsAvailable(db))) {
    const pattern = `%${query}%`;
    let sql = `
      SELECT id as item_id, 0 as rank
      FROM media_items
      WHERE title LIKE ? OR extracted_text LIKE ? OR notes LIKE ? OR source_url LIKE ?
      ORDER BY created_at DESC
    `;
    const params: any[] = [pattern, pattern, pattern, pattern];

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options?.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    return await db.getAllAsync<FtsSearchResult>(sql, params);
  }

  // Escape special FTS5 characters and prepare query
  // Add * for prefix matching to make search more forgiving
  const sanitizedQuery = query
    .replace(/['"]/g, '') // Remove quotes
    .split(/\s+/)
    .filter(term => term.length > 0)
    .map(term => `"${term}"*`) // Wrap in quotes and add prefix wildcard
    .join(' ');

  if (!sanitizedQuery) {
    return [];
  }

  let sql = `
    SELECT item_id, rank
    FROM items_fts
    WHERE items_fts MATCH ?
    ORDER BY rank
  `;

  const params: any[] = [sanitizedQuery];

  if (options?.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  if (options?.offset) {
    sql += ' OFFSET ?';
    params.push(options.offset);
  }

  return await db.getAllAsync<FtsSearchResult>(sql, params);
}

/**
 * Search and return full media items
 */
export async function searchMediaItems(
  db: SQLite.SQLiteDatabase,
  query: string,
  options?: FtsSearchOptions & {
    type?: string;
    sourceDomain?: string;
    dateFrom?: number;
    dateTo?: number;
    orderDirection?: 'ASC' | 'DESC';
  }
): Promise<MediaItem[]> {
  if (!query.trim()) {
    // If no search query, fall back to regular listing
    return [];
  }

  // Fall back to LIKE search if FTS is not available
  if (!(await isFtsAvailable(db))) {
    const pattern = `%${query}%`;
    const whereClauses: string[] = [
      '(m.title LIKE ? OR m.extracted_text LIKE ? OR m.notes LIKE ? OR m.source_url LIKE ?)'
    ];
    const params: any[] = [pattern, pattern, pattern, pattern];

    if (options?.type) {
      whereClauses.push('m.type = ?');
      params.push(options.type);
    }
    if (options?.dateFrom) {
      whereClauses.push('m.created_at >= ?');
      params.push(options.dateFrom);
    }
    if (options?.dateTo) {
      whereClauses.push('m.created_at <= ?');
      params.push(options.dateTo);
    }

    let sql = `SELECT m.* FROM media_items m WHERE ${whereClauses.join(' AND ')} ORDER BY m.created_at DESC`;

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options?.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    return await db.getAllAsync<MediaItem>(sql, params);
  }

  // Escape special FTS5 characters and prepare query
  const sanitizedQuery = query
    .replace(/['"]/g, '')
    .split(/\s+/)
    .filter(term => term.length > 0)
    .map(term => `"${term}"*`)
    .join(' ');

  if (!sanitizedQuery) {
    return [];
  }

  const whereClauses: string[] = [];
  const params: any[] = [sanitizedQuery];

  if (options?.type) {
    whereClauses.push('m.type = ?');
    params.push(options.type);
  }

  if (options?.sourceDomain) {
    whereClauses.push('mm.source_domain = ?');
    params.push(options.sourceDomain);
  }

  if (options?.dateFrom) {
    whereClauses.push('m.created_at >= ?');
    params.push(options.dateFrom);
  }

  if (options?.dateTo) {
    whereClauses.push('m.created_at <= ?');
    params.push(options.dateTo);
  }

  const whereClause = whereClauses.length > 0
    ? 'AND ' + whereClauses.join(' AND ')
    : '';

  const sql = `
    SELECT m.*
    FROM items_fts fts
    INNER JOIN media_items m ON fts.item_id = m.id
    LEFT JOIN media_meta mm ON m.id = mm.item_id
    WHERE fts MATCH ?
    ${whereClause}
    ORDER BY fts.rank
    ${options?.limit ? 'LIMIT ?' : ''}
    ${options?.offset ? 'OFFSET ?' : ''}
  `;

  if (options?.limit) {
    params.push(options.limit);
  }

  if (options?.offset) {
    params.push(options.offset);
  }

  return await db.getAllAsync<MediaItem>(sql, params);
}

/**
 * Get tag facets for search results
 * Returns the most common tags among the search results
 */
export async function getSearchTagFacets(
  db: SQLite.SQLiteDatabase,
  query: string,
  limit: number = 10
): Promise<TagWithCount[]> {
  if (!query.trim()) {
    return [];
  }

  // Fall back to LIKE-based tag facets if FTS is not available
  if (!(await isFtsAvailable(db))) {
    const pattern = `%${query}%`;
    const sql = `
      SELECT t.id, t.name, t.slug, t.kind, t.created_at, t.updated_at, COUNT(*) as usage_count
      FROM media_items m
      INNER JOIN item_tags it ON m.id = it.item_id
      INNER JOIN tags t ON it.tag_id = t.id
      WHERE m.title LIKE ? OR m.extracted_text LIKE ? OR m.notes LIKE ? OR m.source_url LIKE ?
      GROUP BY t.id, t.name, t.slug, t.kind, t.created_at, t.updated_at
      ORDER BY usage_count DESC
      LIMIT ?
    `;
    return await db.getAllAsync<TagWithCount>(sql, [pattern, pattern, pattern, pattern, limit]);
  }

  const sanitizedQuery = query
    .replace(/['"]/g, '')
    .split(/\s+/)
    .filter(term => term.length > 0)
    .map(term => `"${term}"*`)
    .join(' ');

  if (!sanitizedQuery) {
    return [];
  }

  const sql = `
    SELECT t.id, t.name, t.slug, t.kind, t.created_at, t.updated_at, COUNT(*) as usage_count
    FROM items_fts fts
    INNER JOIN item_tags it ON fts.item_id = it.item_id
    INNER JOIN tags t ON it.tag_id = t.id
    WHERE fts MATCH ?
    GROUP BY t.id, t.name, t.slug, t.kind, t.created_at, t.updated_at
    ORDER BY usage_count DESC
    LIMIT ?
  `;

  return await db.getAllAsync<TagWithCount>(sql, [sanitizedQuery, limit]);
}

/**
 * Rebuild the entire FTS index
 * Useful for maintenance or after bulk operations
 */
export async function rebuildFtsIndex(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  // Skip if FTS is not available (e.g., on web)
  if (!(await isFtsAvailable(db))) {
    console.warn('FTS not available, skipping index rebuild');
    return 0;
  }

  // Clear existing index
  await db.runAsync('DELETE FROM items_fts');

  // Repopulate from media_items
  const result = await db.runAsync(`
    INSERT INTO items_fts (item_id, title, text, url, domain, tags_text)
    SELECT
      m.id,
      COALESCE(m.title, ''),
      COALESCE(m.extracted_text, '') || ' ' || COALESCE(m.notes, ''),
      COALESCE(m.source_url, ''),
      COALESCE(mm.source_domain, ''),
      COALESCE((
        SELECT GROUP_CONCAT(t.name, ' ')
        FROM item_tags it
        JOIN tags t ON it.tag_id = t.id
        WHERE it.item_id = m.id
      ), '')
    FROM media_items m
    LEFT JOIN media_meta mm ON m.id = mm.item_id
  `);

  return result.changes;
}
