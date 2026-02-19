# Database Migration Verification Guide

## Quick Verification Steps

### 1. Fresh Install (No Existing Data)
```bash
# Clear app data first
npx expo start --clear

# Watch console for:
✓ "Database initialized successfully"
✓ "Current version: 0, Latest version: 1"
✓ "Applying migration 1..."
✓ "Migration 1 applied successfully"
✓ "No old journal_items table found, skipping data migration"
✓ "All migrations completed"
```

### 2. With Existing Data (Old Schema)
```bash
# If you had the old schema, watch for:
✓ "Migrating data from journal_items to new schema..."
✓ "Successfully migrated X items from old schema"
✓ "Old data backed up to journal_items_backup table"
```

### 3. Test Basic Operations

#### A. Create Entry
1. Tap the **+** button (bottom right)
2. Enter text: "Test entry for new database"
3. Enter tags: "test, database, migration"
4. Tap **Save Entry**
5. Should return to home screen with entry visible

#### B. View Entry
1. Tap on the entry you just created
2. Should see full detail view with:
   - Date and time
   - Full text content
   - Tags displayed as chips
   - Entry metadata (type, word count)

#### C. Filter by Tag
1. On home screen, tap a tag chip (e.g., "test")
2. Should see only entries with that tag
3. Tag chip should be highlighted
4. Tap again to deselect

#### D. Verify Database Persistence
1. Close the app completely
2. Reopen the app
3. Should see all previously created entries
4. No migration messages (already at version 1)

### 4. Verify Legacy Compatibility

If you have code using old API, it should still work:

```typescript
import { db } from '@/lib/storage/db';

// Old API (still works)
await db.insertItem({ 
  id: 'test', 
  type: 'text', 
  clean_text: 'Hello', 
  tags: ['test'] 
});
const items = await db.queryAllItems();
const item = await db.getItem('test');
const tags = await db.getAllTags();

// New API (recommended)
await db.createMediaItem({ 
  id: 'test', 
  type: 'text', 
  notes: 'Hello' 
});
const items = await db.listMediaItems();
const item = await db.getMediaItem('test');
const tags = await db.listTags();
```

## Console Checks

### Success Indicators
- ✅ No "Database initialization failed" errors
- ✅ No "Migration failed" errors  
- ✅ All tables created (check with test script)
- ✅ Entries persist across app restarts
- ✅ Tag filtering works correctly

### Warning Signs
- ⚠️ "Database not initialized" - Call `db.init()` first
- ⚠️ "Failed to load data" - Check database file permissions
- ⚠️ Foreign key constraint errors - Check migration order

## Testing Script

Add this to any component to run comprehensive tests:

```typescript
import { testDatabase } from '@/lib/storage/test-db';
import { useEffect } from 'react';

useEffect(() => {
  testDatabase().then(result => {
    if (result.success) {
      console.log('✅ All database tests passed!');
    } else {
      console.error('❌ Tests failed:', result.message);
    }
  });
}, []);
```

## Advanced Verification (Optional)

### Check Schema via SQLite Inspector

**iOS Simulator:**
```bash
xcrun simctl get_app_container booted com.yourapp.id data
cd Documents
sqlite3 journallink.db
```

**Android Emulator:**
```bash
adb shell
run-as com.yourapp.id
cd databases
sqlite3 journallink.db
```

**SQL Commands:**
```sql
-- List all tables
.tables

-- Check migration version
SELECT * FROM schema_migrations;

-- Count items
SELECT COUNT(*) FROM media_items;

-- List tags with usage
SELECT t.name, COUNT(it.item_id) as count 
FROM tags t 
LEFT JOIN item_tags it ON t.id = it.tag_id 
GROUP BY t.id;

-- Verify foreign keys enabled
PRAGMA foreign_keys;  -- Should return 1
```

## Rollback (Emergency Only)

If something goes catastrophically wrong:

```typescript
// Delete database and start fresh
import * as FileSystem from 'expo-file-system';

const dbPath = `${FileSystem.documentDirectory}SQLite/journallink.db`;
await FileSystem.deleteAsync(dbPath, { idempotent: true });

// Restart app to reinitialize
```

## Known Issues & Workarounds

### Issue: "Foreign key constraint failed"
**Cause:** Trying to attach tag to non-existent item  
**Fix:** Always create media item before attaching tags

### Issue: Migration runs on every app start
**Cause:** schema_migrations table corrupted  
**Fix:** Check `SELECT * FROM schema_migrations;` - should show version 1

### Issue: Old entries not visible
**Cause:** Migration didn't run  
**Fix:** Check console for "Migrating data from journal_items..." message

## Support

If tests fail, check:
1. Console logs for detailed error messages
2. `expo-sqlite` version (should be ^15.2.14)
3. Database file exists in DocumentDirectory
4. No TypeScript/linter errors in storage layer






























