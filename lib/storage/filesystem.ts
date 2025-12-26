import * as FileSystem from 'expo-file-system';

const BLOBS_DIR = `${FileSystem.documentDirectory}JournalLink/blobs/`;

export async function ensureBlobsDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(BLOBS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(BLOBS_DIR, { intermediates: true });
  }
}

export async function saveBlob(data: string, extension: string = 'txt'): Promise<string> {
  await ensureBlobsDirectory();
  const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
  const path = `${BLOBS_DIR}${filename}`;
  await FileSystem.writeAsStringAsync(path, data);
  return path;
}

export async function readBlob(path: string): Promise<string> {
  return await FileSystem.readAsStringAsync(path);
}

export async function deleteBlob(path: string): Promise<void> {
  const fileInfo = await FileSystem.getInfoAsync(path);
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(path);
  }
}