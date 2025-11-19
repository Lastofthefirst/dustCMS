import { Elysia } from 'elysia';
import { readFileSync } from 'fs';
import { join } from 'path';

function loadTemplate(name: string): string {
  return readFileSync(join(process.cwd(), 'templates', name), 'utf-8');
}

function renderTemplate(templateName: string, title: string, content: string): string {
  const layout = loadTemplate('layout.html');
  return layout
    .replace('{{TITLE}}', title)
    .replace('{{CONTENT}}', content);
}

export function tenantPagesRoutes(app: Elysia): Elysia {
  return app
    // Tenant login page
    .get('/login', ({ set, tenant, isTenantAuthenticated }) => {
      // Only show login page if accessing via tenant subdomain
      if (!tenant) {
        set.status = 404;
        return 'Tenant not found';
      }

      if (isTenantAuthenticated) {
        set.redirect = '/';
        return;
      }

      const template = loadTemplate('tenant/login.html');
      const content = template
        .replace(/{{TENANT_SLUG}}/g, tenant.slug)
        .replace(/{{TENANT_NAME}}/g, tenant.name);

      return renderTemplate(`${tenant.name} - Login`, `${tenant.name} Login`, content);
    }, {
      type: 'text/html',
    })

    // Tenant dashboard
    .get('/', ({ set, tenant, isTenantAuthenticated, request }) => {
      // Only show dashboard if accessing via tenant subdomain
      if (!tenant) {
        // No tenant in subdomain, redirect to admin
        set.redirect = '/admin/login';
        return;
      }

      if (!isTenantAuthenticated) {
        set.redirect = '/login';
        return;
      }

      const template = loadTemplate('tenant/dashboard.html');
      const host = request.headers.get('host') || '';
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;

      const content = template
        .replace(/{{TENANT_SLUG}}/g, tenant.slug)
        .replace(/{{TENANT_NAME}}/g, tenant.name)
        .replace(/{{BASE_URL}}/g, baseUrl);

      return renderTemplate(tenant.name, tenant.name, content);
    }, {
      type: 'text/html',
    });
}
