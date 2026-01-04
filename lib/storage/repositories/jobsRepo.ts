/**
 * Jobs Repository - CRUD operations for background job queue
 */

import * as SQLite from 'expo-sqlite';
import {
  Job,
  CreateJobInput,
  UpdateJobInput,
  ListJobsFilters,
  JobStatus,
  IngestItem,
  CreateIngestItemInput,
  UpdateIngestItemInput,
  IngestStatus,
} from '../types';

// ============ Jobs ============

export async function createJob(
  db: SQLite.SQLiteDatabase,
  input: CreateJobInput
): Promise<string> {
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO jobs
     (id, kind, status, payload_json, progress, error, created_at, updated_at)
     VALUES (?, ?, 'pending', ?, 0, NULL, ?, ?)`,
    [input.id, input.kind, input.payload_json ?? null, now, now]
  );
  return input.id;
}

export async function getJob(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<Job | null> {
  return await db.getFirstAsync<Job>(
    'SELECT * FROM jobs WHERE id = ?',
    [id]
  );
}

export async function updateJob(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: UpdateJobInput
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.payload_json !== undefined) {
    fields.push('payload_json = ?');
    values.push(updates.payload_json);
  }
  if (updates.progress !== undefined) {
    fields.push('progress = ?');
    values.push(updates.progress);
  }
  if (updates.error !== undefined) {
    fields.push('error = ?');
    values.push(updates.error);
  }
  if (updates.retry_count !== undefined) {
    fields.push('retry_count = ?');
    values.push(updates.retry_count);
  }
  if (updates.last_error_at !== undefined) {
    fields.push('last_error_at = ?');
    values.push(updates.last_error_at);
  }

  if (fields.length === 0) return false;

  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  const result = await db.runAsync(
    `UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return result.changes > 0;
}

export async function deleteJob(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM jobs WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listJobs(
  db: SQLite.SQLiteDatabase,
  filters?: ListJobsFilters
): Promise<Job[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters?.kind) {
    whereClauses.push('kind = ?');
    params.push(filters.kind);
  }

  if (filters?.status) {
    whereClauses.push('status = ?');
    params.push(filters.status);
  }

  let query = 'SELECT * FROM jobs';

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

  return await db.getAllAsync<Job>(query, params);
}

export async function listPendingJobs(
  db: SQLite.SQLiteDatabase,
  kind?: string,
  limit?: number
): Promise<Job[]> {
  let query = "SELECT * FROM jobs WHERE status = 'pending'";
  const params: any[] = [];

  if (kind) {
    query += ' AND kind = ?';
    params.push(kind);
  }

  query += ' ORDER BY created_at ASC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(limit);
  }

  return await db.getAllAsync<Job>(query, params);
}

export async function countJobs(
  db: SQLite.SQLiteDatabase,
  status?: JobStatus
): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM jobs';
  const params: any[] = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  const result = await db.getFirstAsync<{ count: number }>(query, params);
  return result?.count ?? 0;
}

export async function markJobRunning(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  return updateJob(db, id, { status: 'running', progress: 0 });
}

export async function markJobDone(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  return updateJob(db, id, { status: 'done', progress: 1 });
}

export async function markJobFailed(
  db: SQLite.SQLiteDatabase,
  id: string,
  error: string
): Promise<boolean> {
  return updateJob(db, id, { status: 'failed', error });
}

export async function cancelJob(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  return updateJob(db, id, { status: 'cancelled' });
}

/**
 * Requeue a failed job for retry
 * Resets status to pending so it can be picked up again
 */
export async function requeueJob(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  return updateJob(db, id, {
    status: 'pending',
    error: null,
    progress: 0,
  });
}

/**
 * Increment retry count and mark as pending for automatic retry
 */
export async function incrementRetryAndRequeue(
  db: SQLite.SQLiteDatabase,
  id: string,
  error: string
): Promise<boolean> {
  const job = await getJob(db, id);
  if (!job) return false;

  return updateJob(db, id, {
    status: 'pending',
    retry_count: (job.retry_count || 0) + 1,
    last_error_at: Date.now(),
    error,
    progress: 0,
  });
}

/**
 * List failed jobs that can be retried (retry_count < maxRetries)
 */
export async function listRetryableJobs(
  db: SQLite.SQLiteDatabase,
  maxRetries: number = 3
): Promise<Job[]> {
  return await db.getAllAsync<Job>(
    `SELECT * FROM jobs
     WHERE status = 'failed' AND (retry_count IS NULL OR retry_count < ?)
     ORDER BY created_at ASC`,
    [maxRetries]
  );
}

/**
 * Retry all failed jobs that haven't exceeded max retries
 */
export async function retryAllFailedJobs(
  db: SQLite.SQLiteDatabase,
  maxRetries: number = 3
): Promise<number> {
  const result = await db.runAsync(
    `UPDATE jobs
     SET status = 'pending', error = NULL, progress = 0, updated_at = ?
     WHERE status = 'failed' AND (retry_count IS NULL OR retry_count < ?)`,
    [Date.now(), maxRetries]
  );
  return result.changes;
}

export async function cleanupOldJobs(
  db: SQLite.SQLiteDatabase,
  olderThanMs: number = 7 * 24 * 60 * 60 * 1000 // 7 days default
): Promise<number> {
  const cutoff = Date.now() - olderThanMs;
  const result = await db.runAsync(
    "DELETE FROM jobs WHERE status IN ('done', 'failed', 'cancelled') AND updated_at < ?",
    [cutoff]
  );
  return result.changes;
}

// ============ Ingest Queue (legacy, from migration v2) ============

export async function createIngestItem(
  db: SQLite.SQLiteDatabase,
  input: CreateIngestItemInput
): Promise<string> {
  await db.runAsync(
    `INSERT INTO ingest_queue
     (id, source_type, raw_content, file_uri, status, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
    [
      input.id,
      input.source_type,
      input.raw_content ?? null,
      input.file_uri ?? null,
      Date.now(),
    ]
  );
  return input.id;
}

export async function getIngestItem(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<IngestItem | null> {
  return await db.getFirstAsync<IngestItem>(
    'SELECT * FROM ingest_queue WHERE id = ?',
    [id]
  );
}

export async function updateIngestItem(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: UpdateIngestItemInput
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.error_message !== undefined) {
    fields.push('error_message = ?');
    values.push(updates.error_message);
  }
  if (updates.media_item_id !== undefined) {
    fields.push('media_item_id = ?');
    values.push(updates.media_item_id);
  }
  if (updates.processed_at !== undefined) {
    fields.push('processed_at = ?');
    values.push(updates.processed_at);
  }

  if (fields.length === 0) return false;

  values.push(id);

  const result = await db.runAsync(
    `UPDATE ingest_queue SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return result.changes > 0;
}

export async function listIngestItems(
  db: SQLite.SQLiteDatabase,
  status?: IngestStatus
): Promise<IngestItem[]> {
  let query = 'SELECT * FROM ingest_queue';
  const params: any[] = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  return await db.getAllAsync<IngestItem>(query, params);
}

export async function deleteIngestItem(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM ingest_queue WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function countIngestItems(
  db: SQLite.SQLiteDatabase,
  status?: IngestStatus
): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM ingest_queue';
  const params: any[] = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  const result = await db.getFirstAsync<{ count: number }>(query, params);
  return result?.count ?? 0;
}
