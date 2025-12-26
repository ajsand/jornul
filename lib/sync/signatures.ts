import { db } from '../storage/db';
import { DeviceSignature, SyncResult } from './types';
import { cosineSimilarity } from '../ai/embeddings';
import { getRandomQuestions } from '../../utils/questions';
import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';

export async function getDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync('deviceId');
  if (!deviceId) {
    deviceId = uuidv4();
    await SecureStore.setItemAsync('deviceId', deviceId);
  }
  return deviceId;
}

export async function buildSignature(): Promise<DeviceSignature> {
  const deviceId = await getDeviceId();
  
  let topTags: string[] = [];
  let avgEmbed: number[] = new Array(128).fill(0);
  
  try {
    await db.init();
    topTags = await db.getTopTags(10);
    avgEmbed = await db.getAverageEmbedding() || new Array(128).fill(0);
  } catch (error) {
    console.warn('Failed to get database data for signature, using defaults:', error);
    // Use mock data for demonstration
    topTags = ['thoughts', 'daily', 'reflection'];
    avgEmbed = new Array(128).fill(0).map(() => Math.random() * 0.1);
  }
  
  return {
    deviceId,
    topTags,
    avgEmbed,
    timestamp: Date.now(),
  };
}

export function compare(sigA: DeviceSignature, sigB: DeviceSignature): SyncResult {
  // Calculate shared tags
  const sharedTags = sigA.topTags.filter(tag => sigB.topTags.includes(tag));
  
  // Calculate cosine similarity
  const similarityScore = Math.max(0, Math.min(1, cosineSimilarity(sigA.avgEmbed, sigB.avgEmbed)));
  
  // Get random questions
  const questions = getRandomQuestions(3);
  
  return {
    sharedTags,
    similarityScore: Math.round(similarityScore * 100),
    questions,
  };
}

export function compressSignature(signature: DeviceSignature): string {
  // Simple JSON compression for MVP
  // TODO: Implement proper compression for production
  return JSON.stringify({
    d: signature.deviceId,
    t: signature.topTags,
    e: signature.avgEmbed.map(v => Math.round(v * 1000) / 1000), // Reduce precision
    ts: signature.timestamp,
  });
}

export function decompressSignature(compressed: string): DeviceSignature {
  const data = JSON.parse(compressed);
  return {
    deviceId: data.d,
    topTags: data.t,
    avgEmbed: data.e,
    timestamp: data.ts,
  };
}