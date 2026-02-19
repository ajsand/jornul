/**
 * Tests for media helper utilities
 */

import { getMediaTitle, getMediaPreview, formatMediaDate } from '@/lib/utils/mediaHelpers';
import { testItems } from '@/__tests__/seed/testData';

describe('Media Helpers', () => {
  describe('getMediaTitle', () => {
    it('should return title if available', () => {
      const item = testItems[0]; // Has title
      const result = getMediaTitle(item);
      
      expect(result).toBe(item.title);
    });

    it('should fall back to truncated extracted_text if no title', () => {
      const item = {
        ...testItems[0],
        title: null,
        extracted_text: 'Some extracted text content that is longer than fifty characters to test truncation',
      };
      const result = getMediaTitle(item);
      
      expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
      expect(result).toContain('Some extracted text');
    });

    it('should fall back to notes if no title or extracted_text', () => {
      const item = {
        ...testItems[0],
        title: null,
        extracted_text: null,
        notes: 'Some notes here',
      };
      const result = getMediaTitle(item);
      
      expect(result).toBe('Some notes here');
    });

    it('should return type-based title for items with no text content', () => {
      const item = {
        ...testItems[0],
        type: 'image' as const,
        title: null,
        extracted_text: null,
        notes: null,
      };
      const result = getMediaTitle(item);
      
      expect(result).toBe('Image item');
    });
  });

  describe('getMediaPreview', () => {
    it('should return notes if available', () => {
      const item = testItems[0];
      const result = getMediaPreview(item);
      
      expect(result).toContain(item.notes!.substring(0, 20));
    });

    it('should return extracted_text if no notes', () => {
      const item = {
        ...testItems[0],
        notes: null,
        extracted_text: 'Some extracted text',
      };
      const result = getMediaPreview(item);
      
      expect(result).toBe('Some extracted text');
    });

    it('should return empty string for items with no preview content', () => {
      const item = {
        ...testItems[3],
        notes: null,
        extracted_text: null,
      };
      const result = getMediaPreview(item);
      
      expect(result).toBe('');
    });

    it('should truncate long content at 100 characters', () => {
      const longContent = 'A'.repeat(150);
      const item = {
        ...testItems[0],
        notes: longContent,
      };
      const result = getMediaPreview(item);
      
      expect(result.length).toBeLessThanOrEqual(103); // 100 + '...'
    });
  });

  describe('formatMediaDate', () => {
    it('should return relative time for recent items', () => {
      const now = Date.now();
      const result = formatMediaDate(now - 3600000); // 1 hour ago
      
      expect(result).toContain('ago');
    });

    it('should return absolute date for older items', () => {
      const oldDate = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      const result = formatMediaDate(oldDate);
      
      // Should contain month abbreviation
      expect(result).toMatch(/[A-Z][a-z]{2}/);
    });

    it('should include year for items over a year old', () => {
      const veryOldDate = Date.now() - (400 * 24 * 60 * 60 * 1000); // 400+ days ago
      const result = formatMediaDate(veryOldDate);
      
      expect(result).toMatch(/\d{4}/); // Contains 4-digit year
    });
  });
});
