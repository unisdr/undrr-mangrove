# Release Process Guide

This guide explains the release process for the UNDRR Mangrove component library.

## Overview

Publishing to npm happens automatically when you push a version tag:

### Automatic Publishing (Recommended)

When you push a version tag, the package is automatically published to npm:

```bash
git tag v1.2.3
git push origin v1.2.3
```

The workflow will automatically:

- Build the project
- Package distribution files and SCSS sources
- Publish to npm registry

## Versioning guide

The project uses [semantic-release](https://semantic-release.gitbook.io/):

## Commit Message Examples

```bash
# Patch release (bug fix)
git commit -m "fix: correct button alignment issue"

# Minor release (new feature)
git commit -m "feat: add dark mode toggle component"

# Major release (breaking change)
git commit -m "feat!: rename color tokens

BREAKING CHANGE: All color tokens have been renamed from --color-* to --mg-color-*"
```

### Manual Publishing

You can also manually trigger publishing:

1. Go to Actions → "Publish to NPM Registry"
2. Click "Run workflow"
3. Optionally enter a specific git tag (leave empty to use the latest tag)
4. The workflow will build and publish the specified version

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
   - Push the new tag to trigger automatic npm publishing: `git push origin <tag-name>`

3. **Troubleshooting:**
   - No release? Check commit message format
   - Wrong version? Ensure correct commit type
   - Publishing failed? Check npm token in GitHub secrets
   - Package not published? Verify the tag was pushed to trigger the workflow
