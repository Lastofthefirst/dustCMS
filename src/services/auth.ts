import { getSuperAdmin, createSession, getSession, deleteSession } from '../db/system';

export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

export async function authenticateSuperAdmin(email: string, password: string): Promise<string | null> {
  const admin = getSuperAdmin();
  if (!admin || admin.email !== email) {
    return null;
  }

  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) {
    return null;
  }

  return createSession(email);
}

export function validateSession(token: string): boolean {
  const session = getSession(token);
  return session !== null;
}

export function logout(token: string) {
  deleteSession(token);
}
