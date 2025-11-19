import type { Tenant, ContentModel, Field, ContentItem, SuperAdmin } from '../../src/models/types';

export const testSuperAdmin: SuperAdmin = {
  email: 'admin@test.com',
  password_hash: '$2b$10$test.hash.for.testing',
};

export function createTestTenant(overrides?: Partial<Tenant>): Tenant {
  return {
    slug: 'test-tenant',
    name: 'Test Tenant',
    password: 'testpass123',
    created_at: Date.now(),
    ...overrides,
  };
}

export function createTestContentModel(overrides?: Partial<ContentModel>): ContentModel {
  return {
    slug: 'test_model',
    name: 'Test Model',
    type: 'collection',
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'textarea' },
    ],
    ...overrides,
  };
}

export function createTestField(overrides?: Partial<Field>): Field {
  return {
    name: 'test_field',
    type: 'text',
    required: false,
    ...overrides,
  };
}

export function createTestContentItem(overrides?: Partial<ContentItem>): ContentItem {
  return {
    title: 'Test Item',
    description: 'Test description',
    ...overrides,
  };
}

export const testContentModels = {
  events: {
    slug: 'events',
    name: 'Events',
    type: 'collection' as const,
    fields: [
      { name: 'title', type: 'text' as const, required: true },
      { name: 'date', type: 'date' as const, required: true },
      { name: 'description', type: 'textarea' as const },
      { name: 'image_url', type: 'image' as const },
    ],
  },
  siteSettings: {
    slug: 'site_settings',
    name: 'Site Settings',
    type: 'singleton' as const,
    fields: [
      { name: 'site_name', type: 'text' as const, required: true },
      { name: 'tagline', type: 'text' as const },
      { name: 'logo', type: 'image' as const },
    ],
  },
};

export const testContentItems = {
  event1: {
    title: 'Summer Festival',
    date: '2024-07-15',
    description: 'Annual summer festival with live music',
    image_url: '/images/festival.webp',
  },
  event2: {
    title: 'Winter Carnival',
    date: '2024-12-20',
    description: 'Festive winter carnival with ice skating',
  },
  siteSettings: {
    site_name: 'Test Site',
    tagline: 'Welcome to our test site',
    logo: '/images/logo.webp',
  },
};
