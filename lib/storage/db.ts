import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';
import * as repo from './repository';
import type {
  MediaItem,
  MediaItemWithTags,
  Tag,
  TagWithCount,
  SwipeSignal,
  CompareSession,
  CompareSessionWithItems,
  JournalEntry,
  CreateMediaItemInput,
  UpdateMediaItemInput,
  CreateSwipeSignalInput,
  CreateCompareSessionInput,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  ListMediaItemsFilters,
  ListTagsOptions,
  ListSwipeSignalsFilters,
  ListCompareSessionsFilters,
  TagSource,
  ShareLevel,
} from './types';

// Legacy type for backward compatibility
export interface JournalItem {
  id: string;
  type: 'text' | 'image' | 'audio';
  raw_path?: string;
  clean_text: string;
  tags: string[];
  created_at: number;
  embedding?: number[];
}

/**
 * Main database class for JournalLink
 * Provides high-level API wrapping repository functions
 */
class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('journallink.db', {
        enableChangeListener: true,
      });

      // Set WAL mode for better concurrency
      await this.db.execAsync('PRAGMA journal_mode = WAL;');

      // Run migrations (creates tables and handles schema versioning)
      await runMigrations(this.db);

      console.log('Database initialized successfully');
    } catch (error: any) {
      console.error('Database initialization failed:', error);
      throw new Error('Failed to initialize database: ' + error.message);
    }
  }

  private ensureDb(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // ============ Media Items ============

  async createMediaItem(input: CreateMediaItemInput): Promise<string> {
    return repo.createMediaItem(this.ensureDb(), input);
  }

  async getMediaItem(id: string): Promise<MediaItemWithTags | null> {
    return repo.getMediaItem(this.ensureDb(), id);
  }

  async updateMediaItem(id: string, updates: UpdateMediaItemInput): Promise<boolean> {
    return repo.updateMediaItem(this.ensureDb(), id, updates);
  }

  async deleteMediaItem(id: string): Promise<boolean> {
    return repo.deleteMediaItem(this.ensureDb(), id);
  }

  async listMediaItems(filters?: ListMediaItemsFilters): Promise<MediaItem[]> {
    return repo.listMediaItems(this.ensureDb(), filters);
  }

  // ============ Tags ============

  async upsertTag(name: string): Promise<Tag> {
    return repo.upsertTag(this.ensureDb(), name);
  }

  async getTagById(id: number): Promise<Tag | null> {
    return repo.getTagById(this.ensureDb(), id);
  }

  async getTagByName(name: string): Promise<Tag | null> {
    return repo.getTagByName(this.ensureDb(), name);
  }

  async listTags(options?: ListTagsOptions): Promise<TagWithCount[]> {
    return repo.listTags(this.ensureDb(), options);
  }

  // ============ Item-Tag Relationships ============

  async attachTagToItem(
    itemId: string,
    tagId: number,
    confidence: number | null,
    source: TagSource
  ): Promise<void> {
    return repo.attachTagToItem(this.ensureDb(), itemId, tagId, confidence, source);
  }

  async detachTagFromItem(itemId: string, tagId: number): Promise<boolean> {
    return repo.detachTagFromItem(this.ensureDb(), itemId, tagId);
  }

  async getTagsForItem(
    itemId: string
  ): Promise<Array<Tag & { confidence: number | null; source: TagSource }>> {
    return repo.getTagsForItem(this.ensureDb(), itemId);
  }

  // ============ Journal Entries ============

  async createJournalEntry(input: CreateJournalEntryInput): Promise<string> {
    return repo.createJournalEntry(this.ensureDb(), input);
  }

  async getJournalEntry(id: string): Promise<JournalEntry | null> {
    return repo.getJournalEntry(this.ensureDb(), id);
  }

  async updateJournalEntry(
    id: string,
    updates: UpdateJournalEntryInput
  ): Promise<boolean> {
    return repo.updateJournalEntry(this.ensureDb(), id, updates);
  }

  async deleteJournalEntry(id: string): Promise<boolean> {
    return repo.deleteJournalEntry(this.ensureDb(), id);
  }

  // ============ Swipe Signals ============

  async createSwipeSignal(input: CreateSwipeSignalInput): Promise<number> {
    return repo.createSwipeSignal(this.ensureDb(), input);
  }

  async listSwipeSignals(filters?: ListSwipeSignalsFilters): Promise<SwipeSignal[]> {
    return repo.listSwipeSignals(this.ensureDb(), filters);
  }

  // ============ Compare Sessions ============

  async createCompareSession(input: CreateCompareSessionInput): Promise<string> {
    return repo.createCompareSession(this.ensureDb(), input);
  }

  async addItemToCompareSession(
    sessionId: string,
    itemId: string,
    shareLevel: ShareLevel
  ): Promise<void> {
    return repo.addItemToCompareSession(this.ensureDb(), sessionId, itemId, shareLevel);
  }

  async getCompareSession(id: string): Promise<CompareSessionWithItems | null> {
    return repo.getCompareSession(this.ensureDb(), id);
  }

  async listCompareSessions(
    filters?: ListCompareSessionsFilters
  ): Promise<CompareSession[]> {
    return repo.listCompareSessions(this.ensureDb(), filters);
  }

  // ============ User Metadata (legacy, for app preferences) ============

  async getUserMeta(key: string): Promise<string | null> {
    const db = this.ensureDb();
    const result = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM user_meta WHERE key = ?',
      [key]
    );
    return result?.value || null;
  }

  async setUserMeta(key: string, value: string): Promise<void> {
    const db = this.ensureDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO user_meta (key, value) VALUES (?, ?)',
      [key, value]
    );
  }

  // ============ Legacy Methods (for backward compatibility) ============
  // These methods map old journal_items API to new media_items schema
  // Can be removed once all calling code is migrated

  /**
   * @deprecated Use createMediaItem instead
   */
  async insertItem(item: {
    id: string;
    type: 'text' | 'image' | 'audio';
    raw_path?: string;
    clean_text: string;
    tags: string[];
    created_at?: number;
    embedding?: number[];
  }): Promise<void> {
    const mediaItemId = await this.createMediaItem({
      id: item.id,
      type: item.type,
      local_uri: item.raw_path,
      extracted_text: item.clean_text,
    });

    // Create tags and attach them
    for (const tagName of item.tags) {
      const tag = await this.upsertTag(tagName);
      await this.attachTagToItem(mediaItemId, tag.id, null, 'user');
    }

    // Store embedding in metadata_json if provided
    if (item.embedding) {
      await this.updateMediaItem(mediaItemId, {
        metadata_json: JSON.stringify({ embedding: item.embedding }),
      });
    }
  }

  /**
   * @deprecated Use listMediaItems instead
   */
  async queryAllItems(): Promise<
    Array<{
      id: string;
      type: 'text' | 'image' | 'audio';
      raw_path?: string;
      clean_text: string;
      tags: string[];
      created_at: number;
      embedding?: number[];
    }>
  > {
    const items = await this.listMediaItems({
      orderBy: 'created_at',
      orderDirection: 'DESC',
    });

    const results = [];
    for (const item of items) {
      const tags = await this.getTagsForItem(item.id);
      let embedding: number[] | undefined;

      if (item.metadata_json) {
        try {
          const metadata = JSON.parse(item.metadata_json);
          embedding = metadata.embedding;
        } catch (e) {
          // ignore parse errors
        }
      }

      results.push({
        id: item.id,
        type: item.type as 'text' | 'image' | 'audio',
        raw_path: item.local_uri ?? undefined,
        clean_text: item.extracted_text || item.notes || '',
        tags: tags.map(t => t.name),
        created_at: item.created_at,
        embedding,
      });
    }

    return results;
  }

  /**
   * @deprecated Use listMediaItems with tag filter instead
   */
  async queryByTag(tag: string): Promise<
    Array<{
      id: string;
      type: 'text' | 'image' | 'audio';
      raw_path?: string;
      clean_text: string;
      tags: string[];
      created_at: number;
      embedding?: number[];
    }>
  > {
    const items = await this.listMediaItems({
      tags: [tag],
      orderBy: 'created_at',
      orderDirection: 'DESC',
    });

    const results = [];
    for (const item of items) {
      const tags = await this.getTagsForItem(item.id);
      let embedding: number[] | undefined;

      if (item.metadata_json) {
        try {
          const metadata = JSON.parse(item.metadata_json);
          embedding = metadata.embedding;
        } catch (e) {
          // ignore
        }
      }

      results.push({
        id: item.id,
        type: item.type as 'text' | 'image' | 'audio',
        raw_path: item.local_uri ?? undefined,
        clean_text: item.extracted_text || item.notes || '',
        tags: tags.map(t => t.name),
        created_at: item.created_at,
        embedding,
      });
    }

    return results;
  }

  /**
   * @deprecated Use getMediaItem instead
   */
  async getItem(id: string): Promise<{
    id: string;
    type: 'text' | 'image' | 'audio';
    raw_path?: string;
    clean_text: string;
    tags: string[];
    created_at: number;
    embedding?: number[];
  } | null> {
    const item = await this.getMediaItem(id);
    if (!item) return null;

    let embedding: number[] | undefined;
    if (item.metadata_json) {
      try {
        const metadata = JSON.parse(item.metadata_json);
        embedding = metadata.embedding;
      } catch (e) {
        // ignore
      }
    }

    return {
      id: item.id,
      type: item.type as 'text' | 'image' | 'audio',
      raw_path: item.local_uri ?? undefined,
      clean_text: item.extracted_text || item.notes || '',
      tags: item.tags.map(t => t.name),
      created_at: item.created_at,
      embedding,
    };
  }

  /**
   * @deprecated Use updateMediaItem with metadata_json instead
   */
  async updateItemEmbedding(id: string, embedding: number[]): Promise<void> {
    const item = await this.getMediaItem(id);
    let metadata: any = {};

    if (item?.metadata_json) {
      try {
        metadata = JSON.parse(item.metadata_json);
      } catch (e) {
        // ignore
      }
    }

    metadata.embedding = embedding;
    await this.updateMediaItem(id, {
      metadata_json: JSON.stringify(metadata),
    });
  }

  /**
   * @deprecated Use listTags instead
   */
  async getAllTags(): Promise<{ tag: string; count: number }[]> {
    const tags = await this.listTags();
    return tags.map(t => ({ tag: t.name, count: t.usage_count }));
  }

  /**
   * @deprecated Use listTags with limit instead
   */
  async getTopTags(limit: number = 10): Promise<string[]> {
    const tags = await this.listTags({ sortBy: 'count', limit });
    return tags.map(t => t.name);
  }

  /**
   * @deprecated This is app-level logic, not database logic
   */
  async getAverageEmbedding(): Promise<number[] | null> {
    const items = await this.queryAllItems();
    const embeddings = items.filter(item => item.embedding).map(item => item.embedding!);

    if (embeddings.length === 0) return null;

    const dimensions = embeddings[0].length;
    const avgEmbedding = new Array(dimensions).fill(0);

    embeddings.forEach(embedding => {
      embedding.forEach((value, index) => {
        avgEmbedding[index] += value;
      });
    });

    return avgEmbedding.map(sum => sum / embeddings.length);
  }
}

export const db = new Database();
