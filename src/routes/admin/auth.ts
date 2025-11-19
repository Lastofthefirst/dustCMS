import { Elysia, t } from 'elysia';
import { authenticateSuperAdmin, logout } from '../../services/auth';
import { getSuperAdmin } from '../../db/system';

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .post('/login', async ({ body, cookie, set }) => {
    const { username, password } = body;

    const token = await authenticateSuperAdmin(username, password);
    if (!token) {
      set.status = 401;
      return { error: 'Invalid credentials' };
    }

    cookie.session.set({
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
  .post('/logout', ({ cookie, sessionToken }) => {
    if (sessionToken) {
      logout(sessionToken);
    }
    cookie.session.remove();
    return { success: true };
  })
  .get('/check', ({ isAuthenticated }) => {
    return { authenticated: isAuthenticated };
  })
  .get('/setup-status', () => {
    const admin = getSuperAdmin();
    return { setupComplete: admin !== null };
  });
