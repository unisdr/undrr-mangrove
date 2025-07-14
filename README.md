[![Build Status](https://github.com/unisdr/undrr-mangrove/actions/workflows/semver-release.yml/badge.svg)](https://github.com/unisdr/undrr-mangrove/actions)
[![GitHub Release](https://img.shields.io/github/v/release/unisdr/undrr-mangrove)](https://github.com/unisdr/undrr-mangrove/releases)
[![npm version](https://img.shields.io/npm/v/@undrr/undrr-mangrove.svg)](https://www.npmjs.com/package/@undrr/undrr-mangrove)
[![Storybook](https://cdn.jsdelivr.net/gh/storybookjs/brand@main/badge/badge-storybook.svg)](https://unisdr.github.io/undrr-mangrove/)
[![License](https://img.shields.io/github/license/unisdr/undrr-mangrove.svg)](https://github.com/unisdr/undrr-mangrove/blob/main/LICENSE)

# Mangrove: the UNDRR component library

[View the component library](https://unisdr.github.io/undrr-mangrove/)

## 🚨 Pre-alpha warning 🚨

This project is under active development and at the moment provides no useful resources. [Internal notes on the project can be seen in the GitLab Wiki](https://git.un.org/undrr/web-backlog/-/wikis/Mangrove:-the-UNDRR-Component-library).


## Developer Resources

### Getting Started Guide

[Getting Started Guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-a-getting-started-guide--docs)

## Quick Start

### Installation

Install the library via npm or yarn:

```bash
# NPM
npm install @undrr/undrr-mangrove

# Yarn
yarn add @undrr/undrr-mangrove
```

### Basic Usage

```jsx
import { Button, Card } from '@undrr/undrr-mangrove';
import '@undrr/undrr-mangrove/dist/assets/css/style.css';

function App() {
  return (
    <Card>
      <h2>Welcome to UNDRR</h2>
      <Button variant="primary">Get Started</Button>
    </Card>
  );
}
```

## Purpose

This project stops short of being a full design system and instead focuses on providing usable components that are informed by the UNDRR brand guidelines and project styles.

These components offer consistency, documentation, and portability to speed up quality development with the expected look and feel. They also help reduce entropy, which is critical to ensuring websites remain accessible.

If there is a Component or Pattern that you need, or you have any other feedback, question, or comment, please contact us in the issue queue.

### Assorted technical notes

- **Preact vs React**: After initially planning to use Preact, we've stayed with `react-dom` for using the components in other systems. This ensures that the Storybook and other system runtimes remain similar, avoiding issues with React-only components (e.g. `react-leaflet`).
- **TypeScript Support**: While the default implementation uses JSX and JavaScript, TypeScript is fully supported. You can view examples of TypeScript components in the [TypeScript Example Component](https://unisdr.github.io/undrr-mangrove/?path=/docs/example-typescript-component--docs) (code location: `stories/Components/TypeScriptExampleComponent`)

## Development

You can use the provided npm scripts to simplify running commands inside Docker containers. These scripts are defined in the `package.json` file and can be run using `yarn`.

### Using Windows

You may encounter sporatic issues when developing directly on Windows (Jest does not seem to run), we suggest you use the Docker container and commands (e.g. `yarn run docker-up`)

### Making commits

The project uses the following branching strategy:

- `main` is the primary branch and all commits to it are automatically deployed to the GitHub Pages website
- Development work should be done on feature branches
- Pull requests should be opened against `main` and should reference either:
  - An internal GitLab issue
  - A public GitHub issue

For production use:

- Stable releases will be created as tagged releases
  - Note: tagged releases are not yet available as we are still in an alpha phase
- The `dev` branch is not used

When creating a new feature or fix:

1. Create a new branch from `main`
2. Make your changes
3. Open a pull request against `main`
4. Reference the relevant issue from Github or the private UNDRR GitLab
5. Once approved, the changes will be merged and automatically deployed

### NPM Scripts

```bash
# Start the application: brings up Docker containers, installs dependencies, and runs Storybook locally on port 6006
yarn docker-run

# Install project dependencies inside the Docker container
yarn docker-install

# Build the project for release inside the Docker container
yarn docker-build

# Watch for component changes, rebuild them, and copy JS files to the theme (inside Docker)
yarn docker-watch

# Watch for component changes, rebuild them, and copy JS files to the theme (direct)
yarn watch

# Lint the codebase inside the Docker container
yarn docker-lint
```

### Makefile Commands

You can use the provided `Makefile` to simplify running commands inside Docker containers. Run the following commands to create/update the codebase:

```bash
# Start the application, runs Storybook locally via port 6006
make up

# Install project dependencies
make install

# Run Storybook locally
make run

# Lint the codebase
make lint

# Watch for component changes, rebuild them, and copy JS files to the theme
make watch

# Build for release (default mode is production, you can override it with --mode=development)
make build
```

### Manual Docker Commands

If you prefer running Docker commands manually, the following commands are available:

```bash
# Clone the codebase
git clone git@github.com:unisdr/undrr-mangrove.git

cd undrr-mangrove

# Start the application, runs Storybook locally via port 6006
docker-compose up -d

# Install project dependencies
docker exec -it undrr-mangrove-client-1 bash -c "yarn install"

# Run Storybook locally
docker exec -it undrr-mangrove-client-1 bash -c "yarn run storybook --ci"

# Watch for component changes, rebuild them, and copy JS files to the theme
docker exec -it undrr-mangrove-client-1 bash -c "yarn run watch"

# Build the project for release (default mode is production)
docker exec -it undrr-mangrove-client-1 bash -c "yarn run build"

# Lint the codebase
docker exec -it undrr-mangrove-client-1 bash -c "yarn run lint"
```

## Testing

When adding new components, we rely on the Jest library to test the library. Jest is a JavaScript testing framework that is easy to use and provides a variety of features for testing React components.

### Visual Testing with Chromatic

This project uses [Chromatic](https://www.chromatic.com/) for visual regression testing. Chromatic automatically captures screenshots of your stories and compares them against previous versions to detect visual changes.

#### When Chromatic Runs

The Chromatic workflow executes automatically:
- On pushes to `main` or `develop` branches
- On pull requests targeting `main` or `develop`
- Only when relevant files change:
  - Stories (`stories/**`)
  - Storybook configuration (`.storybook/**`)
  - Package configuration (`package.json`, `*.config.js`)
  - The workflow file itself

#### Viewing Test Results

1. **Pull Request Comments**: Chromatic automatically adds a comment to PRs with:
   - Link to the visual review
   - Summary of changes detected
   - Build status

2. **GitHub Actions**: Check the "Chromatic Visual Testing" workflow run for:
   - Build logs
   - Direct link to Chromatic build

3. **Chromatic Dashboard**: Visit the build link to:
   - Review visual changes side-by-side
   - Accept or reject changes
   - Leave comments for reviewers
   - View component history

#### Skipping Chromatic

To skip Chromatic for a specific commit, include `[skip chromatic]` in your commit message:
```bash
git commit -m "chore: update dependencies [skip chromatic]"
```

**Note**: Visual changes on the `main` branch are automatically accepted as the new baseline.

### Creating Tests

To create tests for your component library, you can create files in the `stories/__tests__` folder. Jest will automatically discover and run any files in this folder that end in `.test.js`.

Each test file should contain one or more test cases. A test case is a function that takes two arguments: a test description and a callback function. The callback function is where you will write your test code.

The test code should assert that the component behaves as expected. You can use the Jest assertion library to do this. The Jest assertion library provides a variety of functions for asserting different types of values.

### Running Tests

To run your tests, you can use the following command:

```bash
yarn test
```

To run the test coverage report, you can use:

```bash
yarn test:coverage
```

## Compiled assets

We do not yet make the compiled assets available directly; see:
<https://gitlab.com/undrr/web-backlog/-/issues/545>

Provisional assets are available in the `dist` directory:

- `dist/components`: the compiled Storybook components
  - example: `dist/components/ShareButtons.js`
- `dist/assets`: the compiled static assets ... jpg, css, web fonts, etc.
  - example: `dist/assets/css/style-preventionweb.css`
  - `dist/assets/fonts/mangrove-icon-set/font/mangrove-icon-set.woff2`

## Developer Resources

For contributing to this library:

- 📖 [Development Guide](./docs/DEVELOPMENT.md) - Setup, workflow, and coding standards
- 🧪 [Testing Guide](./docs/TESTING.md) - Unit, visual, and accessibility testing
- 🚀 [Release Process](./docs/RELEASES.md) - Versioning and publishing

## Package Contents

```
@undrr/undrr-mangrove/
├── dist/              # Compiled components and assets
│   ├── components/    # React components
│   └── assets/        # CSS, fonts, images
├── scss/              # Source SCSS files
└── stories/           # Component source and stories
```

## CDN Distribution

For CDN and static asset hosting in the [UNDRR Static assets repo](https://gitlab.com/undrr/common/shared-web-assets/), this project automatically maintains a `dist` branch that contains only the latest compiled build artifacts. This branch is automatically updated on every push to `main` via GitHub Actions.

The primary use case for this feature is static sites with no build process.

### The `dist` Branch

- **Purpose**: Clean distribution branch for CDN/static hosting services
- **Content**: Contains only the compiled assets from the `dist` directory
- **History**: No git history is retained - each deployment creates a fresh orphan commit
- **Updates**: Automatically updated when changes are pushed to `main`

### Using the `dist` Branch

Example CDN URL:

```
https://assets.undrr.org/testing/static/mangrove/README.md
https://assets.undrr.org/testing/static/mangrove/latest/assets/css/style.css
https://assets.undrr.org/testing/static/mangrove/latest/components/MegaMenu.js
https://assets.undrr.org/testing/static/mangrove/latest/assets/js/tabs.js
```

The workflow ensures that the `dist` branch always reflects the latest stable build from `main`, making it reliable for production CDN usage.

### Future dist features

Support for release tagged content.

## LICENSE

Components and code are Apache 2.0 licensed. The UNDRR look and feel is proprietary.

## Credit

The base configuration and bootstrapping of this [Storybook](https://storybook.js.org/)-powered library was done based off the [UNDP Design System](https://github.com/undp/design-system), which is MIT licensed, but done with their kind blessing.
