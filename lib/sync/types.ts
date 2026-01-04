export interface SwipeSummary {
  totalLikes: number;
  totalDislikes: number;
  totalFavorites: number;
  totalSkips: number;
}

export interface DeviceSignature {
  deviceId: string;
  topTags: string[];
  swipeSummary: SwipeSummary;
  recentTopics: string[];  // Recent themes from liked/favorited items
  timestamp: number;
  sessionToken?: string;  // Ephemeral token for this exchange
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

export type PendingSessionStatus = 'awaiting_consent' | 'accepted' | 'rejected';

export interface PendingSession {
  id: string;
  deviceId: string;
  importedSignature: DeviceSignature;
  importedAt: number;
  status: PendingSessionStatus;
}