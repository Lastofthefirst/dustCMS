import { Elysia } from 'elysia';
import { listContentItems, findContentItem, findSingletonContent, findContentModel } from '../../services/content';

export const publicContentRoutes = new Elysia({ prefix: '/api/content' })
  .get('/:modelSlug', ({ params, tenant, set }) => {
    if (!tenant) {
      set.status = 404;
      return { error: 'Tenant not found' };
    }

    try {
      const model = findContentModel(tenant.slug, params.modelSlug);
      if (!model) {
        set.status = 404;
        return { error: 'Content model not found' };
      }

      if (model.type === 'singleton') {
        const item = findSingletonContent(tenant.slug, params.modelSlug);
        return { data: item };
      } else {
        const items = listContentItems(tenant.slug, params.modelSlug);
        return { data: items };
      }
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  })
  .get('/:modelSlug/:itemId', ({ params, tenant, set }) => {
    if (!tenant) {
      set.status = 404;
      return { error: 'Tenant not found' };
    }

    try {
      const item = findContentItem(tenant.slug, params.modelSlug, parseInt(params.itemId));
      if (!item) {
        set.status = 404;
        return { error: 'Item not found' };
      }
      return { data: item };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  });
