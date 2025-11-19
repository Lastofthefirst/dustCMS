import { Elysia } from 'elysia';
import { uploadAndOptimizeImage, listImages, deleteImage } from '../../services/image';

export const imageRoutes = new Elysia()
  .get('/api/admin/tenants/:slug/images', ({ params }) => {
    const images = listImages(params.slug);
    return { images };
  })
  .post('/api/admin/tenants/:slug/images', async ({ params, body, set }) => {
    try {
      const file = body.file as File;
      if (!file) {
        set.status = 400;
        return { error: 'No file provided' };
      }

      const filename = await uploadAndOptimizeImage(params.slug, file);
      return { filename, url: `/images/${filename}` };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  })
  .delete('/api/admin/tenants/:slug/images/:filename', ({ params, set }) => {
    try {
      deleteImage(params.slug, params.filename);
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  });
