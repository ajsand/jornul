/**
 * Mass Upload Service
 * Handles batch file imports with progress tracking
 */

import * as DocumentPicker from 'expo-document-picker';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/storage/db';
import * as repos from '@/lib/storage/repositories';
import {
  inferMediaType,
  extractTitleFromFilename,
  copyFileToAppDirectory,
  getFileSizeFromUri,
} from '@/lib/utils/fileHelpers';

export interface UploadResult {
  success: boolean;
  batchJobId: string | null;
  itemCount: number;
  error?: string;
}

export interface FileInfo {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
}

/**
 * Open document picker for multiple file selection
 */
export async function pickMultipleFiles(): Promise<FileInfo[] | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf', 'audio/*', 'video/*', 'text/*'],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets.map(asset => ({
      name: asset.name,
      uri: asset.uri,
      mimeType: asset.mimeType ?? undefined,
      size: asset.size ?? undefined,
    }));
  } catch (error) {
    console.error('[MassUpload] Picker error:', error);
    throw error;
  }
}

/**
 * Process a batch of files for import
 * Creates items, copies files, and enqueues jobs
 */
export async function processBatchUpload(files: FileInfo[]): Promise<UploadResult> {
  if (files.length === 0) {
    return { success: false, batchJobId: null, itemCount: 0, error: 'No files selected' };
  }

  try {
    await db.init();
    const rawDb = db.getRawDb();

    const batchJobId = uuidv4();
    const childJobIds: string[] = [];
    const itemIds: string[] = [];

    console.log(`[MassUpload] Processing ${files.length} files`);

    // Process each file
    for (const file of files) {
      try {
        // Infer media type
        const mediaType = inferMediaType(file.mimeType || '', file.name);
        const title = extractTitleFromFilename(file.name);

        // Copy file to app directory
        const localUri = await copyFileToAppDirectory(file.uri, file.name);

        // Get file size
        const fileSize = file.size ?? await getFileSizeFromUri(localUri);

        // Create item
        const itemId = uuidv4();
        await repos.createMediaItem(rawDb, {
          id: itemId,
          type: mediaType,
          title,
          local_uri: localUri,
          source_url: null,
          extracted_text: null,
          notes: null,
          metadata_json: JSON.stringify({
            source: 'mass_upload',
            batch_id: batchJobId,
            original_filename: file.name,
            captured_at: Date.now(),
          }),
        });

        // Create media_meta with file info
        await repos.upsertMediaMeta(rawDb, {
          item_id: itemId,
          extra_json: JSON.stringify({
            mime_type: file.mimeType,
            file_size: fileSize,
            original_uri: file.uri,
          }),
        });

        itemIds.push(itemId);

        // Create individual job for normalization
        const jobId = uuidv4();
        await repos.createJob(rawDb, {
          id: jobId,
          kind: 'normalize_and_tag',
          payload_json: JSON.stringify({
            itemId,
            batchId: batchJobId,
          }),
        });

        childJobIds.push(jobId);
        console.log(`[MassUpload] Created item ${itemId} and job ${jobId} for: ${file.name}`);
      } catch (fileError) {
        console.error(`[MassUpload] Failed to process file ${file.name}:`, fileError);
        // Continue with other files
      }
    }

    // Create batch parent job for tracking
    await repos.createJob(rawDb, {
      id: batchJobId,
      kind: 'batch_import',
      payload_json: JSON.stringify({
        childJobIds,
        itemIds,
        totalFiles: files.length,
        processedFiles: childJobIds.length,
      }),
    });

    console.log(`[MassUpload] Batch job ${batchJobId} created with ${childJobIds.length} children`);

    return {
      success: true,
      batchJobId,
      itemCount: childJobIds.length,
    };
  } catch (error) {
    console.error('[MassUpload] Batch processing error:', error);
    return {
      success: false,
      batchJobId: null,
      itemCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get batch job progress
 */
export async function getBatchProgress(batchJobId: string): Promise<{
  total: number;
  completed: number;
  failed: number;
  progress: number;
} | null> {
  try {
    await db.init();
    const rawDb = db.getRawDb();

    const batchJob = await repos.getJob(rawDb, batchJobId);
    if (!batchJob || batchJob.kind !== 'batch_import') {
      return null;
    }

    const payload = JSON.parse(batchJob.payload_json || '{}');
    const childJobIds: string[] = payload.childJobIds || [];

    if (childJobIds.length === 0) {
      return { total: 0, completed: 0, failed: 0, progress: 1 };
    }

    let completed = 0;
    let failed = 0;

    for (const jobId of childJobIds) {
      const job = await repos.getJob(rawDb, jobId);
      if (job) {
        if (job.status === 'done') completed++;
        if (job.status === 'failed') failed++;
      }
    }

    const total = childJobIds.length;
    const progress = total > 0 ? (completed + failed) / total : 0;

    return { total, completed, failed, progress };
  } catch (error) {
    console.error('[MassUpload] Failed to get batch progress:', error);
    return null;
  }
}

/**
 * Update batch job status based on children
 */
export async function updateBatchJobStatus(batchJobId: string): Promise<void> {
  try {
    await db.init();
    const rawDb = db.getRawDb();

    const progress = await getBatchProgress(batchJobId);
    if (!progress) return;

    const { total, completed, failed } = progress;
    const allDone = completed + failed >= total;

    if (allDone) {
      if (failed === 0) {
        await repos.markJobDone(rawDb, batchJobId);
      } else if (failed === total) {
        await repos.markJobFailed(rawDb, batchJobId, 'All files failed to process');
      } else {
        // Partial success - mark as done with note
        await repos.updateJob(rawDb, batchJobId, {
          status: 'done',
          progress: 1,
          error: `${failed} of ${total} files failed`,
        });
      }
    } else {
      // Update progress
      await repos.updateJob(rawDb, batchJobId, {
        status: 'running',
        progress: progress.progress,
      });
    }
  } catch (error) {
    console.error('[MassUpload] Failed to update batch status:', error);
  }
}
