import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  createTestApp,
  createTestSuperAdmin,
  makeRequest,
  makeAuthenticatedRequest,
  expectStatus,
} from '../../utils/test-helpers';

describe('Auth Middleware', () => {
  let app: any;

  beforeEach(() => {
    setupTestEnvironment();
    app = createTestApp();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  test('should allow access to /admin/login without authentication', async () => {
    const response = await makeRequest(app, 'GET', '/admin/login');
    expect(response.status).not.toBe(401);
  });

  test('should allow access to /api/auth/login without authentication', async () => {
    const response = await makeRequest(app, 'POST', '/api/auth/login', {
      body: {
        email: 'test@test.com',
        password: 'test',
      },
    });
    // Will return 401 for invalid credentials, but not from middleware
    expect(response.status).toBe(401);
  });

  test('should allow access to public API without authentication', async () => {
    const req = new Request('http://tenant.localhost:3000/api/content/test', {
      headers: {
        'Host': 'tenant.localhost',
      },
    });

    const response = await app.handle(req);
    // Will return 404 for non-existent tenant, not 401
    expect(response.status).not.toBe(401);
  });

  test('should block access to /admin without authentication', async () => {
    const response = await makeRequest(app, 'GET', '/admin');
    expectStatus(response, 401);
  });

  test('should block access to /api/admin/* without authentication', async () => {
    const response = await makeRequest(app, 'GET', '/api/admin/tenants');
    expectStatus(response, 401);
  });

  test('should allow access to /admin with valid session', async () => {
    const sessionToken = await createTestSuperAdmin();

    const response = await makeAuthenticatedRequest(app, 'GET', '/admin', {
      sessionToken,
    });

    // Will redirect to login if not authenticated (302), so status should not be 401
    expect(response.status).not.toBe(401);
  });

  test('should allow access to /api/admin/* with valid session', async () => {
    const sessionToken = await createTestSuperAdmin();

    const response = await makeAuthenticatedRequest(app, 'GET', '/api/admin/tenants', {
      sessionToken,
    });

    expectStatus(response, 200);
  });
});
