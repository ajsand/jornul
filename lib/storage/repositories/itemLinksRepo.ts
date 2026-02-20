/**
 * Item Links Repository - CRUD for item_links table
 */

import * as SQLite from 'expo-sqlite';
import {
  ItemLink,
  CreateItemLinkInput,
  UpdateItemLinkInput,
  ListItemLinksFilters,
} from '../types';

export async function createItemLink(
  db: SQLite.SQLiteDatabase,
  input: CreateItemLinkInput
): Promise<string> {
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO item_links (id, item_id, url, title, description, domain, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.item_id,
      input.url,
      input.title ?? null,
      input.description ?? null,
      input.domain ?? null,
      now,
    ]
  );
  return input.id;
}

export async function getItemLink(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<ItemLink | null> {
  return db.getFirstAsync<ItemLink>(
    'SELECT * FROM item_links WHERE id = ?',
    [id]
  );
}

export async function updateItemLink(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: UpdateItemLinkInput
): Promise<boolean> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.url !== undefined) {
    fields.push('url = ?');
    values.push(updates.url);
  }
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.domain !== undefined) {
    fields.push('domain = ?');
    values.push(updates.domain);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await db.runAsync(
    `UPDATE item_links SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.changes > 0;
}

export async function deleteItemLink(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM item_links WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listItemLinks(
  db: SQLite.SQLiteDatabase,
  filters?: ListItemLinksFilters
): Promise<ItemLink[]> {
  const whereClauses: string[] = [];
  const params: (string | number | null)[] = [];

  if (filters?.item_id !== undefined) {
    whereClauses.push('item_id = ?');
    params.push(filters.item_id);
  }
  if (filters?.domain !== undefined) {
    whereClauses.push('domain = ?');
    params.push(filters.domain);
  }

  let query = 'SELECT * FROM item_links';
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

  return db.getAllAsync<ItemLink>(query, params);
}

export async function countItemLinks(
  db: SQLite.SQLiteDatabase,
  item_id?: string
): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM item_links';
  const params: (string | number | null)[] = [];
  if (item_id !== undefined) {
    query += ' WHERE item_id = ?';
    params.push(item_id);
  }
  const result = await db.getFirstAsync<{ count: number }>(query, params);
  return result?.count ?? 0;
}

export async function deleteItemLinksForItem(
  db: SQLite.SQLiteDatabase,
  item_id: string
): Promise<number> {
  const result = await db.runAsync(
    'DELETE FROM item_links WHERE item_id = ?',
    [item_id]
  );
  return result.changes;
}
