import { Elysia } from 'elysia';
import { getTenant } from '../db/system';
import { validateTenantSession } from '../services/auth';
import { config } from '../config';

export function tenantMiddleware(app: Elysia): Elysia {
  return app.derive(({ request, cookie }) => {
    const host = request.headers.get('host') || '';
    const parts = host.split('.');

    // Extract subdomain (tenant slug)
    let tenantSlug: string | null = null;

    // For development (localhost:3000), check if there's a subdomain-like prefix
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      // In dev, we might use tenant-slug.localhost or just localhost
      if (parts.length > 1 && parts[0] !== 'localhost') {
        tenantSlug = parts[0];
      }
    } else {
      // In production, extract subdomain from base domain
      const baseParts = config.baseDomain.split('.');
      if (parts.length > baseParts.length) {
        tenantSlug = parts[0];
      }
    }

    const tenant = tenantSlug ? getTenant(tenantSlug) : null;

    // Check tenant authentication
    const tenantSessionCookie = cookie['tenant-session']?.value;
    const isTenantAuthenticated = tenantSlug && tenantSessionCookie
      ? validateTenantSession(tenantSessionCookie, tenantSlug)
      : false;

    return {
      tenantSlug,
      tenant,
      isTenantAuthenticated,
      tenantSessionToken: tenantSessionCookie || null,
    };
  });
}
