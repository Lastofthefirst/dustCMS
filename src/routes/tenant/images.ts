import { Elysia } from 'elysia';
import { uploadAndOptimizeImage, listImages, deleteImage } from '../../services/image';

export function tenantImageRoutes(app: Elysia): Elysia {
  return app
    .get('/api/tenant/images', ({ tenant, set }) => {
      if (!tenant) {
        set.status = 400;
        return { error: 'No tenant context' };
      }
      const images = listImages(tenant.slug);
      return { images };
    })
    .post('/api/tenant/images', async ({ tenant, body, set }) => {
      if (!tenant) {
        set.status = 400;
        return { error: 'No tenant context' };
      }

      try {
        const file = body.file as File;
        if (!file) {
          set.status = 400;
          return { error: 'No file provided' };
        }

        const filename = await uploadAndOptimizeImage(tenant.slug, file);
        return { filename, url: `/images/${filename}` };
      } catch (error: any) {
        set.status = 400;
        return { error: error.message };
      }
    })
    .delete('/api/tenant/images/:filename', ({ tenant, params, set }) => {
      if (!tenant) {
        set.status = 400;
        return { error: 'No tenant context' };
      }

      try {
        deleteImage(tenant.slug, params.filename);
        return { success: true };
      } catch (error: any) {
        set.status = 400;
        return { error: error.message };
      }
    });
}
