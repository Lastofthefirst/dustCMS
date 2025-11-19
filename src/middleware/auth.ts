import { Elysia } from 'elysia';
import { validateSession } from '../services/auth';

export function authMiddleware(app: Elysia): Elysia {
  return app
    .derive(({ cookie }) => {
      const sessionCookie = cookie.session?.value;
      const isAuthenticated = sessionCookie ? validateSession(sessionCookie) : false;

      return {
        isAuthenticated,
        sessionToken: sessionCookie || null,
      };
    })
    .onBeforeHandle(({ isAuthenticated, path, set }) => {
      // Allow login page and auth API without auth
      if (path === '/admin/login' || path === '/api/auth/login') {
        return;
      }

      // Require auth for admin pages and APIs
      if ((path.startsWith('/admin') || path.startsWith('/api/admin')) && !isAuthenticated) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
    });
}
