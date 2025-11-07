# Contributing to Vong Tích Thành

Thank you for your interest in contributing to Vong Tích Thành! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or remote)
- npm or pnpm

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/pin705/vong_tich_thanh.git
   cd vong_tich_thanh
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Initialize the game world:
   ```bash
   # Start the dev server first
   npm run dev
   
   # In another terminal, initialize the world
   curl -X POST http://localhost:3000/api/init-world
   ```

## Development Workflow

1. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**:
   - Write clean, readable code
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   # Run tests
   npm test
   
   # Run type checking
   npx nuxi typecheck
   
   # Build the project
   npm run build
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid using `any` type
- Use meaningful variable and function names

### Vue Components

- Use Composition API with `<script setup>`
- Keep components focused and single-purpose
- Use props validation
- Emit events with proper typing

### File Naming

- Vue components: `PascalCase.vue` (e.g., `PlayerStatus.vue`)
- TypeScript files: `camelCase.ts` (e.g., `commandParser.ts`)
- Test files: `*.test.ts` (e.g., `commandParser.test.ts`)

### Code Organization

```typescript
// 1. Imports
import { ref, computed } from 'vue'
import type { Player } from '~/types'

// 2. Props and emits
const props = defineProps<{
  player: Player
}>()

const emit = defineEmits<{
  update: [player: Player]
}>()

// 3. Reactive state
const isLoading = ref(false)

// 4. Computed properties
const playerLevel = computed(() => props.player.level)

// 5. Functions
function updatePlayer() {
  // Implementation
}

// 6. Lifecycle hooks
onMounted(() => {
  // Setup
})
```

## Testing

### Writing Tests

- Write tests for all new features
- Aim for at least 70% code coverage
- Test edge cases and error conditions
- Use descriptive test names

Example:
```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from './myModule'

describe('myFunction', () => {
  it('should return correct value for valid input', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('')
    expect(myFunction(null)).toBeNull()
  })
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test:coverage

# Run specific test file
npm test tests/myFile.test.ts
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(combat): add critical hit system"

# Bug fix
git commit -m "fix(inventory): prevent duplicate items"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api): redesign authentication API

BREAKING CHANGE: authentication endpoint now requires JWT token"
```

## Pull Request Process

1. **Update documentation**: Ensure README, API docs, and inline comments are up to date

2. **Run tests**: Ensure all tests pass
   ```bash
   npm test
   npm run build
   npx nuxi typecheck
   ```

3. **Update CHANGELOG**: If applicable, add your changes to the changelog

4. **Create PR**: 
   - Use a clear, descriptive title
   - Describe what changes were made and why
   - Reference any related issues
   - Add screenshots for UI changes

5. **Code Review**:
   - Address review comments
   - Make requested changes
   - Re-request review when ready

6. **Merge**: Once approved, a maintainer will merge your PR

### PR Title Format

```
<type>: <description>

Examples:
feat: add party dungeon finder
fix: resolve combat tick memory leak
docs: improve API documentation
```

## Project Structure

```
vong_tich_thanh/
├── .github/
│   └── workflows/        # CI/CD workflows
├── components/           # Vue components
├── composables/          # Vue composables
├── models/              # MongoDB schemas
├── pages/               # Nuxt pages
├── server/
│   ├── api/            # REST API endpoints
│   ├── commands/       # Command handlers
│   ├── routes/         # WebSocket routes
│   └── utils/          # Server utilities
├── tests/              # Test files
├── types/              # TypeScript types
└── utils/              # Client utilities
```

## Best Practices

### Database

- Use indexes for frequently queried fields
- Validate data before saving
- Use transactions for critical operations
- Avoid N+1 queries

### Security

- Never commit secrets or credentials
- Validate and sanitize all user inputs
- Use parameterized queries
- Implement rate limiting
- Keep dependencies up to date

### Performance

- Use caching where appropriate
- Optimize database queries
- Lazy load components and data
- Minimize bundle size
- Use virtual scrolling for large lists

### Accessibility

- Use semantic HTML
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers
- Support reduced motion preferences

## Getting Help

- Check existing [documentation](./README.md)
- Read through [issues](https://github.com/pin705/vong_tich_thanh/issues)
- Ask questions in pull request comments
- Review the [game design document](./agent.md)

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to Vong Tích Thành! 🎮
