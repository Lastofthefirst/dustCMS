import {
  getContentModels,
  getContentModel,
  createContentModel as dbCreateContentModel,
  updateContentModel as dbUpdateContentModel,
  deleteContentModel as dbDeleteContentModel,
  getContentItems,
  getContentItem,
  getSingletonContent,
  createContentItem as dbCreateContentItem,
  updateContentItem as dbUpdateContentItem,
  updateSingletonContent as dbUpdateSingletonContent,
  deleteContentItem as dbDeleteContentItem,
} from '../db/tenant';
import type { ContentModel, ContentItem } from '../models/types';

export function listContentModels(tenantSlug: string): ContentModel[] {
  return getContentModels(tenantSlug);
}

export function findContentModel(tenantSlug: string, modelSlug: string): ContentModel | null {
  return getContentModel(tenantSlug, modelSlug);
}

export function createContentModel(tenantSlug: string, model: ContentModel) {
  // Validate model slug
  if (!/^[a-z0-9_]+$/.test(model.slug)) {
    throw new Error('Model slug must contain only lowercase letters, numbers, and underscores');
  }

  // Check if model already exists
  if (getContentModel(tenantSlug, model.slug)) {
    throw new Error('Content model with this slug already exists');
  }

  dbCreateContentModel(tenantSlug, model);
}

export function updateContentModel(tenantSlug: string, modelSlug: string, updates: Partial<ContentModel>) {
  dbUpdateContentModel(tenantSlug, modelSlug, updates);
}

export function deleteContentModel(tenantSlug: string, modelSlug: string) {
  dbDeleteContentModel(tenantSlug, modelSlug);
}

export function listContentItems(tenantSlug: string, modelSlug: string): ContentItem[] {
  return getContentItems(tenantSlug, modelSlug);
}

export function findContentItem(tenantSlug: string, modelSlug: string, itemId: number): ContentItem | null {
  return getContentItem(tenantSlug, modelSlug, itemId);
}

export function findSingletonContent(tenantSlug: string, modelSlug: string): ContentItem | null {
  return getSingletonContent(tenantSlug, modelSlug);
}

export function createContentItem(tenantSlug: string, modelSlug: string, data: ContentItem): number {
  const model = getContentModel(tenantSlug, modelSlug);
  if (!model) {
    throw new Error('Content model not found');
  }

  if (model.type === 'singleton') {
    throw new Error('Cannot create items for singleton models');
  }

  // Validate required fields
  for (const field of model.fields) {
    if (field.required && !data[field.name]) {
      throw new Error(`Field '${field.name}' is required`);
    }
  }

  return dbCreateContentItem(tenantSlug, modelSlug, data);
}

export function updateContentItem(tenantSlug: string, modelSlug: string, itemId: number, data: ContentItem) {
  const model = getContentModel(tenantSlug, modelSlug);
  if (!model) {
    throw new Error('Content model not found');
  }

  if (model.type === 'singleton') {
    throw new Error('Use updateSingletonContent for singleton models');
  }

  dbUpdateContentItem(tenantSlug, modelSlug, itemId, data);
}

export function updateSingletonContent(tenantSlug: string, modelSlug: string, data: ContentItem) {
  const model = getContentModel(tenantSlug, modelSlug);
  if (!model) {
    throw new Error('Content model not found');
  }

  if (model.type !== 'singleton') {
    throw new Error('Use updateContentItem for collection models');
  }

  dbUpdateSingletonContent(tenantSlug, modelSlug, data);
}

export function deleteContentItem(tenantSlug: string, modelSlug: string, itemId: number) {
  const model = getContentModel(tenantSlug, modelSlug);
  if (!model) {
    throw new Error('Content model not found');
  }

  if (model.type === 'singleton') {
    throw new Error('Cannot delete singleton content');
  }

  dbDeleteContentItem(tenantSlug, modelSlug, itemId);
}
