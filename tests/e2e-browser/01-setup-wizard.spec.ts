import { test, expect } from '@playwright/test';
import { cleanupTestDataDir, setupTestDataDir } from '../utils/test-db';

test.describe('Setup Wizard', () => {
  test.beforeEach(async () => {
    setupTestDataDir();
  });

  test.afterEach(async () => {
    cleanupTestDataDir();
  });

  test('should complete setup wizard successfully', async ({ page }) => {
    // Navigate to setup page
    await page.goto('/');

    // Should redirect to setup
    await expect(page).toHaveURL('/setup');
    await expect(page.locator('h1')).toContainText('Welcome to dustCMS');

    // Check that step 1 is visible
    await expect(page.locator('#step-1')).toBeVisible();
    await expect(page.locator('.alert-info')).toContainText('Step 1 of 2');

    // Fill in base domain
    const baseDomainInput = page.locator('#base-domain');
    await expect(baseDomainInput).toBeVisible();
    await baseDomainInput.fill('cms.example.com');

    // Click continue to step 2
    await page.locator('#step-1 button').click();

    // Verify step 2 is now visible
    await expect(page.locator('#step-2')).toBeVisible();
    await expect(page.locator('.alert-info')).toContainText('Step 2 of 2');

    // Fill in super admin details
    await page.locator('#admin-email').fill('admin@example.com');
    await page.locator('#admin-password').fill('SuperSecure123!');
    await page.locator('#admin-password-confirm').fill('SuperSecure123!');

    // Submit setup
    await page.locator('#submit-btn').click();

    // Should redirect to login page
    await expect(page).toHaveURL('/admin/login', { timeout: 5000 });
    await expect(page.locator('h1')).toContainText('Super Admin Login');
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/setup');

    // Go to step 2
    await page.locator('#base-domain').fill('test.com');
    await page.locator('#step-1 button').click();

    // Try with short password
    await page.locator('#admin-email').fill('admin@test.com');
    await page.locator('#admin-password').fill('short');
    await page.locator('#admin-password-confirm').fill('short');
    await page.locator('#submit-btn').click();

    // Should show error
    await expect(page.locator('#error-message')).toBeVisible();
    await expect(page.locator('#error-text')).toContainText('at least 8 characters');
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/setup');

    // Go to step 2
    await page.locator('#base-domain').fill('test.com');
    await page.locator('#step-1 button').click();

    // Fill mismatched passwords
    await page.locator('#admin-email').fill('admin@test.com');
    await page.locator('#admin-password').fill('password123');
    await page.locator('#admin-password-confirm').fill('password456');
    await page.locator('#submit-btn').click();

    // Should show error
    await expect(page.locator('#error-message')).toBeVisible();
    await expect(page.locator('#error-text')).toContainText('do not match');
  });

  test('should allow going back to step 1', async ({ page }) => {
    await page.goto('/setup');

    // Go to step 2
    await page.locator('#base-domain').fill('first.com');
    await page.locator('#step-1 button').click();

    await expect(page.locator('#step-2')).toBeVisible();

    // Click back button
    await page.locator('#step-2 button:has-text("Back")').click();

    // Should be back on step 1
    await expect(page.locator('#step-1')).toBeVisible();
    await expect(page.locator('#base-domain')).toHaveValue('first.com');
  });
});
