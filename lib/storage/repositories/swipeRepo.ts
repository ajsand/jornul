/**
 * Swipe Repository - CRUD operations for swipe deck, sessions, and events
 */

import * as SQLite from 'expo-sqlite';
import {
  SwipeMedia,
  SwipeSession,
  SwipeEvent,
  SwipeEventWithMedia,
  SwipeSignal,
  CreateSwipeMediaInput,
  UpdateSwipeMediaInput,
  ListSwipeMediaFilters,
  CreateSwipeSessionInput,
  UpdateSwipeSessionInput,
  CreateSwipeEventInput,
  ListSwipeEventsFilters,
  CreateSwipeSignalInput,
  ListSwipeSignalsFilters,
  SwipeDecision,
} from '../types';

// ============ Swipe Media ============

export async function createSwipeMedia(
  db: SQLite.SQLiteDatabase,
  input: CreateSwipeMediaInput
): Promise<string> {
  await db.runAsync(
    `INSERT INTO swipe_media
     (id, title, type, image_url, short_desc, long_desc, source, tags_json, popularity_score, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.title,
      input.type,
      input.image_url ?? null,
      input.short_desc ?? null,
      input.long_desc ?? null,
      input.source ?? null,
      input.tags_json ?? null,
      input.popularity_score ?? 0,
      Date.now(),
    ]
  );
  return input.id;
}

export async function getSwipeMedia(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<SwipeMedia | null> {
  return await db.getFirstAsync<SwipeMedia>(
    'SELECT * FROM swipe_media WHERE id = ?',
    [id]
  );
}

export async function updateSwipeMedia(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: UpdateSwipeMediaInput
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  if (updates.image_url !== undefined) {
    fields.push('image_url = ?');
    values.push(updates.image_url);
  }
  if (updates.short_desc !== undefined) {
    fields.push('short_desc = ?');
    values.push(updates.short_desc);
  }
  if (updates.long_desc !== undefined) {
    fields.push('long_desc = ?');
    values.push(updates.long_desc);
  }
  if (updates.source !== undefined) {
    fields.push('source = ?');
    values.push(updates.source);
  }
  if (updates.tags_json !== undefined) {
    fields.push('tags_json = ?');
    values.push(updates.tags_json);
  }
  if (updates.popularity_score !== undefined) {
    fields.push('popularity_score = ?');
    values.push(updates.popularity_score);
  }

  if (fields.length === 0) return false;

  values.push(id);

  const result = await db.runAsync(
    `UPDATE swipe_media SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return result.changes > 0;
}

export async function deleteSwipeMedia(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM swipe_media WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listSwipeMedia(
  db: SQLite.SQLiteDatabase,
  filters?: ListSwipeMediaFilters
): Promise<SwipeMedia[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters?.type) {
    whereClauses.push('type = ?');
    params.push(filters.type);
  }

  if (filters?.source) {
    whereClauses.push('source = ?');
    params.push(filters.source);
  }

  if (filters?.minPopularity !== undefined) {
    whereClauses.push('popularity_score >= ?');
    params.push(filters.minPopularity);
  }

  let query = 'SELECT * FROM swipe_media';

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY popularity_score DESC, created_at DESC';

  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  if (filters?.offset) {
    query += ' OFFSET ?';
    params.push(filters.offset);
  }

  return await db.getAllAsync<SwipeMedia>(query, params);
}

export async function countSwipeMedia(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM swipe_media'
  );
  return result?.count ?? 0;
}

// ============ Swipe Sessions ============

export async function createSwipeSession(
  db: SQLite.SQLiteDatabase,
  input: CreateSwipeSessionInput
): Promise<string> {
  await db.runAsync(
    `INSERT INTO swipe_sessions
     (id, started_at, ended_at, filters_json)
     VALUES (?, ?, NULL, ?)`,
    [input.id, Date.now(), input.filters_json ?? null]
  );
  return input.id;
}

export async function getSwipeSession(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<SwipeSession | null> {
  return await db.getFirstAsync<SwipeSession>(
    'SELECT * FROM swipe_sessions WHERE id = ?',
    [id]
  );
}

export async function updateSwipeSession(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: UpdateSwipeSessionInput
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.ended_at !== undefined) {
    fields.push('ended_at = ?');
    values.push(updates.ended_at);
  }
  if (updates.filters_json !== undefined) {
    fields.push('filters_json = ?');
    values.push(updates.filters_json);
  }

  if (fields.length === 0) return false;

  values.push(id);

  const result = await db.runAsync(
    `UPDATE swipe_sessions SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return result.changes > 0;
}

export async function endSwipeSession(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  return updateSwipeSession(db, id, { ended_at: Date.now() });
}

export async function deleteSwipeSession(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM swipe_sessions WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listSwipeSessions(
  db: SQLite.SQLiteDatabase,
  limit?: number
): Promise<SwipeSession[]> {
  let query = 'SELECT * FROM swipe_sessions ORDER BY started_at DESC';
  const params: any[] = [];

  if (limit) {
    query += ' LIMIT ?';
    params.push(limit);
  }

  return await db.getAllAsync<SwipeSession>(query, params);
}

export async function getActiveSwipeSession(
  db: SQLite.SQLiteDatabase
): Promise<SwipeSession | null> {
  return await db.getFirstAsync<SwipeSession>(
    'SELECT * FROM swipe_sessions WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1'
  );
}

// ============ Swipe Events ============

export async function createSwipeEvent(
  db: SQLite.SQLiteDatabase,
  input: CreateSwipeEventInput
): Promise<string> {
  await db.runAsync(
    `INSERT INTO swipe_events
     (id, session_id, media_id, decision, strength, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.session_id,
      input.media_id,
      input.decision,
      input.strength ?? 1.0,
      Date.now(),
    ]
  );
  return input.id;
}

export async function getSwipeEvent(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<SwipeEvent | null> {
  return await db.getFirstAsync<SwipeEvent>(
    'SELECT * FROM swipe_events WHERE id = ?',
    [id]
  );
}

export async function deleteSwipeEvent(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM swipe_events WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listSwipeEvents(
  db: SQLite.SQLiteDatabase,
  filters?: ListSwipeEventsFilters
): Promise<SwipeEvent[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters?.session_id) {
    whereClauses.push('session_id = ?');
    params.push(filters.session_id);
  }

  if (filters?.media_id) {
    whereClauses.push('media_id = ?');
    params.push(filters.media_id);
  }

  if (filters?.decision) {
    whereClauses.push('decision = ?');
    params.push(filters.decision);
  }

  let query = 'SELECT * FROM swipe_events';

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

  return await db.getAllAsync<SwipeEvent>(query, params);
}

export async function countSwipeEventsByDecision(
  db: SQLite.SQLiteDatabase,
  sessionId?: string
): Promise<Record<SwipeDecision, number>> {
  let query = `
    SELECT decision, COUNT(*) as count
    FROM swipe_events
  `;
  const params: any[] = [];

  if (sessionId) {
    query += ' WHERE session_id = ?';
    params.push(sessionId);
  }

  query += ' GROUP BY decision';

  const results = await db.getAllAsync<{ decision: SwipeDecision; count: number }>(query, params);

  const counts: Record<SwipeDecision, number> = {
    like: 0,
    dislike: 0,
    skip: 0,
    super_like: 0,
  };

  for (const r of results) {
    counts[r.decision] = r.count;
  }

  return counts;
}

/**
 * Get swipe events with joined media data for preference computation
 * Used by the ranking algorithm to analyze user preferences
 */
export async function getSwipeEventsWithMedia(
  db: SQLite.SQLiteDatabase,
  filters?: { limit?: number; sessionId?: string }
): Promise<SwipeEventWithMedia[]> {
  let query = `
    SELECT
      e.id, e.session_id, e.media_id, e.decision, e.strength, e.created_at,
      m.title as media_title,
      m.type as media_type,
      m.tags_json as media_tags_json,
      m.popularity_score as media_popularity_score
    FROM swipe_events e
    INNER JOIN swipe_media m ON e.media_id = m.id
  `;
  const params: any[] = [];

  if (filters?.sessionId) {
    query += ' WHERE e.session_id = ?';
    params.push(filters.sessionId);
  }

  query += ' ORDER BY e.created_at DESC';

  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  return await db.getAllAsync<SwipeEventWithMedia>(query, params);
}

/**
 * Get recently swiped media IDs for diversity window calculation
 * Used to avoid showing the same type/tags repeatedly
 */
export async function getRecentSwipedMediaIds(
  db: SQLite.SQLiteDatabase,
  limit: number
): Promise<string[]> {
  const results = await db.getAllAsync<{ media_id: string }>(
    'SELECT media_id FROM swipe_events ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  return results.map(r => r.media_id);
}

/**
 * Get recent swiped media with full data for diversity calculations
 */
export async function getRecentSwipedMedia(
  db: SQLite.SQLiteDatabase,
  limit: number
): Promise<SwipeMedia[]> {
  return await db.getAllAsync<SwipeMedia>(
    `SELECT m.* FROM swipe_events e
     INNER JOIN swipe_media m ON e.media_id = m.id
     ORDER BY e.created_at DESC
     LIMIT ?`,
    [limit]
  );
}

// ============ Swipe Signals (legacy, from migration v1) ============

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
