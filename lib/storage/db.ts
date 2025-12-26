import * as SQLite from 'expo-sqlite';
import { format } from 'date-fns';

export interface JournalItem {
  id: string;
  type: 'text' | 'image' | 'audio';
  raw_path?: string;
  clean_text: string;
  tags: string[];
  created_at: number;
  embedding?: number[];
}

export interface UserMeta {
  key: string;
  value: string;
}

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('journallink.db', {
        enableChangeListener: true,
      });

      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS journal_items (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          raw_path TEXT,
          clean_text TEXT NOT NULL,
          tags TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          embedding BLOB
        );
        
        CREATE TABLE IF NOT EXISTS user_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_journal_items_created_at ON journal_items(created_at);
        CREATE INDEX IF NOT EXISTS idx_journal_items_type ON journal_items(type);
      `);
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new Error('Failed to initialize database: ' + error.message);
    }
  }

  async insertItem(item: Omit<JournalItem, 'created_at'> & { created_at?: number }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const now = item.created_at || Date.now();
    await this.db.runAsync(
      'INSERT INTO journal_items (id, type, raw_path, clean_text, tags, created_at, embedding) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        item.id,
        item.type,
        item.raw_path || null,
        item.clean_text,
        JSON.stringify(item.tags),
        now,
        item.embedding ? JSON.stringify(item.embedding) : null,
      ]
    );
  }

  async queryAllItems(): Promise<JournalItem[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync<any>(
      'SELECT * FROM journal_items ORDER BY created_at DESC'
    );
    
    return result.map(row => ({
      id: row.id,
      type: row.type,
      raw_path: row.raw_path,
      clean_text: row.clean_text,
      tags: JSON.parse(row.tags),
      created_at: row.created_at,
      embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
    }));
  }

  async queryByTag(tag: string): Promise<JournalItem[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync<any>(
      'SELECT * FROM journal_items WHERE tags LIKE ? ORDER BY created_at DESC',
      [`%"${tag}"%`]
    );
    
    return result.map(row => ({
      id: row.id,
      type: row.type,
      raw_path: row.raw_path,
      clean_text: row.clean_text,
      tags: JSON.parse(row.tags),
      created_at: row.created_at,
      embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
    }));
  }

  async getItem(id: string): Promise<JournalItem | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync<any>(
      'SELECT * FROM journal_items WHERE id = ?',
      [id]
    );
    
    if (!result) return null;
    
    return {
      id: result.id,
      type: result.type,
      raw_path: result.raw_path,
      clean_text: result.clean_text,
      tags: JSON.parse(result.tags),
      created_at: result.created_at,
      embedding: result.embedding ? JSON.parse(result.embedding) : undefined,
    };
  }

  async updateItemEmbedding(id: string, embedding: number[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      'UPDATE journal_items SET embedding = ? WHERE id = ?',
      [JSON.stringify(embedding), id]
    );
  }

  async getUserMeta(key: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync<any>(
      'SELECT value FROM user_meta WHERE key = ?',
      [key]
    );
    
    return result?.value || null;
  }

  async setUserMeta(key: string, value: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      'INSERT OR REPLACE INTO user_meta (key, value) VALUES (?, ?)',
      [key, value]
    );
  }

  async getAllTags(): Promise<{ tag: string; count: number }[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const items = await this.queryAllItems();
    const tagCounts: { [key: string]: number } = {};
    
    items.forEach(item => {
      item.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getTopTags(limit: number = 10): Promise<string[]> {
    const tags = await this.getAllTags();
    return tags.slice(0, limit).map(t => t.tag);
  }

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