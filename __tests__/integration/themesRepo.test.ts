/**
 * Integration tests for Themes Repository
 */

import {
  createTheme,
  getTheme,
  updateTheme,
  addTagToTheme,
  getThemeWithTags,
  countThemes,
} from '@/lib/storage/repositories/themesRepo';
import { CreateThemeInput, UpdateThemeInput } from '@/lib/storage/types';

const mockDb = {
  runAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  execAsync: jest.fn(),
};

describe('Themes Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTheme', () => {
    it('should auto-generate slug from name when not provided', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const input: CreateThemeInput = {
        id: 'theme-1',
        name: 'Tech & Science',
      };

      await createTheme(mockDb as any, input);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO themes'),
        expect.arrayContaining(['tech-science'])
      );
    });

    it('should use provided slug when given', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const input: CreateThemeInput = {
        id: 'theme-2',
        name: 'My Theme',
        slug: 'custom-slug',
      };

      await createTheme(mockDb as any, input);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['custom-slug'])
      );
    });
  });

  describe('updateTheme', () => {
    it('should auto-regenerate slug when name changes and no slug provided', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const updates: UpdateThemeInput = { name: 'New Name Here' };
      await updateTheme(mockDb as any, 'theme-1', updates);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('name = ?'),
        expect.arrayContaining(['New Name Here', 'new-name-here'])
      );
    });

    it('should return false when no fields provided', async () => {
      const result = await updateTheme(mockDb as any, 'theme-1', {});
      expect(result).toBe(false);
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });
  });

  describe('addTagToTheme', () => {
    it('should use INSERT OR IGNORE for idempotency', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      await addTagToTheme(mockDb as any, 'theme-1', 42);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR IGNORE INTO theme_members'),
        expect.arrayContaining(['theme-1', 42])
      );
    });
  });

  describe('getThemeWithTags', () => {
    it('should return null when theme not found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getThemeWithTags(mockDb as any, 'nonexistent');

      expect(result).toBeNull();
    });

    it('should join theme with its tags', async () => {
      const mockTheme = {
        id: 'theme-1',
        name: 'Tech',
        slug: 'tech',
        description: null,
        item_count: 0,
        created_at: 1000,
        updated_at: 1000,
      };
      const mockTags = [
        { id: 1, name: 'programming', slug: null, kind: 'emergent', created_at: 1000, updated_at: null, confidence: null, source: 'user' },
      ];

      mockDb.getFirstAsync.mockResolvedValue(mockTheme);
      mockDb.getAllAsync.mockResolvedValue(mockTags);

      const result = await getThemeWithTags(mockDb as any, 'theme-1');

      expect(result).not.toBeNull();
      expect(result!.tags).toHaveLength(1);
      expect(result!.tags[0].name).toBe('programming');
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('theme_members'),
        ['theme-1']
      );
    });
  });
});
