# Development Guide

This guide covers the development setup and workflow for contributing to the UNDRR Mangrove component library.

## Prerequisites

- Node.js 22 (use nvm or similar to manage versions)
- Yarn v4 (enabled via Corepack)
- Docker (optional, for containerized development)
- Git

## Getting Started

### Local Development

```bash
# Clone the repository
git clone git@github.com:unisdr/undrr-mangrove.git
cd undrr-mangrove

# Enable Corepack for Yarn v4
corepack enable

# Install dependencies
yarn install

# Start Storybook development server
yarn dev
# or
yarn storybook
```

### Docker Development

For consistent environments or Windows development:

```bash
# Start containers and run Storybook
yarn docker-run

# Or use Make commands
make up
make install
make run
```

## Development Workflow

### Branch Strategy

- `main` - Primary branch, auto-deploys to GitHub Pages
- Feature branches - Create from `main` for new work
- No `dev` branch is used

### Creating Features

1. Create a branch from `main`
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes following the coding standards

3. Test your changes
   ```bash
   yarn test
   yarn lint
   ```

4. Create a pull request against `main`
   - Reference relevant GitHub or GitLab issues
   - Ensure CI passes

### Commit Message Convention

We use conventional commits for automated versioning:

- `fix:` - Bug fixes (patch release)
- `feat:` - New features (minor release)
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `style:` - Code style changes

Include `BREAKING CHANGE:` in the commit body for major releases.

## Available Scripts

### Development Commands

```bash
# Start Storybook dev server
yarn dev
yarn storybook

# Run tests
yarn test                 # Run all tests
yarn test:watch          # Watch mode
yarn test:coverage       # Generate coverage report
yarn test path/to/file   # Test specific file

# Linting
yarn lint               # Run all linters
yarn lint:js           # Lint JavaScript/JSX
yarn lint:css          # Lint CSS/SCSS

# Build
yarn build             # Build for production
yarn build-storybook   # Build Storybook static site
```

### Docker Commands

```bash
# NPM scripts for Docker
yarn docker-run        # Start containers and Storybook
yarn docker-install    # Install dependencies in container
yarn docker-build      # Build in container
yarn docker-watch      # Watch mode in container
yarn docker-lint       # Lint in container

# Make commands
make up               # Start application
make install          # Install dependencies
make run              # Run Storybook
make lint             # Lint codebase
make watch            # Watch for changes
make build            # Build for release
```

## Component Development

### File Structure

Components follow this structure:
```
stories/
  └── Components/
      └── ComponentName/
          ├── ComponentName.jsx
          ├── ComponentName.stories.jsx
          ├── ComponentName.scss
          └── __tests__/
              └── ComponentName.test.jsx
```

### Component Guidelines

- Use functional components with hooks
- Follow BEM naming for CSS classes
- Include JSDoc comments for props
- Write stories for all component states
- Add tests for component logic

### TypeScript Support

While JSX is the default, TypeScript is fully supported:

```typescript
// ComponentName.tsx
interface ComponentProps {
  title: string;
  onClick?: () => void;
}

export const Component: React.FC<ComponentProps> = ({ title, onClick }) => {
  // Component implementation
};
```

## Code Style

### JavaScript/JSX

- Use ES6+ features
- Prefer functional components
- Follow existing patterns in the codebase
- No unnecessary comments unless explaining complex logic

### CSS/SCSS

- Follow BEM methodology
- Use SCSS variables for consistency
- Organize styles hierarchically
- Keep specificity low

### Import Order

1. React imports
2. External library imports
3. Internal component imports
4. Style imports

## Debugging

### Storybook Issues

- Clear `.cache` and `node_modules` if builds fail
- Check browser console for runtime errors
- Use React DevTools for component inspection

### Test Failures

- Run tests in watch mode for faster feedback
- Use `--verbose` flag for detailed output
- Check test coverage reports in `coverage/`

### Build Problems

- Ensure Node version matches requirements
- Clear Yarn cache: `yarn cache clean`
- Rebuild from scratch: `rm -rf node_modules && yarn install`

## Performance Considerations

- Lazy load heavy components
- Use React.memo for expensive renders
- Optimize images and assets
- Monitor bundle size

## Accessibility

- Test with keyboard navigation
- Use semantic HTML
- Include ARIA labels where needed
- Test with screen readers
- Maintain color contrast ratios