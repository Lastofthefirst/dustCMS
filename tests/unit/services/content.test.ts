import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  listContentModels,
  findContentModel,
  createContentModel,
  updateContentModel,
  deleteContentModel,
  listContentItems,
  findContentItem,
  findSingletonContent,
  createContentItem,
  updateContentItem,
  updateSingletonContent,
  deleteContentItem,
} from '../../../src/services/content';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createTenant } from '../../../src/services/tenant';
import { createTestContentModel, testContentModels, testContentItems } from '../../fixtures/factories';

describe('Content Service', () => {
  const TENANT_SLUG = 'test-tenant';

  beforeEach(() => {
    setupTestEnvironment();
    createTenant(TENANT_SLUG, 'Test Tenant', 'pass');
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('Content Models', () => {
    describe('listContentModels', () => {
      test('should return empty array when no models exist', () => {
        const models = listContentModels(TENANT_SLUG);
        expect(models).toEqual([]);
      });

      test('should return all content models', () => {
        createContentModel(TENANT_SLUG, testContentModels.events);
        createContentModel(TENANT_SLUG, testContentModels.siteSettings);

        const models = listContentModels(TENANT_SLUG);
        expect(models).toHaveLength(2);
      });
    });

    describe('findContentModel', () => {
      test('should find existing model', () => {
        createContentModel(TENANT_SLUG, testContentModels.events);

        const model = findContentModel(TENANT_SLUG, 'events');
        expect(model).toBeDefined();
        expect(model?.slug).toBe('events');
        expect(model?.name).toBe('Events');
        expect(model?.type).toBe('collection');
        expect(model?.fields).toHaveLength(4);
      });

      test('should return null for non-existent model', () => {
        const model = findContentModel(TENANT_SLUG, 'non-existent');
        expect(model).toBeNull();
      });
    });

    describe('createContentModel', () => {
      test('should create collection model', () => {
        createContentModel(TENANT_SLUG, testContentModels.events);

        const model = findContentModel(TENANT_SLUG, 'events');
        expect(model).toBeDefined();
        expect(model?.type).toBe('collection');
      });

      test('should create singleton model', () => {
        createContentModel(TENANT_SLUG, testContentModels.siteSettings);

        const model = findContentModel(TENANT_SLUG, 'site_settings');
        expect(model).toBeDefined();
        expect(model?.type).toBe('singleton');
      });

      test('should reject invalid model slug', () => {
        expect(() => {
          createContentModel(TENANT_SLUG, {
            ...testContentModels.events,
            slug: 'invalid-slug',
          });
        }).toThrow('Model slug must contain only lowercase letters, numbers, and underscores');
      });

      test('should reject duplicate model slug', () => {
        createContentModel(TENANT_SLUG, testContentModels.events);

        expect(() => {
          createContentModel(TENANT_SLUG, testContentModels.events);
        }).toThrow('Content model with this slug already exists');
      });

      test('should allow underscores in slug', () => {
        const model = createTestContentModel({ slug: 'my_test_model' });
        createContentModel(TENANT_SLUG, model);

        expect(findContentModel(TENANT_SLUG, 'my_test_model')).toBeDefined();
      });
    });

    describe('updateContentModel', () => {
      test('should update model name', () => {
        createContentModel(TENANT_SLUG, testContentModels.events);

        updateContentModel(TENANT_SLUG, 'events', { name: 'Updated Events' });

        const model = findContentModel(TENANT_SLUG, 'events');
        expect(model?.name).toBe('Updated Events');
      });

      test('should update model fields', () => {
        createContentModel(TENANT_SLUG, testContentModels.events);

        const newFields = [
          { name: 'title', type: 'text' as const, required: true },
          { name: 'content', type: 'markdown' as const },
        ];

        updateContentModel(TENANT_SLUG, 'events', { fields: newFields });

        const model = findContentModel(TENANT_SLUG, 'events');
        expect(model?.fields).toHaveLength(2);
        expect(model?.fields[1].type).toBe('markdown');
      });
    });

    describe('deleteContentModel', () => {
      test('should delete content model', () => {
        createContentModel(TENANT_SLUG, testContentModels.events);
        expect(findContentModel(TENANT_SLUG, 'events')).toBeDefined();

        deleteContentModel(TENANT_SLUG, 'events');

        expect(findContentModel(TENANT_SLUG, 'events')).toBeNull();
      });
    });
  });

  describe('Content Items - Collection', () => {
    beforeEach(() => {
      createContentModel(TENANT_SLUG, testContentModels.events);
    });

    describe('listContentItems', () => {
      test('should return empty array when no items exist', () => {
        const items = listContentItems(TENANT_SLUG, 'events');
        expect(items).toEqual([]);
      });

      test('should return all content items', () => {
        createContentItem(TENANT_SLUG, 'events', testContentItems.event1);
        createContentItem(TENANT_SLUG, 'events', testContentItems.event2);

        const items = listContentItems(TENANT_SLUG, 'events');
        expect(items).toHaveLength(2);
      });
    });

    describe('createContentItem', () => {
      test('should create content item', () => {
        const id = createContentItem(TENANT_SLUG, 'events', testContentItems.event1);

        expect(id).toBeGreaterThan(0);

        const item = findContentItem(TENANT_SLUG, 'events', id);
        expect(item?.title).toBe('Summer Festival');
      });

      test('should reject missing required fields', () => {
        expect(() => {
          createContentItem(TENANT_SLUG, 'events', {
            description: 'Missing title',
          });
        }).toThrow("Field 'title' is required");
      });

      test('should reject creating item for singleton', () => {
        createContentModel(TENANT_SLUG, testContentModels.siteSettings);

        expect(() => {
          createContentItem(TENANT_SLUG, 'site_settings', testContentItems.siteSettings);
        }).toThrow('Cannot create items for singleton models');
      });

      test('should reject for non-existent model', () => {
        expect(() => {
          createContentItem(TENANT_SLUG, 'non-existent', { title: 'Test' });
        }).toThrow('Content model not found');
      });
    });

    describe('findContentItem', () => {
      test('should find content item by id', () => {
        const id = createContentItem(TENANT_SLUG, 'events', testContentItems.event1);

        const item = findContentItem(TENANT_SLUG, 'events', id);
        expect(item).toBeDefined();
        expect(item?.title).toBe('Summer Festival');
      });

      test('should return null for non-existent item', () => {
        const item = findContentItem(TENANT_SLUG, 'events', 99999);
        expect(item).toBeNull();
      });
    });

    describe('updateContentItem', () => {
      test('should update content item', () => {
        const id = createContentItem(TENANT_SLUG, 'events', testContentItems.event1);

        updateContentItem(TENANT_SLUG, 'events', id, {
          title: 'Updated Festival',
        });

        const item = findContentItem(TENANT_SLUG, 'events', id);
        expect(item?.title).toBe('Updated Festival');
        expect(item?.description).toBe(testContentItems.event1.description); // Unchanged
      });

      test('should reject updating singleton with updateContentItem', () => {
        createContentModel(TENANT_SLUG, testContentModels.siteSettings);

        expect(() => {
          updateContentItem(TENANT_SLUG, 'site_settings', 1, { site_name: 'Test' });
        }).toThrow('Use updateSingletonContent for singleton models');
      });
    });

    describe('deleteContentItem', () => {
      test('should delete content item', () => {
        const id = createContentItem(TENANT_SLUG, 'events', testContentItems.event1);
        expect(findContentItem(TENANT_SLUG, 'events', id)).toBeDefined();

        deleteContentItem(TENANT_SLUG, 'events', id);

        expect(findContentItem(TENANT_SLUG, 'events', id)).toBeNull();
      });

      test('should reject deleting singleton content', () => {
        createContentModel(TENANT_SLUG, testContentModels.siteSettings);

        expect(() => {
          deleteContentItem(TENANT_SLUG, 'site_settings', 1);
        }).toThrow('Cannot delete singleton content');
      });
    });
  });

  describe('Content Items - Singleton', () => {
    beforeEach(() => {
      createContentModel(TENANT_SLUG, testContentModels.siteSettings);
    });

    describe('findSingletonContent', () => {
      test('should return null when no content exists', () => {
        const content = findSingletonContent(TENANT_SLUG, 'site_settings');
        expect(content).toBeNull();
      });

      test('should return singleton content', () => {
        updateSingletonContent(TENANT_SLUG, 'site_settings', testContentItems.siteSettings);

        const content = findSingletonContent(TENANT_SLUG, 'site_settings');
        expect(content).toBeDefined();
        expect(content?.site_name).toBe('Test Site');
      });
    });

    describe('updateSingletonContent', () => {
      test('should create singleton content if not exists', () => {
        updateSingletonContent(TENANT_SLUG, 'site_settings', testContentItems.siteSettings);

        const content = findSingletonContent(TENANT_SLUG, 'site_settings');
        expect(content?.site_name).toBe('Test Site');
      });

      test('should update existing singleton content', () => {
        updateSingletonContent(TENANT_SLUG, 'site_settings', testContentItems.siteSettings);
        updateSingletonContent(TENANT_SLUG, 'site_settings', {
          site_name: 'Updated Site',
        });

        const content = findSingletonContent(TENANT_SLUG, 'site_settings');
        expect(content?.site_name).toBe('Updated Site');
        expect(content?.tagline).toBe(testContentItems.siteSettings.tagline); // Unchanged
      });

      test('should reject updating collection with updateSingletonContent', () => {
        createContentModel(TENANT_SLUG, testContentModels.events);

        expect(() => {
          updateSingletonContent(TENANT_SLUG, 'events', { title: 'Test' });
        }).toThrow('Use updateContentItem for collection models');
      });
    });
  });
});
