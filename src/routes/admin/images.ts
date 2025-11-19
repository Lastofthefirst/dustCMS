import { Elysia } from 'elysia';
import { uploadAndOptimizeImage, listImages, deleteImage } from '../../services/image';

export const imageRoutes = new Elysia({ prefix: '/api/admin/tenants/:tenantSlug/images' })
  .get('/', ({ params }) => {
    const images = listImages(params.tenantSlug);
    return { images };
  })
  .post('/', async ({ params, body, set }) => {
    try {
      const file = body.file as File;
      if (!file) {
        set.status = 400;
        return { error: 'No file provided' };
      }

      const filename = await uploadAndOptimizeImage(params.tenantSlug, file);
      return { filename, url: `/images/${filename}` };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  })
  .delete('/:filename', ({ params, set }) => {
    try {
      deleteImage(params.tenantSlug, params.filename);
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  });
