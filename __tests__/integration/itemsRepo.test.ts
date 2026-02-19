/**
 * Integration tests for Items Repository
 * Tests CRUD operations for media items
 */

import {
  createMediaItem,
  getMediaItem,
  updateMediaItem,
  deleteMediaItem,
  listMediaItems,
  countMediaItems,
} from '@/lib/storage/repositories/itemsRepo';
import { testItems } from '@/__tests__/seed/testData';
import { MediaItem, CreateMediaItemInput } from '@/lib/storage/types';

// Mock expo-sqlite
const mockDb = {
  runAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  execAsync: jest.fn(),
};

// Mock FTS repo (used internally by itemsRepo)
jest.mock('@/lib/storage/repositories/ftsRepo', () => ({
  upsertFtsEntry: jest.fn().mockResolvedValue(undefined),
  deleteFtsEntry: jest.fn().mockResolvedValue(undefined),
}));

describe('Items Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMediaItem', () => {
    it('should create a media item and return its ID', async () => {
      const input: CreateMediaItemInput = {
        id: 'test-item-1',
        type: 'text',
        title: 'Test Note',
        notes: 'Some test notes',
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const result = await createMediaItem(mockDb as any, input);

      expect(result).toBe('test-item-1');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO media_items'),
        expect.arrayContaining([input.id, input.type, input.title])
      );
    });

    it('should handle optional fields correctly', async () => {
      const input: CreateMediaItemInput = {
        id: 'minimal-item',
        type: 'url',
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const result = await createMediaItem(mockDb as any, input);

      expect(result).toBe('minimal-item');
      // Check that null is passed for optional fields
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([null, null, null])
      );
    });
  });

  describe('getMediaItem', () => {
    it('should return item with tags when found', async () => {
      const mockItem: MediaItem = testItems[0];
      const mockTags = [
        { id: 1, name: 'productivity', slug: 'productivity', kind: 'emergent', confidence: 0.85, source: 'heuristic' },
      ];

      mockDb.getFirstAsync.mockResolvedValue(mockItem);
      mockDb.getAllAsync.mockResolvedValue(mockTags);

      const result = await getMediaItem(mockDb as any, mockItem.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(mockItem.id);
      expect(result!.tags).toHaveLength(1);
      expect(result!.tags[0].name).toBe('productivity');
    });

    it('should return null when item not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getMediaItem(mockDb as any, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateMediaItem', () => {
    it('should update specified fields', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await updateMediaItem(mockDb as any, 'item-1', {
        title: 'Updated Title',
        notes: 'Updated notes',
      });

      expect(result).toBe(true);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE media_items'),
        expect.arrayContaining(['Updated Title', 'Updated notes'])
      );
    });

    it('should return false when no fields to update', async () => {
      const result = await updateMediaItem(mockDb as any, 'item-1', {});

      expect(result).toBe(false);
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it('should return false when item not found', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 0 });

      const result = await updateMediaItem(mockDb as any, 'nonexistent', {
        title: 'New Title',
      });

      expect(result).toBe(false);
    });
  });

  describe('deleteMediaItem', () => {
    it('should delete item and return true', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await deleteMediaItem(mockDb as any, 'item-1');

      expect(result).toBe(true);
    });

    it('should return false when item not found', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 0 });

      const result = await deleteMediaItem(mockDb as any, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('listMediaItems', () => {
    it('should return all items when no filters', async () => {
      mockDb.getAllAsync.mockResolvedValue(testItems);

      const result = await listMediaItems(mockDb as any);

      expect(result).toHaveLength(testItems.length);
    });

    it('should filter by type', async () => {
      const textItems = testItems.filter(i => i.type === 'text');
      mockDb.getAllAsync.mockResolvedValue(textItems);

      const result = await listMediaItems(mockDb as any, { type: 'text' });

      expect(result.every(i => i.type === 'text')).toBe(true);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('m.type = ?'),
        expect.arrayContaining(['text'])
      );
    });

    it('should apply limit and offset', async () => {
      mockDb.getAllAsync.mockResolvedValue([testItems[0]]);

      await listMediaItems(mockDb as any, { limit: 1, offset: 2 });

      // Offset only added when > 0
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([1])
      );
    });

    it('should search by text', async () => {
      mockDb.getAllAsync.mockResolvedValue([testItems[0]]);

      await listMediaItems(mockDb as any, { searchText: 'productivity' });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'),
        expect.any(Array)
      );
    });
  });

  describe('countMediaItems', () => {
    it('should return total count', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 42 });

      const result = await countMediaItems(mockDb as any);

      expect(result).toBe(42);
    });

    it('should return 0 when no items', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ count: 0 });

      const result = await countMediaItems(mockDb as any);

      expect(result).toBe(0);
    });
  });
});

