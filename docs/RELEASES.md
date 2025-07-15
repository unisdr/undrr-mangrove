# Release Process Guide

This guide explains the release process for the UNDRR Mangrove component library.

## Overview

This project uses automated semantic versioning and can publish to both npm and GitHub Package Registry.

## Automatic Releases (Semantic Versioning)

The project uses [semantic-release](https://semantic-release.gitbook.io/) to automatically determine version numbers based on commit messages:

1. **Commits to `main` branch** trigger the automatic release process
2. Version numbers are determined by commit message prefixes:
   - `fix:` → Patch release (0.0.X)
   - `feat:` → Minor release (0.X.0)
   - `BREAKING CHANGE:` in commit body → Major release (X.0.0)
3. The release process automatically:
   - Creates a git tag
   - Updates CHANGELOG.md
   - Creates a GitHub release
   - Updates package.json version

### Commit Message Examples

```bash
# Patch release (bug fix)
git commit -m "fix: correct button alignment issue"

# Minor release (new feature)
git commit -m "feat: add dark mode toggle component"

# Major release (breaking change)
git commit -m "feat!: rename color tokens

BREAKING CHANGE: All color tokens have been renamed from --color-* to --mg-color-*"
```

## Publishing to npm/GitHub Registry

After a release is created, you can publish it to npm or GitHub Package Registry:

1. Go to Actions → "Publish to NPM Registry"
2. Click "Run workflow"
3. Enter the git tag (e.g., `v1.2.3`)
4. Select registry: `npm` or `github`
5. The workflow will:
   - Build the project
   - Package distribution files and SCSS sources
   - Publish to the selected registry

### Package Contents

Published packages include:
- `/dist/**/*` - Compiled JavaScript and CSS files
- `/scss/**/*` - Source SCSS files from stories/assets/scss
- `/stories/**/*.scss` - Component-specific SCSS files

## CDN Distribution

For CDN and static asset hosting in the [UNDRR Static assets repo](https://gitlab.com/undrr/common/shared-web-assets/), this project automatically maintains a `dist` branch that contains only the latest compiled build artifacts. This branch is automatically updated on every push to `main` via GitHub Actions.

The primary use case for this feature is static sites with no build process.

### The `dist` Branch

- **Purpose**: Clean distribution branch for CDN/static hosting services
- **Content**: Contains only the compiled assets from the `dist` directory
- **History**: No git history is retained - each deployment creates a fresh orphan commit
- **Updates**: Automatically updated when changes are pushed to `main`

### Using the `dist` Branch

Example CDN URLs:

```
https://assets.undrr.org/testing/static/mangrove/README.md
https://assets.undrr.org/testing/static/mangrove/latest/assets/css/style.css
https://assets.undrr.org/testing/static/mangrove/latest/components/MegaMenu.js
https://assets.undrr.org/testing/static/mangrove/latest/assets/js/tabs.js
```

The workflow ensures that the `dist` branch always reflects the latest stable build from `main`, making it reliable for production CDN usage.

### Future dist features

Support for release tagged content.

## Quick Release Checklist

1. **Before committing:**
   - Run tests: `yarn test`
   - Run linting: `yarn lint`
   - Use proper commit message format

2. **After release is created:**
   - Check GitHub releases page
   - Verify CHANGELOG.md was updated
   - Publish to registry if needed

3. **Troubleshooting:**
   - No release? Check commit message format
   - Wrong version? Ensure correct commit type
   - Publishing failed? Check registry tokens in GitHub secrets
