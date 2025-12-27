import { v4 as uuidv4 } from 'uuid';
import * as FileSystem from 'expo-file-system';
import { db } from '@/lib/storage/db';
import {
  IngestItem,
  MediaType,
  CreateMediaItemInput,
} from '@/lib/storage/types';
import {
  inferMediaType,
  extractTitleFromFilename,
  copyFileToAppDirectory,
} from '@/lib/utils/fileHelpers';

/**
 * Detect if raw content is a URL
 */
function isUrl(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extract title from URL
 */
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove trailing slash
    const cleanPath = pathname.replace(/\/$/, '');
    
    // Get last segment
    const segments = cleanPath.split('/').filter(s => s.length > 0);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      // Decode and clean up
      const decoded = decodeURIComponent(lastSegment);
      return decoded.replace(/[-_]/g, ' ').trim();
    }
    
    // Fallback to hostname
    return urlObj.hostname;
  } catch {
    return 'URL';
  }
}

/**
 * Generate a preview from text content
 */
function generateTextPreview(text: string, maxLength: number = 200): string {
  const cleaned = text.trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return cleaned.slice(0, maxLength) + '...';
}

/**
 * Extract title from text content (first line or first sentence)
 */
function extractTitleFromText(text: string): string {
  const cleaned = text.trim();
  
  // Try first line
  const firstLine = cleaned.split('\n')[0].trim();
  if (firstLine.length > 0 && firstLine.length <= 100) {
    return firstLine;
  }
  
  // Try first sentence
  const firstSentence = cleaned.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 0 && firstSentence.length <= 100) {
    return firstSentence;
  }
  
  // Fallback to preview
  return generateTextPreview(cleaned, 50);
}

/**
 * Process a text ingest item
 */
async function processTextIngest(ingestItem: IngestItem): Promise<string> {
  const content = ingestItem.raw_content || '';
  
  // Detect if it's a URL
  const isUrlContent = isUrl(content);
  const mediaType: MediaType = isUrlContent ? 'url' : 'text';
  
  const title = isUrlContent 
    ? extractTitleFromUrl(content)
    : extractTitleFromText(content);
  
  const mediaItemId = uuidv4();
  const mediaItemInput: CreateMediaItemInput = {
    id: mediaItemId,
    type: mediaType,
    title,
    source_url: isUrlContent ? content.trim() : null,
    extracted_text: isUrlContent ? null : content.trim(),
    metadata_json: JSON.stringify({
      ingest_id: ingestItem.id,
      ingest_source: 'quick_add',
    }),
  };
  
  await db.createMediaItem(mediaItemInput);
  return mediaItemId;
}

/**
 * Process a file ingest item
 */
async function processFileIngest(ingestItem: IngestItem): Promise<string> {
  if (!ingestItem.file_uri) {
    throw new Error('File URI is required for file ingest');
  }

  // Get file info
  const fileInfo = await FileSystem.getInfoAsync(ingestItem.file_uri);
  if (!fileInfo.exists) {
    throw new Error('File does not exist');
  }

  // Extract filename
  const filename = ingestItem.file_uri.split('/').pop() || 'file';

  // Infer media type (we'll use basic inference from filename)
  const mediaType = inferMediaType('', filename);

  // Copy file to app directory
  const localUri = await copyFileToAppDirectory(ingestItem.file_uri, filename);

  // Extract title from filename
  const title = extractTitleFromFilename(filename);

  const mediaItemId = uuidv4();
  const mediaItemInput: CreateMediaItemInput = {
    id: mediaItemId,
    type: mediaType,
    title,
    local_uri: localUri,
    metadata_json: JSON.stringify({
      ingest_id: ingestItem.id,
      ingest_source: 'quick_add',
      original_filename: filename,
      file_size: 'size' in fileInfo ? fileInfo.size : 0,
    }),
  };

  await db.createMediaItem(mediaItemInput);
  return mediaItemId;
}

/**
 * Process a single ingest item
 */
export async function processIngestItem(ingestItemId: string): Promise<void> {
  // Get ingest item
  const ingestItem = await db.getIngestItem(ingestItemId);

  if (!ingestItem) {
    throw new Error(`Ingest item ${ingestItemId} not found`);
  }

  if (ingestItem.status !== 'pending') {
    console.warn(`Ingest item ${ingestItemId} is not pending (status: ${ingestItem.status})`);
    return;
  }

  // Mark as processing
  await db.updateIngestItem(ingestItemId, {
    status: 'processing',
  });
  
  try {
    let mediaItemId: string;
    
    // Process based on source type
    switch (ingestItem.source_type) {
      case 'text':
      case 'url':
        mediaItemId = await processTextIngest(ingestItem);
        break;
      
      case 'file':
        mediaItemId = await processFileIngest(ingestItem);
        break;
      
      default:
        throw new Error(`Unsupported source type: ${ingestItem.source_type}`);
    }
    
    // Mark as ready
    await db.updateIngestItem(ingestItemId, {
      status: 'ready',
      media_item_id: mediaItemId,
      processed_at: Date.now(),
    });

    console.log(`Processed ingest item ${ingestItemId} -> media item ${mediaItemId}`);
  } catch (error) {
    console.error(`Failed to process ingest item ${ingestItemId}:`, error);

    // Mark as failed
    await db.updateIngestItem(ingestItemId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      processed_at: Date.now(),
    });
  }
}

/**
 * Process all pending ingest items
 */
export async function processPendingIngests(): Promise<void> {
  const pendingItems = await db.listIngestItems('pending');

  console.log(`Processing ${pendingItems.length} pending ingest items`);

  for (const item of pendingItems) {
    await processIngestItem(item.id);
  }
}
