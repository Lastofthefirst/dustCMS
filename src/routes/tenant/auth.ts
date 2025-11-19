import { Elysia, t } from 'elysia';
import { authenticateTenant, logout } from '../../services/auth';

export function tenantAuthRoutes(app: Elysia): Elysia {
  return app
    .post('/api/tenant/auth/login', async ({ body, cookie, set, tenant }) => {
      if (!tenant) {
        set.status = 400;
        return { error: 'Invalid tenant' };
      }

      const { username, password } = body;

      const token = await authenticateTenant(tenant.slug, username, password);
      if (!token) {
        set.status = 401;
        return { error: 'Invalid credentials' };
      }

      cookie['tenant-session'].set({
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return { success: true };
    }, {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    })
    .post('/api/tenant/auth/logout', ({ cookie, tenantSessionToken }) => {
      if (tenantSessionToken) {
        logout(tenantSessionToken);
      }
      cookie['tenant-session'].remove();
      return { success: true };
    })
    .get('/api/tenant/auth/check', ({ isTenantAuthenticated }) => {
      return { authenticated: isTenantAuthenticated };
    });
}
