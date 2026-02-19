/**
 * Integration tests for Tags Repository
 * Tests tag CRUD and item-tag relationships
 */

import {
  createTag,
  getTagById,
  getTagByName,
  updateTag,
  deleteTag,
  listTags,
  attachTagToItem,
  detachTagFromItem,
  getTagsForItem,
} from '@/lib/storage/repositories/tagsRepo';
import { testTags, testTagAssignments } from '@/__tests__/seed/testData';
import { Tag, CreateTagInput } from '@/lib/storage/types';

// Mock expo-sqlite
const mockDb = {
  runAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  execAsync: jest.fn(),
};

// Mock FTS repo (used internally by tagsRepo)
jest.mock('@/lib/storage/repositories/ftsRepo', () => ({
  upsertFtsEntry: jest.fn().mockResolvedValue(undefined),
}));

describe('Tags Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTag', () => {
    it('should create a tag with name and auto-generate slug', async () => {
      const input: CreateTagInput = {
        name: 'React Native',
        kind: 'emergent',
      };

      const mockCreatedTag: Tag = {
        id: 1,
        name: 'React Native',
        slug: 'react-native',
        kind: 'emergent',
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue(mockCreatedTag);

      const result = await createTag(mockDb as any, input);

      expect(result.name).toBe('React Native');
      expect(result.kind).toBe('emergent');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tags'),
        expect.arrayContaining(['React Native'])
      );
    });

    it('should use provided slug if given', async () => {
      const input: CreateTagInput = {
        name: 'JavaScript',
        slug: 'js',
        kind: 'manual',
      };

      const mockTag: Tag = {
        id: 2,
        name: 'JavaScript',
        slug: 'js',
        kind: 'manual',
        created_at: Date.now(),
        updated_at: null,
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue(mockTag);

      const result = await createTag(mockDb as any, input);

      expect(result.slug).toBe('js');
    });

    it('should truncate long tag names', async () => {
      const longName = 'A'.repeat(150);
      const input: CreateTagInput = { name: longName };

      const mockTag: Tag = {
        id: 3,
        name: longName.slice(0, 100),
        slug: 'a'.repeat(100).slice(0, 30),
        kind: 'manual',
        created_at: Date.now(),
        updated_at: null,
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue(mockTag);

      const result = await createTag(mockDb as any, input);

      expect(result.name.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getTagById', () => {
    it('should return tag when found', async () => {
      const mockTag = testTags[0];
      mockDb.getFirstAsync.mockResolvedValue(mockTag);

      const result = await getTagById(mockDb as any, 1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(mockTag.id);
    });

    it('should return null when not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getTagById(mockDb as any, 9999);

      expect(result).toBeNull();
    });
  });

  describe('getTagByName', () => {
    it('should find tag by exact name match', async () => {
      const mockTag = testTags[0];
      mockDb.getFirstAsync.mockResolvedValue(mockTag);

      const result = await getTagByName(mockDb as any, 'productivity');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('productivity');
    });
  });

  describe('updateTag', () => {
    it('should update tag name and auto-update slug', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await updateTag(mockDb as any, 1, {
        name: 'New Name',
      });

      expect(result).toBe(true);
      // Should auto-generate new slug when name changes
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('slug ='),
        expect.any(Array)
      );
    });

    it('should update only kind without changing slug', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await updateTag(mockDb as any, 1, {
        kind: 'manual',
      });

      expect(result).toBe(true);
    });
  });

  describe('listTags', () => {
    it('should return tags sorted by usage count', async () => {
      const mockTagsWithCount = testTags.map((t, i) => ({
        ...t,
        usage_count: 10 - i,
      }));
      mockDb.getAllAsync.mockResolvedValue(mockTagsWithCount);

      const result = await listTags(mockDb as any, {
        sortBy: 'count',
        sortDirection: 'DESC',
      });

      expect(result.length).toBeGreaterThan(0);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY usage_count DESC'),
        expect.any(Array)
      );
    });

    it('should filter by minimum usage count', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await listTags(mockDb as any, { minUsageCount: 5 });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('HAVING usage_count >= ?'),
        expect.arrayContaining([5])
      );
    });
  });

  describe('Item-Tag Relationships', () => {
    describe('attachTagToItem', () => {
      it('should create item-tag relationship', async () => {
        mockDb.runAsync.mockResolvedValue({ changes: 1 });

        await attachTagToItem(mockDb as any, 'item-1', 1, 0.85, 'heuristic');

        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('INSERT OR REPLACE INTO item_tags'),
          expect.arrayContaining(['item-1', 1, 0.85, 'heuristic'])
        );
      });
    });

    describe('detachTagFromItem', () => {
      it('should remove item-tag relationship', async () => {
        mockDb.runAsync.mockResolvedValue({ changes: 1 });

        const result = await detachTagFromItem(mockDb as any, 'item-1', 1);

        expect(result).toBe(true);
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM item_tags'),
          expect.arrayContaining(['item-1', 1])
        );
      });

      it('should return false if relationship did not exist', async () => {
        mockDb.runAsync.mockResolvedValue({ changes: 0 });

        const result = await detachTagFromItem(mockDb as any, 'item-1', 999);

        expect(result).toBe(false);
      });
    });

    describe('getTagsForItem', () => {
      it('should return all tags for an item', async () => {
        const mockItemTags = [
          { id: 1, name: 'productivity', confidence: 0.85, source: 'heuristic' },
          { id: 2, name: 'work', confidence: 0.75, source: 'ml' },
        ];
        mockDb.getAllAsync.mockResolvedValue(mockItemTags);

        const result = await getTagsForItem(mockDb as any, 'item-1');

        expect(result).toHaveLength(2);
        expect(result[0].confidence).toBe(0.85);
      });
    });
  });
});

