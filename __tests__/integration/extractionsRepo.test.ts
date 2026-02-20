/**
 * Integration tests for Extractions Repository
 */

import {
  createExtraction,
  getExtractionForStage,
  updateExtraction,
  deleteExtractionsForItem,
  listExtractions,
} from '@/lib/storage/repositories/extractionsRepo';
import { CreateExtractionInput } from '@/lib/storage/types';

const mockDb = {
  runAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  execAsync: jest.fn(),
};

describe('Extractions Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createExtraction', () => {
    it('should insert correct columns and return the id', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const input: CreateExtractionInput = {
        id: 'ext-1',
        item_id: 'item-1',
        stage: 'detect',
        content: 'detected text',
        confidence: 0.9,
      };

      const result = await createExtraction(mockDb as any, input);

      expect(result).toBe('ext-1');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO extractions'),
        expect.arrayContaining(['ext-1', 'item-1', 'detect', 'detected text', 0.9])
      );
    });
  });

  describe('getExtractionForStage', () => {
    it('should return the latest extraction for the given stage', async () => {
      const mockExtraction = {
        id: 'ext-1',
        item_id: 'item-1',
        stage: 'detect',
        content: 'test',
        confidence: null,
        created_at: 1000,
      };
      mockDb.getFirstAsync.mockResolvedValue(mockExtraction);

      const result = await getExtractionForStage(mockDb as any, 'item-1', 'detect');

      expect(result).toEqual(mockExtraction);
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('item_id = ? AND stage = ?'),
        ['item-1', 'detect']
      );
    });

    it('should return null when no extraction matches', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await getExtractionForStage(mockDb as any, 'item-1', 'tag');

      expect(result).toBeNull();
    });
  });

  describe('deleteExtractionsForItem', () => {
    it('should return the count of deleted rows', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 5 });

      const count = await deleteExtractionsForItem(mockDb as any, 'item-1');

      expect(count).toBe(5);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM extractions WHERE item_id = ?'),
        ['item-1']
      );
    });
  });

  describe('updateExtraction', () => {
    it('should return false when no fields to update', async () => {
      const result = await updateExtraction(mockDb as any, 'ext-1', {});
      expect(result).toBe(false);
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });

    it('should update content and confidence', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await updateExtraction(mockDb as any, 'ext-1', {
        content: 'updated',
        confidence: 0.75,
      });

      expect(result).toBe(true);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE extractions SET'),
        expect.arrayContaining(['updated', 0.75, 'ext-1'])
      );
    });
  });
});
