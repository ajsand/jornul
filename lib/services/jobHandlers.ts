/**
 * Job Handlers
 * Implementation of specific job processing logic
 */

import { db } from '@/lib/storage/db';
import * as repos from '@/lib/storage/repositories';
import { Job } from '@/lib/storage/types';
import { registerJobHandler } from './jobRunner';

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
 */
async function handleNormalizeAndTag(job: Job, payload: { itemId: string }): Promise<void> {
  if (!payload.itemId) {
    throw new Error('Missing itemId in payload');
  }

  const rawDb = db.getRawDb();
  const item = await repos.getMediaItem(rawDb, payload.itemId);

  if (!item) {
    throw new Error(`Item not found: ${payload.itemId}`);
  }

  console.log(`[NormalizeAndTag] Processing item: ${item.id} (type: ${item.type})`);

  if (item.type === 'url' && item.source_url) {
    // Handle URL items
    const domain = extractDomain(item.source_url);

    if (domain) {
      // Update media_meta with source_domain
      await repos.upsertMediaMeta(rawDb, {
        item_id: item.id,
        source_domain: domain,
        extra_json: JSON.stringify({
          normalized_at: Date.now(),
          original_url: item.source_url,
        }),
      });

      // Update title if it looks like a placeholder
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
        normalized_at: Date.now(),
        text_stats: stats,
      }),
    });

    console.log(`[NormalizeAndTag] Note normalized: ${stats.word_count} words`);
  }

  // TODO: Future iterations will add actual tagging logic here
  // For now, we just mark the normalization as complete
}

/**
 * Register all job handlers
 */
export function registerAllJobHandlers(): void {
  registerJobHandler('normalize_and_tag', handleNormalizeAndTag);
  console.log('[JobHandlers] All handlers registered');
}
