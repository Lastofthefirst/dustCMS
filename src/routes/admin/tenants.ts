import { Elysia, t } from 'elysia';
import { listTenants, findTenant, createTenant, updateTenant, deleteTenant } from '../../services/tenant';

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
  .post('/', ({ body, set }) => {
    try {
      const tenant = createTenant(body.slug, body.name, body.password);
      return { tenant };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Object({
      slug: t.String(),
      name: t.String(),
      password: t.String(),
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
  });
