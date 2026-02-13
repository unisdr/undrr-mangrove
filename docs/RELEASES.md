# Release process guide

This guide explains the release process for the UNDRR Mangrove component library.

## Overview

Releases use **manual versioning** with automated npm publishing. You choose the version number, update `package.json`, tag the release, and CI handles the rest.

### Why not automated semantic-release?

We follow Conventional Commits for consistent, readable commit history, but we don't use semantic-release for automated version bumps. As a rapidly evolving component library, strict semver automation would produce excessive major version bumps — individual component breaking changes happen frequently during active development, but don't warrant a major library release when the change is scoped to a single component. Manual versioning gives us control over when to signal a significant release to consumers.

## Release steps

### 1. Prepare the release

```bash
# Make sure everything passes
yarn test
yarn lint
```

### 2. Update the version

Edit `version` in `package.json` to the new version number:

```json
{
  "version": "1.3.0"
}
```

**Version guidance:**
- **Patch** (1.2.14 → 1.2.15): bug fixes, dependency updates, minor style tweaks
- **Minor** (1.2.14 → 1.3.0): new components, new features, non-breaking enhancements
- **Major** (1.2.14 → 2.0.0): broad breaking changes across multiple components, API redesigns, major dependency upgrades (e.g., React major version)

### 3. Update CDN links in documentation

```bash
yarn update-cdn-version            # updates docs to reference new version
yarn update-cdn-version --dry-run  # preview changes first
```

This updates CDN URLs in README.md, MDX docs, and story files from the old version to the new one.

### 4. Commit, tag, and push

```bash
git add .
git commit -m "chore(release): v1.3.0"
git tag v1.3.0
git push origin main --tags
```

### 5. Monitor the publish

The tag push triggers the [NPM Publish workflow](https://github.com/unisdr/undrr-mangrove/actions/workflows/npm-publish.yml), which automatically:

- Builds the project
- Packages distribution files and SCSS sources
- Publishes to the npm registry

### 6. Create a GitHub Release

Go to [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) and create a release from the tag. Include a summary of changes — you can use the "Generate release notes" button for a starting point.

### 7. Verify

- [npm package page](https://www.npmjs.com/package/@undrr/undrr-mangrove) shows the new version
- [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) has the release notes

### 8. Update the Drupal theme (if needed)

If component JS or CSS changed:

```bash
yarn build
yarn watch --copy    # copies dist/components/*.js to undrr_common/js/mangrove-components/
```

If CSS changed, manually copy compiled CSS to each child theme's `css/mangrove/mangrove.css`.

## Manual npm publish (fallback)

If automated publishing fails, you can trigger it manually:

1. Go to [Actions → Publish to NPM Registry](https://github.com/unisdr/undrr-mangrove/actions/workflows/npm-publish.yml)
2. Click "Run workflow"
3. Optionally enter a specific git tag (leave empty for latest)

## Commit message conventions

We use [Conventional Commits](https://www.conventionalcommits.org/) for readable history and PR title validation, even though version bumps are manual:

| Prefix | Purpose |
|---|---|
| `feat:` | New feature or component |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `chore:` | Maintenance, dependencies |
| `refactor:` | Code restructuring |
| `test:` | Test additions or changes |
| `build:` | Build system or tooling |
| `ci:` | CI/CD configuration |

PR titles are validated by CI — see `.github/workflows/pr-title-check.yml`.

## Package contents

Published npm packages include:

- `/components/**/*` — compiled React components (ES modules)
- `/css/**/*` — compiled CSS files
- `/js/**/*` — compiled vanilla JavaScript files
- `/scss/**/*` — source SCSS files
- `/error-pages/**/*` — static error page templates
- `/fonts/**/*` — Mangrove icon font

## CDN distribution

The project maintains a `dist` branch for CDN/static hosting via the [UNDRR static assets repo](https://gitlab.com/undrr/common/shared-web-assets/). This branch is automatically updated on every push to `main` (not just releases).

- **Content**: compiled assets only (no source, no git history)
- **Use case**: static sites with no build process

Example CDN URLs:

```
# Latest (from dist branch, updated on every push to main)
https://assets.undrr.org/testing/static/mangrove/latest/css/style.css
https://assets.undrr.org/testing/static/mangrove/latest/components/MegaMenu.js

# Versioned (from tagged releases)
https://assets.undrr.org/static/mangrove/1.3.0/css/style.css
https://assets.undrr.org/static/mangrove/1.3.0/components/MegaMenu.js
https://assets.undrr.org/static/mangrove/1.3.0/js/tabs.js
```

## CI/CD configuration

| File | Purpose |
|---|---|
| `.github/workflows/npm-publish.yml` | npm publish on tag push (`v*`) |
| `.github/workflows/dist.yml` | Update `dist` branch on `main` push |
| `.github/workflows/storybook.yml` | Build and deploy Storybook to GitHub Pages |
| `.github/workflows/chromatic.yml` | Visual regression testing |
| `.github/workflows/pr-title-check.yml` | Validate PR titles follow Conventional Commits |

### Required GitHub secrets

- **`GITHUB_TOKEN`** — built-in, used by workflows
- **`NPM_TOKEN`** — npm access token for `@undrr` scope, used by npm-publish workflow
- **`CHROMATIC_PROJECT_TOKEN`** — for visual regression testing (optional)

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| npm publish fails | Expired or missing `NPM_TOKEN` secret | Regenerate token at npmjs.com, update GitHub secret |
| npm publish fails with Corepack error | Missing `corepack enable` step in workflow | Check `npm-publish.yml` has the "Enable Corepack" step |
| CDN not updated | `dist.yml` workflow failed | Check the workflow run; it runs on every push to `main` |
| PR title rejected | Doesn't follow Conventional Commits format | Use `feat:`, `fix:`, `docs:`, `chore:`, etc. prefix |
| Chromatic skipped | Commit or PR title contains `[skip chromatic]` | Intentional; remove the flag to run visual tests |
