import sharp from 'sharp';
import { join } from 'path';
import { config } from '../config';
import { existsSync, readdirSync, unlinkSync } from 'fs';

export async function uploadAndOptimizeImage(
  tenantSlug: string,
  file: File
): Promise<string> {
  const imagesDir = join(config.dataDir, 'tenants', tenantSlug, 'images');

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const filename = `${timestamp}-${randomStr}.webp`;
  const filepath = join(imagesDir, filename);

  // Convert file to buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Optimize and convert to WebP
  await sharp(buffer)
    .resize(1200, null, { withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(filepath);

  return filename;
}

export function getImagePath(tenantSlug: string, filename: string): string {
  return join(config.dataDir, 'tenants', tenantSlug, 'images', filename);
}

export function listImages(tenantSlug: string): string[] {
  const imagesDir = join(config.dataDir, 'tenants', tenantSlug, 'images');
  if (!existsSync(imagesDir)) {
    return [];
  }
  return readdirSync(imagesDir).filter(f => f.endsWith('.webp'));
}

export function deleteImage(tenantSlug: string, filename: string) {
  const filepath = getImagePath(tenantSlug, filename);
  if (existsSync(filepath)) {
    unlinkSync(filepath);
  }
}
