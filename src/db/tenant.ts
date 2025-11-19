import { Database } from 'bun:sqlite';
import { join } from 'path';
import { config } from '../config';
import { initTenantDb, createContentTable } from './schema';
import type { ContentModel, ContentItem } from '../models/types';

const tenantDbs: Map<string, Database> = new Map();

export function getTenantDb(tenantSlug: string): Database {
  if (!tenantDbs.has(tenantSlug)) {
    const dbPath = join(config.dataDir, 'tenants', tenantSlug, 'content.db');
    const db = new Database(dbPath);
    initTenantDb(db);
    tenantDbs.set(tenantSlug, db);
  }
  return tenantDbs.get(tenantSlug)!;
}

export function getContentModels(tenantSlug: string): ContentModel[] {
  const db = getTenantDb(tenantSlug);
  const rows = db.prepare('SELECT * FROM content_models ORDER BY name').all() as any[];
  return rows.map(row => ({
    ...row,
    fields: JSON.parse(row.fields)
  }));
}

export function getContentModel(tenantSlug: string, modelSlug: string): ContentModel | null {
  const db = getTenantDb(tenantSlug);
  const row = db.prepare('SELECT * FROM content_models WHERE slug = ?').get(modelSlug) as any;
  if (!row) return null;
  return {
    ...row,
    fields: JSON.parse(row.fields)
  };
}

export function createContentModel(tenantSlug: string, model: ContentModel) {
  const db = getTenantDb(tenantSlug);
  const fieldsJson = JSON.stringify(model.fields);

  db.prepare('INSERT INTO content_models (slug, name, type, fields) VALUES (?, ?, ?, ?)').run(
    model.slug,
    model.name,
    model.type,
    fieldsJson
  );

  // Create content table for collections
  if (model.type === 'collection') {
    createContentTable(db, model.slug, model.fields);
  } else {
    // For singletons, create a simple table
    const columns = model.fields
      .map(f => `${f.name} TEXT`)
      .join(', ');
    db.exec(`
      CREATE TABLE IF NOT EXISTS content_${model.slug} (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        ${columns}
      );
    `);
  }
}

export function updateContentModel(tenantSlug: string, modelSlug: string, updates: Partial<ContentModel>) {
  const db = getTenantDb(tenantSlug);
  const fieldsJson = updates.fields ? JSON.stringify(updates.fields) : undefined;

  if (updates.name || fieldsJson) {
    const sets: string[] = [];
    const values: any[] = [];

    if (updates.name) {
      sets.push('name = ?');
      values.push(updates.name);
    }
    if (fieldsJson) {
      sets.push('fields = ?');
      values.push(fieldsJson);
    }

    values.push(modelSlug);
    db.prepare(`UPDATE content_models SET ${sets.join(', ')} WHERE slug = ?`).run(...values);
  }
}

export function deleteContentModel(tenantSlug: string, modelSlug: string) {
  const db = getTenantDb(tenantSlug);
  db.prepare('DELETE FROM content_models WHERE slug = ?').run(modelSlug);
  db.exec(`DROP TABLE IF EXISTS content_${modelSlug}`);
}

export function getContentItems(tenantSlug: string, modelSlug: string): ContentItem[] {
  const db = getTenantDb(tenantSlug);
  return db.prepare(`SELECT * FROM content_${modelSlug}`).all() as ContentItem[];
}

export function getContentItem(tenantSlug: string, modelSlug: string, itemId: number): ContentItem | null {
  const db = getTenantDb(tenantSlug);
  const row = db.prepare(`SELECT * FROM content_${modelSlug} WHERE id = ?`).get(itemId) as ContentItem | undefined;
  return row || null;
}

export function getSingletonContent(tenantSlug: string, modelSlug: string): ContentItem | null {
  const db = getTenantDb(tenantSlug);
  const row = db.prepare(`SELECT * FROM content_${modelSlug} WHERE id = 1`).get() as ContentItem | undefined;
  return row || null;
}

export function createContentItem(tenantSlug: string, modelSlug: string, data: ContentItem): number {
  const db = getTenantDb(tenantSlug);
  const fields = Object.keys(data);
  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map(f => data[f]);

  const result = db.prepare(
    `INSERT INTO content_${modelSlug} (${fields.join(', ')}) VALUES (${placeholders})`
  ).run(...values);

  return result.lastInsertRowid as number;
}

export function updateContentItem(tenantSlug: string, modelSlug: string, itemId: number, data: ContentItem) {
  const db = getTenantDb(tenantSlug);
  const fields = Object.keys(data).filter(k => k !== 'id');
  const values = fields.map(k => data[k]);

  if (fields.length > 0) {
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    db.prepare(`UPDATE content_${modelSlug} SET ${setClause} WHERE id = ?`).run(...values, itemId);
  }
}

export function updateSingletonContent(tenantSlug: string, modelSlug: string, data: ContentItem) {
  const db = getTenantDb(tenantSlug);
  const fields = Object.keys(data).filter(k => k !== 'id');
  const values = fields.map(k => data[k]);

  if (fields.length > 0) {
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const existing = db.prepare(`SELECT * FROM content_${modelSlug} WHERE id = 1`).get();

    if (existing) {
      db.prepare(`UPDATE content_${modelSlug} SET ${setClause} WHERE id = 1`).run(...values);
    } else {
      const placeholders = fields.map(() => '?').join(', ');
      db.prepare(
        `INSERT INTO content_${modelSlug} (id, ${fields.join(', ')}) VALUES (1, ${placeholders})`
      ).run(...values);
    }
  }
}

export function deleteContentItem(tenantSlug: string, modelSlug: string, itemId: number) {
  const db = getTenantDb(tenantSlug);
  db.prepare(`DELETE FROM content_${modelSlug} WHERE id = ?`).run(itemId);
}


// Test helper to reset database connections
export function closeTenantDbs() {
  for (const db of tenantDbs.values()) {
    db.close();
  }
  tenantDbs.clear();
}
