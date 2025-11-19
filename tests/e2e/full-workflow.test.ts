import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  createTestApp,
  makeRequest,
  makeAuthenticatedRequest,
  expectStatus,
  expectJson,
} from '../utils/test-helpers';

describe('E2E: Full CMS Workflow', () => {
  let app: any;

  beforeEach(() => {
    setupTestEnvironment();
    app = createTestApp();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  test('Complete workflow: Setup → Create Tenant → Create Model → Add Content → Public API', async () => {
    // Step 1: Check setup status (should be incomplete)
    let response = await makeRequest(app, 'GET', '/api/auth/setup-status');
    expectStatus(response, 200);
    let data = await expectJson(response);
    expect(data.setupComplete).toBe(false);

    // Step 2: Complete setup
    response = await makeRequest(app, 'POST', '/api/setup', {
      body: {
        email: 'admin@example.com',
        password: 'securepassword123',
        baseDomain: 'example.com',
      },
    });
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.success).toBe(true);

    // Step 3: Login as super admin
    response = await makeRequest(app, 'POST', '/api/auth/login', {
      body: {
        email: 'admin@example.com',
        password: 'securepassword123',
      },
    });
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.success).toBe(true);

    // Extract session token from cookie
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    const sessionMatch = setCookie?.match(/session=([^;]+)/);
    expect(sessionMatch).toBeDefined();
    const sessionToken = sessionMatch![1];

    // Step 4: Verify authentication
    response = await makeAuthenticatedRequest(app, 'GET', '/api/auth/check', {
      sessionToken,
    });
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.authenticated).toBe(true);

    // Step 5: Create a tenant
    response = await makeAuthenticatedRequest(app, 'POST', '/api/admin/tenants', {
      sessionToken,
      body: {
        slug: 'acme-corp',
        name: 'ACME Corporation',
        password: 'acmepass123',
      },
    });
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.tenant).toBeDefined();
    expect(data.tenant.slug).toBe('acme-corp');

    // Step 6: Verify tenant was created
    response = await makeAuthenticatedRequest(app, 'GET', '/api/admin/tenants', {
      sessionToken,
    });
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.tenants).toHaveLength(1);

    // Step 7: Create a content model for the tenant
    response = await makeAuthenticatedRequest(app, 'POST', '/api/admin/tenants/acme-corp/models', {
      sessionToken,
      body: {
        slug: 'blog_posts',
        name: 'Blog Posts',
        type: 'collection',
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'author', type: 'text', required: true },
          { name: 'content', type: 'markdown', required: true },
          { name: 'published_date', type: 'date' },
          { name: 'featured_image', type: 'image' },
        ],
      },
    });
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.success).toBe(true);

    // Step 8: Verify content model was created
    response = await makeAuthenticatedRequest(app, 'GET', '/api/admin/tenants/acme-corp/models', {
      sessionToken,
    });
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.models).toHaveLength(1);
    expect(data.models[0].slug).toBe('blog_posts');
    expect(data.models[0].fields).toHaveLength(5);

    // Step 9: Create content item
    response = await makeAuthenticatedRequest(app, 'POST', '/api/admin/tenants/acme-corp/content/blog_posts', {
      sessionToken,
      body: {
        title: 'Welcome to Our Blog',
        author: 'John Doe',
        content: '# Welcome\n\nThis is our first blog post!',
        published_date: '2024-01-15',
        featured_image: '/images/welcome.webp',
      },
    });
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.id).toBe(1);

    // Step 10: Create another content item
    response = await makeAuthenticatedRequest(app, 'POST', '/api/admin/tenants/acme-corp/content/blog_posts', {
      sessionToken,
      body: {
        title: 'Product Launch Announcement',
        author: 'Jane Smith',
        content: 'We are excited to announce our new product!',
        published_date: '2024-01-20',
      },
    });
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.id).toBe(2);

    // Step 11: List all content items
    response = await makeAuthenticatedRequest(app, 'GET', '/api/admin/tenants/acme-corp/content/blog_posts', {
      sessionToken,
    });
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.items).toHaveLength(2);

    // Step 12: Update a content item
    response = await makeAuthenticatedRequest(app, 'PATCH', '/api/admin/tenants/acme-corp/content/blog_posts/1', {
      sessionToken,
      body: {
        title: 'Welcome to Our Updated Blog',
      },
    });
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.success).toBe(true);

    // Step 13: Access public API (without authentication)
    const publicReq = new Request('http://acme-corp.example.com:3000/api/content/blog_posts', {
      headers: {
        'Host': 'acme-corp.example.com',
      },
    });
    response = await app.handle(publicReq);
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].title).toBe('Welcome to Our Updated Blog');
    expect(data.data[1].title).toBe('Product Launch Announcement');

    // Step 14: Access specific item from public API
    const publicItemReq = new Request('http://acme-corp.example.com:3000/api/content/blog_posts/2', {
      headers: {
        'Host': 'acme-corp.example.com',
      },
    });
    response = await app.handle(publicItemReq);
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.data).toBeDefined();
    expect(data.data.title).toBe('Product Launch Announcement');
    expect(data.data.author).toBe('Jane Smith');

    // Step 15: Delete a content item
    response = await makeAuthenticatedRequest(app, 'DELETE', '/api/admin/tenants/acme-corp/content/blog_posts/2', {
      sessionToken,
    });
    expectStatus(response, 200);

    // Step 16: Verify item was deleted
    response = await makeAuthenticatedRequest(app, 'GET', '/api/admin/tenants/acme-corp/content/blog_posts', {
      sessionToken,
    });
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.items).toHaveLength(1);

    // Step 17: Delete content model
    response = await makeAuthenticatedRequest(app, 'DELETE', '/api/admin/tenants/acme-corp/models/blog_posts', {
      sessionToken,
    });
    expectStatus(response, 200);

    // Step 18: Delete tenant
    response = await makeAuthenticatedRequest(app, 'DELETE', '/api/admin/tenants/acme-corp', {
      sessionToken,
    });
    expectStatus(response, 200);

    // Step 19: Verify tenant was deleted
    response = await makeAuthenticatedRequest(app, 'GET', '/api/admin/tenants', {
      sessionToken,
    });
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.tenants).toHaveLength(0);

    // Step 20: Logout
    response = await makeAuthenticatedRequest(app, 'POST', '/api/auth/logout', {
      sessionToken,
    });
    expectStatus(response, 200);

    // Step 21: Verify session is invalid after logout
    response = await makeAuthenticatedRequest(app, 'GET', '/api/auth/check', {
      sessionToken,
    });
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.authenticated).toBe(false);
  });

  test('E2E: Singleton content workflow', async () => {
    // Setup and login
    await makeRequest(app, 'POST', '/api/setup', {
      body: {
        email: 'admin@example.com',
        password: 'password123',
      },
    });

    let response = await makeRequest(app, 'POST', '/api/auth/login', {
      body: {
        email: 'admin@example.com',
        password: 'password123',
      },
    });

    const setCookie = response.headers.get('set-cookie');
    const sessionToken = setCookie?.match(/session=([^;]+)/)?.[1]!;

    // Create tenant
    await makeAuthenticatedRequest(app, 'POST', '/api/admin/tenants', {
      sessionToken,
      body: {
        slug: 'test-site',
        name: 'Test Site',
        password: 'pass',
      },
    });

    // Create singleton content model
    await makeAuthenticatedRequest(app, 'POST', '/api/admin/tenants/test-site/models', {
      sessionToken,
      body: {
        slug: 'site_config',
        name: 'Site Configuration',
        type: 'singleton',
        fields: [
          { name: 'site_title', type: 'text', required: true },
          { name: 'tagline', type: 'text' },
          { name: 'maintenance_mode', type: 'text' },
        ],
      },
    });

    // Update singleton content
    response = await makeAuthenticatedRequest(app, 'PUT', '/api/admin/tenants/test-site/content/site_config', {
      sessionToken,
      body: {
        site_title: 'My Awesome Site',
        tagline: 'The best site ever',
        maintenance_mode: 'false',
      },
    });
    expectStatus(response, 200);

    // Get singleton content
    response = await makeAuthenticatedRequest(app, 'GET', '/api/admin/tenants/test-site/content/site_config/singleton', {
      sessionToken,
    });
    expectStatus(response, 200);
    let data = await expectJson(response);
    expect(data.item).toBeDefined();
    expect(data.item.site_title).toBe('My Awesome Site');

    // Access via public API
    const publicReq = new Request('http://test-site.localhost:3000/api/content/site_config', {
      headers: {
        'Host': 'test-site.localhost',
      },
    });
    response = await app.handle(publicReq);
    expectStatus(response, 200);
    data = await expectJson(response);
    expect(data.data).toBeDefined();
    expect(data.data.site_title).toBe('My Awesome Site');
    expect(data.data.tagline).toBe('The best site ever');
  });
});
