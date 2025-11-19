import { Elysia, t } from 'elysia';
import { authenticateTenant, logout } from '../../services/auth';

export const tenantAuthRoutes = new Elysia({ prefix: '/api/tenant/auth' })
  .post('/login', async ({ body, cookie, set, tenant }) => {
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
  .post('/logout', ({ cookie, tenantSessionToken }) => {
    if (tenantSessionToken) {
      logout(tenantSessionToken);
    }
    cookie['tenant-session'].remove();
    return { success: true };
  })
  .get('/check', ({ isTenantAuthenticated }) => {
    return { authenticated: isTenantAuthenticated };
  });
