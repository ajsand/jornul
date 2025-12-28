import * as FileSystem from 'expo-file-system';
import { MediaType } from '@/lib/storage/types';

const BLOBS_DIR = `${FileSystem.documentDirectory}JournalLink/blobs/`;

// MIME type to MediaType mapping
const MIME_TO_TYPE: Record<string, MediaType> = {
  // Images
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/heic': 'image',
  'image/heif': 'image',
  
  // Videos
  'video/mp4': 'video',
  'video/mov': 'video',
  'video/quicktime': 'video',
  'video/mpeg': 'video',
  'video/x-msvideo': 'video',
  
  // Audio
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/mp4': 'audio',
  'audio/m4a': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  
  // PDF
  'application/pdf': 'pdf',
  
  // Text
  'text/plain': 'text',
  'text/markdown': 'text',
  'text/html': 'text',
  'application/json': 'text',
};

// File extension to MediaType mapping (fallback)
const EXT_TO_TYPE: Record<string, MediaType> = {
  // Images
  'jpg': 'image',
  'jpeg': 'image',
  'png': 'image',
  'gif': 'image',
  'webp': 'image',
  'heic': 'image',
  'heif': 'image',
  
  // Videos
  'mp4': 'video',
  'mov': 'video',
  'avi': 'video',
  'mpeg': 'video',
  'mpg': 'video',
  
  // Audio
  'mp3': 'audio',
  'm4a': 'audio',
  'wav': 'audio',
  'aac': 'audio',
  
  // PDF
  'pdf': 'pdf',
  
  // Text
  'txt': 'text',
  'md': 'text',
  'json': 'text',
};

/**
 * Infer MediaType from MIME type and filename
 */
export function inferMediaType(mimeType: string, filename: string): MediaType {
  // Try MIME type first
  if (mimeType && MIME_TO_TYPE[mimeType.toLowerCase()]) {
    return MIME_TO_TYPE[mimeType.toLowerCase()];
  }
  
  // Fallback to checking MIME prefix
  if (mimeType) {
    const prefix = mimeType.split('/')[0].toLowerCase();
    if (prefix === 'image') return 'image';
    if (prefix === 'video') return 'video';
    if (prefix === 'audio') return 'audio';
    if (prefix === 'text') return 'text';
  }
  
  // Fallback to file extension
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext && EXT_TO_TYPE[ext]) {
    return EXT_TO_TYPE[ext];
  }
  
  // Default to text
  return 'text';
}

/**
 * Extract a clean title from a filename
 */
export function extractTitleFromFilename(filename: string): string {
  // Remove file extension
  let title = filename.replace(/\.[^/.]+$/, '');
  
  // Decode URI components
  try {
    title = decodeURIComponent(title);
  } catch (e) {
    // If decode fails, keep original
  }
  
  // Replace underscores and hyphens with spaces
  title = title.replace(/[_-]/g, ' ');
  
  // Remove multiple spaces
  title = title.replace(/\s+/g, ' ').trim();
  
  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }
  
  // If empty after processing, return original
  return title || filename;
}

/**
 * Ensure blobs directory exists
 */
async function ensureBlobsDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(BLOBS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(BLOBS_DIR, { intermediates: true });
  }
}

/**
 * Generate a unique filename with timestamp and random string
 */
function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const ext = originalFilename.split('.').pop();
  return `${timestamp}-${random}.${ext}`;
}

/**
 * Copy a file to the app's blobs directory
 */
export async function copyFileToAppDirectory(
  sourceUri: string,
  originalFilename: string
): Promise<string> {
  await ensureBlobsDirectory();
  
  const uniqueFilename = generateUniqueFilename(originalFilename);
  const destPath = `${BLOBS_DIR}${uniqueFilename}`;
  
  await FileSystem.copyAsync({
    from: sourceUri,
    to: destPath,
  });
  
  return destPath;
}

/**
 * Get file size from URI
 */
export async function getFileSizeFromUri(uri: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && 'size' in info ? info.size : 0;
  } catch (error) {
    console.error('Failed to get file size:', error);
    return 0;
  }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}





