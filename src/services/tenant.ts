import { mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { config } from '../config';
import { getTenants, getTenant, createTenant as dbCreateTenant, updateTenant as dbUpdateTenant, deleteTenant as dbDeleteTenant } from '../db/system';
import { hashPassword } from './auth';
import type { Tenant } from '../models/types';

export function listTenants(): Tenant[] {
  return getTenants();
}

export function findTenant(slug: string): Tenant | null {
  return getTenant(slug);
}

export async function createTenant(slug: string, name: string, password: string): Promise<Tenant> {
  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('Tenant slug must contain only lowercase letters, numbers, and hyphens');
  }

  // Check if tenant already exists
  if (getTenant(slug)) {
    throw new Error('Tenant with this slug already exists');
  }

  // Create tenant directories
  const tenantDir = join(config.dataDir, 'tenants', slug);
  const imagesDir = join(tenantDir, 'images');

  if (!existsSync(tenantDir)) {
    mkdirSync(tenantDir, { recursive: true });
  }
  if (!existsSync(imagesDir)) {
    mkdirSync(imagesDir, { recursive: true });
  }

  // Hash password before storing
  const passwordHash = await hashPassword(password);

  // Create tenant in database with both hashed and plaintext passwords
  // Plaintext is stored for admin access only (admin dashboard is protected)
  return dbCreateTenant({ slug, name, password: passwordHash, password_plaintext: password });
}

export function updateTenant(slug: string, updates: Partial<Tenant>) {
  dbUpdateTenant(slug, updates);
}

export function deleteTenant(slug: string) {
  // Delete tenant from database
  dbDeleteTenant(slug);

  // Delete tenant directory
  const tenantDir = join(config.dataDir, 'tenants', slug);
  if (existsSync(tenantDir)) {
    rmSync(tenantDir, { recursive: true, force: true });
  }
}
