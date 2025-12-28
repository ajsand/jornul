/**
 * JournalLink Storage Layer
 * 
 * Main exports for database access and types
 */

// Main database instance
export { db } from './db';

// Repository functions (for advanced use cases)
export * from './repository';

// All types
export * from './types';

// Filesystem utilities
export * from './filesystem';

// Test utilities (development only)
export { testDatabase } from './test-db';





