/**
 * Integration tests for Item Links Repository
 */

import {
  createItemLink,
  getItemLink,
  updateItemLink,
  deleteItemLink,
  listItemLinks,
  countItemLinks,
  deleteItemLinksForItem,
} from '@/lib/storage/repositories/itemLinksRepo';
import { CreateItemLinkInput } from '@/lib/storage/types';

const mockDb = {
  runAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  execAsync: jest.fn(),
};

describe('Item Links Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createItemLink', () => {
    it('should insert correct columns and return the id', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const input: CreateItemLinkInput = {
        id: 'link-1',
        item_id: 'item-1',
        url: 'https://example.com',
        title: 'Example',
        description: 'A description',
        domain: 'example.com',
      };

      const result = await createItemLink(mockDb as any, input);

      expect(result).toBe('link-1');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO item_links'),
        expect.arrayContaining(['link-1', 'item-1', 'https://example.com'])
      );
    });

    it('should use null for optional fields when not provided', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const input: CreateItemLinkInput = {
        id: 'link-2',
        item_id: 'item-1',
        url: 'https://example.com',
      };

      await createItemLink(mockDb as any, input);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([null, null, null])
      );
    });
  });

  describe('listItemLinks', () => {
    it('should filter by item_id', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await listItemLinks(mockDb as any, { item_id: 'item-1' });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('item_id = ?'),
        expect.arrayContaining(['item-1'])
      );
    });

    it('should filter by domain', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await listItemLinks(mockDb as any, { domain: 'example.com' });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('domain = ?'),
        expect.arrayContaining(['example.com'])
      );
    });
  });

  describe('updateItemLink', () => {
    it('should return false when no fields to update', async () => {
      const result = await updateItemLink(mockDb as any, 'link-1', {});
      expect(result).toBe(false);
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it('should update specified fields', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await updateItemLink(mockDb as any, 'link-1', { title: 'New Title' });

      expect(result).toBe(true);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('title = ?'),
        expect.arrayContaining(['New Title', 'link-1'])
      );
    });
  });

  describe('deleteItemLinksForItem', () => {
    it('should return the number of deleted rows', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 3 });

      const count = await deleteItemLinksForItem(mockDb as any, 'item-1');

      expect(count).toBe(3);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM item_links WHERE item_id = ?'),
        ['item-1']
      );
    });
  });
});
