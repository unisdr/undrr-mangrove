# Development Guide

This guide covers the development setup and workflow for contributing to the UNDRR Mangrove component library.

For more detailed information, see the [Getting Started Guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-a-getting-started-guide--docs).

## Related guides

- **Project readme**: see the top-level [README](../README.md) for an overview, install, and common tasks
- **Contributing guide**: how to propose changes and follow our workflow — [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Release process**: versioning, tagging, and publishing — [docs/RELEASES.md](./RELEASES.md)
- **Testing guide**: unit, visual, and accessibility testing — [docs/TESTING.md](./TESTING.md)
- **Writing guidelines**: UX writing standards — [docs/WRITING.md](./WRITING.md)
- **Writing quick reference**: concise checklist for AI tools and reviews — [docs/WRITING-SHORT.md](./WRITING-SHORT.md)
- **Architecture**: build system, distribution channels, and Drupal integration — [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- **Component guide**: step-by-step tutorial for building a new component — [docs/COMPONENT-GUIDE.md](./COMPONENT-GUIDE.md)

### Storybook documentation

These guides live inside Storybook and cover component standards, integration, and best practices:

- [Getting started guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-a-getting-started-guide--docs) — onboarding, installation methods, and integration options
- [Component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-contribution-guide--docs) — component structure, code standards, and PR process
- [Component structure](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-structure--docs) — architecture and organization patterns
- [Testing components](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-testing-components--docs) — testing strategies within Storybook
- [Best practices](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-best-practices--docs) — accessibility, performance, and architecture guidance

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

### Branch naming convention

Branch names use a conventional prefix matching the commit type, followed by a short kebab-case description:

```
feat/short-description       — new features
fix/short-description        — bug fixes
chore/short-description      — maintenance, deps, CI
docs/short-description       — documentation only
refactor/short-description   — code restructuring
```

### Creating features

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

# Run tests (see docs/TESTING.md for detailed patterns and coverage requirements)
yarn test                 # Run all tests
yarn test:watch          # Watch mode
yarn test:coverage       # Generate coverage report
yarn test path/to/file   # Test specific file

# Linting
yarn lint               # Run all linters
yarn lint:js           # Lint JavaScript/JSX
yarn lint:css          # Lint CSS/SCSS

# Build
yarn build             # Build for production (SCSS + Storybook + webpack)
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

## Deploying theme CSS to Drupal

Built JavaScript is automatically copied to the Drupal theme by `mangrove-watch.js` (via `yarn watch --copy`). CSS is **not** auto-synced and must be copied manually after each SCSS change.

### Child themes

All theme directories live under `docroot/themes/custom/` in the Drupal project. The following child themes consume Mangrove CSS at `css/mangrove/mangrove.css`:

| Theme directory | Site |
|---|---|
| `undrr` | undrr.org (global UNDRR) |
| `pw` | preventionweb.net |
| `mcr` | mcr2030.undrr.org |
| `irp` | IRP |
| `arise` | ARISE |
| `gp` | Global Platform |
| `sfvc` | SFVC |

Other child themes (`iddrr`, `wtad`) and base themes (`base`, `ev_base`, `undrr_common`) exist but do not use Mangrove CSS.

### Workflow

1. Compile SCSS:

   ```bash
   yarn scss
   ```

   This writes compiled CSS to `stories/assets/css/`.

2. Copy the compiled CSS to each applicable child theme:

   ```bash
   cp stories/assets/css/style.css \
     /path/to/docroot/themes/custom/<theme>/css/mangrove/mangrove.css
   ```

   Repeat for each child theme that needs the update. Theme-specific stylesheets (`style-preventionweb.scss`, `style-irp.scss`, `style-mcr.scss`) compile to their own CSS files; copy the matching file to the corresponding theme.

3. Commit the updated `mangrove.css` files in the Drupal repository.

## Component development

See the [component guide](COMPONENT-GUIDE.md) for the step-by-step tutorial and the [component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-contribution-guide--docs) in Storybook for code standards (React patterns, BEM, PropTypes, JSDoc, TypeScript, import order).

### TypeScript support

While JSX is the default, TypeScript is fully supported. Path aliases available: `@/*` → `src/*`, `@components/*` → `stories/Components/*`.

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
