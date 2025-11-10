# Testing Guide

## Overview

This project uses [Vitest](https://vitest.dev/) as the testing framework with Vue Test Utils for component testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test:ui

# Run tests with coverage
npm test:coverage
```

## Test Structure

```
tests/
├── setup.ts                    # Global test setup
├── commandParser.test.ts       # Command parser tests
├── combatSystem.test.ts        # Combat system tests (to be added)
└── utils/                      # Utility function tests
    ├── validation.test.ts
    └── helpSystem.test.ts
```

## Writing Tests

### Unit Tests

Unit tests should test individual functions or classes in isolation.

Example:
```typescript
import { describe, it, expect } from 'vitest'
import { parseCommand } from '../server/utils/commandParser'

describe('Command Parser', () => {
  it('should parse movement commands', () => {
    const result = parseCommand('go north')
    expect(result.command).toBe('go')
    expect(result.args).toContain('north')
  })
})
```

### Component Tests

Component tests use Vue Test Utils to test Vue components.

Example:
```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '../components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test' }
    })
    expect(wrapper.text()).toContain('Test')
  })
})
```

### Integration Tests

Integration tests test multiple components working together.

Example:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('Combat System Integration', () => {
  beforeEach(() => {
    // Setup test database or mock data
  })

  it('should complete a full combat cycle', async () => {
    // Test complete combat flow
  })
})
```

## Test Coverage Goals

- **Overall**: Minimum 70% coverage
- **Critical Utilities**: 90%+ coverage
  - Command parser
  - Combat system
  - Validation utilities
  - Game state management
- **API Endpoints**: 80%+ coverage
- **Components**: 60%+ coverage (focus on business logic)

## Mocking

### Mocking MongoDB

```typescript
import { vi } from 'vitest'

vi.mock('../models/Player', () => ({
  PlayerSchema: {
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  }
}))
```

### Mocking WebSocket

```typescript
import { vi } from 'vitest'

const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  on: vi.fn(),
}
```

## Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested
   - ✅ `should parse "go north" correctly`
   - ❌ `test1`

2. **Arrange-Act-Assert**: Structure tests clearly
   ```typescript
   it('should increase player HP when using potion', () => {
     // Arrange
     const player = { hp: 50, maxHp: 100 }
     const potion = { healing: 30 }
     
     // Act
     const newHp = usePotion(player, potion)
     
     // Assert
     expect(newHp).toBe(80)
   })
   ```

3. **Test Independence**: Each test should be independent
   - Don't rely on order of execution
   - Clean up after each test
   - Use `beforeEach` and `afterEach` for setup/teardown

4. **Mock External Dependencies**: Mock database, API calls, file system, etc.

5. **Test Edge Cases**: Don't just test happy paths
   - Empty inputs
   - Invalid inputs
   - Boundary values
   - Error conditions

6. **Keep Tests Fast**: Unit tests should run in milliseconds
   - Use mocks instead of real database
   - Avoid network calls
   - Minimize file I/O

## CI/CD Integration

Tests run automatically on:
- Every push to `main`, `develop`, or `copilot/**` branches
- Every pull request to `main` or `develop`

The CI pipeline will fail if:
- Any test fails
- Coverage drops below threshold
- Build fails

## Debugging Tests

### Run Single Test File
```bash
npm test tests/commandParser.test.ts
```

### Run Specific Test
```bash
npm test -t "should parse movement commands"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Common Issues

### "Cannot find module" errors
- Ensure paths in test files match the actual file structure
- Check `vitest.config.ts` for correct alias configuration

### Tests timing out
- Increase timeout for slow tests: `it('slow test', { timeout: 10000 }, async () => {})`
- Check for unresolved promises
- Ensure mocks are properly set up

### Flaky tests
- Tests that pass/fail randomly are usually due to:
  - Shared state between tests
  - Race conditions with async operations
  - Time-dependent logic
- Fix by ensuring test independence and proper async handling

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Best Practices](https://testingjavascript.com/)
