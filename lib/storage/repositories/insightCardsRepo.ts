/**
 * Insight Cards Repository - CRUD for insight_cards table
 */

import * as SQLite from 'expo-sqlite';
import {
  InsightCard,
  CreateInsightCardInput,
  ListInsightCardsFilters,
} from '../types';

export async function createInsightCard(
  db: SQLite.SQLiteDatabase,
  input: CreateInsightCardInput
): Promise<string> {
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO insight_cards (id, item_id, kind, content_json, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.item_id ?? null,
      input.kind,
      input.content_json,
      input.source,
      now,
    ]
  );
  return input.id;
}

export async function getInsightCard(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<InsightCard | null> {
  return db.getFirstAsync<InsightCard>(
    'SELECT * FROM insight_cards WHERE id = ?',
    [id]
  );
}

export async function deleteInsightCard(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM insight_cards WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listInsightCards(
  db: SQLite.SQLiteDatabase,
  filters?: ListInsightCardsFilters
): Promise<InsightCard[]> {
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (filters?.item_id !== undefined) {
    whereClauses.push('item_id = ?');
    params.push(filters.item_id);
  }
  if (filters?.kind !== undefined) {
    whereClauses.push('kind = ?');
    params.push(filters.kind);
  }
  if (filters?.source !== undefined) {
    whereClauses.push('source = ?');
    params.push(filters.source);
  }

  let query = 'SELECT * FROM insight_cards';
  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }
  query += ' ORDER BY created_at DESC';

  if (filters?.limit !== undefined) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }
  if (filters?.offset !== undefined) {
    query += ' OFFSET ?';
    params.push(filters.offset);
  }

  return db.getAllAsync<InsightCard>(query, params as any[]);
}

export async function deleteInsightCardsForItem(
  db: SQLite.SQLiteDatabase,
  item_id: string
): Promise<number> {
  const result = await db.runAsync(
    'DELETE FROM insight_cards WHERE item_id = ?',
    [item_id]
  );
  return result.changes;
}

export async function countInsightCards(
  db: SQLite.SQLiteDatabase,
  filters?: { item_id?: string; kind?: string; source?: string }
): Promise<number> {
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (filters?.item_id !== undefined) {
    whereClauses.push('item_id = ?');
    params.push(filters.item_id);
  }
  if (filters?.kind !== undefined) {
    whereClauses.push('kind = ?');
    params.push(filters.kind);
  }
  if (filters?.source !== undefined) {
    whereClauses.push('source = ?');
    params.push(filters.source);
  }

  let query = 'SELECT COUNT(*) as count FROM insight_cards';
  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  const result = await db.getFirstAsync<{ count: number }>(query, params as any[]);
  return result?.count ?? 0;
}
