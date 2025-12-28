import * as SQLite from 'expo-sqlite';

// Migration definitions
const migrations: { [version: number]: string } = {
  1: `
    -- Schema migrations tracking
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );

    -- Media items (core content)
    CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('text', 'image', 'audio', 'video', 'pdf', 'url')),
      title TEXT,
      source_url TEXT,
      local_uri TEXT,
      notes TEXT,
      extracted_text TEXT,
      metadata_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_media_items_type ON media_items(type);
    CREATE INDEX IF NOT EXISTS idx_media_items_created_at ON media_items(created_at);
    CREATE INDEX IF NOT EXISTS idx_media_items_updated_at ON media_items(updated_at);

    -- Tags (normalized, no duplicates)
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

    -- Item-tag relationships (many-to-many)
    CREATE TABLE IF NOT EXISTS item_tags (
      item_id TEXT NOT NULL,
      tag_id INTEGER NOT NULL,
      confidence REAL CHECK(confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0)),
      source TEXT NOT NULL CHECK(source IN ('heuristic', 'ml', 'user')),
      created_at INTEGER NOT NULL,
      PRIMARY KEY (item_id, tag_id),
      FOREIGN KEY (item_id) REFERENCES media_items(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_item_tags_item_id ON item_tags(item_id);
    CREATE INDEX IF NOT EXISTS idx_item_tags_tag_id ON item_tags(tag_id);

    -- Journal entries (optional rich metadata)
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      media_item_id TEXT NOT NULL,
      entry_date INTEGER,
      mood TEXT,
      location TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (media_item_id) REFERENCES media_items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_media_item_id ON journal_entries(media_item_id);

    -- Swipe signals (user preference learning)
    CREATE TABLE IF NOT EXISTS swipe_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_item_id TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('like', 'dislike')),
      category TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (media_item_id) REFERENCES media_items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_swipe_signals_item_id ON swipe_signals(media_item_id);
    CREATE INDEX IF NOT EXISTS idx_swipe_signals_direction ON swipe_signals(direction);

    -- Compare sessions (social/AI comparison feature)
    CREATE TABLE IF NOT EXISTS compare_sessions (
      id TEXT PRIMARY KEY,
      mode TEXT NOT NULL CHECK(mode IN ('friend', 'heart')),
      scope_filters TEXT,
      provider TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_compare_sessions_mode ON compare_sessions(mode);
    CREATE INDEX IF NOT EXISTS idx_compare_sessions_created_at ON compare_sessions(created_at);

    -- Compare session items (what was shared in session)
    CREATE TABLE IF NOT EXISTS compare_session_items (
      session_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      share_level TEXT NOT NULL CHECK(share_level IN ('title', 'snippet', 'full')),
      created_at INTEGER NOT NULL,
      PRIMARY KEY (session_id, item_id),
      FOREIGN KEY (session_id) REFERENCES compare_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES media_items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_compare_session_items_session_id ON compare_session_items(session_id);

    -- User metadata (for app preferences)
    CREATE TABLE IF NOT EXISTS user_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `,
  2: `
    -- Ingest queue for Quick Add feature
    CREATE TABLE IF NOT EXISTS ingest_queue (
      id TEXT PRIMARY KEY,
      source_type TEXT NOT NULL CHECK(source_type IN ('text', 'url', 'file')),
      raw_content TEXT,
      file_uri TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'ready', 'failed')) DEFAULT 'pending',
      error_message TEXT,
      media_item_id TEXT,
      created_at INTEGER NOT NULL,
      processed_at INTEGER,
      FOREIGN KEY (media_item_id) REFERENCES media_items(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ingest_queue_status ON ingest_queue(status);
    CREATE INDEX IF NOT EXISTS idx_ingest_queue_created_at ON ingest_queue(created_at);
  `,
  3: `
    -- Enhanced media metadata for richer item info
    CREATE TABLE IF NOT EXISTS media_meta (
      item_id TEXT PRIMARY KEY,
      duration_ms INTEGER,
      width INTEGER,
      height INTEGER,
      exif_json TEXT,
      ocr_status TEXT CHECK(ocr_status IS NULL OR ocr_status IN ('pending', 'processing', 'done', 'failed', 'skipped')),
      asr_status TEXT CHECK(asr_status IS NULL OR asr_status IN ('pending', 'processing', 'done', 'failed', 'skipped')),
      source_domain TEXT,
      extra_json TEXT,
      FOREIGN KEY (item_id) REFERENCES media_items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_media_meta_ocr_status ON media_meta(ocr_status);
    CREATE INDEX IF NOT EXISTS idx_media_meta_asr_status ON media_meta(asr_status);
    CREATE INDEX IF NOT EXISTS idx_media_meta_source_domain ON media_meta(source_domain);

    -- Enhanced tags with kind field for emergent/manual/system distinction
    ALTER TABLE tags ADD COLUMN slug TEXT;
    ALTER TABLE tags ADD COLUMN kind TEXT DEFAULT 'manual' CHECK(kind IN ('emergent', 'manual', 'system'));
    ALTER TABLE tags ADD COLUMN updated_at INTEGER;

    -- Create unique index on slug after adding column
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

    -- Jobs table for background processing queue
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'done', 'failed', 'cancelled')),
      payload_json TEXT,
      progress REAL DEFAULT 0 CHECK(progress >= 0 AND progress <= 1),
      error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_kind ON jobs(kind);
    CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

    -- Swipe media catalog (external content for swipe deck)
    CREATE TABLE IF NOT EXISTS swipe_media (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      image_url TEXT,
      short_desc TEXT,
      long_desc TEXT,
      source TEXT,
      tags_json TEXT,
      popularity_score REAL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_swipe_media_type ON swipe_media(type);
    CREATE INDEX IF NOT EXISTS idx_swipe_media_source ON swipe_media(source);
    CREATE INDEX IF NOT EXISTS idx_swipe_media_popularity ON swipe_media(popularity_score);

    -- Swipe sessions for grouping swipe events
    CREATE TABLE IF NOT EXISTS swipe_sessions (
      id TEXT PRIMARY KEY,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      filters_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_swipe_sessions_started_at ON swipe_sessions(started_at);

    -- Swipe events (user decisions on swipe media)
    CREATE TABLE IF NOT EXISTS swipe_events (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      media_id TEXT NOT NULL,
      decision TEXT NOT NULL CHECK(decision IN ('like', 'dislike', 'skip', 'super_like')),
      strength REAL DEFAULT 1.0 CHECK(strength >= 0 AND strength <= 1),
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES swipe_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (media_id) REFERENCES swipe_media(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_swipe_events_session_id ON swipe_events(session_id);
    CREATE INDEX IF NOT EXISTS idx_swipe_events_media_id ON swipe_events(media_id);
    CREATE INDEX IF NOT EXISTS idx_swipe_events_decision ON swipe_events(decision);

    -- Session ledger for AI/cloud session tracking
    CREATE TABLE IF NOT EXISTS session_ledger (
      id TEXT PRIMARY KEY,
      started_at INTEGER NOT NULL,
      mode TEXT NOT NULL,
      provider TEXT,
      excerpt_counts_json TEXT,
      sensitive_included INTEGER DEFAULT 0,
      token_estimate INTEGER,
      cost_estimate_cents INTEGER,
      ended_at INTEGER,
      result_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_session_ledger_started_at ON session_ledger(started_at);
    CREATE INDEX IF NOT EXISTS idx_session_ledger_mode ON session_ledger(mode);
    CREATE INDEX IF NOT EXISTS idx_session_ledger_provider ON session_ledger(provider);
  `,
};

/**
 * Check if a table exists in the database
 */
async function tableExists(db: SQLite.SQLiteDatabase, tableName: string): Promise<boolean> {
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?",
    [tableName]
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Get the current schema version
 */
async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const hasMigrationsTable = await tableExists(db, 'schema_migrations');
  if (!hasMigrationsTable) {
    return 0;
  }

  const result = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM schema_migrations'
  );
  return result?.version ?? 0;
}

/**
 * Mark a migration as applied
 */
async function recordMigration(db: SQLite.SQLiteDatabase, version: number): Promise<void> {
  await db.runAsync(
    'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
    [version, Date.now()]
  );
}

/**
 * Migrate data from old journal_items table if it exists
 */
async function migrateOldData(db: SQLite.SQLiteDatabase): Promise<void> {
  const hasOldTable = await tableExists(db, 'journal_items');
  if (!hasOldTable) {
    console.log('No old journal_items table found, skipping data migration');
    return;
  }

  console.log('Migrating data from journal_items to new schema...');

  // Get all old items
  const oldItems = await db.getAllAsync<any>('SELECT * FROM journal_items');

  for (const oldItem of oldItems) {
    // Insert into media_items
    await db.runAsync(
      `INSERT OR IGNORE INTO media_items 
       (id, type, title, source_url, local_uri, notes, extracted_text, metadata_json, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        oldItem.id,
        oldItem.type,
        null, // old schema didn't have title
        null, // old schema didn't have source_url
        oldItem.raw_path,
        null, // old schema didn't have notes
        oldItem.clean_text,
        null, // old schema didn't have metadata_json
        oldItem.created_at,
        oldItem.created_at, // use created_at as updated_at
      ]
    );

    // Migrate tags from JSON array to normalized tables
    if (oldItem.tags) {
      let tagNames: string[] = [];
      try {
        tagNames = JSON.parse(oldItem.tags);
      } catch (e) {
        console.warn(`Failed to parse tags for item ${oldItem.id}:`, e);
        continue;
      }

      for (const tagName of tagNames) {
        // Insert tag if not exists
        await db.runAsync(
          'INSERT OR IGNORE INTO tags (name, created_at) VALUES (?, ?)',
          [tagName, Date.now()]
        );

        // Get tag id
        const tag = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM tags WHERE name = ?',
          [tagName]
        );

        if (tag) {
          // Create item-tag relationship (all migrated tags are user-created)
          await db.runAsync(
            `INSERT OR IGNORE INTO item_tags 
             (item_id, tag_id, confidence, source, created_at) 
             VALUES (?, ?, ?, ?, ?)`,
            [oldItem.id, tag.id, null, 'user', Date.now()]
          );
        }
      }
    }
  }

  // Rename old table as backup
  await db.execAsync('ALTER TABLE journal_items RENAME TO journal_items_backup;');
  console.log(`✓ Successfully migrated ${oldItems.length} items from old schema`);
  console.log('  Old data backed up to journal_items_backup table');
  console.log('  To clean up backup later: DROP TABLE journal_items_backup;');
}

/**
 * Run all pending migrations
 */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('Checking for pending migrations...');

  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const currentVersion = await getCurrentVersion(db);
  const latestVersion = Math.max(...Object.keys(migrations).map(Number));

  if (currentVersion >= latestVersion) {
    console.log(`Database is up to date (version ${currentVersion})`);
    return;
  }

  console.log(`Current version: ${currentVersion}, Latest version: ${latestVersion}`);

  // Apply each pending migration
  for (let version = currentVersion + 1; version <= latestVersion; version++) {
    const sql = migrations[version];
    if (!sql) {
      throw new Error(`Migration ${version} not found`);
    }

    console.log(`Applying migration ${version}...`);
    await db.execAsync(sql);
    await recordMigration(db, version);
    console.log(`Migration ${version} applied successfully`);
  }

  // After all migrations, check for old data to migrate
  if (currentVersion === 0) {
    await migrateOldData(db);
  }

  console.log('All migrations completed');
}

