/**
 * Job Handlers
 * Implementation of specific job processing logic
 */

import { db } from '@/lib/storage/db';
import * as repos from '@/lib/storage/repositories';
import { Job } from '@/lib/storage/types';
import { registerJobHandler } from './jobRunner';
import { updateBatchJobStatus } from './massUpload';
import { tagItem } from './aets';

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Compute basic text stats
 */
function computeTextStats(text: string): {
  char_count: number;
  word_count: number;
  line_count: number;
  has_urls: boolean;
} {
  const trimmed = text.trim();
  return {
    char_count: trimmed.length,
    word_count: trimmed.split(/\s+/).filter(w => w.length > 0).length,
    line_count: trimmed.split('\n').length,
    has_urls: /https?:\/\/\S+/.test(trimmed),
  };
}

/**
 * Normalize and tag handler
 * - For links: extract domain, update source_domain
 * - For notes: compute text stats, store in media_meta
 * - For files: merge existing meta with normalized info
 */
async function handleNormalizeAndTag(
  job: Job,
  payload: { itemId: string; batchId?: string }
): Promise<void> {
  if (!payload.itemId) {
    throw new Error('Missing itemId in payload');
  }

  const rawDb = db.getRawDb();
  const item = await repos.getMediaItem(rawDb, payload.itemId);

  if (!item) {
    throw new Error(`Item not found: ${payload.itemId}`);
  }

  console.log(`[NormalizeAndTag] Processing item: ${item.id} (type: ${item.type})`);

  // Get existing meta if any
  const existingMeta = await repos.getMediaMeta(rawDb, item.id);
  let existingExtra: Record<string, any> = {};
  if (existingMeta?.extra_json) {
    try {
      existingExtra = JSON.parse(existingMeta.extra_json);
    } catch {
      // Ignore parse errors
    }
  }

  if (item.type === 'url' && item.source_url) {
    // Handle URL items
    const domain = extractDomain(item.source_url);

    if (domain) {
      await repos.upsertMediaMeta(rawDb, {
        item_id: item.id,
        source_domain: domain,
        extra_json: JSON.stringify({
          ...existingExtra,
          normalized_at: Date.now(),
          original_url: item.source_url,
        }),
      });

      if (!item.title || item.title === 'Link' || item.title === domain) {
        await repos.updateMediaItem(rawDb, item.id, {
          title: domain,
        });
      }

      console.log(`[NormalizeAndTag] Link normalized: domain=${domain}`);
    }
  } else if (item.type === 'text' && item.extracted_text) {
    // Handle text/note items
    const stats = computeTextStats(item.extracted_text);

    await repos.upsertMediaMeta(rawDb, {
      item_id: item.id,
      extra_json: JSON.stringify({
        ...existingExtra,
        normalized_at: Date.now(),
        text_stats: stats,
      }),
    });

    console.log(`[NormalizeAndTag] Note normalized: ${stats.word_count} words`);
  } else if (['image', 'audio', 'video', 'pdf'].includes(item.type)) {
    // Handle file items - just mark as normalized
    await repos.upsertMediaMeta(rawDb, {
      item_id: item.id,
      extra_json: JSON.stringify({
        ...existingExtra,
        normalized_at: Date.now(),
      }),
    });

    console.log(`[NormalizeAndTag] File normalized: ${item.type}`);
  }

  // AETS: Extract and assign emergent tags
  try {
    const taggingResult = await tagItem(rawDb, item);
    console.log(`[NormalizeAndTag] AETS tagged: ${taggingResult.tagsAssigned} tags assigned`);
  } catch (error) {
    // Log but don't fail the job if tagging fails
    console.error(`[NormalizeAndTag] AETS tagging failed:`, error);
  }

  // Update batch job status if this is part of a batch
  if (payload.batchId) {
    await updateBatchJobStatus(payload.batchId);
  }
}

/**
 * Batch import handler
 * Monitors child jobs and updates overall progress
 */
async function handleBatchImport(
  job: Job,
  payload: { childJobIds: string[]; totalFiles: number }
): Promise<void> {
  // The batch job itself doesn't need to do much work
  // It just serves as a tracking container
  // Child jobs trigger updateBatchJobStatus when they complete
  console.log(`[BatchImport] Batch job ${job.id} tracking ${payload.totalFiles} files`);

  // Mark as running - individual job completions will update progress
  const rawDb = db.getRawDb();
  await repos.updateJob(rawDb, job.id, {
    status: 'running',
    progress: 0,
  });
}

/**
 * Register all job handlers
 */
export function registerAllJobHandlers(): void {
  registerJobHandler('normalize_and_tag', handleNormalizeAndTag);
  registerJobHandler('batch_import', handleBatchImport);
  console.log('[JobHandlers] All handlers registered');
}
