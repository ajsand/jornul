// Type definitions for JournalLink data layer
// All DB models are defined here for single source of truth

// ============ Enums ============

export type MediaType = 'text' | 'image' | 'audio' | 'video' | 'pdf' | 'url';
export type TagSource = 'heuristic' | 'ml' | 'user';
export type TagKind = 'emergent' | 'manual' | 'system';
export type SwipeDirection = 'like' | 'dislike';
export type SwipeDecision = 'like' | 'dislike' | 'skip' | 'super_like';
export type CompareMode = 'friend' | 'heart';
export type ShareLevel = 'title' | 'snippet' | 'full';
export type JobStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
export type ProcessingStatus = 'pending' | 'processing' | 'done' | 'failed' | 'skipped';

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
  slug: string | null;
  kind: TagKind;
  created_at: number;
  updated_at: number | null;
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

// ============ Media Meta (v3) ============

export interface MediaMeta {
  item_id: string;
  duration_ms: number | null;
  width: number | null;
  height: number | null;
  exif_json: string | null;
  ocr_status: ProcessingStatus | null;
  asr_status: ProcessingStatus | null;
  source_domain: string | null;
  extra_json: string | null;
}

export interface CreateMediaMetaInput {
  item_id: string;
  duration_ms?: number | null;
  width?: number | null;
  height?: number | null;
  exif_json?: string | null;
  ocr_status?: ProcessingStatus | null;
  asr_status?: ProcessingStatus | null;
  source_domain?: string | null;
  extra_json?: string | null;
}

export interface UpdateMediaMetaInput {
  duration_ms?: number | null;
  width?: number | null;
  height?: number | null;
  exif_json?: string | null;
  ocr_status?: ProcessingStatus | null;
  asr_status?: ProcessingStatus | null;
  source_domain?: string | null;
  extra_json?: string | null;
}

// ============ Jobs (v3) ============

export interface Job {
  id: string;
  kind: string;
  status: JobStatus;
  payload_json: string | null;
  progress: number;
  error: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateJobInput {
  id: string;
  kind: string;
  payload_json?: string | null;
}

export interface UpdateJobInput {
  status?: JobStatus;
  payload_json?: string | null;
  progress?: number;
  error?: string | null;
}

export interface ListJobsFilters {
  kind?: string;
  status?: JobStatus;
  limit?: number;
  offset?: number;
}

// ============ Swipe Media (v3) ============

export interface SwipeMedia {
  id: string;
  title: string;
  type: string;
  image_url: string | null;
  short_desc: string | null;
  long_desc: string | null;
  source: string | null;
  tags_json: string | null;
  popularity_score: number;
  created_at: number;
}

export interface CreateSwipeMediaInput {
  id: string;
  title: string;
  type: string;
  image_url?: string | null;
  short_desc?: string | null;
  long_desc?: string | null;
  source?: string | null;
  tags_json?: string | null;
  popularity_score?: number;
}

export interface UpdateSwipeMediaInput {
  title?: string;
  type?: string;
  image_url?: string | null;
  short_desc?: string | null;
  long_desc?: string | null;
  source?: string | null;
  tags_json?: string | null;
  popularity_score?: number;
}

export interface ListSwipeMediaFilters {
  type?: string;
  source?: string;
  minPopularity?: number;
  limit?: number;
  offset?: number;
}

// ============ Swipe Sessions (v3) ============

export interface SwipeSession {
  id: string;
  started_at: number;
  ended_at: number | null;
  filters_json: string | null;
}

export interface CreateSwipeSessionInput {
  id: string;
  filters_json?: string | null;
}

export interface UpdateSwipeSessionInput {
  ended_at?: number | null;
  filters_json?: string | null;
}

// ============ Swipe Events (v3) ============

export interface SwipeEvent {
  id: string;
  session_id: string;
  media_id: string;
  decision: SwipeDecision;
  strength: number;
  created_at: number;
}

export interface CreateSwipeEventInput {
  id: string;
  session_id: string;
  media_id: string;
  decision: SwipeDecision;
  strength?: number;
}

export interface ListSwipeEventsFilters {
  session_id?: string;
  media_id?: string;
  decision?: SwipeDecision;
  limit?: number;
  offset?: number;
}

// ============ Session Ledger (v3) ============

export interface SessionLedger {
  id: string;
  started_at: number;
  mode: string;
  provider: string | null;
  excerpt_counts_json: string | null;
  sensitive_included: number;
  token_estimate: number | null;
  cost_estimate_cents: number | null;
  ended_at: number | null;
  result_json: string | null;
}

export interface CreateSessionLedgerInput {
  id: string;
  mode: string;
  provider?: string | null;
  excerpt_counts_json?: string | null;
  sensitive_included?: boolean;
  token_estimate?: number | null;
  cost_estimate_cents?: number | null;
}

export interface UpdateSessionLedgerInput {
  ended_at?: number | null;
  result_json?: string | null;
  token_estimate?: number | null;
  cost_estimate_cents?: number | null;
}

export interface ListSessionLedgerFilters {
  mode?: string;
  provider?: string;
  dateFrom?: number;
  dateTo?: number;
  limit?: number;
  offset?: number;
}

// ============ Enhanced Tag Types (v3) ============

export interface CreateTagInput {
  name: string;
  slug?: string | null;
  kind?: TagKind;
}

export interface UpdateTagInput {
  name?: string;
  slug?: string | null;
  kind?: TagKind;
}





