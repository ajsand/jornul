# JournalLink Storage Layer

Authoritative data layer built with expo-sqlite for local-first storage.

## Architecture

- **Database**: SQLite with WAL mode for concurrency
- **Schema Versioning**: Automatic migrations tracked in `schema_migrations` table
- **Normalized Structure**: Proper many-to-many relationships for tags
- **Type-Safe**: Full TypeScript coverage with runtime types

## Tables

### Core Tables
- `media_items` - All content (text, images, audio, video, PDFs, URLs)
- `tags` - Normalized tag names (no duplicates)
- `item_tags` - Many-to-many relationship with confidence scoring
- `journal_entries` - Optional rich journaling metadata
- `swipe_signals` - User preference learning data
- `compare_sessions` - Social/AI comparison sessions
- `compare_session_items` - Items shared in sessions

### System Tables
- `schema_migrations` - Tracks applied migration versions
- `user_meta` - App preferences (key-value store)

## Usage

### Initialization

```typescript
import { db } from '@/lib/storage';

// Call once on app startup
await db.init();
```

### Create Media Item

```typescript
const itemId = await db.createMediaItem({
  id: 'unique-id',
  type: 'text',
  title: 'My Note',
  notes: 'Content here',
  extracted_text: 'Searchable text',
});
```

### Tag Management

```typescript
// Create or get tag
const tag = await db.upsertTag('important');

// Attach to item with confidence
await db.attachTagToItem(itemId, tag.id, 0.95, 'heuristic');

// User-created tags have null confidence
await db.attachTagToItem(itemId, tag.id, null, 'user');

// List all tags with usage counts
const tags = await db.listTags({ sortBy: 'count' });
```

### Query Items

```typescript
// Get single item with tags
const item = await db.getMediaItem(itemId);
console.log(item?.tags); // Array of tags with confidence/source

// List with filters
const items = await db.listMediaItems({
  type: 'image',
  tags: ['vacation', 'family'],
  minTagConfidence: 0.8,
  dateFrom: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
  searchText: 'beach',
  limit: 20,
  offset: 0,
});

// Update item
await db.updateMediaItem(itemId, {
  notes: 'Updated content',
});

// Delete (cascades to tags, entries, etc.)
await db.deleteMediaItem(itemId);
```

### Swipe Signals

```typescript
// Record user preference
await db.createSwipeSignal({
  media_item_id: itemId,
  direction: 'like',
  category: 'favorites',
});

// Query signals
const signals = await db.listSwipeSignals({
  media_item_id: itemId,
  direction: 'like',
});
```

### Compare Sessions

```typescript
// Create session
const sessionId = await db.createCompareSession({
  id: 'session-123',
  mode: 'friend',
  provider: 'openai',
});

// Add items with privacy levels
await db.addItemToCompareSession(sessionId, itemId, 'snippet');

// Retrieve session with all items
const session = await db.getCompareSession(sessionId);
```

### Journal Entries

```typescript
// Create rich journal metadata
await db.createJournalEntry({
  id: 'entry-123',
  media_item_id: itemId,
  mood: 'happy',
  location: 'Paris',
  entry_date: Date.now(),
});
```

## Migration

The system automatically migrates from the old `journal_items` schema:
- Old items → `media_items`
- JSON tag arrays → normalized `tags` + `item_tags`
- Old table renamed to `journal_items_backup`

## Testing

```typescript
import { testDatabase } from '@/lib/storage/test-db';

// Run comprehensive test suite
const result = await testDatabase();
console.log(result.success ? 'Pass' : 'Fail');
```

## Type Exports

All types available from `@/lib/storage/types`:
- `MediaItem`, `MediaItemWithTags`
- `Tag`, `TagWithCount`
- `ItemTag`, `SwipeSignal`, `CompareSession`, `JournalEntry`
- `CreateMediaItemInput`, `UpdateMediaItemInput`
- `ListMediaItemsFilters`, `ListTagsOptions`
- `MediaType`, `TagSource`, `SwipeDirection`, `CompareMode`, `ShareLevel`

## Edge Cases Handled

✓ Foreign key constraints with cascading deletes  
✓ Unique constraints (tags, primary keys)  
✓ Confidence scoring (0.0-1.0 for ML, null for user)  
✓ Tag source tracking (heuristic | ml | user)  
✓ Offline-first (no network required)  
✓ Concurrent reads (WAL mode)  
✓ Schema versioning for future updates  

## Legacy Compatibility

Deprecated methods maintained for backward compatibility:
- `insertItem()` → `createMediaItem()`
- `queryAllItems()` → `listMediaItems()`
- `queryByTag()` → `listMediaItems({ tags })`
- `getItem()` → `getMediaItem()`
- `getAllTags()` → `listTags()`

New code should use the modern API.




