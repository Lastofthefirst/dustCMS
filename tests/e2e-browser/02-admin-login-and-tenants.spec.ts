import { test, expect } from '@playwright/test';
import { cleanupTestDataDir, setupTestDataDir } from '../utils/test-db';
import { createTestSuperAdmin } from '../utils/test-helpers';

test.describe('Admin Login and Tenant Management', () => {
  test.beforeEach(async () => {
    setupTestDataDir();
  });

  test.afterEach(async () => {
    cleanupTestDataDir();
  });

  test('should login as super admin', async ({ page }) => {
    // Create super admin first
    await createTestSuperAdmin('admin@test.com', 'password123');

    // Navigate to login page
    await page.goto('/admin/login');

    // Verify login form is visible
    await expect(page.locator('h1')).toContainText('Super Admin Login');

    // Fill in credentials
    await page.locator('#email').fill('admin@test.com');
    await page.locator('#password').fill('password123');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/admin', { timeout: 5000 });
    await expect(page.locator('h1')).toContainText('Tenant Management');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await createTestSuperAdmin('admin@test.com', 'correctpass');

    await page.goto('/admin/login');

    // Try wrong password
    await page.locator('#email').fill('admin@test.com');
    await page.locator('#password').fill('wrongpass');
    await page.locator('button[type="submit"]').click();

    // Should show error message
    await expect(page.locator('#error-message')).toBeVisible();
    await expect(page.locator('#error-text')).toContainText('Invalid credentials');
  });

  test('should create a tenant through UI', async ({ page }) => {
    await createTestSuperAdmin();

    // Login
    await page.goto('/admin/login');
    await page.locator('#email').fill('admin@test.com');
    await page.locator('#password').fill('testpass123');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL('/admin');

    // Click "Create New Tenant" button
    await page.locator('button:has-text("Create New Tenant")').click();

    // Modal should open
    await expect(page.locator('#create-tenant-modal')).toBeVisible();

    // Fill in tenant details
    await page.locator('#tenant-slug').fill('acme-corp');
    await page.locator('#tenant-name').fill('ACME Corporation');
    await page.locator('#tenant-password').fill('acmepass123');

    // Submit form
    await page.locator('#create-tenant-form button[type="submit"]').click();

    // Modal should close and tenant should appear in list
    await expect(page.locator('#create-tenant-modal')).not.toBeVisible({ timeout: 5000 });

    // Verify tenant card appears
    await expect(page.locator('.card:has-text("ACME Corporation")')).toBeVisible();
    await expect(page.locator('text=acme-corp')).toBeVisible();

    // Verify tenant count updated
    await expect(page.locator('#tenant-count')).toHaveText('1');
  });

  test('should validate tenant slug format', async ({ page }) => {
    await createTestSuperAdmin();

    await page.goto('/admin/login');
    await page.locator('#email').fill('admin@test.com');
    await page.locator('#password').fill('testpass123');
    await page.locator('button[type="submit"]').click();

    await page.locator('button:has-text("Create New Tenant")').click();

    // Try invalid slug (uppercase)
    await page.locator('#tenant-slug').fill('Invalid-Slug');
    await page.locator('#tenant-name').fill('Test');
    await page.locator('#tenant-password').fill('pass');

    // Try to submit
    await page.locator('#create-tenant-form button[type="submit"]').click();

    // Should show validation error
    await expect(page.locator('#create-error')).toBeVisible();
  });

  test('should navigate to tenant management page', async ({ page }) => {
    await createTestSuperAdmin();

    await page.goto('/admin/login');
    await page.locator('#email').fill('admin@test.com');
    await page.locator('#password').fill('testpass123');
    await page.locator('button[type="submit"]').click();

    // Create a tenant first
    await page.locator('button:has-text("Create New Tenant")').click();
    await page.locator('#tenant-slug').fill('test-tenant');
    await page.locator('#tenant-name').fill('Test Tenant');
    await page.locator('#tenant-password').fill('pass');
    await page.locator('#create-tenant-form button[type="submit"]').click();

    await page.waitForTimeout(500); // Wait for modal to close

    // Click "Manage" button
    await page.locator('.card:has-text("Test Tenant") a:has-text("Manage")').click();

    // Should navigate to tenant page
    await expect(page).toHaveURL('/admin/tenants/test-tenant');
    await expect(page.locator('text=Test Tenant')).toBeVisible();
  });

  test('should delete a tenant', async ({ page }) => {
    await createTestSuperAdmin();

    await page.goto('/admin/login');
    await page.locator('#email').fill('admin@test.com');
    await page.locator('#password').fill('testpass123');
    await page.locator('button[type="submit"]').click();

    // Create a tenant
    await page.locator('button:has-text("Create New Tenant")').click();
    await page.locator('#tenant-slug').fill('delete-me');
    await page.locator('#tenant-name').fill('Delete Me');
    await page.locator('#tenant-password').fill('pass');
    await page.locator('#create-tenant-form button[type="submit"]').click();

    await page.waitForTimeout(500);

    // Verify tenant exists
    await expect(page.locator('.card:has-text("Delete Me")')).toBeVisible();

    // Handle confirmation dialog
    page.on('dialog', dialog => dialog.accept());

    // Click delete button
    await page.locator('.card:has-text("Delete Me") button.btn-error').click();

    // Tenant should be removed
    await expect(page.locator('.card:has-text("Delete Me")')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('#tenant-count')).toHaveText('0');
  });

  test('should logout successfully', async ({ page }) => {
    await createTestSuperAdmin();

    await page.goto('/admin/login');
    await page.locator('#email').fill('admin@test.com');
    await page.locator('#password').fill('testpass123');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL('/admin');

    // Click logout button
    await page.locator('button:has-text("Logout")').click();

    // Should redirect to login page
    await expect(page).toHaveURL('/admin/login', { timeout: 5000 });
  });
});
