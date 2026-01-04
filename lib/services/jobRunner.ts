/**
 * Job Runner Service
 * Processes background jobs from the queue in FIFO order
 * Features:
 * - Timeout protection (prevents hung jobs from blocking queue)
 * - Automatic retry with exponential backoff
 * - Configurable max retries per job
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
const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minute timeout per job
const MAX_RETRIES = 3; // Maximum automatic retries
const BASE_RETRY_DELAY_MS = 1000; // Base delay for exponential backoff

/**
 * Create a promise that rejects after a timeout
 */
function createTimeout(ms: number, jobId: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Job ${jobId} timed out after ${ms / 1000} seconds`));
    }, ms);
  });
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(retryCount: number): number {
  return BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
}

/**
 * Register a job handler for a specific job kind
 */
export function registerJobHandler(kind: string, handler: JobHandler): void {
  jobHandlers[kind] = handler;
  console.log(`[JobRunner] Registered handler for: ${kind}`);
}

/**
 * Process a single job with timeout protection and retry logic
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
  const retryCount = job.retry_count || 0;

  try {
    // Mark as running
    await repos.markJobRunning(rawDb, job.id);
    console.log(`[JobRunner] Processing job: ${job.id} (${job.kind}) [attempt ${retryCount + 1}/${MAX_RETRIES + 1}]`);

    // Parse payload
    let payload = {};
    if (job.payload_json) {
      try {
        payload = JSON.parse(job.payload_json);
      } catch (e) {
        throw new Error('Invalid job payload JSON');
      }
    }

    // Execute handler with timeout protection
    await Promise.race([
      handler(job, payload),
      createTimeout(JOB_TIMEOUT_MS, job.id),
    ]);

    // Mark as done
    await repos.markJobDone(rawDb, job.id);
    console.log(`[JobRunner] Completed job: ${job.id}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[JobRunner] Job failed: ${job.id}`, error);

    // Check if we should retry
    if (retryCount < MAX_RETRIES) {
      const delay = getRetryDelay(retryCount);
      console.log(`[JobRunner] Will retry job ${job.id} in ${delay}ms (attempt ${retryCount + 2}/${MAX_RETRIES + 1})`);

      // Increment retry count and requeue
      await repos.incrementRetryAndRequeue(rawDb, job.id, errorMessage);

      // Wait before allowing the job to be picked up again
      await new Promise((resolve) => setTimeout(resolve, delay));
    } else {
      // Max retries exceeded - mark as permanently failed
      console.error(`[JobRunner] Job ${job.id} exceeded max retries (${MAX_RETRIES}), marking as failed`);
      await repos.markJobFailed(rawDb, job.id, `${errorMessage} (after ${MAX_RETRIES + 1} attempts)`);
    }
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

/**
 * Manually retry a specific failed job
 * Resets the job to pending state so it can be picked up again
 */
export async function retryJob(jobId: string): Promise<boolean> {
  await db.init();
  const rawDb = db.getRawDb();
  return repos.requeueJob(rawDb, jobId);
}

/**
 * Retry all failed jobs that haven't exceeded max retries
 * Returns the number of jobs requeued
 */
export async function retryAllFailed(): Promise<number> {
  await db.init();
  const rawDb = db.getRawDb();
  return repos.retryAllFailedJobs(rawDb, MAX_RETRIES);
}

/**
 * Get the maximum number of retries configured
 */
export function getMaxRetries(): number {
  return MAX_RETRIES;
}

/**
 * Get the job timeout in milliseconds
 */
export function getJobTimeout(): number {
  return JOB_TIMEOUT_MS;
}
