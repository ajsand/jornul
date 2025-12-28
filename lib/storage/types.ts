// Type definitions for JournalLink data layer

// ============ Enums ============

export type MediaType = 'text' | 'image' | 'audio' | 'video' | 'pdf' | 'url';
export type TagSource = 'heuristic' | 'ml' | 'user';
export type SwipeDirection = 'like' | 'dislike';
export type CompareMode = 'friend' | 'heart';
export type ShareLevel = 'title' | 'snippet' | 'full';

// ============ Table Row Types ============

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string | null;
  source_url: string | null;
  local_uri: string | null;
  notes: string | null;
  extracted_text: string | null;
  metadata_json: string | null;
  created_at: number;
  updated_at: number;
}

export interface Tag {
  id: number;
  name: string;
  created_at: number;
}

export interface ItemTag {
  item_id: string;
  tag_id: number;
  confidence: number | null;
  source: TagSource;
  created_at: number;
}

export interface JournalEntry {
  id: string;
  media_item_id: string;
  entry_date: number | null;
  mood: string | null;
  location: string | null;
  created_at: number;
  updated_at: number;
}

export interface SwipeSignal {
  id: number;
  media_item_id: string;
  direction: SwipeDirection;
  category: string | null;
  created_at: number;
}

export interface CompareSession {
  id: string;
  mode: CompareMode;
  scope_filters: string | null;
  provider: string | null;
  created_at: number;
}

export interface CompareSessionItem {
  session_id: string;
  item_id: string;
  share_level: ShareLevel;
  created_at: number;
}

export interface SchemaMigration {
  version: number;
  applied_at: number;
}

// ============ Enriched Types (with relations) ============

export interface MediaItemWithTags extends MediaItem {
  tags: Array<Tag & { confidence: number | null; source: TagSource }>;
}

export interface TagWithCount extends Tag {
  usage_count: number;
}

export interface CompareSessionWithItems extends CompareSession {
  items: Array<{
    media_item: MediaItem;
    share_level: ShareLevel;
  }>;
}

// ============ Input Types ============

export interface CreateMediaItemInput {
  id: string;
  type: MediaType;
  title?: string | null;
  source_url?: string | null;
  local_uri?: string | null;
  notes?: string | null;
  extracted_text?: string | null;
  metadata_json?: string | null;
}

export interface UpdateMediaItemInput {
  type?: MediaType;
  title?: string | null;
  source_url?: string | null;
  local_uri?: string | null;
  notes?: string | null;
  extracted_text?: string | null;
  metadata_json?: string | null;
}

export interface CreateSwipeSignalInput {
  media_item_id: string;
  direction: SwipeDirection;
  category?: string | null;
}

export interface CreateCompareSessionInput {
  id: string;
  mode: CompareMode;
  scope_filters?: string | null;
  provider?: string | null;
}

export interface CreateJournalEntryInput {
  id: string;
  media_item_id: string;
  entry_date?: number | null;
  mood?: string | null;
  location?: string | null;
}

export interface UpdateJournalEntryInput {
  entry_date?: number | null;
  mood?: string | null;
  location?: string | null;
}

// ============ Filter Types ============

export interface ListMediaItemsFilters {
  type?: MediaType;
  tags?: string[];
  minTagConfidence?: number;
  dateFrom?: number;
  dateTo?: number;
  searchText?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'title';
  orderDirection?: 'ASC' | 'DESC';
}

export interface ListTagsOptions {
  minUsageCount?: number;
  sortBy?: 'count' | 'name';
  sortDirection?: 'ASC' | 'DESC';
  limit?: number;
}

export interface ListSwipeSignalsFilters {
  media_item_id?: string;
  direction?: SwipeDirection;
  category?: string;
  dateFrom?: number;
  dateTo?: number;
  limit?: number;
  offset?: number;
}

export interface ListCompareSessionsFilters {
  mode?: CompareMode;
  dateFrom?: number;
  dateTo?: number;
  limit?: number;
  offset?: number;
}

// ============ Ingest Queue (Quick Add) ============

export type IngestStatus = 'pending' | 'processing' | 'ready' | 'failed';
export type IngestSourceType = 'text' | 'url' | 'file';

export interface IngestItem {
  id: string;
  source_type: IngestSourceType;
  raw_content: string | null;
  file_uri: string | null;
  status: IngestStatus;
  error_message: string | null;
  media_item_id: string | null;
  created_at: number;
  processed_at: number | null;
}

export interface CreateIngestItemInput {
  id: string;
  source_type: IngestSourceType;
  raw_content?: string | null;
  file_uri?: string | null;
}

export interface UpdateIngestItemInput {
  status?: IngestStatus;
  error_message?: string | null;
  media_item_id?: string | null;
  processed_at?: number | null;
}





