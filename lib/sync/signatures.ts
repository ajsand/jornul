import { db } from '../storage/db';
import { DeviceSignature, SyncResult, SwipeSummary } from './types';
import { cosineSimilarity } from '../ai/embeddings';
import { getRandomQuestions } from '../../utils/questions';
import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';
import * as repos from '../storage/repositories';

export async function getDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync('deviceId');
  if (!deviceId) {
    deviceId = uuidv4();
    await SecureStore.setItemAsync('deviceId', deviceId);
  }
  return deviceId;
}

/**
 * Builds a device signature containing:
 * - Top tags from journal entries
 * - Swipe summary statistics
 * - Recent topics from liked/favorited items
 */
export async function buildSignature(): Promise<DeviceSignature> {
  const deviceId = await getDeviceId();
  const sessionToken = uuidv4().slice(0, 8); // Short ephemeral token
  
  let topTags: string[] = [];
  let swipeSummary: SwipeSummary = {
    totalLikes: 0,
    totalDislikes: 0,
    totalFavorites: 0,
    totalSkips: 0,
  };
  let recentTopics: string[] = [];
  
  try {
    await db.init();
    const rawDb = db.getRawDb();
    
    // Get top tags from journal entries
    topTags = await db.getTopTags(10);
    
    // Get swipe summary statistics
    const swipeCounts = await repos.countSwipeEventsByDecision(rawDb);
    swipeSummary = {
      totalLikes: swipeCounts.like || 0,
      totalDislikes: swipeCounts.dislike || 0,
      totalFavorites: swipeCounts.super_like || 0,
      totalSkips: swipeCounts.skip || 0,
    };
    
    // Get recent topics from liked/favorited items
    const recentLikedEvents = await repos.getSwipeEventsWithMedia(rawDb, { limit: 20 });
    const likedEvents = recentLikedEvents.filter(
      e => e.decision === 'like' || e.decision === 'super_like'
    );
    
    // Extract tags from liked items
    const topicCounts = new Map<string, number>();
    for (const event of likedEvents) {
      if (event.media_tags_json) {
        try {
          const tags: string[] = JSON.parse(event.media_tags_json);
          for (const tag of tags) {
            topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
    
    // Sort by frequency and take top 8
    recentTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([topic]) => topic);
      
  } catch (error) {
    console.warn('Failed to get database data for signature, using defaults:', error);
    // Use mock data for demonstration
    topTags = ['thoughts', 'daily', 'reflection'];
    recentTopics = ['ideas', 'personal'];
  }
  
  return {
    deviceId,
    topTags,
    swipeSummary,
    recentTopics,
    timestamp: Date.now(),
    sessionToken,
  };
}

export function compare(sigA: DeviceSignature, sigB: DeviceSignature): SyncResult {
  // Calculate shared tags from both topTags and recentTopics
  const allTagsA = new Set([...sigA.topTags, ...sigA.recentTopics]);
  const allTagsB = new Set([...sigB.topTags, ...sigB.recentTopics]);
  
  const sharedTags = [...allTagsA].filter(tag => allTagsB.has(tag));
  
  // Calculate similarity based on shared interests
  // Use Jaccard similarity on combined tags
  const unionSize = new Set([...allTagsA, ...allTagsB]).size;
  const intersectionSize = sharedTags.length;
  const similarityScore = unionSize > 0 ? intersectionSize / unionSize : 0;
  
  // Get random questions
  const questions = getRandomQuestions(3);
  
  return {
    sharedTags,
    similarityScore: Math.round(similarityScore * 100),
    questions,
  };
}

/**
 * Compress signature to a compact JSON string suitable for QR codes
 * Uses short keys to reduce size
 */
export function compressSignature(signature: DeviceSignature): string {
  return JSON.stringify({
    d: signature.deviceId,
    t: signature.topTags,
    s: {
      l: signature.swipeSummary.totalLikes,
      dl: signature.swipeSummary.totalDislikes,
      f: signature.swipeSummary.totalFavorites,
      sk: signature.swipeSummary.totalSkips,
    },
    r: signature.recentTopics,
    ts: signature.timestamp,
    st: signature.sessionToken,
  });
}

/**
 * Decompress signature from compact JSON format
 */
export function decompressSignature(compressed: string): DeviceSignature {
  const data = JSON.parse(compressed);
  return {
    deviceId: data.d,
    topTags: data.t || [],
    swipeSummary: {
      totalLikes: data.s?.l || 0,
      totalDislikes: data.s?.dl || 0,
      totalFavorites: data.s?.f || 0,
      totalSkips: data.s?.sk || 0,
    },
    recentTopics: data.r || [],
    timestamp: data.ts,
    sessionToken: data.st,
  };
}

/**
 * Validate a decompressed signature has required fields
 */
export function isValidSignature(sig: any): sig is DeviceSignature {
  return (
    typeof sig === 'object' &&
    typeof sig.deviceId === 'string' &&
    Array.isArray(sig.topTags) &&
    typeof sig.timestamp === 'number'
  );
}