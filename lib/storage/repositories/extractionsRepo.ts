/**
 * Extractions Repository - CRUD for extractions table
 */

import * as SQLite from 'expo-sqlite';
import {
  Extraction,
  CreateExtractionInput,
  UpdateExtractionInput,
  ListExtractionsFilters,
  ExtractionStage,
} from '../types';

export async function createExtraction(
  db: SQLite.SQLiteDatabase,
  input: CreateExtractionInput
): Promise<string> {
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO extractions (id, item_id, stage, content, confidence, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.item_id,
      input.stage,
      input.content ?? null,
      input.confidence ?? null,
      now,
    ]
  );
  return input.id;
}

export async function getExtraction(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<Extraction | null> {
  return db.getFirstAsync<Extraction>(
    'SELECT * FROM extractions WHERE id = ?',
    [id]
  );
}

export async function getExtractionForStage(
  db: SQLite.SQLiteDatabase,
  item_id: string,
  stage: ExtractionStage
): Promise<Extraction | null> {
  return db.getFirstAsync<Extraction>(
    'SELECT * FROM extractions WHERE item_id = ? AND stage = ? ORDER BY created_at DESC LIMIT 1',
    [item_id, stage]
  );
}

export async function updateExtraction(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: UpdateExtractionInput
): Promise<boolean> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.confidence !== undefined) {
    fields.push('confidence = ?');
    values.push(updates.confidence);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await db.runAsync(
    `UPDATE extractions SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.changes > 0;
}

export async function deleteExtraction(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM extractions WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listExtractions(
  db: SQLite.SQLiteDatabase,
  filters?: ListExtractionsFilters
): Promise<Extraction[]> {
  const whereClauses: string[] = [];
  const params: (string | number | null)[] = [];

  if (filters?.item_id !== undefined) {
    whereClauses.push('item_id = ?');
    params.push(filters.item_id);
  }
  if (filters?.stage !== undefined) {
    whereClauses.push('stage = ?');
    params.push(filters.stage);
  }

  let query = 'SELECT * FROM extractions';
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

  return db.getAllAsync<Extraction>(query, params);
}

export async function deleteExtractionsForItem(
  db: SQLite.SQLiteDatabase,
  item_id: string
): Promise<number> {
  const result = await db.runAsync(
    'DELETE FROM extractions WHERE item_id = ?',
    [item_id]
  );
  return result.changes;
}
