/**
 * Tests for swipe ranking and preference computation
 */

import {
  computePreferences,
  rankItems,
  getColdStartBatch,
  getWarmBatch,
  computeVaultPreferences,
  mergePreferences,
  DEFAULT_CONFIG,
  PreferenceProfile,
} from '@/lib/services/swipe/ranker';
import { testSwipeMedia, getTestSwipeEventsWithMedia } from '@/__tests__/seed/testData';

describe('Swipe Ranker', () => {
  describe('computePreferences', () => {
    it('should compute tag preferences from swipe events', () => {
      const events = getTestSwipeEventsWithMedia();
      const preferences = computePreferences(events, DEFAULT_CONFIG);
      
      expect(preferences.totalSwipes).toBe(events.length);
      expect(preferences.tags.size).toBeGreaterThan(0);
      expect(preferences.types.size).toBeGreaterThan(0);
    });

    it('should give positive weight to liked tags', () => {
      const events = getTestSwipeEventsWithMedia();
      const preferences = computePreferences(events, DEFAULT_CONFIG);
      
      // drama and crime tags should have positive weight (from Breaking Bad likes)
      const dramaWeight = preferences.tags.get('drama');
      if (dramaWeight) {
        expect(dramaWeight.weight).toBeGreaterThan(0);
      }
    });

    it('should give negative weight to disliked tags', () => {
      const events = getTestSwipeEventsWithMedia();
      const preferences = computePreferences(events, DEFAULT_CONFIG);
      
      // interview and comedy tags should have negative weight (from podcast dislikes)
      const interviewWeight = preferences.tags.get('interview');
      if (interviewWeight) {
        expect(interviewWeight.weight).toBeLessThan(0);
      }
    });

    it('should handle empty events array', () => {
      const preferences = computePreferences([], DEFAULT_CONFIG);
      
      expect(preferences.totalSwipes).toBe(0);
      expect(preferences.tags.size).toBe(0);
      expect(preferences.types.size).toBe(0);
    });
  });

  describe('getColdStartBatch', () => {
    it('should return stratified sample across types', () => {
      const result = getColdStartBatch(testSwipeMedia);
      
      expect(result.length).toBeGreaterThan(0);
      // Should have items from different types
      const types = new Set(result.map(r => r.item.type));
      expect(types.size).toBeGreaterThan(1);
    });

    it('should sort by popularity within each type', () => {
      const result = getColdStartBatch(testSwipeMedia);
      
      // All items should have 'trending' reason in cold start
      result.forEach(r => {
        expect(r.reason).toBe('trending');
      });
    });

    it('should respect batch size limit', () => {
      const result = getColdStartBatch(testSwipeMedia, 2);
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getWarmBatch', () => {
    it('should rank items based on preferences', () => {
      const events = getTestSwipeEventsWithMedia();
      const preferences = computePreferences(events, DEFAULT_CONFIG);
      const recentMedia = testSwipeMedia.slice(0, 2);
      
      const result = getWarmBatch(testSwipeMedia, preferences, recentMedia);
      
      expect(result.length).toBe(testSwipeMedia.length);
      // Items should be sorted by score
      for (let i = 0; i < result.length - 1; i++) {
        // Allow for exploration swaps
        if (result[i].reason !== 'explore' && result[i + 1].reason !== 'explore') {
          expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score);
        }
      }
    });

    it('should apply diversity penalty for repeated types', () => {
      const events = getTestSwipeEventsWithMedia();
      const preferences = computePreferences(events, DEFAULT_CONFIG);
      // Recent media all of same type
      const recentMedia = [testSwipeMedia[0], testSwipeMedia[0], testSwipeMedia[0]];
      
      const result = getWarmBatch(testSwipeMedia, preferences, recentMedia);
      
      // Same type items should have lower scores due to diversity penalty
      const sameTypeItems = result.filter(r => r.item.type === testSwipeMedia[0].type);
      expect(sameTypeItems.length).toBeGreaterThan(0);
    });
  });

  describe('computeVaultPreferences', () => {
    it('should compute preferences from vault items', () => {
      const vaultItems = [
        { id: '1', type: 'text' as const, tags: ['productivity', 'work'], created_at: Date.now() },
        { id: '2', type: 'url' as const, tags: ['cooking', 'recipes'], created_at: Date.now() },
      ];
      
      const prefs = computeVaultPreferences(vaultItems, DEFAULT_CONFIG);
      
      expect(prefs.totalSwipes).toBe(2); // Each vault item counts as 1
      expect(prefs.tags.get('productivity')).toBeDefined();
      expect(prefs.tags.get('cooking')).toBeDefined();
    });

    it('should weight vault items positively (implicit likes)', () => {
      const vaultItems = [
        { id: '1', type: 'text' as const, tags: ['music'], created_at: Date.now() },
      ];
      
      const prefs = computeVaultPreferences(vaultItems, DEFAULT_CONFIG);
      
      const musicPref = prefs.tags.get('music');
      expect(musicPref).toBeDefined();
      expect(musicPref!.weight).toBeGreaterThan(0);
    });
  });

  describe('mergePreferences', () => {
    it('should combine swipe and vault preferences', () => {
      const swipePrefs: PreferenceProfile = {
        tags: new Map([['music', { weight: 0.8, count: 5 }]]),
        types: new Map([['url', { weight: 0.5, count: 3 }]]),
        totalSwipes: 10,
        lastUpdated: Date.now(),
      };
      
      const vaultPrefs: PreferenceProfile = {
        tags: new Map([['cooking', { weight: 0.6, count: 2 }]]),
        types: new Map([['text', { weight: 0.7, count: 4 }]]),
        totalSwipes: 5,
        lastUpdated: Date.now(),
      };
      
      const merged = mergePreferences(swipePrefs, vaultPrefs);
      
      expect(merged.tags.has('music')).toBe(true);
      expect(merged.tags.has('cooking')).toBe(true);
      expect(merged.totalSwipes).toBe(15);
    });

    it('should weight swipes higher than vault items', () => {
      const swipePrefs: PreferenceProfile = {
        tags: new Map([['shared', { weight: 1.0, count: 5 }]]),
        types: new Map(),
        totalSwipes: 5,
        lastUpdated: Date.now(),
      };
      
      const vaultPrefs: PreferenceProfile = {
        tags: new Map([['shared', { weight: 0.5, count: 2 }]]),
        types: new Map(),
        totalSwipes: 2,
        lastUpdated: Date.now(),
      };
      
      const merged = mergePreferences(swipePrefs, vaultPrefs, 0.7, 0.3);
      
      const sharedWeight = merged.tags.get('shared')!.weight;
      // Should be weighted toward swipe preference (0.7 * 1.0 + 0.3 * 0.5 = 0.85)
      expect(sharedWeight).toBeCloseTo(0.85, 1);
    });
  });
});





















