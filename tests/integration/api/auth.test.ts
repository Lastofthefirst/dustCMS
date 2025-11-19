import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  createTestApp,
  createTestSuperAdmin,
  makeRequest,
  makeAuthenticatedRequest,
  expectStatus,
  expectJson,
} from '../../utils/test-helpers';
import { getSuperAdmin } from '../../../src/db/system';

describe('Auth API', () => {
  let app: any;

  beforeEach(() => {
    setupTestEnvironment();
    app = createTestApp();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      await createTestSuperAdmin('admin@test.com', 'testpass123');

      const response = await makeRequest(app, 'POST', '/api/auth/login', {
        body: {
          email: 'admin@test.com',
          password: 'testpass123',
        },
      });

      expectStatus(response, 200);
      const data = await expectJson(response);
      expect(data.success).toBe(true);

      // Check that session cookie is set
      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain('session=');
    });

    test('should reject invalid email', async () => {
      await createTestSuperAdmin('admin@test.com', 'testpass123');

      const response = await makeRequest(app, 'POST', '/api/auth/login', {
        body: {
          email: 'wrong@test.com',
          password: 'testpass123',
        },
      });

      expectStatus(response, 401);
      const data = await expectJson(response);
      expect(data.error).toBe('Invalid credentials');
    });

    test('should reject invalid password', async () => {
      await createTestSuperAdmin('admin@test.com', 'testpass123');

      const response = await makeRequest(app, 'POST', '/api/auth/login', {
        body: {
          email: 'admin@test.com',
          password: 'wrongpassword',
        },
      });

      expectStatus(response, 401);
      const data = await expectJson(response);
      expect(data.error).toBe('Invalid credentials');
    });

    test('should reject empty credentials', async () => {
      const response = await makeRequest(app, 'POST', '/api/auth/login', {
        body: {
          email: '',
          password: '',
        },
      });

      expectStatus(response, 401);
    });

    test('should reject when no super admin exists', async () => {
      const response = await makeRequest(app, 'POST', '/api/auth/login', {
        body: {
          email: 'admin@test.com',
          password: 'testpass123',
        },
      });

      expectStatus(response, 401);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout authenticated user', async () => {
      const token = await createTestSuperAdmin();

      const response = await makeAuthenticatedRequest(app, 'POST', '/api/auth/logout', {
        sessionToken: token,
      });

      expectStatus(response, 200);
      const data = await expectJson(response);
      expect(data.success).toBe(true);
    });

    test('should handle logout without session', async () => {
      const response = await makeRequest(app, 'POST', '/api/auth/logout');

      expectStatus(response, 200);
    });
  });

  describe('GET /api/auth/check', () => {
    test('should return authenticated true for valid session', async () => {
      const token = await createTestSuperAdmin();

      const response = await makeAuthenticatedRequest(app, 'GET', '/api/auth/check', {
        sessionToken: token,
      });

      expectStatus(response, 200);
      const data = await expectJson(response);
      expect(data.authenticated).toBe(true);
    });

    test('should return authenticated false without session', async () => {
      const response = await makeRequest(app, 'GET', '/api/auth/check');

      expectStatus(response, 200);
      const data = await expectJson(response);
      expect(data.authenticated).toBe(false);
    });
  });

  describe('GET /api/auth/setup-status', () => {
    test('should return setupComplete false when no admin exists', async () => {
      const response = await makeRequest(app, 'GET', '/api/auth/setup-status');

      expectStatus(response, 200);
      const data = await expectJson(response);
      expect(data.setupComplete).toBe(false);
    });

    test('should return setupComplete true when admin exists', async () => {
      await createTestSuperAdmin();

      const response = await makeRequest(app, 'GET', '/api/auth/setup-status');

      expectStatus(response, 200);
      const data = await expectJson(response);
      expect(data.setupComplete).toBe(true);
    });
  });
});
