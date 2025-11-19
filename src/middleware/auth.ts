import { Elysia } from 'elysia';
import { validateSession } from '../services/auth';

export const authMiddleware = new Elysia()
  .derive(({ cookie }) => {
    const sessionCookie = cookie.session?.value;
    const isAuthenticated = sessionCookie ? validateSession(sessionCookie) : false;

    return {
      isAuthenticated,
      sessionToken: sessionCookie || null,
    };
  })
  .onBeforeHandle(({ isAuthenticated, path, set }) => {
    // Allow setup and login pages without auth
    if (path === '/setup' || path === '/admin/login' || path === '/api/auth/login') {
      return;
    }

    // Require auth for admin pages and APIs
    if ((path.startsWith('/admin') || path.startsWith('/api/admin')) && !isAuthenticated) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
  });
