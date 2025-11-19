import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  createTestApp,
  createTestSuperAdmin,
  makeAuthenticatedRequest,
  expectStatus,
  expectJson,
} from '../../utils/test-helpers';
import { createTenant, findTenant } from '../../../src/services/tenant';

describe('Tenant API', () => {
  let app: any;
  let sessionToken: string;

  beforeEach(async () => {
    setupTestEnvironment();
    app = createTestApp();
    sessionToken = await createTestSuperAdmin();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('GET /api/admin/tenants', () => {
    test('should return empty array when no tenants exist', async () => {
      const response = await makeAuthenticatedRequest(app, 'GET', '/api/admin/tenants', {
        sessionToken,
      });

      expectStatus(response, 200);
      const data = await expectJson(response);
      expect(data.tenants).toEqual([]);
    });

    test('should return all tenants', async () => {
      createTenant('tenant1', 'Tenant One', 'pass1');
      createTenant('tenant2', 'Tenant Two', 'pass2');

      const response = await makeAuthenticatedRequest(app, 'GET', '/api/admin/tenants', {
        sessionToken,
      });

      expectStatus(response, 200);
      const data = await expectJson(response);
      expect(data.tenants).toHaveLength(2);
    });

    test('should require authentication', async () => {
      const response = await makeAuthenticatedRequest(app, 'GET', '/api/admin/tenants');

      expectStatus(response, 401);
    });
  });

  describe('GET /api/admin/tenants/:slug', () => {
    test('should return tenant by slug', async () => {
      createTenant('test-tenant', 'Test Tenant', 'testpass');

      const response = await makeAuthenticatedRequest(app, 'GET', '/api/admin/tenants/test-tenant', {
        sessionToken,
      });

      expectStatus(response, 200);
      const data = await expectJson(response);
      expect(data.tenant).toBeDefined();
      expect(data.tenant.slug).toBe('test-tenant');
      expect(data.tenant.name).toBe('Test Tenant');
    });

    test('should return error for non-existent tenant', async () => {
      const response = await makeAuthenticatedRequest(app, 'GET', '/api/admin/tenants/non-existent', {
        sessionToken,
      });

      expectStatus(response, 200);
      const data = await expectJson(response);
      expect(data.error).toBe('Tenant not found');
    });
  });

  describe('POST /api/admin/tenants', () => {
    test('should create tenant', async () => {
      const response = await makeAuthenticatedRequest(app, 'POST', '/api/admin/tenants', {
        sessionToken,
        body: {
          slug: 'new-tenant',
          name: 'New Tenant',
          password: 'newpass',
        },
      });

      expectStatus(response, 200);
      const data = await expectJson(response);
      expect(data.tenant).toBeDefined();
      expect(data.tenant.slug).toBe('new-tenant');

      // Verify tenant was created in database
      const tenant = findTenant('new-tenant');
      expect(tenant).toBeDefined();
    });

    test('should reject invalid slug', async () => {
      const response = await makeAuthenticatedRequest(app, 'POST', '/api/admin/tenants', {
        sessionToken,
        body: {
          slug: 'Invalid Slug',
          name: 'Test',
          password: 'pass',
        },
      });

      expectStatus(response, 400);
      const data = await expectJson(response);
      expect(data.error).toContain('lowercase letters, numbers, and hyphens');
    });

    test('should reject duplicate slug', async () => {
      createTenant('duplicate', 'First', 'pass1');

      const response = await makeAuthenticatedRequest(app, 'POST', '/api/admin/tenants', {
        sessionToken,
        body: {
          slug: 'duplicate',
          name: 'Second',
          password: 'pass2',
        },
      });

      expectStatus(response, 400);
      const data = await expectJson(response);
      expect(data.error).toBe('Tenant with this slug already exists');
    });

    test('should require authentication', async () => {
      const response = await makeAuthenticatedRequest(app, 'POST', '/api/admin/tenants', {
        body: {
          slug: 'test',
          name: 'Test',
          password: 'pass',
        },
      });

      expectStatus(response, 401);
    });
  });

  describe('PATCH /api/admin/tenants/:slug', () => {
    test('should update tenant name', async () => {
      createTenant('test-tenant', 'Old Name', 'pass');

      const response = await makeAuthenticatedRequest(app, 'PATCH', '/api/admin/tenants/test-tenant', {
        sessionToken,
        body: {
          name: 'New Name',
        },
      });

      expectStatus(response, 200);
      const data = await expectJson(response);
      expect(data.success).toBe(true);

      const tenant = findTenant('test-tenant');
      expect(tenant?.name).toBe('New Name');
    });

    test('should update tenant password', async () => {
      createTenant('test-tenant', 'Test', 'oldpass');

      const response = await makeAuthenticatedRequest(app, 'PATCH', '/api/admin/tenants/test-tenant', {
        sessionToken,
        body: {
          password: 'newpass',
        },
      });

      expectStatus(response, 200);

      const tenant = findTenant('test-tenant');
      expect(tenant?.password).toBe('newpass');
    });
  });

  describe('DELETE /api/admin/tenants/:slug', () => {
    test('should delete tenant', async () => {
      createTenant('test-tenant', 'Test', 'pass');
      expect(findTenant('test-tenant')).toBeDefined();

      const response = await makeAuthenticatedRequest(app, 'DELETE', '/api/admin/tenants/test-tenant', {
        sessionToken,
      });

      expectStatus(response, 200);
      const data = await expectJson(response);
      expect(data.success).toBe(true);

      expect(findTenant('test-tenant')).toBeNull();
    });

    test('should require authentication', async () => {
      createTenant('test-tenant', 'Test', 'pass');

      const response = await makeAuthenticatedRequest(app, 'DELETE', '/api/admin/tenants/test-tenant');

      expectStatus(response, 401);
    });
  });
});
