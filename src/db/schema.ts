import Database from 'better-sqlite3';

export function initSystemDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS super_admin (
      email TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenants (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
}

export function initTenantDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_models (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('collection', 'singleton')),
      fields TEXT NOT NULL
    );
  `);
}

export function createContentTable(db: Database.Database, modelSlug: string, fields: any[]) {
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
