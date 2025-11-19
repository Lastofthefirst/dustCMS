import { Elysia, t } from 'elysia';
import {
  listContentModels,
  findContentModel,
  createContentModel,
  updateContentModel,
  deleteContentModel,
} from '../../services/content';

export const modelRoutes = new Elysia({ prefix: '/api/admin/tenants/:tenantSlug/models' })
  .get('/', ({ params }) => {
    const models = listContentModels(params.tenantSlug);
    return { models };
  })
  .get('/:modelSlug', ({ params, set }) => {
    const model = findContentModel(params.tenantSlug, params.modelSlug);
    if (!model) {
      set.status = 404;
      return { error: 'Content model not found' };
    }
    return { model };
  })
  .post('/', ({ params, body, set }) => {
    try {
      createContentModel(params.tenantSlug, body);
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
  .patch('/:modelSlug', ({ params, body, set }) => {
    try {
      updateContentModel(params.tenantSlug, params.modelSlug, body);
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
  .delete('/:modelSlug', ({ params, set }) => {
    try {
      deleteContentModel(params.tenantSlug, params.modelSlug);
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  });
