import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { listTenants, findTenant, createTenant, updateTenant, deleteTenant } from '../../../src/services/tenant';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createTestTenant } from '../../fixtures/factories';
import { existsSync } from 'fs';
import { join } from 'path';
import { config } from '../../../src/config';

describe('Tenant Service', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('listTenants', () => {
    test('should return empty array when no tenants exist', () => {
      const tenants = listTenants();
      expect(tenants).toEqual([]);
    });

    test('should return all tenants', () => {
      createTenant('tenant1', 'Tenant One', 'pass1');
      createTenant('tenant2', 'Tenant Two', 'pass2');

      const tenants = listTenants();
      expect(tenants).toHaveLength(2);
      expect(tenants[0].slug).toBe('tenant2'); // Ordered by created_at DESC
      expect(tenants[1].slug).toBe('tenant1');
    });
  });

  describe('findTenant', () => {
    test('should find existing tenant', () => {
      createTenant('test-tenant', 'Test Tenant', 'testpass');

      const tenant = findTenant('test-tenant');
      expect(tenant).toBeDefined();
      expect(tenant?.slug).toBe('test-tenant');
      expect(tenant?.name).toBe('Test Tenant');
      expect(tenant?.password).toBe('testpass');
    });

    test('should return null for non-existent tenant', () => {
      const tenant = findTenant('non-existent');
      expect(tenant).toBeNull();
    });
  });

  describe('createTenant', () => {
    test('should create tenant successfully', () => {
      const tenant = createTenant('acme-corp', 'ACME Corporation', 'acmepass');

      expect(tenant).toBeDefined();
      expect(tenant.slug).toBe('acme-corp');
      expect(tenant.name).toBe('ACME Corporation');
      expect(tenant.password).toBe('acmepass');
      expect(tenant.created_at).toBeGreaterThan(0);
    });

    test('should create tenant directories', () => {
      createTenant('test-tenant', 'Test Tenant', 'testpass');

      const tenantDir = join(config.dataDir, 'tenants', 'test-tenant');
      const imagesDir = join(tenantDir, 'images');

      expect(existsSync(tenantDir)).toBe(true);
      expect(existsSync(imagesDir)).toBe(true);
    });

    test('should reject invalid slug with uppercase', () => {
      expect(() => {
        createTenant('Invalid-Slug', 'Test', 'pass');
      }).toThrow('Tenant slug must contain only lowercase letters, numbers, and hyphens');
    });

    test('should reject invalid slug with spaces', () => {
      expect(() => {
        createTenant('invalid slug', 'Test', 'pass');
      }).toThrow('Tenant slug must contain only lowercase letters, numbers, and hyphens');
    });

    test('should reject invalid slug with special characters', () => {
      expect(() => {
        createTenant('invalid@slug', 'Test', 'pass');
      }).toThrow('Tenant slug must contain only lowercase letters, numbers, and hyphens');
    });

    test('should reject duplicate tenant slug', () => {
      createTenant('duplicate', 'First Tenant', 'pass1');

      expect(() => {
        createTenant('duplicate', 'Second Tenant', 'pass2');
      }).toThrow('Tenant with this slug already exists');
    });

    test('should allow hyphens in slug', () => {
      const tenant = createTenant('my-test-tenant', 'Test', 'pass');
      expect(tenant.slug).toBe('my-test-tenant');
    });

    test('should allow numbers in slug', () => {
      const tenant = createTenant('tenant123', 'Test', 'pass');
      expect(tenant.slug).toBe('tenant123');
    });
  });

  describe('updateTenant', () => {
    test('should update tenant name', () => {
      createTenant('test-tenant', 'Old Name', 'pass');

      updateTenant('test-tenant', { name: 'New Name' });

      const tenant = findTenant('test-tenant');
      expect(tenant?.name).toBe('New Name');
      expect(tenant?.password).toBe('pass'); // Unchanged
    });

    test('should update tenant password', () => {
      createTenant('test-tenant', 'Test', 'oldpass');

      updateTenant('test-tenant', { password: 'newpass' });

      const tenant = findTenant('test-tenant');
      expect(tenant?.password).toBe('newpass');
    });

    test('should update multiple fields', () => {
      createTenant('test-tenant', 'Old Name', 'oldpass');

      updateTenant('test-tenant', { name: 'New Name', password: 'newpass' });

      const tenant = findTenant('test-tenant');
      expect(tenant?.name).toBe('New Name');
      expect(tenant?.password).toBe('newpass');
    });

    test('should not update slug', () => {
      createTenant('test-tenant', 'Test', 'pass');

      updateTenant('test-tenant', { slug: 'new-slug' } as any);

      const tenant = findTenant('test-tenant');
      expect(tenant).toBeDefined();
      expect(findTenant('new-slug')).toBeNull();
    });
  });

  describe('deleteTenant', () => {
    test('should delete tenant from database', () => {
      createTenant('test-tenant', 'Test', 'pass');
      expect(findTenant('test-tenant')).toBeDefined();

      deleteTenant('test-tenant');

      expect(findTenant('test-tenant')).toBeNull();
    });

    test('should delete tenant directory', () => {
      createTenant('test-tenant', 'Test', 'pass');
      const tenantDir = join(config.dataDir, 'tenants', 'test-tenant');
      expect(existsSync(tenantDir)).toBe(true);

      deleteTenant('test-tenant');

      expect(existsSync(tenantDir)).toBe(false);
    });

    test('should handle deleting non-existent tenant gracefully', () => {
      expect(() => deleteTenant('non-existent')).not.toThrow();
    });
  });
});
