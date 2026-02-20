/**
 * Files Repository - CRUD for files table
 */

import * as SQLite from 'expo-sqlite';
import { ItemFile, CreateItemFileInput, ListFilesFilters } from '../types';

export async function createFile(
  db: SQLite.SQLiteDatabase,
  input: CreateItemFileInput
): Promise<string> {
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO files (id, item_id, filename, mime_type, local_uri, size_bytes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.item_id,
      input.filename,
      input.mime_type ?? null,
      input.local_uri,
      input.size_bytes ?? null,
      now,
    ]
  );
  return input.id;
}

export async function getFile(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<ItemFile | null> {
  return db.getFirstAsync<ItemFile>('SELECT * FROM files WHERE id = ?', [id]);
}

export async function deleteFile(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM files WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listFiles(
  db: SQLite.SQLiteDatabase,
  filters?: ListFilesFilters
): Promise<ItemFile[]> {
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (filters?.item_id !== undefined) {
    whereClauses.push('item_id = ?');
    params.push(filters.item_id);
  }

  let query = 'SELECT * FROM files';
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

  return db.getAllAsync<ItemFile>(query, params as any[]);
}

export async function deleteFilesForItem(
  db: SQLite.SQLiteDatabase,
  item_id: string
): Promise<number> {
  const result = await db.runAsync('DELETE FROM files WHERE item_id = ?', [item_id]);
  return result.changes;
}

export async function countFiles(
  db: SQLite.SQLiteDatabase,
  item_id?: string
): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM files';
  const params: unknown[] = [];
  if (item_id !== undefined) {
    query += ' WHERE item_id = ?';
    params.push(item_id);
  }
  const result = await db.getFirstAsync<{ count: number }>(query, params as any[]);
  return result?.count ?? 0;
}
