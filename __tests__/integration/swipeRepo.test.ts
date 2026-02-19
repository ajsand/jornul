/**
 * Integration tests for Swipe Repository
 * Tests swipe sessions, events, and preference tracking
 */

import {
  createSwipeSession,
  getSwipeSession,
  updateSwipeSession,
  endSwipeSession,
  createSwipeEvent,
  listSwipeEvents,
  countSwipeEventsByDecision,
  getSwipeEventsWithMedia,
  createSwipeMedia,
  listSwipeMedia,
  countSwipeMedia,
} from '@/lib/storage/repositories/swipeRepo';
import { testSwipeMedia, testSwipeEvents, testSwipeSession } from '@/__tests__/seed/testData';
import { CreateSwipeEventInput, CreateSwipeSessionInput, CreateSwipeMediaInput } from '@/lib/storage/types';

// Mock expo-sqlite
const mockDb = {
  runAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  execAsync: jest.fn(),
};

describe('Swipe Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Swipe Media', () => {
    describe('createSwipeMedia', () => {
      it('should create swipe media item', async () => {
        const input: CreateSwipeMediaInput = {
          id: 'movie-1',
          title: 'Inception',
          type: 'movie',
          short_desc: 'Sci-fi thriller',
          tags_json: '["sci-fi","thriller"]',
          popularity_score: 0.92,
        };

        mockDb.runAsync.mockResolvedValue({ changes: 1 });

        const result = await createSwipeMedia(mockDb as any, input);

        expect(result).toBe('movie-1');
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO swipe_media'),
          expect.arrayContaining(['movie-1', 'Inception', 'movie'])
        );
      });
    });

    describe('listSwipeMedia', () => {
      it('should return all media when no filters', async () => {
        mockDb.getAllAsync.mockResolvedValue(testSwipeMedia);

        const result = await listSwipeMedia(mockDb as any);

        expect(result).toHaveLength(testSwipeMedia.length);
      });

      it('should filter by type', async () => {
        const movies = testSwipeMedia.filter(m => m.type === 'movie');
        mockDb.getAllAsync.mockResolvedValue(movies);

        const result = await listSwipeMedia(mockDb as any, { type: 'movie' });

        expect(result.every(m => m.type === 'movie')).toBe(true);
      });

      it('should filter by minimum popularity', async () => {
        const popular = testSwipeMedia.filter(m => m.popularity_score >= 0.9);
        mockDb.getAllAsync.mockResolvedValue(popular);

        await listSwipeMedia(mockDb as any, { minPopularity: 0.9 });

        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          expect.stringContaining('popularity_score >= ?'),
          expect.arrayContaining([0.9])
        );
      });
    });

    describe('countSwipeMedia', () => {
      it('should return total count', async () => {
        mockDb.getFirstAsync.mockResolvedValue({ count: 100 });

        const result = await countSwipeMedia(mockDb as any);

        expect(result).toBe(100);
      });
    });
  });

  describe('Swipe Sessions', () => {
    describe('createSwipeSession', () => {
      it('should create a new session', async () => {
        const input: CreateSwipeSessionInput = {
          id: 'session-1',
          filters_json: '{"types":["movie"]}',
        };

        mockDb.runAsync.mockResolvedValue({ changes: 1 });

        const result = await createSwipeSession(mockDb as any, input);

        expect(result).toBe('session-1');
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO swipe_sessions'),
          expect.any(Array)
        );
      });
    });

    describe('getSwipeSession', () => {
      it('should return session when found', async () => {
        mockDb.getFirstAsync.mockResolvedValue(testSwipeSession);

        const result = await getSwipeSession(mockDb as any, 'session-1');

        expect(result).not.toBeNull();
        expect(result!.id).toBe(testSwipeSession.id);
      });
    });

    describe('endSwipeSession', () => {
      it('should set ended_at timestamp', async () => {
        mockDb.runAsync.mockResolvedValue({ changes: 1 });

        const result = await endSwipeSession(mockDb as any, 'session-1');

        expect(result).toBe(true);
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('ended_at = ?'),
          expect.any(Array)
        );
      });
    });
  });

  describe('Swipe Events', () => {
    describe('createSwipeEvent', () => {
      it('should create a swipe event', async () => {
        const input: CreateSwipeEventInput = {
          id: 'event-1',
          session_id: 'session-1',
          media_id: 'movie-1',
          decision: 'like',
          strength: 1.0,
        };

        mockDb.runAsync.mockResolvedValue({ changes: 1 });

        const result = await createSwipeEvent(mockDb as any, input);

        expect(result).toBe('event-1');
        expect(mockDb.runAsync).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO swipe_events'),
          expect.arrayContaining(['event-1', 'session-1', 'movie-1', 'like', 1.0])
        );
      });
    });

    describe('listSwipeEvents', () => {
      it('should filter by session', async () => {
        const sessionEvents = testSwipeEvents.filter(e => e.session_id === 'session-1');
        mockDb.getAllAsync.mockResolvedValue(sessionEvents);

        const result = await listSwipeEvents(mockDb as any, {
          session_id: 'session-1',
        });

        expect(result.every(e => e.session_id === 'session-1')).toBe(true);
      });

      it('should filter by decision type', async () => {
        const likes = testSwipeEvents.filter(e => e.decision === 'like');
        mockDb.getAllAsync.mockResolvedValue(likes);

        await listSwipeEvents(mockDb as any, { decision: 'like' });

        expect(mockDb.getAllAsync).toHaveBeenCalledWith(
          expect.stringContaining('decision = ?'),
          expect.arrayContaining(['like'])
        );
      });
    });

    describe('countSwipeEventsByDecision', () => {
      it('should return counts for each decision type', async () => {
        mockDb.getAllAsync.mockResolvedValue([
          { decision: 'like', count: 5 },
          { decision: 'dislike', count: 3 },
          { decision: 'skip', count: 2 },
          { decision: 'super_like', count: 2 },
        ]);

        const result = await countSwipeEventsByDecision(mockDb as any);

        expect(result.like).toBe(5);
        expect(result.dislike).toBe(3);
        expect(result.skip).toBe(2);
        expect(result.super_like).toBe(2);
      });

      it('should return zeros for missing decisions', async () => {
        mockDb.getAllAsync.mockResolvedValue([
          { decision: 'like', count: 1 },
        ]);

        const result = await countSwipeEventsByDecision(mockDb as any);

        expect(result.dislike).toBe(0);
        expect(result.skip).toBe(0);
      });
    });

    describe('getSwipeEventsWithMedia', () => {
      it('should return events with joined media data', async () => {
        const eventsWithMedia = testSwipeEvents.map(e => ({
          ...e,
          media_title: 'Some Title',
          media_type: 'movie',
          media_tags_json: '["action"]',
          media_popularity_score: 0.8,
        }));
        mockDb.getAllAsync.mockResolvedValue(eventsWithMedia);

        const result = await getSwipeEventsWithMedia(mockDb as any);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('media_title');
        expect(result[0]).toHaveProperty('media_tags_json');
      });
    });
  });
});

