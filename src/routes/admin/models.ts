import { Elysia, t } from 'elysia';
import {
  listContentModels,
  findContentModel,
  createContentModel,
  updateContentModel,
  deleteContentModel,
} from '../../services/content';

export const modelRoutes = new Elysia()
  .get('/api/admin/tenants/:slug/models', ({ params }) => {
    const models = listContentModels(params.slug);
    return { models };
  })
  .get('/api/admin/tenants/:slug/models/:modelSlug', ({ params, set }) => {
    const model = findContentModel(params.slug, params.modelSlug);
    if (!model) {
      set.status = 404;
      return { error: 'Content model not found' };
    }
    return { model };
  })
  .post('/api/admin/tenants/:slug/models', ({ params, body, set }) => {
    try {
      createContentModel(params.slug, body);
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Object({
      slug: t.String(),
      name: t.String(),
      type: t.Union([t.Literal('collection'), t.Literal('singleton')]),
      fields: t.Array(t.Object({
        name: t.String(),
        type: t.String(),
        required: t.Optional(t.Boolean()),
        label: t.Optional(t.String()),
      })),
    }),
  })
  .patch('/api/admin/tenants/:slug/models/:modelSlug', ({ params, body, set }) => {
    try {
      updateContentModel(params.slug, params.modelSlug, body);
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      fields: t.Optional(t.Array(t.Object({
        name: t.String(),
        type: t.String(),
        required: t.Optional(t.Boolean()),
        label: t.Optional(t.String()),
      }))),
    }),
  })
  .delete('/api/admin/tenants/:slug/models/:modelSlug', ({ params, set }) => {
    try {
      deleteContentModel(params.slug, params.modelSlug);
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  });
