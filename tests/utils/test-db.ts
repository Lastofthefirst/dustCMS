import { Database } from 'bun:sqlite';
import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { initSystemDb, initTenantDb } from '../../src/db/schema';

const TEST_DATA_DIR = join(process.cwd(), 'tests', 'test-data');

export function getTestDataDir(): string {
  return TEST_DATA_DIR;
}

export function setupTestDataDir() {
  if (existsSync(TEST_DATA_DIR)) {
    rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
  mkdirSync(TEST_DATA_DIR, { recursive: true });
  mkdirSync(join(TEST_DATA_DIR, 'tenants'), { recursive: true });
}

export function cleanupTestDataDir() {
  if (existsSync(TEST_DATA_DIR)) {
    rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
}

export function createTestSystemDb(): Database {
  const dbPath = join(TEST_DATA_DIR, 'system.db');
  const db = new Database(dbPath);
  initSystemDb(db);
  return db;
}

export function createTestTenantDb(tenantSlug: string): Database {
  const tenantDir = join(TEST_DATA_DIR, 'tenants', tenantSlug);
  if (!existsSync(tenantDir)) {
    mkdirSync(tenantDir, { recursive: true });
    mkdirSync(join(tenantDir, 'images'), { recursive: true });
  }

  const dbPath = join(tenantDir, 'content.db');
  const db = new Database(dbPath);
  initTenantDb(db);
  return db;
}

export function closeDb(db: Database) {
  if (db) {
    db.close();
  }
}
