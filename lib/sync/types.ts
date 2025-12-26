export interface DeviceSignature {
  deviceId: string;
  topTags: string[];
  avgEmbed: number[];
  timestamp: number;
}

export interface SyncResult {
  sharedTags: string[];
  similarityScore: number;
  questions: string[];
}

export interface BLEDevice {
  id: string;
  name: string;
  signature?: DeviceSignature;
}