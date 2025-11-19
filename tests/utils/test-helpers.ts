import { createServer } from '../../src/server';
import type { Elysia } from 'elysia';
import { config } from '../../src/config';
import { setupTestDataDir, cleanupTestDataDir, getTestDataDir } from './test-db';
import { createSuperAdmin, createSession } from '../../src/db/system';
import { hashPassword } from '../../src/services/auth';

export async function setupTestEnvironment() {
  // Override config for testing
  config.dataDir = getTestDataDir();
  config.nodeEnv = 'test';
  config.sessionSecret = 'test-secret';

  // Setup test data directory
  setupTestDataDir();
}

export function cleanupTestEnvironment() {
  // Close all database connections
  try {
    const { closeSystemDb } = require('../../src/db/system');
    const { closeTenantDbs } = require('../../src/db/tenant');
    closeSystemDb();
    closeTenantDbs();
  } catch (e) {
    // Ignore errors if modules aren't loaded yet
  }

  cleanupTestDataDir();
}

export function createTestApp(): Elysia {
  return createServer();
}

export async function createTestSuperAdmin(email: string = 'admin@test.com', password: string = 'testpass123'): Promise<string> {
  const passwordHash = await hashPassword(password);
  createSuperAdmin(email, passwordHash);
  return createSession(email);
}

export async function makeAuthenticatedRequest(
  app: Elysia,
  method: string,
  path: string,
  options?: {
    body?: any;
    headers?: Record<string, string>;
    sessionToken?: string;
  }
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (options?.sessionToken) {
    headers['Cookie'] = `session=${options.sessionToken}`;
  }

  const req = new Request(`http://localhost:3000${path}`, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  return app.handle(req);
}

export async function makeRequest(
  app: Elysia,
  method: string,
  path: string,
  options?: {
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const req = new Request(`http://localhost:3000${path}`, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  return app.handle(req);
}

export function expectStatus(response: Response, expectedStatus: number) {
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
  }
}

export async function expectJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Expected JSON response, got: ${text}`);
  }
}

export function createMockFile(filename: string, content: string = 'test'): File {
  const blob = new Blob([content], { type: 'image/jpeg' });
  return new File([blob], filename, { type: 'image/jpeg' });
}

export async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
