# Test Suite

This directory contains unit tests for the IKFast Online Generator.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- test/auth.test.js
```

## Test Files

### auth.test.js
Tests for the `AuthenticationManager` class:
- Token storage and retrieval (6 tests)
- Token validation (8 tests)
- Authentication state management (2 tests)

**Total: 16 tests**

### github-api.test.js
Tests for the `GitHubAPIClient` class:
- API request formatting (3 tests)
- Error handling for various HTTP status codes (6 tests)
- File upload functionality (3 tests)
- Workflow triggering (2 tests)
- Workflow run details (1 test)
- Artifact listing (1 test)
- Artifact downloading (1 test)
- Active workflow detection (2 tests)

**Total: 19 tests**

### workflow.test.js
Tests for the GitHub Actions workflow file:
- YAML syntax validation (6 tests)
- Workflow configuration (3 tests)
- Workflow steps (6 tests)
- Docker configuration (3 tests)
- Info mode workflow (4 tests)
- Generate mode workflow (6 tests)
- Artifact upload (4 tests)
- Input validation (4 tests)
- Error handling (3 tests)
- Log output (2 tests)

**Total: 41 tests**

## Test Framework

- **Vitest**: Fast unit test framework
- **happy-dom**: Lightweight DOM implementation for testing
- **vi**: Mocking and spying utilities

## Coverage

Run `npm run test:coverage` to generate a coverage report.
