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
  // Login page
  .get('/admin/login', ({ set, isAuthenticated }) => {
    if (isAuthenticated) {
      set.redirect = '/admin';
      return;
    }

    const admin = getSuperAdmin();
    if (!admin) {
      // Setup not completed, show helpful message
      const setupMessage = `
        <div class="min-h-screen flex items-center justify-center bg-base-200">
          <div class="card w-96 bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title text-2xl">Setup Required</h2>
              <div class="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>dustCMS has not been set up yet.</span>
              </div>
              <div class="text-sm space-y-2">
                <p class="font-semibold">To set up dustCMS, run:</p>
                <div class="mockup-code">
                  <pre><code>bun run src/main.ts setup</code></pre>
                </div>
                <p class="text-xs opacity-70">This will create the super admin account via CLI.</p>
              </div>
            </div>
          </div>
        </div>
      `;
      return renderTemplate('Setup Required', 'Setup Required', setupMessage);
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
    set.redirect = '/admin/login';
  });
