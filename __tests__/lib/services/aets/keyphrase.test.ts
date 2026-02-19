/**
 * Tests for keyphrase extraction and tag generation
 */

import {
  extractTitleKeyphrases,
  extractDomainTokens,
  extractKeyphrases,
  normalizeTagName,
} from '@/lib/services/aets/keyphrase';

describe('Keyphrase Extraction', () => {
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

    it('should handle empty strings', () => {
      expect(normalizeTagName('')).toBe('');
    });

    it('should handle special characters', () => {
      const result = normalizeTagName('c++');
      expect(result).toBeTruthy();
    });
  });

  describe('extractKeyphrases', () => {
    it('should extract meaningful phrases from text', () => {
      const text = 'machine learning algorithms for natural language processing';
      const result = extractKeyphrases(text, 5);
      
      expect(result.length).toBeGreaterThan(0);
      // Each result should have phrase and score
      result.forEach(kp => {
        expect(kp.phrase).toBeTruthy();
        expect(typeof kp.score).toBe('number');
      });
    });

    it('should respect maxPhrases limit', () => {
      const text = 'machine learning algorithms for natural language processing and deep learning neural networks';
      const result = extractKeyphrases(text, 3);
      
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should filter out stopwords', () => {
      const text = 'the quick brown fox jumps over the lazy dog';
      const result = extractKeyphrases(text, 5);
      
      // Results should not contain pure stopwords
      result.forEach(kp => {
        expect(kp.phrase).not.toBe('the');
        expect(kp.phrase).not.toBe('over');
      });
    });

    it('should handle empty text', () => {
      const result = extractKeyphrases('', 5);
      expect(result).toEqual([]);
    });
  });

  describe('extractTitleKeyphrases', () => {
    it('should extract meaningful phrases from titles', () => {
      const title = 'How to Build a React Native App';
      const result = extractTitleKeyphrases(title);
      
      expect(result.length).toBeGreaterThan(0);
      // Should extract relevant tech terms
      expect(result.some(kp => kp.phrase.toLowerCase().includes('react'))).toBe(true);
    });

    it('should handle YouTube-style titles', () => {
      const title = 'Bruno Mars - Uptown Funk (Official Video)';
      const result = extractTitleKeyphrases(title);
      
      expect(result.length).toBeGreaterThan(0);
      // Should extract artist name or song name
      const hasBrunoOrUptown = result.some(kp => 
        kp.phrase.toLowerCase().includes('bruno') || 
        kp.phrase.toLowerCase().includes('uptown')
      );
      expect(hasBrunoOrUptown).toBe(true);
    });

    it('should return empty array for empty title', () => {
      const result = extractTitleKeyphrases('');
      expect(result).toEqual([]);
    });

    it('should assign confidence scores', () => {
      const title = 'React Native Development Guide';
      const result = extractTitleKeyphrases(title);
      
      result.forEach(kp => {
        expect(kp.score).toBeGreaterThanOrEqual(0);
        expect(kp.score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('extractDomainTokens', () => {
    it('should extract meaningful tokens from URLs', () => {
      const url = 'https://example.com/blog/react-native-tutorial';
      const result = extractDomainTokens(url);
      
      expect(result.length).toBeGreaterThan(0);
    });

    it('should extract domain name as a token', () => {
      const url = 'https://reactnative.dev/docs/getting-started';
      const result = extractDomainTokens(url);
      
      // Should include some form of the domain
      expect(result.some(kp => kp.phrase.includes('reactnative'))).toBe(true);
    });

    it('should filter out common URL path segments', () => {
      const url = 'https://youtube.com/watch?v=abc123';
      const result = extractDomainTokens(url);
      
      // Should not include 'watch' as a meaningful tag
      expect(result.every(kp => kp.phrase !== 'watch')).toBe(true);
    });

    it('should handle malformed URLs gracefully', () => {
      const result = extractDomainTokens('not-a-valid-url');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle URLs without path', () => {
      const url = 'https://example.com';
      const result = extractDomainTokens(url);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
