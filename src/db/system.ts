import { Database } from 'bun:sqlite';
import { join } from 'path';
import { config } from '../config';
import { initSystemDb } from './schema';
import type { SuperAdmin, Tenant, Session } from '../models/types';

let systemDb: Database | null = null;

export function getSystemDb(): Database {
  if (!systemDb) {
    const dbPath = join(config.dataDir, 'system.db');
    systemDb = new Database(dbPath);
    initSystemDb(systemDb);
  }
  return systemDb;
}

export function getSuperAdmin(): SuperAdmin | null {
  const db = getSystemDb();
  const row = db.prepare('SELECT * FROM super_admin LIMIT 1').get() as SuperAdmin | undefined;
  return row || null;
}

export function createSuperAdmin(username: string, passwordHash: string) {
  const db = getSystemDb();
  db.prepare('INSERT INTO super_admin (username, password_hash) VALUES (?, ?)').run(username, passwordHash);
}

export function getTenants(): Tenant[] {
  const db = getSystemDb();
  return db.prepare('SELECT * FROM tenants ORDER BY created_at DESC').all() as Tenant[];
}

export function getTenant(slug: string): Tenant | null {
  const db = getSystemDb();
  const row = db.prepare('SELECT * FROM tenants WHERE slug = ?').get(slug) as Tenant | undefined;
  return row || null;
}

export function createTenant(tenant: Omit<Tenant, 'created_at'>): Tenant {
  const db = getSystemDb();
  const now = Date.now();
  db.prepare('INSERT INTO tenants (slug, name, password, created_at) VALUES (?, ?, ?, ?)').run(
    tenant.slug,
    tenant.name,
    tenant.password,
    now
  );
  return { ...tenant, created_at: now };
}

export function updateTenant(slug: string, updates: Partial<Tenant>) {
  const db = getSystemDb();
  const fields = Object.keys(updates).filter(k => k !== 'slug');
  const values = fields.map(k => (updates as any)[k]);

  if (fields.length > 0) {
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    db.prepare(`UPDATE tenants SET ${setClause} WHERE slug = ?`).run(...values, slug);
  }
}

export function deleteTenant(slug: string) {
  const db = getSystemDb();
  db.prepare('DELETE FROM tenants WHERE slug = ?').run(slug);
}

export function createSession(username: string): string {
  const db = getSystemDb();
  const token = crypto.randomUUID();
  const now = Date.now();
  db.prepare('INSERT INTO sessions (token, username, created_at) VALUES (?, ?, ?)').run(token, username, now);
  return token;
}

export function getSession(token: string): Session | null {
  const db = getSystemDb();
  const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as Session | undefined;
  return row || null;
}

export function deleteSession(token: string) {
  const db = getSystemDb();
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// Test helper to reset database connection
export function closeSystemDb() {
  if (systemDb) {
    systemDb.close();
    systemDb = null;
  }
}
