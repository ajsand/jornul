/**
 * Compare Repository - CRUD operations for compare sessions and session ledger
 * Iteration 24: Consent Screen + Compare Capsule Builder
 */

import * as SQLite from 'expo-sqlite';
import {
  CompareSession,
  CompareSessionItem,
  SessionLedger,
  CreateCompareSessionInput,
  CreateSessionLedgerInput,
  UpdateSessionLedgerInput,
  ListSessionLedgerFilters,
  ShareLevel,
} from '../types';
import { ConsentMode } from '../../sync/types';

// ============ Compare Sessions ============

/**
 * Create a new compare session
 */
export async function createCompareSession(
  db: SQLite.SQLiteDatabase,
  input: CreateCompareSessionInput
): Promise<string> {
  await db.runAsync(
    `INSERT INTO compare_sessions (id, mode, scope_filters, provider, created_at)
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

/**
 * Get a compare session by ID
 */
export async function getCompareSession(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<CompareSession | null> {
  const row = await db.getFirstAsync<{
    id: string;
    mode: string;
    scope_filters: string | null;
    provider: string | null;
    created_at: number;
  }>('SELECT * FROM compare_sessions WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    mode: row.mode as ConsentMode,
    scope_filters: row.scope_filters,
    provider: row.provider,
    created_at: row.created_at,
  };
}

/**
 * Insert an item into a compare session
 */
export async function insertCompareSessionItem(
  db: SQLite.SQLiteDatabase,
  sessionId: string,
  itemId: string,
  shareLevel: ShareLevel
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO compare_session_items (session_id, item_id, share_level, created_at)
     VALUES (?, ?, ?, ?)`,
    [sessionId, itemId, shareLevel, Date.now()]
  );
}

/**
 * List all items in a compare session
 */
export async function listCompareSessionItems(
  db: SQLite.SQLiteDatabase,
  sessionId: string
): Promise<CompareSessionItem[]> {
  const rows = await db.getAllAsync<{
    session_id: string;
    item_id: string;
    share_level: string;
    created_at: number;
  }>('SELECT * FROM compare_session_items WHERE session_id = ?', [sessionId]);

  return rows.map(row => ({
    session_id: row.session_id,
    item_id: row.item_id,
    share_level: row.share_level as ShareLevel,
    created_at: row.created_at,
  }));
}

/**
 * Delete a compare session and its items (cascade)
 */
export async function deleteCompareSession(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM compare_sessions WHERE id = ?', [id]);
  return result.changes > 0;
}

/**
 * List compare sessions with optional filters
 */
export async function listCompareSessions(
  db: SQLite.SQLiteDatabase,
  filters?: {
    mode?: ConsentMode;
    limit?: number;
    offset?: number;
  }
): Promise<CompareSession[]> {
  let query = 'SELECT * FROM compare_sessions';
  const params: any[] = [];
  const conditions: string[] = [];

  if (filters?.mode) {
    conditions.push('mode = ?');
    params.push(filters.mode);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
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

  const rows = await db.getAllAsync<{
    id: string;
    mode: string;
    scope_filters: string | null;
    provider: string | null;
    created_at: number;
  }>(query, params);

  return rows.map(row => ({
    id: row.id,
    mode: row.mode as ConsentMode,
    scope_filters: row.scope_filters,
    provider: row.provider,
    created_at: row.created_at,
  }));
}

// ============ Session Ledger ============

/**
 * Create a new session ledger entry
 */
export async function createSessionLedger(
  db: SQLite.SQLiteDatabase,
  input: CreateSessionLedgerInput
): Promise<string> {
  await db.runAsync(
    `INSERT INTO session_ledger
     (id, started_at, mode, provider, excerpt_counts_json, sensitive_included, token_estimate, cost_estimate_cents)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      Date.now(),
      input.mode,
      input.provider ?? null,
      input.excerpt_counts_json ?? null,
      input.sensitive_included ? 1 : 0,
      input.token_estimate ?? null,
      input.cost_estimate_cents ?? null,
    ]
  );
  return input.id;
}

/**
 * Get a session ledger entry by ID
 */
export async function getSessionLedger(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<SessionLedger | null> {
  const row = await db.getFirstAsync<{
    id: string;
    started_at: number;
    mode: string;
    provider: string | null;
    excerpt_counts_json: string | null;
    sensitive_included: number;
    token_estimate: number | null;
    cost_estimate_cents: number | null;
    ended_at: number | null;
    result_json: string | null;
  }>('SELECT * FROM session_ledger WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    started_at: row.started_at,
    mode: row.mode,
    provider: row.provider,
    excerpt_counts_json: row.excerpt_counts_json,
    sensitive_included: row.sensitive_included,
    token_estimate: row.token_estimate,
    cost_estimate_cents: row.cost_estimate_cents,
    ended_at: row.ended_at,
    result_json: row.result_json,
  };
}

/**
 * Update a session ledger entry
 */
export async function updateSessionLedger(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: UpdateSessionLedgerInput
): Promise<boolean> {
  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.ended_at !== undefined) {
    setClauses.push('ended_at = ?');
    params.push(updates.ended_at);
  }

  if (updates.result_json !== undefined) {
    setClauses.push('result_json = ?');
    params.push(updates.result_json);
  }

  if (updates.token_estimate !== undefined) {
    setClauses.push('token_estimate = ?');
    params.push(updates.token_estimate);
  }

  if (updates.cost_estimate_cents !== undefined) {
    setClauses.push('cost_estimate_cents = ?');
    params.push(updates.cost_estimate_cents);
  }

  if (setClauses.length === 0) return false;

  params.push(id);

  const result = await db.runAsync(
    `UPDATE session_ledger SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );

  return result.changes > 0;
}

/**
 * List session ledger entries with optional filters
 */
export async function listSessionLedgers(
  db: SQLite.SQLiteDatabase,
  filters?: ListSessionLedgerFilters
): Promise<SessionLedger[]> {
  let query = 'SELECT * FROM session_ledger';
  const params: any[] = [];
  const conditions: string[] = [];

  if (filters?.mode) {
    conditions.push('mode = ?');
    params.push(filters.mode);
  }

  if (filters?.provider) {
    conditions.push('provider = ?');
    params.push(filters.provider);
  }

  if (filters?.dateFrom) {
    conditions.push('started_at >= ?');
    params.push(filters.dateFrom);
  }

  if (filters?.dateTo) {
    conditions.push('started_at <= ?');
    params.push(filters.dateTo);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY started_at DESC';

  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  if (filters?.offset) {
    query += ' OFFSET ?';
    params.push(filters.offset);
  }

  const rows = await db.getAllAsync<{
    id: string;
    started_at: number;
    mode: string;
    provider: string | null;
    excerpt_counts_json: string | null;
    sensitive_included: number;
    token_estimate: number | null;
    cost_estimate_cents: number | null;
    ended_at: number | null;
    result_json: string | null;
  }>(query, params);

  return rows.map(row => ({
    id: row.id,
    started_at: row.started_at,
    mode: row.mode,
    provider: row.provider,
    excerpt_counts_json: row.excerpt_counts_json,
    sensitive_included: row.sensitive_included,
    token_estimate: row.token_estimate,
    cost_estimate_cents: row.cost_estimate_cents,
    ended_at: row.ended_at,
    result_json: row.result_json,
  }));
}

/**
 * Delete a session ledger entry
 */
export async function deleteSessionLedger(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM session_ledger WHERE id = ?', [id]);
  return result.changes > 0;
}
