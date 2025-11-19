import { getSuperAdmin, createSession, getSession, deleteSession, getTenant } from '../db/system';

export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

export async function authenticateSuperAdmin(username: string, password: string): Promise<string | null> {
  const admin = getSuperAdmin();
  if (!admin || admin.username !== username) {
    return null;
  }

  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) {
    return null;
  }

  return createSession(username);
}

export function validateSession(token: string): boolean {
  const session = getSession(token);
  return session !== null;
}

export function logout(token: string) {
  deleteSession(token);
}

// Tenant authentication
export async function authenticateTenant(tenantSlug: string, username: string, password: string): Promise<string | null> {
  const tenant = getTenant(tenantSlug);
  if (!tenant || tenant.slug !== username) {
    return null;
  }

  const valid = await verifyPassword(password, tenant.password);
  if (!valid) {
    return null;
  }

  return createSession(`tenant:${tenantSlug}`);
}

export function validateTenantSession(token: string, tenantSlug: string): boolean {
  const session = getSession(token);
  return session !== null && session.username === `tenant:${tenantSlug}`;
}
