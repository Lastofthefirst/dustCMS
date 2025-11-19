import { Elysia } from 'elysia';
import { html } from '@elysiajs/html';
import { staticPlugin } from '@elysiajs/static';
import { cookie } from '@elysiajs/cookie';
import { join } from 'path';
import { config } from './config';
import { authMiddleware } from './middleware/auth';
import { tenantMiddleware } from './middleware/tenants';

// Route imports
import { authRoutes } from './routes/admin/auth';
import { tenantRoutes } from './routes/admin/tenants';
import { modelRoutes } from './routes/admin/models';
import { adminContentRoutes } from './routes/admin/content';
import { imageRoutes } from './routes/admin/images';
import { integrationRoutes } from './routes/admin/integration';
import { publicContentRoutes } from './routes/api/content';
import { uiRoutes } from './routes/ui/pages';
import { getImagePath } from './services/image';

export function createServer() {
  const app = new Elysia()
    .use(html())
    .use(cookie())

    // Add tenant middleware to all routes
    .use(tenantMiddleware)

    // Serve static images
    .get('/images/:filename', ({ params, tenant, set }) => {
      if (!tenant) {
        set.status = 404;
        return 'Not found';
      }

      const filepath = getImagePath(tenant.slug, params.filename);
      return Bun.file(filepath);
    })

    // Public API routes (no auth required)
    .use(publicContentRoutes)

    // UI routes (with auth middleware)
    .use(uiRoutes)

    // Apply auth middleware to admin routes
    .use(authMiddleware)

    // Admin API routes (auth required)
    .use(authRoutes)
    .use(tenantRoutes)
    .use(modelRoutes)
    .use(adminContentRoutes)
    .use(imageRoutes)
    .use(integrationRoutes)

    // Health check
    .get('/health', () => ({ status: 'ok' }))

    // 404 handler
    .onError(({ code, error, set }) => {
      if (code === 'NOT_FOUND') {
        set.status = 404;
        return { error: 'Not found' };
      }

      console.error('Error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    });

  return app;
}

export async function startServer() {
  const app = createServer();

  app.listen(config.port, () => {
    console.log(`
╔═══════════════════════════════════════╗
║         dustCMS Server Ready          ║
╚═══════════════════════════════════════╝

  🚀 Server running on http://localhost:${config.port}
  📦 Base domain: ${config.baseDomain}
  🗄️  Data directory: ${config.dataDir}

  Next steps:
  1. Visit http://localhost:${config.port}/setup to configure
  2. Create tenants from the admin dashboard
  3. Define content models for each tenant
  4. Access tenant APIs at: http://tenant-slug.${config.baseDomain}/api/content

`);
  });

  return app;
}
