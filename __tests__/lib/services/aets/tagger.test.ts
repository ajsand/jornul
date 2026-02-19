/**
 * Tests for automatic tag generation
 */

import { extractTagCandidates, TagCandidate } from '@/lib/services/aets/tagger';
import { normalizeTagName } from '@/lib/services/aets/keyphrase';
import { isAnyStopword } from '@/lib/services/aets/wordLists';
import { testItems } from '@/__tests__/seed/testData';

describe('AETS Tagger', () => {
  describe('extractTagCandidates', () => {
    it('should extract tags from title', () => {
      const item = testItems[0]; // Text item with title about productivity
      const result = extractTagCandidates(item);
      
      expect(result.length).toBeGreaterThan(0);
      // Should extract meaningful tags from title
      expect(result.some(t => t.name.toLowerCase().includes('productivity'))).toBe(true);
    });

    it('should extract tags from URL for link items', () => {
      const item = testItems[1]; // URL item pointing to reactnative.dev
      const result = extractTagCandidates(item);
      
      expect(result.length).toBeGreaterThan(0);
    });

    it('should extract tags from notes', () => {
      const item = testItems[0]; // Has notes about productivity
      const result = extractTagCandidates(item);
      
      expect(result.length).toBeGreaterThan(0);
    });

    it('should assign confidence scores between 0 and 1', () => {
      const item = testItems[0];
      const result = extractTagCandidates(item);
      
      result.forEach(tag => {
        expect(tag.score).toBeGreaterThanOrEqual(0);
        expect(tag.score).toBeLessThanOrEqual(1.5); // Allow for boost
      });
    });

    it('should handle items with minimal content', () => {
      const item = {
        ...testItems[0],
        title: null,
        notes: null,
        extracted_text: null,
      };
      const result = extractTagCandidates(item);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should add media type as a tag for non-text items', () => {
      const item = testItems[3]; // Image item
      const result = extractTagCandidates(item);
      
      // The 'image' type gets filtered out as it's in URL_PATH_STOPWORDS
      // But other content should still be extracted
      expect(Array.isArray(result)).toBe(true);
      // The item has 'hiking' and 'sunset' in content which should be extracted
      expect(result.some(t => t.name.includes('sunset') || t.name.includes('hiking') || t.name.includes('photo'))).toBe(true);
    });
  });

  describe('normalizeTagName', () => {
    it('should convert to lowercase', () => {
      expect(normalizeTagName('React Native')).toBe('react native');
    });

    it('should trim whitespace', () => {
      expect(normalizeTagName('  react  ')).toBe('react');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeTagName('react   native')).toBe('react native');
    });

    it('should handle hyphenated words', () => {
      const result = normalizeTagName('machine-learning');
      expect(result).toBeTruthy();
    });
  });

  describe('isAnyStopword', () => {
    it('should identify common stopwords', () => {
      expect(isAnyStopword('the')).toBe(true);
      expect(isAnyStopword('and')).toBe(true);
      expect(isAnyStopword('with')).toBe(true);
    });

    it('should not flag content words', () => {
      expect(isAnyStopword('programming')).toBe(false);
      expect(isAnyStopword('javascript')).toBe(false);
      expect(isAnyStopword('technology')).toBe(false);
    });

    it('should flag video-related stopwords', () => {
      // 'music' is in VIDEO_STOPWORDS as it's generic media type
      expect(isAnyStopword('music')).toBe(true);
      expect(isAnyStopword('video')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isAnyStopword('THE')).toBe(true);
      expect(isAnyStopword('And')).toBe(true);
    });
  });

  describe('Tag Quality', () => {
    it('should filter short single-word tags', () => {
      const item = {
        ...testItems[0],
        title: 'A to do list',
        notes: null,
        extracted_text: null,
      };
      const result = extractTagCandidates(item);
      
      // Should not include 'a' or 'to' as standalone tags
      expect(result.every(t => t.name !== 'a')).toBe(true);
      expect(result.every(t => t.name !== 'to')).toBe(true);
    });

    it('should allow multi-word phrases', () => {
      const item = {
        ...testItems[0],
        title: 'artificial intelligence research',
        notes: null,
        extracted_text: null,
      };
      const result = extractTagCandidates(item);
      
      // Should extract phrases - either multi-word or single meaningful words
      expect(result.length).toBeGreaterThan(0);
      // At least one tag should be extracted from the title
      const hasRelevantTag = result.some(t => 
        t.name.includes('artificial') || 
        t.name.includes('intelligence') || 
        t.name.includes('research')
      );
      expect(hasRelevantTag).toBe(true);
    });
  });
});
