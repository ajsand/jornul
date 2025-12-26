import * as SQLite from 'expo-sqlite';
import {
  MediaItem,
  MediaItemWithTags,
  Tag,
  TagWithCount,
  SwipeSignal,
  CompareSession,
  CompareSessionWithItems,
  JournalEntry,
  CreateMediaItemInput,
  UpdateMediaItemInput,
  CreateSwipeSignalInput,
  CreateCompareSessionInput,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  ListMediaItemsFilters,
  ListTagsOptions,
  ListSwipeSignalsFilters,
  ListCompareSessionsFilters,
  TagSource,
  ShareLevel,
} from './types';

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
    `SELECT t.id, t.name, t.created_at, it.confidence, it.source
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
      created_at: t.created_at,
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

  // Build dynamic UPDATE query
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
    return false; // Nothing to update
  }

  // Always update timestamp
  fields.push('updated_at = ?');
  values.push(Date.now());

  // Add id for WHERE clause
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

  // Build WHERE clause
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

  // Handle tag filtering
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

  // Order by
  const orderBy = filters?.orderBy ?? 'created_at';
  const orderDirection = filters?.orderDirection ?? 'DESC';
  query += ` ORDER BY m.${orderBy} ${orderDirection}`;

  // Pagination
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

// ============ Tags ============

export async function upsertTag(
  db: SQLite.SQLiteDatabase,
  name: string
): Promise<Tag> {
  // Try to insert, ignore if exists
  await db.runAsync(
    'INSERT OR IGNORE INTO tags (name, created_at) VALUES (?, ?)',
    [name, Date.now()]
  );

  // Return the tag (either just created or existing)
  const tag = await db.getFirstAsync<Tag>('SELECT * FROM tags WHERE name = ?', [
    name,
  ]);

  if (!tag) {
    throw new Error(`Failed to upsert tag: ${name}`);
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

export async function listTags(
  db: SQLite.SQLiteDatabase,
  options?: ListTagsOptions
): Promise<TagWithCount[]> {
  let query = `
    SELECT t.id, t.name, t.created_at, COUNT(it.item_id) as usage_count
    FROM tags t
    LEFT JOIN item_tags it ON t.id = it.tag_id
    GROUP BY t.id, t.name, t.created_at
  `;

  const params: any[] = [];

  if (options?.minUsageCount !== undefined) {
    query += ' HAVING usage_count >= ?';
    params.push(options.minUsageCount);
  }

  // Sorting
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
  return result.changes > 0;
}

export async function getTagsForItem(
  db: SQLite.SQLiteDatabase,
  itemId: string
): Promise<Array<Tag & { confidence: number | null; source: TagSource }>> {
  return await db.getAllAsync<any>(
    `SELECT t.id, t.name, t.created_at, it.confidence, it.source
     FROM tags t
     INNER JOIN item_tags it ON t.id = it.tag_id
     WHERE it.item_id = ?
     ORDER BY t.name`,
    [itemId]
  );
}

// ============ Journal Entries ============

export async function createJournalEntry(
  db: SQLite.SQLiteDatabase,
  input: CreateJournalEntryInput
): Promise<string> {
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO journal_entries 
     (id, media_item_id, entry_date, mood, location, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.media_item_id,
      input.entry_date ?? null,
      input.mood ?? null,
      input.location ?? null,
      now,
      now,
    ]
  );
  return input.id;
}

export async function getJournalEntry(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<JournalEntry | null> {
  return await db.getFirstAsync<JournalEntry>(
    'SELECT * FROM journal_entries WHERE id = ?',
    [id]
  );
}

export async function updateJournalEntry(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: UpdateJournalEntryInput
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.entry_date !== undefined) {
    fields.push('entry_date = ?');
    values.push(updates.entry_date);
  }
  if (updates.mood !== undefined) {
    fields.push('mood = ?');
    values.push(updates.mood);
  }
  if (updates.location !== undefined) {
    fields.push('location = ?');
    values.push(updates.location);
  }

  if (fields.length === 0) return false;

  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  const result = await db.runAsync(
    `UPDATE journal_entries SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return result.changes > 0;
}

export async function deleteJournalEntry(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [
    id,
  ]);
  return result.changes > 0;
}

// ============ Swipe Signals ============

export async function createSwipeSignal(
  db: SQLite.SQLiteDatabase,
  input: CreateSwipeSignalInput
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO swipe_signals 
     (media_item_id, direction, category, created_at) 
     VALUES (?, ?, ?, ?)`,
    [input.media_item_id, input.direction, input.category ?? null, Date.now()]
  );
  return result.lastInsertRowId;
}

export async function listSwipeSignals(
  db: SQLite.SQLiteDatabase,
  filters?: ListSwipeSignalsFilters
): Promise<SwipeSignal[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters?.media_item_id) {
    whereClauses.push('media_item_id = ?');
    params.push(filters.media_item_id);
  }

  if (filters?.direction) {
    whereClauses.push('direction = ?');
    params.push(filters.direction);
  }

  if (filters?.category) {
    whereClauses.push('category = ?');
    params.push(filters.category);
  }

  if (filters?.dateFrom) {
    whereClauses.push('created_at >= ?');
    params.push(filters.dateFrom);
  }

  if (filters?.dateTo) {
    whereClauses.push('created_at <= ?');
    params.push(filters.dateTo);
  }

  let query = 'SELECT * FROM swipe_signals';

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  if (filters?.offset) {
    query += ' OFFSET ?';
    params.push(filters.offset);
  }

  return await db.getAllAsync<SwipeSignal>(query, params);
}

// ============ Compare Sessions ============

export async function createCompareSession(
  db: SQLite.SQLiteDatabase,
  input: CreateCompareSessionInput
): Promise<string> {
  await db.runAsync(
    `INSERT INTO compare_sessions 
     (id, mode, scope_filters, provider, created_at) 
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.id,
      input.mode,
      input.scope_filters ?? null,
      input.provider ?? null,
      Date.now(),
    ]
  );
  return input.id;
}

export async function addItemToCompareSession(
  db: SQLite.SQLiteDatabase,
  sessionId: string,
  itemId: string,
  shareLevel: ShareLevel
): Promise<void> {
  await db.runAsync(
    `INSERT INTO compare_session_items 
     (session_id, item_id, share_level, created_at) 
     VALUES (?, ?, ?, ?)`,
    [sessionId, itemId, shareLevel, Date.now()]
  );
}

export async function getCompareSession(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<CompareSessionWithItems | null> {
  const session = await db.getFirstAsync<CompareSession>(
    'SELECT * FROM compare_sessions WHERE id = ?',
    [id]
  );

  if (!session) return null;

  const items = await db.getAllAsync<any>(
    `SELECT m.*, csi.share_level
     FROM media_items m
     INNER JOIN compare_session_items csi ON m.id = csi.item_id
     WHERE csi.session_id = ?
     ORDER BY csi.created_at`,
    [id]
  );

  return {
    ...session,
    items: items.map(item => ({
      media_item: {
        id: item.id,
        type: item.type,
        title: item.title,
        source_url: item.source_url,
        local_uri: item.local_uri,
        notes: item.notes,
        extracted_text: item.extracted_text,
        metadata_json: item.metadata_json,
        created_at: item.created_at,
        updated_at: item.updated_at,
      },
      share_level: item.share_level,
    })),
  };
}

export async function listCompareSessions(
  db: SQLite.SQLiteDatabase,
  filters?: ListCompareSessionsFilters
): Promise<CompareSession[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters?.mode) {
    whereClauses.push('mode = ?');
    params.push(filters.mode);
  }

  if (filters?.dateFrom) {
    whereClauses.push('created_at >= ?');
    params.push(filters.dateFrom);
  }

  if (filters?.dateTo) {
    whereClauses.push('created_at <= ?');
    params.push(filters.dateTo);
  }

  let query = 'SELECT * FROM compare_sessions';

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  if (filters?.offset) {
    query += ' OFFSET ?';
    params.push(filters.offset);
  }

  return await db.getAllAsync<CompareSession>(query, params);
}

