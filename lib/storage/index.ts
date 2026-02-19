/**
 * JournalLink Storage Layer
 *
 * Main exports for database access and types
 *
 * Usage:
 *   import { db } from '@/lib/storage';
 *   import * as repos from '@/lib/storage/repositories';
 *
 * The recommended pattern is:
 *   await db.init();
 *   const rawDb = db.getRawDb();
 *   await repos.createMediaItem(rawDb, { ... });
 */

// Main database instance
export { db } from './db';

// Modular repositories (preferred)
export * as repos from './repositories';

// Legacy repository (deprecated - use ./repositories instead)
export * from './repository';

// All types
export * from './types';

// Filesystem utilities
export * from './filesystem';

// Test utilities (development only)
export { testDatabase } from './test-db';






























