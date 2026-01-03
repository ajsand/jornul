/**
 * Swipe Catalog Seeder
 * Seeds the swipe_media table with initial catalog data on first run
 */

import * as SQLite from 'expo-sqlite';
import * as repos from '@/lib/storage/repositories';
import { SEED_CATALOG } from '@/lib/data/swipeCatalog';

/**
 * Check if catalog is already seeded
 */
export async function isCatalogSeeded(db: SQLite.SQLiteDatabase): Promise<boolean> {
  const count = await repos.countSwipeMedia(db);
  return count > 0;
}

/**
 * Seed the swipe catalog with initial data
 */
export async function seedSwipeCatalog(db: SQLite.SQLiteDatabase): Promise<number> {
  const alreadySeeded = await isCatalogSeeded(db);
  if (alreadySeeded) {
    console.log('[SwipeCatalogSeeder] Catalog already seeded, skipping');
    return 0;
  }

  console.log(`[SwipeCatalogSeeder] Seeding ${SEED_CATALOG.length} items...`);

  let seeded = 0;
  for (const item of SEED_CATALOG) {
    try {
      await repos.createSwipeMedia(db, {
        id: item.id,
        title: item.title,
        type: item.type,
        short_desc: item.short_desc,
        long_desc: item.long_desc,
        tags_json: JSON.stringify(item.tags),
        popularity_score: item.popularity_score,
      });
      seeded++;
    } catch (error) {
      console.warn(`[SwipeCatalogSeeder] Failed to seed ${item.id}:`, error);
    }
  }

  console.log(`[SwipeCatalogSeeder] Seeded ${seeded} items`);
  return seeded;
}

/**
 * Ensure catalog is seeded (call on app init)
 */
export async function ensureCatalogSeeded(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await seedSwipeCatalog(db);
  } catch (error) {
    console.error('[SwipeCatalogSeeder] Failed to seed catalog:', error);
  }
}
