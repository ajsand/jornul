/**
 * Job Handlers
 * Implementation of specific job processing logic
 */

import { db } from '@/lib/storage/db';
import * as repos from '@/lib/storage/repositories';
import { Job, MediaItem } from '@/lib/storage/types';
import { registerJobHandler } from './jobRunner';
import { updateBatchJobStatus } from './massUpload';
import { tagItem, tagItemWithContent } from './aets';
import { analyzeMultipleUrls, extractUrls, UrlMetadata } from './urlMetadata';
import { upsertFtsEntry } from '@/lib/storage/repositories/ftsRepo';

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
 * - For links: fetch content, extract title/description, update metadata
 * - For notes: compute text stats, store in media_meta
 * - For files: merge existing meta with normalized info
 */
async function handleNormalizeAndTag(
  job: Job,
  payload: { itemId: string; batchId?: string; fetchUrlContent?: boolean }
): Promise<void> {
  if (!payload.itemId) {
    throw new Error('Missing itemId in payload');
  }

  const rawDb = db.getRawDb();
  let item = await repos.getMediaItem(rawDb, payload.itemId);

  if (!item) {
    throw new Error(`Item not found: ${payload.itemId}`);
  }

  console.log(`[NormalizeAndTag] Processing item: ${item.id} (type: ${item.type})`);

  // Get existing meta and metadata_json
  const existingMeta = await repos.getMediaMeta(rawDb, item.id);
  let existingExtra: Record<string, any> = {};
  if (existingMeta?.extra_json) {
    try {
      existingExtra = JSON.parse(existingMeta.extra_json);
    } catch {
      // Ignore parse errors
    }
  }

  let itemMetadata: Record<string, any> = {};
  if (item.metadata_json) {
    try {
      itemMetadata = JSON.parse(item.metadata_json);
    } catch {
      // Ignore parse errors
    }
  }

  // Content for enhanced tagging
  let fetchedContent: string[] = [];
  let fetchedKeywords: string[] = [];

  if (item.type === 'url') {
    // Get URLs from metadata or source_url
    const urls = itemMetadata.urls || (item.source_url ? [item.source_url] : []);

    if (urls.length > 0 && (payload.fetchUrlContent || itemMetadata.pendingUrlFetch)) {
      console.log(`[NormalizeAndTag] Fetching content for ${urls.length} URL(s)...`);

      try {
        // Fetch metadata for all URLs
        const analysis = await analyzeMultipleUrls(urls);

        // Determine the best title from fetched content
        let newTitle: string | null = null;
        
        // For single URL, prefer the actual fetched title
        if (urls.length === 1 && analysis.urls[0]?.title) {
          newTitle = analysis.urls[0].title;
        } else if (analysis.combinedTitle && analysis.combinedTitle !== 'Link Collection') {
          // For multiple URLs, use the combined title
          newTitle = analysis.combinedTitle;
        }

        // Update item title if we got a real title
        if (newTitle && newTitle.trim().length > 0) {
          await repos.updateMediaItem(rawDb, item.id, {
            title: newTitle,
          });
          console.log(`[NormalizeAndTag] Updated title: "${newTitle}"`);
        }

        // Collect content for tagging
        for (const urlMeta of analysis.urls) {
          if (urlMeta.title) fetchedContent.push(urlMeta.title);
          if (urlMeta.description) fetchedContent.push(urlMeta.description);
          if (urlMeta.author) fetchedContent.push(urlMeta.author);
          fetchedKeywords.push(...urlMeta.keywords);
        }

        // Add common themes as keywords
        fetchedKeywords.push(...analysis.commonThemes);

        // Store fetched metadata
        const urlMetadata = analysis.urls.map(u => ({
          url: u.url,
          title: u.title,
          description: u.description,
          siteName: u.siteName,
          type: u.type,
          author: u.author,
          thumbnailUrl: u.thumbnailUrl,
        }));

        // Get primary domain
        const primaryDomain = analysis.urls[0]?.siteName || extractDomain(urls[0]);

        await repos.upsertMediaMeta(rawDb, {
          item_id: item.id,
          source_domain: primaryDomain,
          extra_json: JSON.stringify({
            ...existingExtra,
            normalized_at: Date.now(),
            urls: urlMetadata,
            commonThemes: analysis.commonThemes,
            fetchedKeywords: [...new Set(fetchedKeywords)],
          }),
        });

        // Update metadata_json to mark fetch complete
        itemMetadata.pendingUrlFetch = false;
        itemMetadata.urlsFetched = true;
        itemMetadata.fetchedAt = Date.now();
        await repos.updateMediaItem(rawDb, item.id, {
          metadata_json: JSON.stringify(itemMetadata),
        });

        console.log(`[NormalizeAndTag] URL content fetched: ${analysis.urls.length} URLs, ${fetchedKeywords.length} keywords`);
      } catch (error) {
        console.error(`[NormalizeAndTag] Failed to fetch URL content:`, error);
        // Continue with basic normalization but keep pendingUrlFetch = true for retry
        const domain = extractDomain(urls[0]);
        if (domain) {
          await repos.upsertMediaMeta(rawDb, {
            item_id: item.id,
            source_domain: domain,
            extra_json: JSON.stringify({
              ...existingExtra,
              normalized_at: Date.now(),
              fetchError: String(error),
              lastFetchAttempt: Date.now(),
            }),
          });
          
          // Update metadata but keep pendingUrlFetch true so it can be retried
          itemMetadata.lastFetchError = String(error);
          itemMetadata.lastFetchAttempt = Date.now();
          await repos.updateMediaItem(rawDb, item.id, {
            metadata_json: JSON.stringify(itemMetadata),
          });
        }
      }
    } else if (item.source_url) {
      // Basic URL normalization (no content fetch)
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

  // Refresh item after updates
  const refreshedItem = await repos.getMediaItem(rawDb, payload.itemId);
  if (!refreshedItem) {
    throw new Error(`Item not found after update: ${payload.itemId}`);
  }

  // Convert to base MediaItem for tagging (strip tags relation)
  const itemForTagging: MediaItem = {
    id: refreshedItem.id,
    type: refreshedItem.type,
    title: refreshedItem.title,
    source_url: refreshedItem.source_url,
    local_uri: refreshedItem.local_uri,
    notes: refreshedItem.notes,
    extracted_text: refreshedItem.extracted_text,
    metadata_json: refreshedItem.metadata_json,
    ingest_status: refreshedItem.ingest_status,
    created_at: refreshedItem.created_at,
    updated_at: refreshedItem.updated_at,
  };

  // AETS: Extract and assign emergent tags
  try {
    let taggingResult;
    if (fetchedContent.length > 0 || fetchedKeywords.length > 0) {
      // Use enhanced tagging with fetched content
      taggingResult = await tagItemWithContent(rawDb, itemForTagging, fetchedContent, fetchedKeywords);
    } else {
      // Use standard tagging
      taggingResult = await tagItem(rawDb, itemForTagging);
    }
    console.log(`[NormalizeAndTag] AETS tagged: ${taggingResult.tagsAssigned} tags assigned`);
  } catch (error) {
    // Log but don't fail the job if tagging fails
    console.error(`[NormalizeAndTag] AETS tagging failed:`, error);
  }

  // Update FTS index with the final title and tags
  try {
    await upsertFtsEntry(rawDb, payload.itemId);
    console.log(`[NormalizeAndTag] FTS index updated for item ${payload.itemId}`);
  } catch (error) {
    console.warn(`[NormalizeAndTag] FTS update failed:`, error);
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
