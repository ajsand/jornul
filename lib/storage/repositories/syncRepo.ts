/**
 * Sync Repository - CRUD operations for pending sessions (QR signature exchange)
 */

import * as SQLite from 'expo-sqlite';
import { PendingSession, PendingSessionStatus, DeviceSignature } from '../../sync/types';

// ============ Pending Sessions ============

export interface CreatePendingSessionInput {
  id: string;
  deviceId: string;
  signature: DeviceSignature;
}

/**
 * Insert a new pending session from an imported signature
 */
export async function insertPendingSession(
  db: SQLite.SQLiteDatabase,
  input: CreatePendingSessionInput
): Promise<string> {
  await db.runAsync(
    `INSERT INTO pending_sessions
     (id, device_id, signature_json, imported_at, status)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.id,
      input.deviceId,
      JSON.stringify(input.signature),
      Date.now(),
      'awaiting_consent',
    ]
  );
  return input.id;
}

/**
 * Get a pending session by ID
 */
export async function getPendingSession(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<PendingSession | null> {
  const row = await db.getFirstAsync<{
    id: string;
    device_id: string;
    signature_json: string;
    imported_at: number;
    status: PendingSessionStatus;
  }>('SELECT * FROM pending_sessions WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    deviceId: row.device_id,
    importedSignature: JSON.parse(row.signature_json),
    importedAt: row.imported_at,
    status: row.status,
  };
}

/**
 * List all pending sessions, optionally filtered by status
 */
export async function listPendingSessions(
  db: SQLite.SQLiteDatabase,
  status?: PendingSessionStatus
): Promise<PendingSession[]> {
  let query = 'SELECT * FROM pending_sessions';
  const params: any[] = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY imported_at DESC';

  const rows = await db.getAllAsync<{
    id: string;
    device_id: string;
    signature_json: string;
    imported_at: number;
    status: PendingSessionStatus;
  }>(query, params);

  return rows.map(row => ({
    id: row.id,
    deviceId: row.device_id,
    importedSignature: JSON.parse(row.signature_json),
    importedAt: row.imported_at,
    status: row.status,
  }));
}

/**
 * Update the status of a pending session
 */
export async function updatePendingSessionStatus(
  db: SQLite.SQLiteDatabase,
  id: string,
  status: PendingSessionStatus
): Promise<boolean> {
  const result = await db.runAsync(
    'UPDATE pending_sessions SET status = ? WHERE id = ?',
    [status, id]
  );
  return result.changes > 0;
}

/**
 * Delete a pending session by ID
 */
export async function deletePendingSession(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM pending_sessions WHERE id = ?', [id]);
  return result.changes > 0;
}

/**
 * Count pending sessions by status
 */
export async function countPendingSessions(
  db: SQLite.SQLiteDatabase,
  status?: PendingSessionStatus
): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM pending_sessions';
  const params: any[] = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  const result = await db.getFirstAsync<{ count: number }>(query, params);
  return result?.count ?? 0;
}

/**
 * Check if a pending session already exists for a device
 */
export async function hasPendingSessionForDevice(
  db: SQLite.SQLiteDatabase,
  deviceId: string
): Promise<boolean> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM pending_sessions WHERE device_id = ? AND status = ?',
    [deviceId, 'awaiting_consent']
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Delete all rejected sessions (cleanup)
 */
export async function deleteRejectedSessions(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  const result = await db.runAsync(
    "DELETE FROM pending_sessions WHERE status = 'rejected'"
  );
  return result.changes;
}

