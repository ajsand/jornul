/**
 * Test seed data for JournalLink tests
 * Provides deterministic data for unit and integration tests
 */

import { 
  MediaItem, 
  Tag, 
  ItemTag, 
  SwipeMedia, 
  SwipeEvent,
  SwipeSession,
  TagKind,
  TagSource,
  SwipeDecision,
  MediaType,
} from '@/lib/storage/types';

// ============ Test Items ============

export const testItems: MediaItem[] = [
  {
    id: 'item-1',
    type: 'text',
    title: 'Morning reflections on productivity',
    source_url: null,
    local_uri: null,
    notes: 'Thinking about how to be more productive today',
    extracted_text: 'Thinking about how to be more productive today',
    metadata_json: null,
    created_at: Date.now() - 86400000 * 5, // 5 days ago
    updated_at: Date.now() - 86400000 * 5,
  },
  {
    id: 'item-2',
    type: 'url',
    title: 'Best practices for React Native development',
    source_url: 'https://reactnative.dev/docs/getting-started',
    local_uri: null,
    notes: 'Great resource for RN best practices',
    extracted_text: 'React Native documentation and best practices',
    metadata_json: JSON.stringify({ og_title: 'React Native - Getting Started' }),
    created_at: Date.now() - 86400000 * 3, // 3 days ago
    updated_at: Date.now() - 86400000 * 3,
  },
  {
    id: 'item-3',
    type: 'url',
    title: 'Bruno Mars - Uptown Funk (Official Video)',
    source_url: 'https://www.youtube.com/watch?v=OPf0YbXqDm0',
    local_uri: null,
    notes: null,
    extracted_text: null,
    metadata_json: JSON.stringify({ type: 'video', duration: 270 }),
    created_at: Date.now() - 86400000 * 2, // 2 days ago
    updated_at: Date.now() - 86400000 * 2,
  },
  {
    id: 'item-4',
    type: 'image',
    title: 'Sunset photo from hiking trip',
    source_url: null,
    local_uri: '/documents/photos/sunset.jpg',
    notes: 'Beautiful sunset from Mt. Tamalpais',
    extracted_text: null,
    metadata_json: JSON.stringify({ width: 4032, height: 3024 }),
    created_at: Date.now() - 86400000, // 1 day ago
    updated_at: Date.now() - 86400000,
  },
  {
    id: 'item-5',
    type: 'text',
    title: 'Recipe: Homemade pasta with tomato sauce',
    source_url: null,
    local_uri: null,
    notes: 'Family recipe for pasta',
    extracted_text: 'Ingredients: flour, eggs, tomatoes, basil, olive oil',
    metadata_json: null,
    created_at: Date.now(), // today
    updated_at: Date.now(),
  },
];

// ============ Test Tags ============

export const testTags: Tag[] = [
  { id: 1, name: 'productivity', slug: 'productivity', kind: 'emergent', created_at: Date.now() - 86400000 * 10, updated_at: null },
  { id: 2, name: 'react native', slug: 'react-native', kind: 'emergent', created_at: Date.now() - 86400000 * 10, updated_at: null },
  { id: 3, name: 'music', slug: 'music', kind: 'emergent', created_at: Date.now() - 86400000 * 10, updated_at: null },
  { id: 4, name: 'bruno mars', slug: 'bruno-mars', kind: 'emergent', created_at: Date.now() - 86400000 * 10, updated_at: null },
  { id: 5, name: 'photography', slug: 'photography', kind: 'emergent', created_at: Date.now() - 86400000 * 10, updated_at: null },
  { id: 6, name: 'hiking', slug: 'hiking', kind: 'manual', created_at: Date.now() - 86400000 * 10, updated_at: null },
  { id: 7, name: 'cooking', slug: 'cooking', kind: 'emergent', created_at: Date.now() - 86400000 * 10, updated_at: null },
  { id: 8, name: 'recipes', slug: 'recipes', kind: 'emergent', created_at: Date.now() - 86400000 * 10, updated_at: null },
];

// ============ Test Tag Assignments ============

export const testTagAssignments: ItemTag[] = [
  { item_id: 'item-1', tag_id: 1, confidence: 0.85, source: 'heuristic', created_at: Date.now() - 86400000 * 5 },
  { item_id: 'item-2', tag_id: 2, confidence: 0.92, source: 'heuristic', created_at: Date.now() - 86400000 * 3 },
  { item_id: 'item-3', tag_id: 3, confidence: 0.88, source: 'heuristic', created_at: Date.now() - 86400000 * 2 },
  { item_id: 'item-3', tag_id: 4, confidence: 0.95, source: 'heuristic', created_at: Date.now() - 86400000 * 2 },
  { item_id: 'item-4', tag_id: 5, confidence: 0.90, source: 'heuristic', created_at: Date.now() - 86400000 },
  { item_id: 'item-4', tag_id: 6, confidence: 1.0, source: 'user', created_at: Date.now() - 86400000 },
  { item_id: 'item-5', tag_id: 7, confidence: 0.87, source: 'heuristic', created_at: Date.now() },
  { item_id: 'item-5', tag_id: 8, confidence: 0.82, source: 'heuristic', created_at: Date.now() },
  { item_id: 'item-1', tag_id: 7, confidence: 0.65, source: 'ml', created_at: Date.now() - 86400000 * 4 },
  { item_id: 'item-2', tag_id: 1, confidence: 0.70, source: 'ml', created_at: Date.now() - 86400000 * 3 },
];

// ============ Test Swipe Media ============

export const testSwipeMedia: SwipeMedia[] = [
  { id: 'swipe-1', title: 'The Great Gatsby', type: 'book', image_url: null, short_desc: 'Classic novel', long_desc: null, source: 'catalog', tags_json: '["fiction","classic"]', popularity_score: 0.85, created_at: Date.now() - 86400000 * 30 },
  { id: 'swipe-2', title: 'Inception', type: 'movie', image_url: null, short_desc: 'Sci-fi thriller', long_desc: null, source: 'catalog', tags_json: '["sci-fi","thriller"]', popularity_score: 0.92, created_at: Date.now() - 86400000 * 30 },
  { id: 'swipe-3', title: 'The Joe Rogan Experience', type: 'podcast', image_url: null, short_desc: 'Popular podcast', long_desc: null, source: 'catalog', tags_json: '["interview","comedy"]', popularity_score: 0.88, created_at: Date.now() - 86400000 * 30 },
  { id: 'swipe-4', title: 'Breaking Bad', type: 'tv', image_url: null, short_desc: 'Crime drama series', long_desc: null, source: 'catalog', tags_json: '["drama","crime"]', popularity_score: 0.95, created_at: Date.now() - 86400000 * 30 },
];

// ============ Test Swipe Session ============

export const testSwipeSession: SwipeSession = {
  id: 'session-1',
  started_at: Date.now() - 3600000, // 1 hour ago
  ended_at: null,
  filters_json: null,
};

// ============ Test Swipe Events ============

export const testSwipeEvents: SwipeEvent[] = [
  { id: 'event-1', session_id: 'session-1', media_id: 'swipe-1', decision: 'like', strength: 1.0, created_at: Date.now() - 3500000 },
  { id: 'event-2', session_id: 'session-1', media_id: 'swipe-2', decision: 'super_like', strength: 1.0, created_at: Date.now() - 3400000 },
  { id: 'event-3', session_id: 'session-1', media_id: 'swipe-3', decision: 'dislike', strength: 1.0, created_at: Date.now() - 3300000 },
  { id: 'event-4', session_id: 'session-1', media_id: 'swipe-4', decision: 'like', strength: 1.0, created_at: Date.now() - 3200000 },
  { id: 'event-5', session_id: 'session-1', media_id: 'swipe-1', decision: 'skip', strength: 1.0, created_at: Date.now() - 3100000 },
  { id: 'event-6', session_id: 'session-1', media_id: 'swipe-2', decision: 'like', strength: 1.0, created_at: Date.now() - 3000000 },
  { id: 'event-7', session_id: 'session-1', media_id: 'swipe-3', decision: 'dislike', strength: 1.0, created_at: Date.now() - 2900000 },
  { id: 'event-8', session_id: 'session-1', media_id: 'swipe-4', decision: 'super_like', strength: 1.0, created_at: Date.now() - 2800000 },
  { id: 'event-9', session_id: 'session-1', media_id: 'swipe-1', decision: 'like', strength: 1.0, created_at: Date.now() - 2700000 },
  { id: 'event-10', session_id: 'session-1', media_id: 'swipe-2', decision: 'like', strength: 1.0, created_at: Date.now() - 2600000 },
  { id: 'event-11', session_id: 'session-1', media_id: 'swipe-3', decision: 'skip', strength: 1.0, created_at: Date.now() - 2500000 },
  { id: 'event-12', session_id: 'session-1', media_id: 'swipe-4', decision: 'like', strength: 1.0, created_at: Date.now() - 2400000 },
];

// ============ Helper Functions ============

/**
 * Create a mock database that returns test data
 */
export function createMockDbWithData() {
  return {
    runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
    getFirstAsync: jest.fn().mockImplementation((query: string) => {
      if (query.includes('media_items')) {
        return Promise.resolve(testItems[0]);
      }
      return Promise.resolve(null);
    }),
    getAllAsync: jest.fn().mockImplementation((query: string) => {
      if (query.includes('media_items')) {
        return Promise.resolve(testItems);
      }
      if (query.includes('tags')) {
        return Promise.resolve(testTags);
      }
      if (query.includes('swipe_media')) {
        return Promise.resolve(testSwipeMedia);
      }
      if (query.includes('swipe_events')) {
        return Promise.resolve(testSwipeEvents);
      }
      return Promise.resolve([]);
    }),
    execAsync: jest.fn().mockResolvedValue(undefined),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Get test swipe events with media data (for preference computation tests)
 */
export function getTestSwipeEventsWithMedia() {
  return testSwipeEvents.map(event => {
    const media = testSwipeMedia.find(m => m.id === event.media_id);
    return {
      ...event,
      media_title: media?.title || '',
      media_type: media?.type || '',
      media_tags_json: media?.tags_json || null,
      media_popularity_score: media?.popularity_score || 0,
    };
  });
}





















