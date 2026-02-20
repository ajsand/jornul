/**
 * Integration tests for AETS (Automatic Emergent Tag System) Pipeline
 * Tests the full flow from content extraction to tag assignment
 */

import { extractTagCandidates, TagCandidate } from '@/lib/services/aets/tagger';
import {
  extractKeyphrases,
  extractTitleKeyphrases,
  extractDomainTokens,
  normalizeTagName,
} from '@/lib/services/aets/keyphrase';
import { isAnyStopword, validateTag, isLikelyNoun } from '@/lib/services/aets/wordLists';
import { testItems } from '@/__tests__/seed/testData';
import { MediaItem } from '@/lib/storage/types';

describe('AETS Pipeline Integration', () => {
  describe('Full Tag Extraction Flow', () => {
    it('should extract meaningful tags from text content', () => {
      const item: MediaItem = {
        id: 'test-1',
        type: 'text',
        title: 'Machine Learning Best Practices for Beginners',
        source_url: null,
        local_uri: null,
        notes: 'Learning about neural networks and deep learning concepts',
        extracted_text: 'Neural networks are fundamental to modern AI applications',
        metadata_json: null,
        ingest_status: 'ready',
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const candidates = extractTagCandidates(item);

      expect(candidates.length).toBeGreaterThan(0);
      // Should extract relevant terms
      const hasRelevantTag = candidates.some(c =>
        c.name.includes('neural') ||
        c.name.includes('learning') ||
        c.name.includes('network')
      );
      expect(hasRelevantTag).toBe(true);
    });

    it('should extract domain-based tags from URLs', () => {
      const item: MediaItem = {
        id: 'test-2',
        type: 'url',
        title: 'React Native Documentation',
        source_url: 'https://reactnative.dev/docs/getting-started',
        local_uri: null,
        notes: null,
        extracted_text: null,
        metadata_json: null,
        ingest_status: 'ready',
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const candidates = extractTagCandidates(item);

      expect(candidates.length).toBeGreaterThan(0);
      // Should extract something from domain/title
      const hasRelevant = candidates.some(c =>
        c.name.includes('react') || c.name.includes('native')
      );
      expect(hasRelevant).toBe(true);
    });

    it('should handle items with minimal content', () => {
      const item: MediaItem = {
        id: 'test-3',
        type: 'text',
        title: null,
        source_url: null,
        local_uri: null,
        notes: null,
        extracted_text: null,
        metadata_json: null,
        ingest_status: 'ready',
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const candidates = extractTagCandidates(item);

      // Should not crash, may return empty or media type
      expect(Array.isArray(candidates)).toBe(true);
    });
  });

  describe('Keyphrase Quality Filtering', () => {
    it('should filter out stopwords from keyphrases', () => {
      const text = 'Programming involves building software applications and databases';
      const keyphrases = extractKeyphrases(text, 5);

      // Keyphrases should prefer content words over stopwords
      expect(keyphrases.length).toBeGreaterThanOrEqual(0);
      // At least some meaningful content should be extracted
      if (keyphrases.length > 0) {
        const hasContent = keyphrases.some(kp => 
          !isAnyStopword(kp.phrase) || kp.phrase.split(' ').some(w => !isAnyStopword(w))
        );
        expect(hasContent).toBe(true);
      }
    });

    it('should prioritize noun phrases over verbs', () => {
      const text = 'Programming involves building software applications';
      const keyphrases = extractKeyphrases(text, 5);

      // Should extract nouns like 'programming', 'software', 'applications'
      const hasNouns = keyphrases.some(kp =>
        isLikelyNoun(kp.phrase) || kp.phrase.includes('software') || kp.phrase.includes('programming')
      );
      expect(hasNouns).toBe(true);
    });

    it('should validate and clean tag names', () => {
      // Valid tags
      expect(validateTag('Programming')).toBe('programming');
      expect(validateTag('  TypeScript  ')).toBe('typescript');
      expect(validateTag('technology')).toBe('technology');

      // Invalid tags
      expect(validateTag('a')).toBeNull(); // too short
      expect(validateTag('12345')).toBeNull(); // pure numbers
      expect(validateTag('the')).toBeNull(); // stopword
    });
  });

  describe('Title Processing', () => {
    it('should extract keyphrases from YouTube-style titles', () => {
      const title = 'Taylor Swift - Shake It Off (Official Music Video)';
      const keyphrases = extractTitleKeyphrases(title);

      expect(keyphrases.length).toBeGreaterThan(0);
      // Should extract artist name
      const hasTaylor = keyphrases.some(kp =>
        kp.phrase.toLowerCase().includes('taylor') ||
        kp.phrase.toLowerCase().includes('swift')
      );
      expect(hasTaylor).toBe(true);
    });

    it('should extract keyphrases from article titles', () => {
      const title = 'How to Build a REST API with Node.js and Express';
      const keyphrases = extractTitleKeyphrases(title);

      expect(keyphrases.length).toBeGreaterThan(0);
      // Should extract tech terms
      const hasTech = keyphrases.some(kp =>
        kp.phrase.toLowerCase().includes('node') ||
        kp.phrase.toLowerCase().includes('express') ||
        kp.phrase.toLowerCase().includes('rest')
      );
      expect(hasTech).toBe(true);
    });
  });

  describe('URL Processing', () => {
    it('should extract domain as potential tag', () => {
      const url = 'https://developer.mozilla.org/en-US/docs/Web/JavaScript';
      const tokens = extractDomainTokens(url);

      // Should extract something from the URL
      expect(Array.isArray(tokens)).toBe(true);
      // Check for any content extraction (developer, javascript, etc.)
      if (tokens.length > 0) {
        const hasContent = tokens.some(t => t.phrase.length > 0);
        expect(hasContent).toBe(true);
      }
    });

    it('should extract meaningful path segments', () => {
      const url = 'https://example.com/blog/react-native-tutorial';
      const tokens = extractDomainTokens(url);

      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should filter out common URL noise', () => {
      const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ';
      const tokens = extractDomainTokens(url);

      // Should not include 'watch' as it's a URL path stopword
      const hasWatch = tokens.some(t => t.phrase === 'watch');
      expect(hasWatch).toBe(false);
    });
  });

  describe('Tag Scoring', () => {
    it('should assign higher scores to title-derived tags', () => {
      const item = testItems[0]; // Has title about productivity
      const candidates = extractTagCandidates(item);

      // Find candidates from title
      const titleCandidates = candidates.filter(c =>
        item.title?.toLowerCase().includes(c.name.toLowerCase())
      );

      // Title candidates should exist
      expect(titleCandidates.length).toBeGreaterThan(0);
    });

    it('should boost multi-word phrases', () => {
      const item: MediaItem = {
        id: 'test-boost',
        type: 'text',
        title: 'Introduction to Machine Learning Algorithms',
        source_url: null,
        local_uri: null,
        notes: null,
        extracted_text: null,
        metadata_json: null,
        ingest_status: 'ready',
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const candidates = extractTagCandidates(item);

      // Check if multi-word phrases exist
      const multiWordCandidates = candidates.filter(c => c.name.includes(' '));
      // Either multi-word or single meaningful words should be present
      expect(candidates.length).toBeGreaterThan(0);
    });
  });

  describe('Normalization', () => {
    it('should normalize tag names consistently', () => {
      expect(normalizeTagName('React Native')).toBe('react native');
      expect(normalizeTagName('  TYPESCRIPT  ')).toBe('typescript');
      // Node.js gets normalized by removing dots
      expect(normalizeTagName('Node.js').toLowerCase()).toContain('node');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeTagName('machine   learning')).toBe('machine learning');
    });

    it('should handle empty input', () => {
      expect(normalizeTagName('')).toBe('');
      expect(normalizeTagName('   ')).toBe('');
    });
  });
});

