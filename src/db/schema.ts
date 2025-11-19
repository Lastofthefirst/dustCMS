import { Database } from 'bun:sqlite';

export function initSystemDb(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS super_admin (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenants (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      password_plaintext TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Migration: Add password_plaintext column if it doesn't exist
  try {
    db.exec(`ALTER TABLE tenants ADD COLUMN password_plaintext TEXT;`);
  } catch (e) {
    // Column already exists, ignore error
  }
}

export function initTenantDb(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_models (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('collection', 'singleton')),
      fields TEXT NOT NULL
    );
  `);
}

export function createContentTable(db: Database, modelSlug: string, fields: any[]) {
  const columns = fields
    .map(f => `${f.name} TEXT${f.required ? ' NOT NULL' : ''}`)
    .join(', ');

  db.exec(`
    CREATE TABLE IF NOT EXISTS content_${modelSlug} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ${columns}
    );
  `);
}
