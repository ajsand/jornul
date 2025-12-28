/**
 * Job Runner Service
 * Processes background jobs from the queue in FIFO order
 */

import { db } from '@/lib/storage/db';
import * as repos from '@/lib/storage/repositories';
import { Job } from '@/lib/storage/types';

// Job handler type
type JobHandler = (job: Job, payload: any) => Promise<void>;

// Registry of job handlers
const jobHandlers: Record<string, JobHandler> = {};

// Runner state
let isRunning = false;
let runnerInterval: ReturnType<typeof setInterval> | null = null;
const POLL_INTERVAL_MS = 2000; // Check for jobs every 2 seconds
const MAX_CONCURRENT_JOBS = 1; // Process one job at a time for safety

/**
 * Register a job handler for a specific job kind
 */
export function registerJobHandler(kind: string, handler: JobHandler): void {
  jobHandlers[kind] = handler;
  console.log(`[JobRunner] Registered handler for: ${kind}`);
}

/**
 * Process a single job
 */
async function processJob(job: Job): Promise<void> {
  const handler = jobHandlers[job.kind];

  if (!handler) {
    console.warn(`[JobRunner] No handler for job kind: ${job.kind}`);
    const rawDb = db.getRawDb();
    await repos.markJobFailed(rawDb, job.id, `Unknown job kind: ${job.kind}`);
    return;
  }

  const rawDb = db.getRawDb();

  try {
    // Mark as running
    await repos.markJobRunning(rawDb, job.id);
    console.log(`[JobRunner] Processing job: ${job.id} (${job.kind})`);

    // Parse payload
    let payload = {};
    if (job.payload_json) {
      try {
        payload = JSON.parse(job.payload_json);
      } catch (e) {
        throw new Error('Invalid job payload JSON');
      }
    }

    // Execute handler
    await handler(job, payload);

    // Mark as done
    await repos.markJobDone(rawDb, job.id);
    console.log(`[JobRunner] Completed job: ${job.id}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[JobRunner] Job failed: ${job.id}`, error);
    await repos.markJobFailed(rawDb, job.id, errorMessage);
  }
}

/**
 * Poll for and process pending jobs
 */
async function pollAndProcess(): Promise<void> {
  if (!isRunning) return;

  try {
    const rawDb = db.getRawDb();
    const pendingJobs = await repos.listPendingJobs(rawDb, undefined, MAX_CONCURRENT_JOBS);

    for (const job of pendingJobs) {
      if (!isRunning) break;
      await processJob(job);
    }
  } catch (error) {
    console.error('[JobRunner] Poll error:', error);
  }
}

/**
 * Start the job runner
 */
export async function startJobRunner(): Promise<void> {
  if (isRunning) {
    console.log('[JobRunner] Already running');
    return;
  }

  try {
    await db.init();
    isRunning = true;
    console.log('[JobRunner] Started');

    // Initial poll
    await pollAndProcess();

    // Set up interval polling
    runnerInterval = setInterval(pollAndProcess, POLL_INTERVAL_MS);
  } catch (error) {
    console.error('[JobRunner] Failed to start:', error);
    isRunning = false;
  }
}

/**
 * Stop the job runner
 */
export function stopJobRunner(): void {
  if (!isRunning) return;

  isRunning = false;
  if (runnerInterval) {
    clearInterval(runnerInterval);
    runnerInterval = null;
  }
  console.log('[JobRunner] Stopped');
}

/**
 * Check if runner is active
 */
export function isJobRunnerActive(): boolean {
  return isRunning;
}

/**
 * Manually trigger processing of pending jobs
 */
export async function processPendingJobs(): Promise<void> {
  if (!isRunning) {
    await startJobRunner();
  }
  await pollAndProcess();
}

/**
 * Get job runner stats
 */
export async function getJobStats(): Promise<{
  pending: number;
  running: number;
  done: number;
  failed: number;
}> {
  await db.init();
  const rawDb = db.getRawDb();

  const [pending, running, done, failed] = await Promise.all([
    repos.countJobs(rawDb, 'pending'),
    repos.countJobs(rawDb, 'running'),
    repos.countJobs(rawDb, 'done'),
    repos.countJobs(rawDb, 'failed'),
  ]);

  return { pending, running, done, failed };
}
