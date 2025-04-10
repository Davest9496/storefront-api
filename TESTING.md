# Testing Guide for E-commerce Backend API

This document provides comprehensive guidance for testing the e-commerce backend API using Jest.

## Setup and Configuration

The project uses Jest for testing, with TypeScript support via ts-jest. Tests are organized into unit tests and integration tests.

### Test Environment

- Tests run against a dedicated test database (`storefront_test`)
- Environment variables for tests are loaded from `.env.test`
- Each test run starts with a clean database state

## Running Tests

### Prerequisites

Make sure you have PostgreSQL installed and running. The test database will be created automatically.

### Basic Test Commands

```bash
# Setup the test database (run this first)
npm run test:setup

# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests with coverage report
npm run test:coverage

# One-step setup and run tests (useful for CI)
npm run prepare-test
```

## Test Organization

Tests are organized in the `src/__tests__` directory:

```
src/__tests__/
├── unit/                # Unit tests for isolated components
│   ├── auth.controller.test.ts
│   ├── auth.middleware.test.ts
│   └── password.utils.test.ts
├── integration/         # Integration tests for API endpoints
│   └── auth.routes.test.ts
└── helpers/             # Test helpers and utilities
    └── test-utils.ts
```

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions or classes in isolation. Dependencies are mocked.

```typescript
// Example unit test for a utility function
import { hashPassword } from '../../utils/password.utils';

describe('Password Utilities', () => {
  it('should hash a password', async () => {
    const password = 'TestPassword123!';
    const hashedPassword = await hashPassword(password);

    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toEqual(password);
    expect(hashedPassword.startsWith('$2b$')).toBe(true);
  });
});
```

### Integration Tests

Integration tests focus on testing API endpoints and how components work together.

```typescript
// Example integration test for an API endpoint
import request from 'supertest';
import app from '../../app';

describe('Authentication Routes', () => {
  it('should login a user with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'TestPassword123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
```

## Test Database

A separate test database is used to isolate tests from development and production data.

### Database Setup

Before running tests, the test database needs to be set up:

```bash
npm run test:setup
```

This command:

1. Creates (or recreates) the test database
2. Configures the schema
3. Loads minimal test data

### Test Helpers

The `src/__tests__/helpers/test-utils.ts` file contains utilities for:

- Initializing the test database connection
- Creating test users
- Generating authentication tokens
- Cleaning up test data

```typescript
// Example of using test helpers
import { createTestUser, generateTestToken } from '../helpers/test-utils';

// Create a test user
const testUser = await createTestUser('Test', 'User', 'test@example.com', 'Password123!');

// Generate an authentication token
const token = generateTestToken(testUser);
```

## Mocking

Mocking is used to isolate the code being tested.

### Mocking Dependencies

```typescript
// Example of mocking dependencies
jest.mock('../../utils/jwt.utils');
jest.mock('../../repositories/user.repository');

// Setup mock implementations in beforeEach
beforeEach(() => {
  (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ id: 1 });
  (userRepository.findOne as jest.Mock).mockResolvedValue({ id: 1, email: 'test@example.com' });
});
```

### Mocking Request Objects

```typescript
// Example of mocking Express request/response objects
const mockRequest = {
  body: { email: 'test@example.com', password: 'password123' },
  headers: { authorization: 'Bearer token' },
  user: { id: 1, email: 'test@example.com' },
};

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};

const mockNext = jest.fn();
```

## Test Coverage

Jest is configured to collect test coverage information. Run with:

```bash
npm run test:coverage
```

Coverage results are stored in the `coverage` directory.

## Continuous Integration

Tests automatically run on GitHub Actions when:

- Code is pushed to main or develop branches
- Pull requests are opened against main or develop

The workflow:

1. Sets up Node.js and PostgreSQL
2. Creates the test database
3. Runs all tests
4. Uploads coverage reports

## Best Practices

1. **Test in isolation**: Unit tests should focus on testing a single function or component.

2. **Use descriptive test names**: Your test names should clearly describe what is being tested.

3. **Follow the AAA pattern**:

   - Arrange: Set up the test data and conditions
   - Act: Perform the action to be tested
   - Assert: Verify the result

4. **Keep tests independent**: Each test should be able to run on its own.

5. **Test error cases**: Don't just test the happy path; test error conditions as well.

6. **Use beforeEach/afterEach**: Set up and tear down test data for each test.

7. **Mock external dependencies**: Use Jest's mocking capabilities to isolate your code.

8. **Run tests before committing**: Make sure all tests pass before pushing code.

## Troubleshooting

### Database Connection Issues

If tests fail with database connection errors:

1. Make sure PostgreSQL is running
2. Check database credentials in `.env.test`
3. Try manually running `npm run test:setup`

### Test Timeouts

If tests time out:

1. Increase the timeout in `jest.setup.js`
2. Check for any long-running operations or infinite loops

### Mock Reset Issues

If tests are failing because mocks have unexpected values:

1. Make sure you're clearing mocks between tests with `jest.clearAllMocks()`
2. Check if any mocks are being set up at the describe level but not reset between tests
