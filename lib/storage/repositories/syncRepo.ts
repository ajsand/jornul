/**
 * Sync Repository - CRUD operations for pending sessions (QR signature exchange)
 */

import * as SQLite from 'expo-sqlite';
import { PendingSession, PendingSessionStatus, DeviceSignature } from '../../sync/types';

// Default session expiration time (7 days in milliseconds)
const SESSION_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Safely parse JSON with error handling
 * Returns null if parsing fails instead of throwing
 */
function safeJsonParse<T>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('[syncRepo] Failed to parse JSON:', error);
    return null;
  }
}

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
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO pending_sessions
     (id, device_id, signature_json, imported_at, status, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.id,
      input.deviceId,
      JSON.stringify(input.signature),
      now,
      'awaiting_consent',
      now + SESSION_EXPIRATION_MS,
    ]
  );
  return input.id;
}

/**
 * Get a pending session by ID
 * Returns null if session not found or signature is corrupted
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
    expires_at: number | null;
  }>('SELECT * FROM pending_sessions WHERE id = ?', [id]);

  if (!row) return null;

  // Safely parse the signature JSON - return null if corrupted
  const signature = safeJsonParse<DeviceSignature>(row.signature_json);
  if (!signature) {
    console.warn(`[syncRepo] Session ${id} has corrupted signature, treating as not found`);
    return null;
  }

  return {
    id: row.id,
    deviceId: row.device_id,
    importedSignature: signature,
    importedAt: row.imported_at,
    status: row.status,
  };
}

/**
 * List all pending sessions, optionally filtered by status
 * Filters out sessions with corrupted signature data
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
    expires_at: number | null;
  }>(query, params);

  // Filter out entries with corrupted signatures
  const validSessions: PendingSession[] = [];
  for (const row of rows) {
    const signature = safeJsonParse<DeviceSignature>(row.signature_json);
    if (signature) {
      validSessions.push({
        id: row.id,
        deviceId: row.device_id,
        importedSignature: signature,
        importedAt: row.imported_at,
        status: row.status,
      });
    } else {
      console.warn(`[syncRepo] Skipping session ${row.id} with corrupted signature`);
    }
  }

  return validSessions;
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

/**
 * Delete expired pending sessions
 * Sessions expire after SESSION_EXPIRATION_MS (7 days)
 * Returns the number of sessions deleted
 */
export async function cleanupExpiredSessions(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  const now = Date.now();
  const result = await db.runAsync(
    'DELETE FROM pending_sessions WHERE expires_at IS NOT NULL AND expires_at < ?',
    [now]
  );
  if (result.changes > 0) {
    console.log(`[syncRepo] Cleaned up ${result.changes} expired session(s)`);
  }
  return result.changes;
}

/**
 * List expired pending sessions (for UI display before cleanup)
 */
export async function listExpiredSessions(
  db: SQLite.SQLiteDatabase
): Promise<PendingSession[]> {
  const now = Date.now();
  const rows = await db.getAllAsync<{
    id: string;
    device_id: string;
    signature_json: string;
    imported_at: number;
    status: PendingSessionStatus;
    expires_at: number | null;
  }>(
    'SELECT * FROM pending_sessions WHERE expires_at IS NOT NULL AND expires_at < ? ORDER BY imported_at DESC',
    [now]
  );

  const validSessions: PendingSession[] = [];
  for (const row of rows) {
    const signature = safeJsonParse<DeviceSignature>(row.signature_json);
    if (signature) {
      validSessions.push({
        id: row.id,
        deviceId: row.device_id,
        importedSignature: signature,
        importedAt: row.imported_at,
        status: row.status,
      });
    }
  }

  return validSessions;
}

/**
 * Check if a session is expired
 */
export async function isSessionExpired(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const now = Date.now();
  const result = await db.getFirstAsync<{ expired: number }>(
    'SELECT (expires_at IS NOT NULL AND expires_at < ?) as expired FROM pending_sessions WHERE id = ?',
    [now, id]
  );
  return result?.expired === 1;
}


