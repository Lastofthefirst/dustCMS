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

export const adminContentRoutes = new Elysia({ prefix: '/api/admin/tenants/:tenantSlug/content' })
  .get('/:modelSlug', ({ params, set }) => {
    try {
      const items = listContentItems(params.tenantSlug, params.modelSlug);
      return { items };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  })
  .get('/:modelSlug/:itemId', ({ params, set }) => {
    try {
      const item = findContentItem(params.tenantSlug, params.modelSlug, parseInt(params.itemId));
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
  .get('/:modelSlug/singleton', ({ params, set }) => {
    try {
      const item = findSingletonContent(params.tenantSlug, params.modelSlug);
      return { item };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  })
  .post('/:modelSlug', ({ params, body, set }) => {
    try {
      const id = createContentItem(params.tenantSlug, params.modelSlug, body);
      return { id };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Any(),
  })
  .patch('/:modelSlug/:itemId', ({ params, body, set }) => {
    try {
      updateContentItem(params.tenantSlug, params.modelSlug, parseInt(params.itemId), body);
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Any(),
  })
  .put('/:modelSlug', ({ params, body, set }) => {
    try {
      updateSingletonContent(params.tenantSlug, params.modelSlug, body);
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Any(),
  })
  .delete('/:modelSlug/:itemId', ({ params, set }) => {
    try {
      deleteContentItem(params.tenantSlug, params.modelSlug, parseInt(params.itemId));
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  });
