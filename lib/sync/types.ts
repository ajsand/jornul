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

// ============ Consent & Capsule Types (Iteration 24) ============

export type ConsentMode = 'friend' | 'heart' | 'custom';
export type ShareLevel = 'title' | 'snippet' | 'full';

export interface ConsentConfig {
  mode: ConsentMode;
  selectedTopics: string[];      // Tag names to include
  includeSensitive: boolean;     // Default false
  useCloud: boolean;             // Default false
  cloudProvider: string | null;  // 'openai' | 'gemini' | 'claude' | null
}

export interface CapsuleItem {
  itemId: string;
  title: string;
  excerpt: string;               // Truncated text (max 200 chars)
  tags: string[];
  shareLevel: ShareLevel;
}

export interface ThemeCount {
  theme: string;
  count: number;
}

export interface CapsuleSwipeSummary {
  likedThemes: ThemeCount[];
  dislikedThemes: ThemeCount[];
}

export interface CompareCapsule {
  sessionId: string;
  mode: ConsentMode;
  items: CapsuleItem[];
  swipeSummary: CapsuleSwipeSummary;
  tokenEstimate: number;
  createdAt: number;
}

export type ConsentStep = 'idle' | 'configuring' | 'reviewing' | 'ready';

export interface ConsentSession {
  pendingSessionId: string | null;
  config: ConsentConfig | null;
  capsule: CompareCapsule | null;
  step: ConsentStep;
}