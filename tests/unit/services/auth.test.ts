import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { hashPassword, verifyPassword, authenticateSuperAdmin, validateSession, logout } from '../../../src/services/auth';
import { setupTestEnvironment, cleanupTestEnvironment, createTestSuperAdmin } from '../../utils/test-helpers';
import { createSuperAdmin, getSession } from '../../../src/db/system';

describe('Auth Service', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('hashPassword', () => {
    test('should hash password successfully', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    test('should generate different hashes for same password', async () => {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    test('should verify correct password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hash = await hashPassword(password);

      const result = await verifyPassword(wrongPassword, hash);
      expect(result).toBe(false);
    });

    test('should reject empty password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      const result = await verifyPassword('', hash);
      expect(result).toBe(false);
    });
  });

  describe('authenticateSuperAdmin', () => {
    test('should authenticate valid super admin', async () => {
      const email = 'admin@test.com';
      const password = 'testpass123';
      const passwordHash = await hashPassword(password);
      createSuperAdmin(email, passwordHash);

      const token = await authenticateSuperAdmin(email, password);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token!.length).toBeGreaterThan(10);
    });

    test('should reject invalid email', async () => {
      const email = 'admin@test.com';
      const password = 'testpass123';
      const passwordHash = await hashPassword(password);
      createSuperAdmin(email, passwordHash);

      const token = await authenticateSuperAdmin('wrong@test.com', password);

      expect(token).toBeNull();
    });

    test('should reject invalid password', async () => {
      const email = 'admin@test.com';
      const password = 'testpass123';
      const passwordHash = await hashPassword(password);
      createSuperAdmin(email, passwordHash);

      const token = await authenticateSuperAdmin(email, 'wrongpassword');

      expect(token).toBeNull();
    });

    test('should reject when no super admin exists', async () => {
      const token = await authenticateSuperAdmin('admin@test.com', 'testpass123');
      expect(token).toBeNull();
    });
  });

  describe('validateSession', () => {
    test('should validate valid session token', async () => {
      const token = await createTestSuperAdmin();

      const result = validateSession(token);
      expect(result).toBe(true);
    });

    test('should reject invalid session token', () => {
      const result = validateSession('invalid-token-12345');
      expect(result).toBe(false);
    });

    test('should reject empty session token', () => {
      const result = validateSession('');
      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    test('should delete session on logout', async () => {
      const token = await createTestSuperAdmin();

      // Verify session exists
      expect(validateSession(token)).toBe(true);

      // Logout
      logout(token);

      // Verify session is deleted
      expect(validateSession(token)).toBe(false);
    });

    test('should handle logout with invalid token gracefully', () => {
      expect(() => logout('invalid-token')).not.toThrow();
    });
  });
});
