/**
 * Tests for word list utilities (stopwords, filters)
 */

import {
  isAnyStopword,
  isStopword,
  isVideoStopword,
  isUrlPathStopword,
  isLikelyNoun,
  validateTag,
  STOPWORDS,
  VERB_STOPWORDS,
  ADJECTIVE_STOPWORDS,
  VIDEO_STOPWORDS,
  URL_PATH_STOPWORDS,
} from '@/lib/services/aets/wordLists';

describe('Word Lists', () => {
  describe('STOPWORDS', () => {
    it('should include common English stopwords', () => {
      expect(STOPWORDS.has('the')).toBe(true);
      expect(STOPWORDS.has('and')).toBe(true);
      expect(STOPWORDS.has('but')).toBe(true);
      expect(STOPWORDS.has('or')).toBe(true);
    });

    it('should include articles', () => {
      expect(STOPWORDS.has('a')).toBe(true);
      expect(STOPWORDS.has('an')).toBe(true);
    });

    it('should include pronouns', () => {
      expect(STOPWORDS.has('he')).toBe(true);
      expect(STOPWORDS.has('she')).toBe(true);
      expect(STOPWORDS.has('it')).toBe(true);
    });
  });

  describe('isAnyStopword', () => {
    it('should return true for stopwords', () => {
      expect(isAnyStopword('the')).toBe(true);
      expect(isAnyStopword('is')).toBe(true);
      expect(isAnyStopword('at')).toBe(true);
    });

    it('should return false for content words', () => {
      expect(isAnyStopword('javascript')).toBe(false);
      expect(isAnyStopword('programming')).toBe(false);
      expect(isAnyStopword('technology')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isAnyStopword('THE')).toBe(true);
      expect(isAnyStopword('The')).toBe(true);
      expect(isAnyStopword('tHe')).toBe(true);
    });

    it('should catch video stopwords', () => {
      expect(isAnyStopword('official')).toBe(true);
      expect(isAnyStopword('video')).toBe(true);
    });

    it('should catch URL path stopwords', () => {
      expect(isAnyStopword('watch')).toBe(true);
      expect(isAnyStopword('embed')).toBe(true);
    });
  });

  describe('VERB_STOPWORDS', () => {
    it('should include common verbs', () => {
      expect(VERB_STOPWORDS.has('make')).toBe(true);
      expect(VERB_STOPWORDS.has('get')).toBe(true);
      expect(VERB_STOPWORDS.has('take')).toBe(true);
    });

    it('should include verb conjugations', () => {
      expect(VERB_STOPWORDS.has('plays')).toBe(true);
      expect(VERB_STOPWORDS.has('played')).toBe(true);
      expect(VERB_STOPWORDS.has('playing')).toBe(true);
    });
  });

  describe('ADJECTIVE_STOPWORDS', () => {
    it('should include weak adjectives', () => {
      expect(ADJECTIVE_STOPWORDS.has('best')).toBe(true);
      expect(ADJECTIVE_STOPWORDS.has('good')).toBe(true);
      expect(ADJECTIVE_STOPWORDS.has('new')).toBe(true);
    });

    it('should include vague descriptors', () => {
      expect(ADJECTIVE_STOPWORDS.has('amazing')).toBe(true);
      expect(ADJECTIVE_STOPWORDS.has('incredible')).toBe(true);
      expect(ADJECTIVE_STOPWORDS.has('epic')).toBe(true);
    });
  });

  describe('VIDEO_STOPWORDS', () => {
    it('should include common video title junk words', () => {
      expect(VIDEO_STOPWORDS.has('official')).toBe(true);
      expect(VIDEO_STOPWORDS.has('video')).toBe(true);
      expect(VIDEO_STOPWORDS.has('lyric')).toBe(true);
    });

    it('should include platform names', () => {
      expect(VIDEO_STOPWORDS.has('youtube')).toBe(true);
      expect(VIDEO_STOPWORDS.has('spotify')).toBe(true);
    });
  });

  describe('URL_PATH_STOPWORDS', () => {
    it('should include common URL path segments', () => {
      expect(URL_PATH_STOPWORDS.has('watch')).toBe(true);
      expect(URL_PATH_STOPWORDS.has('shorts')).toBe(true);
      expect(URL_PATH_STOPWORDS.has('embed')).toBe(true);
    });
  });

  describe('isLikelyNoun', () => {
    it('should identify nouns with common suffixes', () => {
      expect(isLikelyNoun('technology')).toBe(true);
      expect(isLikelyNoun('photography')).toBe(true);
      expect(isLikelyNoun('entertainment')).toBe(true);
    });

    it('should reject stopwords', () => {
      expect(isLikelyNoun('the')).toBe(false);
      expect(isLikelyNoun('and')).toBe(false);
    });

    it('should handle proper nouns (capitalized)', () => {
      expect(isLikelyNoun('taylor', 'Taylor')).toBe(true);
      expect(isLikelyNoun('swift', 'Swift')).toBe(true);
    });

    it('should allow activity nouns ending in -ing', () => {
      expect(isLikelyNoun('cooking')).toBe(true);
      expect(isLikelyNoun('programming')).toBe(true);
      expect(isLikelyNoun('gaming')).toBe(true);
    });
  });

  describe('validateTag', () => {
    it('should return lowercase version for valid tags', () => {
      expect(validateTag('Programming')).toBe('programming');
      expect(validateTag('  technology  ')).toBe('technology');
    });

    it('should return null for short words', () => {
      expect(validateTag('a')).toBeNull();
      expect(validateTag('ab')).toBeNull();
    });

    it('should return null for pure numbers', () => {
      expect(validateTag('123')).toBeNull();
      expect(validateTag('2024')).toBeNull();
    });

    it('should return null for stopwords', () => {
      expect(validateTag('the')).toBeNull();
      expect(validateTag('video')).toBeNull();
    });

    it('should respect original capitalization for proper nouns', () => {
      // Proper nouns should be allowed even if they might match adjective patterns
      expect(validateTag('creative', 'Creative')).toBe('creative');
    });
  });
});
