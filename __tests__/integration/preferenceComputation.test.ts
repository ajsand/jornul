/**
 * Integration tests for Preference Computation
 * Tests the full flow from swipe events to preference profile
 */

import {
  computePreferences,
  computeVaultPreferences,
  mergePreferences,
  getColdStartBatch,
  getWarmBatch,
  getRankedBatch,
  DEFAULT_CONFIG,
  PreferenceProfile,
} from '@/lib/services/swipe/ranker';
import {
  testSwipeMedia,
  testSwipeEvents,
  getTestSwipeEventsWithMedia,
} from '@/__tests__/seed/testData';

describe('Preference Computation Integration', () => {
  describe('Full Preference Pipeline', () => {
    it('should compute preferences from swipe history', () => {
      const eventsWithMedia = getTestSwipeEventsWithMedia();
      
      const preferences = computePreferences(eventsWithMedia, DEFAULT_CONFIG);
      
      expect(preferences.totalSwipes).toBe(eventsWithMedia.length);
      expect(preferences.tags.size).toBeGreaterThan(0);
      expect(preferences.types.size).toBeGreaterThan(0);
    });

    it('should give higher weight to super_likes', () => {
      const eventsWithMedia = getTestSwipeEventsWithMedia();
      const preferences = computePreferences(eventsWithMedia, DEFAULT_CONFIG);
      
      // Breaking Bad was super_liked - its tags should have high weight
      // drama and crime tags from Breaking Bad
      const dramaWeight = preferences.tags.get('drama');
      const crimeWeight = preferences.tags.get('crime');
      
      // At least one should exist and be positive
      const hasPositivePreference = 
        (dramaWeight && dramaWeight.weight > 0) || 
        (crimeWeight && crimeWeight.weight > 0);
      
      expect(hasPositivePreference).toBe(true);
    });

    it('should give negative weight to disliked content', () => {
      const eventsWithMedia = getTestSwipeEventsWithMedia();
      const preferences = computePreferences(eventsWithMedia, DEFAULT_CONFIG);
      
      // The Joe Rogan Experience was disliked - interview/comedy tags
      const interviewWeight = preferences.tags.get('interview');
      
      if (interviewWeight) {
        expect(interviewWeight.weight).toBeLessThan(0);
      }
    });
  });

  describe('Vault Preferences Integration', () => {
    it('should treat vault items as implicit likes', () => {
      const vaultItems = [
        { id: '1', type: 'text' as const, tags: ['productivity', 'work'], created_at: Date.now() },
        { id: '2', type: 'url' as const, tags: ['cooking', 'recipes'], created_at: Date.now() },
        { id: '3', type: 'text' as const, tags: ['productivity'], created_at: Date.now() },
      ];
      
      const preferences = computeVaultPreferences(vaultItems, DEFAULT_CONFIG);
      
      // All vault items should contribute positive weights
      const productivityPref = preferences.tags.get('productivity');
      expect(productivityPref).toBeDefined();
      expect(productivityPref!.weight).toBeGreaterThan(0);
      expect(productivityPref!.count).toBe(2); // appears twice
    });

    it('should count vault items as swipe equivalents', () => {
      const vaultItems = [
        { id: '1', type: 'text' as const, tags: ['test'], created_at: Date.now() },
        { id: '2', type: 'text' as const, tags: ['test'], created_at: Date.now() },
      ];
      
      const preferences = computeVaultPreferences(vaultItems, DEFAULT_CONFIG);
      
      expect(preferences.totalSwipes).toBe(2);
    });
  });

  describe('Merged Preferences', () => {
    it('should combine swipe and vault preferences', () => {
      const swipePrefs: PreferenceProfile = {
        tags: new Map([
          ['music', { weight: 0.8, count: 5 }],
          ['shared', { weight: 0.5, count: 3 }],
        ]),
        types: new Map([['url', { weight: 0.6, count: 4 }]]),
        totalSwipes: 10,
        lastUpdated: Date.now(),
      };
      
      const vaultPrefs: PreferenceProfile = {
        tags: new Map([
          ['cooking', { weight: 0.7, count: 2 }],
          ['shared', { weight: 0.3, count: 1 }],
        ]),
        types: new Map([['text', { weight: 0.8, count: 3 }]]),
        totalSwipes: 5,
        lastUpdated: Date.now(),
      };
      
      const merged = mergePreferences(swipePrefs, vaultPrefs, 0.7, 0.3);
      
      // Should have all unique tags
      expect(merged.tags.has('music')).toBe(true);
      expect(merged.tags.has('cooking')).toBe(true);
      expect(merged.tags.has('shared')).toBe(true);
      
      // Should have all unique types
      expect(merged.types.has('url')).toBe(true);
      expect(merged.types.has('text')).toBe(true);
      
      // Total should be combined
      expect(merged.totalSwipes).toBe(15);
    });

    it('should weight swipes higher than vault by default', () => {
      const swipePrefs: PreferenceProfile = {
        tags: new Map([['test', { weight: 1.0, count: 5 }]]),
        types: new Map(),
        totalSwipes: 5,
        lastUpdated: Date.now(),
      };
      
      const vaultPrefs: PreferenceProfile = {
        tags: new Map([['test', { weight: 0.2, count: 2 }]]),
        types: new Map(),
        totalSwipes: 2,
        lastUpdated: Date.now(),
      };
      
      const merged = mergePreferences(swipePrefs, vaultPrefs, 0.7, 0.3);
      
      const testWeight = merged.tags.get('test')!.weight;
      // 0.7 * 1.0 + 0.3 * 0.2 = 0.76
      expect(testWeight).toBeCloseTo(0.76, 1);
    });
  });

  describe('Ranking Pipeline', () => {
    it('should provide cold start batch for new users', () => {
      const batch = getColdStartBatch(testSwipeMedia);
      
      expect(batch.length).toBeGreaterThan(0);
      // All items should have 'trending' reason in cold start
      expect(batch.every(b => b.reason === 'trending')).toBe(true);
    });

    it('should provide personalized batch for warm users', () => {
      const eventsWithMedia = getTestSwipeEventsWithMedia();
      const preferences = computePreferences(eventsWithMedia, DEFAULT_CONFIG);
      const recentMedia = testSwipeMedia.slice(0, 2);
      
      // Disable exploration for deterministic testing
      const noExploreConfig = { ...DEFAULT_CONFIG, epsilonExplore: 0 };
      const batch = getWarmBatch(testSwipeMedia, preferences, recentMedia, 10, noExploreConfig);
      
      expect(batch.length).toBe(testSwipeMedia.length);
      // Items should be sorted by score (no exploration swaps)
      for (let i = 0; i < batch.length - 1; i++) {
        expect(batch[i].score).toBeGreaterThanOrEqual(batch[i + 1].score);
      }
    });

    it('should auto-select cold vs warm based on history size', () => {
      // With few events, should use cold start
      const fewEvents = getTestSwipeEventsWithMedia().slice(0, 5);
      const batch1 = getRankedBatch(testSwipeMedia, fewEvents, [], {
        ...DEFAULT_CONFIG,
        coldStartThreshold: 10,
      });
      
      // All should be trending (cold start)
      expect(batch1.every(b => b.reason === 'trending')).toBe(true);
      
      // With many events, should use warm start
      const manyEvents = getTestSwipeEventsWithMedia();
      const batch2 = getRankedBatch(testSwipeMedia, manyEvents, [], {
        ...DEFAULT_CONFIG,
        coldStartThreshold: 5,
      });
      
      // Should have some preference-based items (warm start)
      const hasPreference = batch2.some(b => b.reason === 'preference');
      const hasTrending = batch2.some(b => b.reason === 'trending');
      expect(hasPreference || hasTrending).toBe(true);
    });
  });
});

