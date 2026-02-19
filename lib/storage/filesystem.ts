import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// On web, FileSystem.documentDirectory is null, so we use a virtual path
const BLOBS_DIR = Platform.OS === 'web'
  ? 'journallink-blobs/'
  : `${FileSystem.documentDirectory}JournalLink/blobs/`;

// In-memory storage for web (blobs don't persist across page reloads)
const webBlobStore = new Map<string, string>();

export async function ensureBlobsDirectory(): Promise<void> {
  if (Platform.OS === 'web') {
    // Web: No-op, using in-memory storage
    return;
  }

  const dirInfo = await FileSystem.getInfoAsync(BLOBS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(BLOBS_DIR, { intermediates: true });
  }
}

export async function saveBlob(data: string, extension: string = 'txt'): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
  const path = `${BLOBS_DIR}${filename}`;

  if (Platform.OS === 'web') {
    // Web: Store in memory (won't persist across page reloads)
    webBlobStore.set(path, data);
    console.warn('[Web] File stored in memory only - will not persist');
    return path;
  }

  await ensureBlobsDirectory();
  await FileSystem.writeAsStringAsync(path, data);
  return path;
}

export async function readBlob(path: string): Promise<string> {
  if (Platform.OS === 'web') {
    const data = webBlobStore.get(path);
    if (data === undefined) {
      throw new Error('Blob not found in web storage');
    }
    return data;
  }

  return await FileSystem.readAsStringAsync(path);
}

export async function deleteBlob(path: string): Promise<void> {
  if (Platform.OS === 'web') {
    webBlobStore.delete(path);
    return;
  }

  const fileInfo = await FileSystem.getInfoAsync(path);
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(path);
  }
}

export function getBlobExists(path: string): boolean {
  if (Platform.OS === 'web') {
    return webBlobStore.has(path);
  }
  // For native, this should be called with await - this is a sync convenience for web
  return false;
}
