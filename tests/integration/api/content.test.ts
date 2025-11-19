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
import { createTenant } from '../../../src/services/tenant';
import { createContentModel } from '../../../src/services/content';
import { testContentModels, testContentItems } from '../../fixtures/factories';

describe('Content API', () => {
  let app: any;
  let sessionToken: string;
  const TENANT_SLUG = 'test-tenant';

  beforeEach(async () => {
    setupTestEnvironment();
    app = createTestApp();
    sessionToken = await createTestSuperAdmin();
    createTenant(TENANT_SLUG, 'Test Tenant', 'pass');
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('Content Models API', () => {
    describe('GET /api/admin/tenants/:slug/models', () => {
      test('should return all models', async () => {
        createContentModel(TENANT_SLUG, testContentModels.events);
        createContentModel(TENANT_SLUG, testContentModels.siteSettings);

        const response = await makeAuthenticatedRequest(
          app,
          'GET',
          `/api/admin/tenants/${TENANT_SLUG}/models`,
          { sessionToken }
        );

        expectStatus(response, 200);
        const data = await expectJson(response);
        expect(data.models).toHaveLength(2);
      });

      test('should require authentication', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'GET',
          `/api/admin/tenants/${TENANT_SLUG}/models`
        );

        expectStatus(response, 401);
      });
    });

    describe('POST /api/admin/tenants/:slug/models', () => {
      test('should create content model', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/admin/tenants/${TENANT_SLUG}/models`,
          {
            sessionToken,
            body: testContentModels.events,
          }
        );

        expectStatus(response, 200);
        const data = await expectJson(response);
        expect(data.success).toBe(true);
      });

      test('should reject invalid slug', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/admin/tenants/${TENANT_SLUG}/models`,
          {
            sessionToken,
            body: {
              ...testContentModels.events,
              slug: 'invalid-slug',
            },
          }
        );

        expectStatus(response, 400);
        const data = await expectJson(response);
        expect(data.error).toContain('lowercase letters, numbers, and underscores');
      });
    });

    describe('DELETE /api/admin/tenants/:slug/models/:modelSlug', () => {
      test('should delete content model', async () => {
        createContentModel(TENANT_SLUG, testContentModels.events);

        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `/api/admin/tenants/${TENANT_SLUG}/models/events`,
          { sessionToken }
        );

        expectStatus(response, 200);
        const data = await expectJson(response);
        expect(data.success).toBe(true);
      });
    });
  });

  describe('Content Items API - Collection', () => {
    beforeEach(() => {
      createContentModel(TENANT_SLUG, testContentModels.events);
    });

    describe('GET /api/admin/tenants/:slug/content/:modelSlug', () => {
      test('should return all content items', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'GET',
          `/api/admin/tenants/${TENANT_SLUG}/content/events`,
          { sessionToken }
        );

        expectStatus(response, 200);
        const data = await expectJson(response);
        expect(data.items).toEqual([]);
      });
    });

    describe('POST /api/admin/tenants/:slug/content/:modelSlug', () => {
      test('should create content item', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/admin/tenants/${TENANT_SLUG}/content/events`,
          {
            sessionToken,
            body: testContentItems.event1,
          }
        );

        expectStatus(response, 200);
        const data = await expectJson(response);
        expect(data.id).toBeGreaterThan(0);
      });

      test('should reject missing required fields', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/admin/tenants/${TENANT_SLUG}/content/events`,
          {
            sessionToken,
            body: {
              description: 'Missing title',
            },
          }
        );

        expectStatus(response, 400);
        const data = await expectJson(response);
        expect(data.error).toContain("Field 'title' is required");
      });
    });

    describe('PATCH /api/admin/tenants/:slug/content/:modelSlug/:itemId', () => {
      test('should update content item', async () => {
        // First create an item
        const createResponse = await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/admin/tenants/${TENANT_SLUG}/content/events`,
          {
            sessionToken,
            body: testContentItems.event1,
          }
        );
        const { id } = await expectJson(createResponse);

        // Then update it
        const response = await makeAuthenticatedRequest(
          app,
          'PATCH',
          `/api/admin/tenants/${TENANT_SLUG}/content/events/${id}`,
          {
            sessionToken,
            body: {
              title: 'Updated Event',
            },
          }
        );

        expectStatus(response, 200);
        const data = await expectJson(response);
        expect(data.success).toBe(true);
      });
    });

    describe('DELETE /api/admin/tenants/:slug/content/:modelSlug/:itemId', () => {
      test('should delete content item', async () => {
        // First create an item
        const createResponse = await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/admin/tenants/${TENANT_SLUG}/content/events`,
          {
            sessionToken,
            body: testContentItems.event1,
          }
        );
        const { id } = await expectJson(createResponse);

        // Then delete it
        const response = await makeAuthenticatedRequest(
          app,
          'DELETE',
          `/api/admin/tenants/${TENANT_SLUG}/content/events/${id}`,
          { sessionToken }
        );

        expectStatus(response, 200);
        const data = await expectJson(response);
        expect(data.success).toBe(true);
      });
    });
  });

  describe('Content Items API - Singleton', () => {
    beforeEach(() => {
      createContentModel(TENANT_SLUG, testContentModels.siteSettings);
    });

    describe('GET /api/admin/tenants/:slug/content/:modelSlug/singleton', () => {
      test('should return singleton content', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'GET',
          `/api/admin/tenants/${TENANT_SLUG}/content/site_settings/singleton`,
          { sessionToken }
        );

        expectStatus(response, 200);
        const data = await expectJson(response);
        expect(data.item).toBeNull();
      });
    });

    describe('PUT /api/admin/tenants/:slug/content/:modelSlug', () => {
      test('should update singleton content', async () => {
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `/api/admin/tenants/${TENANT_SLUG}/content/site_settings`,
          {
            sessionToken,
            body: testContentItems.siteSettings,
          }
        );

        expectStatus(response, 200);
        const data = await expectJson(response);
        expect(data.success).toBe(true);
      });
    });
  });

  describe('Public Content API', () => {
    beforeEach(() => {
      createContentModel(TENANT_SLUG, testContentModels.events);
    });

    describe('GET /api/content/:modelSlug', () => {
      test('should return content without authentication', async () => {
        // Create some content first
        await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/admin/tenants/${TENANT_SLUG}/content/events`,
          {
            sessionToken,
            body: testContentItems.event1,
          }
        );

        // Access public API
        const req = new Request(`http://${TENANT_SLUG}.localhost:3000/api/content/events`, {
          headers: {
            'Host': `${TENANT_SLUG}.localhost`,
          },
        });

        const response = await app.handle(req);

        expectStatus(response, 200);
        const data = await expectJson(response);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].title).toBe('Summer Festival');
      });

      test('should return 404 for non-existent tenant', async () => {
        const req = new Request('http://non-existent.localhost:3000/api/content/events', {
          headers: {
            'Host': 'non-existent.localhost',
          },
        });

        const response = await app.handle(req);
        expectStatus(response, 404);
      });
    });
  });
});
