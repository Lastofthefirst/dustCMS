import { Elysia, t } from 'elysia';
import { listTenants, findTenant, createTenant, updateTenant, deleteTenant } from '../../services/tenant';
import { generatePassphrase } from '../../services/password';
import { hashPassword } from '../../services/auth';

export const tenantRoutes = new Elysia({ prefix: '/api/admin/tenants' })
  .get('/', () => {
    return { tenants: listTenants() };
  })
  .get('/:slug', ({ params }) => {
    const tenant = findTenant(params.slug);
    if (!tenant) {
      return { error: 'Tenant not found' };
    }
    return { tenant };
  })
  .post('/', async ({ body, set }) => {
    try {
      // Auto-generate password if not provided
      const plaintextPassword = body.password || generatePassphrase(4);
      const tenant = await createTenant(body.slug, body.name, plaintextPassword);

      // Return tenant data with plaintext password for the welcome modal
      // Note: The database stores the hashed version, but we return plaintext
      // so the admin can share it with the client
      return {
        tenant: {
          ...tenant,
          password: plaintextPassword, // Override with plaintext for display only
        },
      };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Object({
      slug: t.String(),
      name: t.String(),
      password: t.Optional(t.String()),
    }),
  })
  .patch('/:slug', ({ params, body, set }) => {
    try {
      updateTenant(params.slug, body);
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      password: t.Optional(t.String()),
    }),
  })
  .delete('/:slug', ({ params, set }) => {
    try {
      deleteTenant(params.slug);
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  })
  .post('/:slug/regenerate-password', async ({ params, set }) => {
    try {
      const tenant = findTenant(params.slug);
      if (!tenant) {
        set.status = 404;
        return { error: 'Tenant not found' };
      }

      // Generate new password
      const newPassword = generatePassphrase(4);

      // Hash and update tenant password (both hashed and plaintext)
      const passwordHash = await hashPassword(newPassword);
      updateTenant(params.slug, {
        password: passwordHash,
        password_plaintext: newPassword
      });

      return {
        success: true,
        password: newPassword
      };
    } catch (error: any) {
      set.status = 500;
      return { error: error.message };
    }
  });
