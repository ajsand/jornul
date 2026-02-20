/**
 * Signatures Repository - CRUD for signatures table
 */

import * as SQLite from 'expo-sqlite';
import {
  Signature,
  CreateSignatureInput,
  UpdateSignatureInput,
  ListSignaturesFilters,
} from '../types';

export async function createSignature(
  db: SQLite.SQLiteDatabase,
  input: CreateSignatureInput
): Promise<string> {
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO signatures (id, device_id, public_key_hash, label, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [input.id, input.device_id, input.public_key_hash, input.label ?? null, now]
  );
  return input.id;
}

export async function getSignature(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<Signature | null> {
  return db.getFirstAsync<Signature>(
    'SELECT * FROM signatures WHERE id = ?',
    [id]
  );
}

export async function getSignatureByDeviceKey(
  db: SQLite.SQLiteDatabase,
  device_id: string,
  public_key_hash: string
): Promise<Signature | null> {
  return db.getFirstAsync<Signature>(
    'SELECT * FROM signatures WHERE device_id = ? AND public_key_hash = ?',
    [device_id, public_key_hash]
  );
}

export async function listSignaturesForDevice(
  db: SQLite.SQLiteDatabase,
  device_id: string
): Promise<Signature[]> {
  return db.getAllAsync<Signature>(
    'SELECT * FROM signatures WHERE device_id = ? ORDER BY created_at DESC',
    [device_id]
  );
}

export async function updateSignature(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: UpdateSignatureInput
): Promise<boolean> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.label !== undefined) {
    fields.push('label = ?');
    values.push(updates.label);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const result = await db.runAsync(
    `UPDATE signatures SET ${fields.join(', ')} WHERE id = ?`,
    values as any[]
  );
  return result.changes > 0;
}

export async function deleteSignature(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM signatures WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function upsertSignature(
  db: SQLite.SQLiteDatabase,
  input: CreateSignatureInput
): Promise<string> {
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO signatures (id, device_id, public_key_hash, label, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(device_id, public_key_hash)
     DO UPDATE SET label = excluded.label`,
    [input.id, input.device_id, input.public_key_hash, input.label ?? null, now]
  );
  return input.id;
}
