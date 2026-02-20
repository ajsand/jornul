/**
 * Themes Repository - CRUD for themes + theme_members tables
 */

import * as SQLite from 'expo-sqlite';
import {
  Theme,
  ThemeWithTags,
  CreateThemeInput,
  UpdateThemeInput,
  ListThemesFilters,
  Tag,
  TagSource,
  TagKind,
} from '../types';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createTheme(
  db: SQLite.SQLiteDatabase,
  input: CreateThemeInput
): Promise<string> {
  const now = Date.now();
  const slug = input.slug ?? generateSlug(input.name);
  await db.runAsync(
    `INSERT INTO themes (id, name, slug, description, item_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?)`,
    [input.id, input.name, slug, input.description ?? null, now, now]
  );
  return input.id;
}

export async function getTheme(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<Theme | null> {
  return db.getFirstAsync<Theme>('SELECT * FROM themes WHERE id = ?', [id]);
}

export async function getThemeBySlug(
  db: SQLite.SQLiteDatabase,
  slug: string
): Promise<Theme | null> {
  return db.getFirstAsync<Theme>('SELECT * FROM themes WHERE slug = ?', [slug]);
}

export async function updateTheme(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: UpdateThemeInput
): Promise<boolean> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
    // Auto-regenerate slug when name changes but new slug not supplied
    if (updates.slug === undefined) {
      fields.push('slug = ?');
      values.push(generateSlug(updates.name));
    }
  }
  if (updates.slug !== undefined) {
    fields.push('slug = ?');
    values.push(updates.slug);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.item_count !== undefined) {
    fields.push('item_count = ?');
    values.push(updates.item_count);
  }

  if (fields.length === 0) return false;

  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  const result = await db.runAsync(
    `UPDATE themes SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.changes > 0;
}

export async function deleteTheme(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<boolean> {
  const result = await db.runAsync('DELETE FROM themes WHERE id = ?', [id]);
  return result.changes > 0;
}

export async function listThemes(
  db: SQLite.SQLiteDatabase,
  filters?: ListThemesFilters
): Promise<Theme[]> {
  const VALID_ORDER_BY = ['created_at', 'updated_at', 'item_count', 'name'];
  const orderBy = filters?.orderBy ?? 'created_at';
  const orderDirection = filters?.orderDirection ?? 'DESC';

  if (!VALID_ORDER_BY.includes(orderBy)) {
    throw new Error(`Invalid orderBy: ${orderBy}`);
  }

  let query = `SELECT * FROM themes ORDER BY ${orderBy} ${orderDirection}`;
  const params: (string | number | null)[] = [];

  if (filters?.limit !== undefined) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }
  if (filters?.offset !== undefined) {
    query += ' OFFSET ?';
    params.push(filters.offset);
  }

  return db.getAllAsync<Theme>(query, params);
}

export async function getThemeWithTags(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<ThemeWithTags | null> {
  const theme = await getTheme(db, id);
  if (!theme) return null;

  type RawThemeTag = {
    id: number;
    name: string;
    slug: string | null;
    kind: string;
    created_at: number;
    updated_at: number | null;
    confidence: number | null;
    source: string;
  };
  const tags = await db.getAllAsync<RawThemeTag>(
    `SELECT t.id, t.name, t.slug, t.kind, t.created_at, t.updated_at,
            NULL as confidence, 'user' as source
     FROM tags t
     INNER JOIN theme_members tm ON t.id = tm.tag_id
     WHERE tm.theme_id = ?
     ORDER BY t.name`,
    [id]
  );

  return {
    ...theme,
    tags: tags.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      kind: (t.kind as TagKind) || 'manual',
      created_at: t.created_at,
      updated_at: t.updated_at,
      confidence: t.confidence,
      source: t.source as TagSource,
    })),
  };
}

export async function addTagToTheme(
  db: SQLite.SQLiteDatabase,
  theme_id: string,
  tag_id: number
): Promise<void> {
  const now = Date.now();
  await db.runAsync(
    'INSERT OR IGNORE INTO theme_members (theme_id, tag_id, created_at) VALUES (?, ?, ?)',
    [theme_id, tag_id, now]
  );
}

export async function removeTagFromTheme(
  db: SQLite.SQLiteDatabase,
  theme_id: string,
  tag_id: number
): Promise<boolean> {
  const result = await db.runAsync(
    'DELETE FROM theme_members WHERE theme_id = ? AND tag_id = ?',
    [theme_id, tag_id]
  );
  return result.changes > 0;
}

export async function getTagsForTheme(
  db: SQLite.SQLiteDatabase,
  theme_id: string
): Promise<Tag[]> {
  return db.getAllAsync<Tag>(
    `SELECT t.* FROM tags t
     INNER JOIN theme_members tm ON t.id = tm.tag_id
     WHERE tm.theme_id = ?
     ORDER BY t.name`,
    [theme_id]
  );
}

export async function getThemesForTag(
  db: SQLite.SQLiteDatabase,
  tag_id: number
): Promise<Theme[]> {
  return db.getAllAsync<Theme>(
    `SELECT th.* FROM themes th
     INNER JOIN theme_members tm ON th.id = tm.theme_id
     WHERE tm.tag_id = ?
     ORDER BY th.name`,
    [tag_id]
  );
}

export async function countThemes(db: SQLite.SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM themes'
  );
  return result?.count ?? 0;
}
