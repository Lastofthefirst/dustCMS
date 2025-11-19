import { Elysia, t } from 'elysia';
import {
  listContentItems,
  findContentItem,
  findSingletonContent,
  createContentItem,
  updateContentItem,
  updateSingletonContent,
  deleteContentItem,
} from '../../services/content';

export const adminContentRoutes = new Elysia()
  .get('/api/admin/tenants/:slug/content/:modelSlug', ({ params, set }) => {
    try {
      const items = listContentItems(params.slug, params.modelSlug);
      return { items };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  })
  .get('/api/admin/tenants/:slug/content/:modelSlug/singleton', ({ params, set }) => {
    try {
      const item = findSingletonContent(params.slug, params.modelSlug);
      return { item };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  })
  .get('/api/admin/tenants/:slug/content/:modelSlug/:itemId', ({ params, set }) => {
    try {
      const item = findContentItem(params.slug, params.modelSlug, parseInt(params.itemId));
      if (!item) {
        set.status = 404;
        return { error: 'Item not found' };
      }
      return { item };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  })
  .post('/api/admin/tenants/:slug/content/:modelSlug', ({ params, body, set }) => {
    try {
      const id = createContentItem(params.slug, params.modelSlug, body);
      return { id };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Any(),
  })
  .patch('/api/admin/tenants/:slug/content/:modelSlug/:itemId', ({ params, body, set }) => {
    try {
      updateContentItem(params.slug, params.modelSlug, parseInt(params.itemId), body);
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Any(),
  })
  .put('/api/admin/tenants/:slug/content/:modelSlug', ({ params, body, set }) => {
    try {
      updateSingletonContent(params.slug, params.modelSlug, body);
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Any(),
  })
  .delete('/api/admin/tenants/:slug/content/:modelSlug/:itemId', ({ params, set }) => {
    try {
      deleteContentItem(params.slug, params.modelSlug, parseInt(params.itemId));
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  });
