# Testing Guide for dustCMS

## Overview

The test suite for dustCMS follows state-of-the-art best practices with comprehensive unit tests, integration tests, and end-to-end tests.

## Test Structure

```
tests/
├── unit/               # Unit tests for individual functions
│   ├── services/       # Service layer tests
│   └── middleware/     # Middleware tests
├── integration/        # Integration tests for API endpoints
│   └── api/            # API route tests
├── e2e/               # End-to-end workflow tests
├── fixtures/          # Test data and factories
└── utils/             # Test utilities and helpers
```

## Running Tests

### Run All Tests

```bash
bun test
```

### Run Specific Test Suites

```bash
# Unit tests only
bun test:unit

# Integration tests only
bun test:integration

# E2E tests only
bun test:e2e
```

### Run Tests in Watch Mode

```bash
bun test:watch
```

### Run Tests with Coverage

```bash
bun test:coverage
```

### Run Specific Test File

```bash
bun test tests/unit/services/auth.test.ts
```

## Test Categories

### Unit Tests

Unit tests focus on testing individual functions and services in isolation.

**Coverage:**
- `services/auth.test.ts` - Authentication service (password hashing, verification, sessions)
- `services/tenant.test.ts` - Tenant management (CRUD operations, validation)
- `services/content.test.ts` - Content models and items (dynamic schemas, validation)
- `middleware/auth.test.ts` - Authentication middleware (route protection)

**Key Features:**
- Isolated from external dependencies
- Fast execution
- Comprehensive edge case testing
- Input validation testing

### Integration Tests

Integration tests verify that different components work together correctly, especially API endpoints.

**Coverage:**
- `api/auth.test.ts` - Authentication endpoints (login, logout, setup)
- `api/tenants.test.ts` - Tenant management API (CRUD operations)
- `api/content.test.ts` - Content management API (models, items, public access)

**Key Features:**
- Full HTTP request/response cycle
- Database interactions
- Authentication flows
- Error handling
- Status code verification

### E2E Tests

End-to-end tests simulate real user workflows from start to finish.

**Coverage:**
- `full-workflow.test.ts` - Complete CMS workflow (setup → tenant → content → API)
  - Initial setup wizard
  - Super admin authentication
  - Tenant creation
  - Content model definition
  - Content item management
  - Public API access
  - Resource cleanup

**Key Features:**
- Multi-step workflows
- Realistic user scenarios
- Cross-component integration
- Data persistence verification

## Test Utilities

### Test Helpers (`tests/utils/test-helpers.ts`)

- `setupTestEnvironment()` - Initialize test environment
- `cleanupTestEnvironment()` - Clean up after tests
- `createTestApp()` - Create Elysia app instance
- `createTestSuperAdmin()` - Create test super admin with session
- `makeRequest()` - Make HTTP request without auth
- `makeAuthenticatedRequest()` - Make HTTP request with session token
- `expectStatus()` - Assert response status code
- `expectJson()` - Parse and return JSON response

### Test Database (`tests/utils/test-db.ts`)

- `setupTestDataDir()` - Create test data directory
- `cleanupTestDataDir()` - Remove test data
- `createTestSystemDb()` - Initialize system database
- `createTestTenantDb()` - Initialize tenant database

### Test Fixtures (`tests/fixtures/factories.ts`)

Pre-defined test data for consistent testing:
- `testSuperAdmin` - Super admin credentials
- `createTestTenant()` - Tenant factory
- `createTestContentModel()` - Content model factory
- `testContentModels` - Pre-defined models (events, site settings)
- `testContentItems` - Pre-defined content items

## Best Practices

### Test Isolation

Each test is completely isolated:
- Fresh database for each test
- Clean test data directory
- No shared state between tests

### Arrange-Act-Assert Pattern

```typescript
test('should create tenant', () => {
  // Arrange
  setupTestEnvironment();

  // Act
  const tenant = createTenant('test', 'Test', 'pass');

  // Assert
  expect(tenant.slug).toBe('test');
});
```

### Descriptive Test Names

Test names clearly describe what is being tested:
```typescript
test('should reject invalid slug with uppercase')
test('should return empty array when no tenants exist')
test('should require authentication for admin routes')
```

### Comprehensive Coverage

Tests cover:
- ✅ Happy paths (successful operations)
- ✅ Error cases (validation failures, not found errors)
- ✅ Edge cases (empty data, boundary conditions)
- ✅ Security (authentication, authorization)
- ✅ Data integrity (database operations)

### Before/After Hooks

Consistent setup and cleanup:
```typescript
describe('Test Suite', () => {
  beforeEach(() => {
    setupTestEnvironment();
    // Additional setup
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });
});
```

## Writing New Tests

### Unit Test Template

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { yourFunction } from '../../../src/your-module';

describe('Your Module', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  test('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = yourFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Integration Test Template

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  createTestApp,
  createTestSuperAdmin,
  makeAuthenticatedRequest,
  expectStatus,
  expectJson,
} from '../../utils/test-helpers';

describe('API Endpoint', () => {
  let app: any;
  let sessionToken: string;

  beforeEach(async () => {
    setupTestEnvironment();
    app = createTestApp();
    sessionToken = await createTestSuperAdmin();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  test('should return expected response', async () => {
    const response = await makeAuthenticatedRequest(
      app,
      'GET',
      '/api/endpoint',
      { sessionToken }
    );

    expectStatus(response, 200);
    const data = await expectJson(response);
    expect(data).toBeDefined();
  });
});
```

## Continuous Integration

Tests are designed to run in CI/CD pipelines:
- No external dependencies
- Fast execution (< 5 seconds for full suite)
- Deterministic results
- No flaky tests
- Clean state between runs

## Test Metrics

Current test coverage:

- **Unit Tests**: 3 test files, 50+ tests
- **Integration Tests**: 3 test files, 40+ tests
- **E2E Tests**: 1 test file, 2 comprehensive workflows

Total: **90+ tests** covering all critical paths

## Debugging Tests

### Run Single Test

```bash
bun test --test-name-pattern "should create tenant"
```

### Verbose Output

```bash
bun test --verbose
```

### Debug Mode

Add `console.log()` statements in tests or use Bun's debugger.

## Common Issues

### Test Data Not Cleaning Up

Ensure `cleanupTestEnvironment()` is called in `afterEach()`.

### Tests Interfering With Each Other

Each test should be isolated. Check that you're not sharing state.

### Database Locked Errors

Close database connections properly in cleanup.

## Contributing

When adding new features:
1. Write unit tests for new services/functions
2. Write integration tests for new API endpoints
3. Update E2E tests if workflow changes
4. Maintain >80% code coverage
5. Follow existing test patterns
