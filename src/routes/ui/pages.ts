import { Elysia } from 'elysia';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getSuperAdmin, createSuperAdmin } from '../../db/system';
import { hashPassword } from '../../services/auth';
import { findTenant } from '../../services/tenant';
import { config } from '../../config';

function loadTemplate(name: string): string {
  return readFileSync(join(process.cwd(), 'templates', name), 'utf-8');
}

function renderTemplate(templateName: string, title: string, content: string): string {
  const layout = loadTemplate('layout.html');
  return layout
    .replace('{{TITLE}}', title)
    .replace('{{CONTENT}}', content);
}

export const uiRoutes = new Elysia()
  // Setup page
  .get('/setup', ({ set }) => {
    const admin = getSuperAdmin();
    if (admin) {
      set.redirect = '/admin/login';
      return;
    }

    const template = loadTemplate('setup.html');
    const content = template.replace(/{{BASE_DOMAIN}}/g, config.baseDomain);
    return renderTemplate('Setup', 'Setup', content);
  }, {
    type: 'text/html',
  })

  // Setup API endpoint
  .post('/api/setup', async ({ body, set }) => {
    const admin = getSuperAdmin();
    if (admin) {
      set.status = 400;
      return { error: 'Setup already completed' };
    }

    const { email, password, baseDomain } = body as any;

    if (!email || !password) {
      set.status = 400;
      return { error: 'Email and password required' };
    }

    // Update config if baseDomain provided
    if (baseDomain) {
      config.baseDomain = baseDomain;
    }

    const passwordHash = await hashPassword(password);
    createSuperAdmin(email, passwordHash);

    return { success: true };
  })

  // Login page
  .get('/admin/login', ({ set, isAuthenticated }) => {
    if (isAuthenticated) {
      set.redirect = '/admin';
      return;
    }

    const template = loadTemplate('admin/login.html');
    return renderTemplate('Login', 'Login', template);
  }, {
    type: 'text/html',
  })

  // Admin dashboard
  .get('/admin', ({ set, isAuthenticated }) => {
    if (!isAuthenticated) {
      set.redirect = '/admin/login';
      return;
    }

    const template = loadTemplate('admin/dashboard.html');
    return renderTemplate('Dashboard', 'Dashboard', template);
  }, {
    type: 'text/html',
  })

  // Tenant management page
  .get('/admin/tenants/:slug', ({ params, set, isAuthenticated }) => {
    if (!isAuthenticated) {
      set.redirect = '/admin/login';
      return;
    }

    const tenant = findTenant(params.slug);
    if (!tenant) {
      set.status = 404;
      return 'Tenant not found';
    }

    const template = loadTemplate('admin/tenant.html');
    const content = template
      .replace(/{{TENANT_SLUG}}/g, tenant.slug)
      .replace(/{{TENANT_NAME}}/g, tenant.name);

    return renderTemplate(tenant.name, tenant.name, content);
  }, {
    type: 'text/html',
  })

  // Root redirect
  .get('/', ({ set }) => {
    const admin = getSuperAdmin();
    if (!admin) {
      set.redirect = '/setup';
    } else {
      set.redirect = '/admin/login';
    }
  });
