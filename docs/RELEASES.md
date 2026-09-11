# Release process guide

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASES.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-release-process--docs).

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

Review any components whose markup changed since the last release and update their HTML examples in `scripts/ai-manifest/component-data.js`. If utility classes were added or removed, update `scripts/ai-manifest/css-utilities.js`. These curated files feed the AI component manifest and can drift from reality between releases.

You can check for drift by running a full build and then validating the manifest:

```bash
yarn build
yarn validate-manifest
```

The validation checks for stale curated data keys, accessibility anti-patterns in HTML examples, and PropTypes coverage.

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

### 4. Update CHANGELOG.md

In `CHANGELOG.md`, rename the `## Unreleased` section to `## X.Y.Z — YYYY-MM-DD` and add a link to the GitHub Release below the heading (the release page is created in step 6, so you can add the link now and it will resolve once the release is published):

```markdown
## 1.3.0 — 2026-01-15

See the [GitHub Release](https://github.com/unisdr/undrr-mangrove/releases/tag/v1.3.0) for full details.
```

Then add a fresh empty `## Unreleased` section above it for the next cycle.

### 5. Commit, tag, and push

```bash
git add .
git commit -m "chore(release): v1.3.0"
git tag v1.3.0
git push origin main --tags
```

### 6. Monitor the publish

The tag push triggers the [NPM Publish workflow](https://github.com/unisdr/undrr-mangrove/actions/workflows/npm-publish.yml), which automatically:

- Builds the project
- Packages distribution files and SCSS sources
- Publishes to the npm registry

### 7. Create a GitHub Release

Go to [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) and create a release from the tag.

Write the release notes as a **curated, themed narrative** — not a flat list of commits. Start by reviewing the commit log since the previous tag:

```bash
git log v1.7.0..v1.8.0 --oneline
```

Group the work into themed sections that match what actually landed. Common sections (use what fits, skip what doesn't):

- **Breaking changes** — always first if present; include a migration path
- **New features** — user-visible additions, one bullet per meaningful feature with a PR link
- **Bug fixes** — notable fixes worth calling out
- **Security** — any dependency patches or policy changes
- **Documentation & code quality** — significant doc or internal quality improvements
- **Dependencies** — batched dep updates (one line is fine)

Each bullet should be **bold component or feature name** followed by PR link(s) and a one-sentence description of what changed and why it matters to a consumer. GitHub's "Generate release notes" button produces a useful raw list of PR titles — use it as a checklist to ensure nothing is missed, then rewrite into themed prose.

Close with a CDN snippet so consumers can copy-paste the new version:

~~~markdown
## CDN
```html
<link rel="stylesheet" href="https://assets.undrr.org/mangrove/2.0.0-beta.1/css/style.css">
```
~~~

See [past releases](https://github.com/unisdr/undrr-mangrove/releases) for worked examples of this format.

### 8. Verify

- [npm package page](https://www.npmjs.com/package/@undrr/undrr-mangrove) shows the new version
- [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) has the release notes

### 9. Update the Drupal theme (if needed)

If component JS or CSS changed:

```bash
yarn build
```

Copy built JS from `dist/components/` to `undrr_common/js/mangrove-components/` in the Drupal theme. If CSS changed, manually copy compiled CSS to each child theme's `css/mangrove/mangrove.css`.

## Manual npm publish (fallback)

If a tag-push publish fails but **Actions is still available**, re-run it manually:

1. Go to [Actions → Publish to NPM Registry](https://github.com/unisdr/undrr-mangrove/actions/workflows/npm-publish.yml)
2. Click "Run workflow"
3. Optionally enter a specific git tag (leave empty for latest)

## Break-glass: fully local release (CI/Actions unavailable)

Use this **only** when GitHub Actions cannot run at all — e.g. the `unisdr` org is flagged/suspended and every workflow (`npm-publish`, `dist`, `storybook`, `chromatic`) is dark. This path trades away the guarantees CI normally provides; read the trade-offs before committing to it.

### Prerequisites

- npm account with **publish rights to the `@undrr` scope** and 2FA configured.
- Local checkout on the exact commit you intend to tag, fully built and passing (`yarn test`, `yarn lint`, `yarn build`, `yarn validate-manifest`).

### The gate: is a token publish even allowed?

The package uses [OIDC trusted publishing](#npm-trusted-publishing). If its **Publishing access** setting is "Require two-factor authentication or an automation/granular access token" that's fine, but if it is set to **require trusted publishing**, a `npm login` (token) publish is rejected and this path is impossible — you wait for CI.

**`npm publish --dry-run` does NOT test this.** Dry-run packs the tarball and reports what it *would* upload, but never contacts the registry for authorization — so it cannot reveal a trusted-publisher rejection. There are only two ways to know:

1. Check **Settings → Publishing access** on [the package page](https://www.npmjs.com/package/@undrr/undrr-mangrove/access) before starting.
2. Just attempt the real publish (step 4). A rejected publish **does not consume the version number**, so it is safe to try — it either succeeds or 403s with a clear message.

### 1. Prepare the release

Follow the normal [Release steps](#release-steps) 1–5 (version bump, CDN links, CHANGELOG, commit, tag) and `npm login`. You still commit and tag on `main` — the tag just won't trigger a publish.

### 2. Assemble the package exactly as CI does

The `npm-publish.yml` workflow does **not** publish the repo root — it builds a curated `npm-package/` directory from `dist/` (compiled `components/`, `css/`, `js/`, `fonts/`, `error-pages/`, the `scss/` sources, and a slimmed `package.json`). Reproduce its "Prepare package files" step from the repo root after a clean `yarn build`:

```bash
rm -rf npm-package && mkdir -p npm-package/dist && cp -r dist/* npm-package/dist/
[ -d dist/assets/js ]          && { mkdir -p npm-package/js;          cp -r dist/assets/js/* npm-package/js/; }
[ -d dist/assets/css ]         && { mkdir -p npm-package/css;         cp -r dist/assets/css/* npm-package/css/; }
[ -d dist/assets/error-pages ] && { mkdir -p npm-package/error-pages; cp -r dist/assets/error-pages/* npm-package/error-pages/; }
[ -d dist/fonts ]              && { mkdir -p npm-package/fonts;       cp -r dist/fonts/* npm-package/fonts/; }
[ -d dist/components ]         && { mkdir -p npm-package/components;   cp -r dist/components/* npm-package/components/; }
mkdir -p npm-package/scss
find stories -name '*.scss' -type f | while read f; do
  mkdir -p "npm-package/scss/$(dirname "$f" | sed 's|^stories/||')"
  cp "$f" "npm-package/scss/$(echo "$f" | sed 's|^stories/||')"
done
cp package.json README.md LICENSE npm-package/
node -e 'const p=require("./package.json");require("fs").writeFileSync("npm-package/package.json",JSON.stringify({name:p.name,version:p.version,description:p.description,main:"dist/index.js",files:["components/**/*","css/**/*","js/**/*","scss/**/*.scss","error-pages/**/*","fonts/**/*"],repository:p.repository,keywords:p.keywords,author:p.author,license:p.license},null,2))'
```

Two quirks worth knowing, both intentional and matching every prior release:

- The slim `files` array **excludes `dist/`**, so `main: "dist/index.js"` is a dangling pointer — the published tarball has no `dist/`. Consumers import from the subpath dirs (`components/`, `css/`, …), so this has never mattered. Don't "fix" it, or you change what's published.
- `npm-package/` is **not** gitignored. Publish from inside it, and don't `git add -A` on `main` while it exists or you'll commit 8 MB of build output.

### 3. Verify the tarball before publishing

Never `npm pack` at the repo root — the root `package.json` has no `files` field, so it packs the **entire repo** (600+ files including source and config), which is not what gets published. Only pack from `npm-package/`.

Confirm contents against the previous published release — the diff should be *only* files that genuinely changed this release:

```bash
cd npm-package && npm pack --dry-run --json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s)[0];console.log(j.entryCount,"files,",(j.unpackedSize/1048576).toFixed(2)+"MB")})'
# parity check against the last release actually on npm:
cd /tmp && npm pack @undrr/undrr-mangrove@<previous-version>   # downloads the real published tarball
# then compare the two file lists (tar tzf ... | sed 's|^package/||' | sort) with diff/comm.
```

### 4. Publish

Confirm you hold publish rights first (`npm access list collaborators @undrr/undrr-mangrove` should show your user as `read-write`). Then, from inside `npm-package/`:

```bash
# Stable version (clean semver, e.g. 2.0.0):
npm publish --access public        # NO --provenance — it needs the CI OIDC token and fails locally

# Prerelease version (anything with a hyphen, e.g. 2.0.0-alpha.1):
npm publish --access public --tag next   # MUST use --tag next, or a plain
                                         # `npm install @undrr/undrr-mangrove`
                                         # resolves to the unstable build.
```

Run this in a **real interactive terminal**, not a non-interactive/`!`-style shell: with account 2FA enabled, npm prompts for a one-time password, and a shell that can't accept stdin will hang. (Alternatively pass `--otp=<code>`.)

This is also the real test of [the gate](#the-gate-is-a-token-publish-even-allowed): success means token publishing was allowed; a 403/trusted-publisher error means it wasn't, and you stop here. A rejected attempt does not burn the version number.

### 5. Update the CDN `dist` branch by hand

`dist.yml` normally force-pushes the contents of `dist/` (minus `assets/images` and `assets/icons`) to the `dist` branch on every push to `main`. **This feeds only the CDN `latest/` path** — the versioned `static/mangrove/X.Y.Z/` path is produced separately by the GitLab [shared-web-assets](https://gitlab.com/undrr/common/shared-web-assets/) pipeline from the tagged release (see [the caveat in step 6](#6-create-the-github-release-and-verify)).

Replicate the push from an **isolated worktree** so your `main` checkout is untouched (with `dist/` freshly built at the tagged commit):

```bash
git fetch origin dist
git worktree add -B dist /tmp/dist-deploy origin/dist
find /tmp/dist-deploy -maxdepth 1 -mindepth 1 -not -name '.git' -exec rm -rf {} +
cp -r dist/* /tmp/dist-deploy/
rm -rf /tmp/dist-deploy/assets/images /tmp/dist-deploy/assets/icons
git -C /tmp/dist-deploy add -A
git -C /tmp/dist-deploy commit -m "Deploy dist from <sha> (vX.Y.Z)"
git -C /tmp/dist-deploy push origin dist
git worktree remove /tmp/dist-deploy && git branch -D dist   # cleanup
```

### 6. Create the GitHub Release and verify

Create the release from the tag as usual (steps 7–8), then verify:

```bash
npm view @undrr/undrr-mangrove dist-tags                     # stable: latest -> X.Y.Z ; prerelease: next -> X.Y.Z-alpha.N and latest UNCHANGED
npm pack @undrr/undrr-mangrove@X.Y.Z --dry-run 2>&1 | tail -1  # sanity-check file count/size
curl -sI https://assets.undrr.org/mangrove/latest/css/style.css | head -1   # CDN latest/ reachable
curl -sI https://assets.undrr.org/mangrove/X.Y.Z/css/style.css  | head -1   # versioned path
```

The versioned `X.Y.Z/` URL will **404 until the GitLab shared-web-assets pipeline publishes it** — that pipeline, not this repo's `dist` push, creates versioned paths, and under the org flag it may need to be checked or triggered manually on the GitLab side. `latest/` should return 200 once GitLab has synced the `dist` push.

Finally, delete the local `npm-package/` once the version is live.

### Trade-offs vs a CI release

| Guarantee | CI release | Break-glass |
|---|---|---|
| **Provenance attestation** | Yes (`--provenance` via OIDC) | **No** — `--provenance` needs the CI OIDC token; a local publish omits it |
| **CDN (`dist` branch)** | Auto on `main` push | **Manual** — must be pushed by hand |
| **Storybook Pages** | Auto-redeployed | **Not updated** |
| **Chromatic visual regression** | Runs | **Skipped** |
| **Auditability** | Build tied to a CI run | Only your local shell history |

Prefer restoring CI over repeating this. Every published version through 1.8.1 shipped with provenance via the normal flow; a break-glass release is a deliberate, one-off exception.

## Component changelogs vs project releases

Mangrove tracks changes at two levels:

- **Component changelogs** (in each component's MDX file): Track per-component version history. Update these whenever a PR modifies a component's behavior, API, or appearance. See the [component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs#changelog-format) for the required format (source: `stories/Documentation/ComponentContribution.mdx` → "Changelog format").
- **Project releases** (GitHub Releases): Track library-wide releases. Created during the release process above.

Component changelogs and project releases serve different audiences — component changelogs help developers working with a specific component, while project releases help consumers of the npm package understand what changed between versions.

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
https://assets.undrr.org/mangrove/2.0.0-beta.1/css/style.css
https://assets.undrr.org/mangrove/2.0.0-beta.1/components/MegaMenu.js
https://assets.undrr.org/mangrove/2.0.0-beta.1/js/tabs.js
```

## CI/CD configuration

| File | Purpose |
|---|---|
| `.github/workflows/npm-publish.yml` | npm publish on tag push (`v*`) |
| `.github/workflows/dist.yml` | Update `dist` branch on `main` push |
| `.github/workflows/storybook.yml` | Build and deploy Storybook to GitHub Pages |
| `.github/workflows/chromatic.yml` | Visual regression testing |
| `.github/workflows/pr-title-check.yml` | Validate PR titles follow Conventional Commits |

### npm trusted publishing

npm publishing uses [OIDC trusted publishing](https://docs.npmjs.com/trusted-publishers/) instead of long-lived access tokens. GitHub Actions authenticates directly with npm using a short-lived OIDC token — no `NPM_TOKEN` secret is needed.

This is configured in two places:
- **npmjs.com**: [package settings → Trusted Publisher](https://www.npmjs.com/package/@undrr/undrr-mangrove/access) links the `unisdr/undrr-mangrove` repo and `npm-publish.yml` workflow
- **Workflow**: `id-token: write` permission and `--provenance` flag on `npm publish`

Published packages include a [provenance attestation](https://docs.npmjs.com/generating-provenance-statements/) that cryptographically links the npm package to its source commit and build.

### Required GitHub secrets

- **`GITHUB_TOKEN`** — built-in, used by workflows
- **`CHROMATIC_PROJECT_TOKEN`** — for visual regression testing (optional)

No npm token is required — trusted publishing handles authentication via OIDC.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| npm publish fails with 403/404 | Trusted publisher not configured or misconfigured | Check [package settings](https://www.npmjs.com/package/@undrr/undrr-mangrove/access) — repo, workflow filename, and environment must match |
| npm publish fails with OIDC error | Missing `id-token: write` permission in workflow | Ensure the job has `permissions: id-token: write` |
| npm publish fails with Corepack error | Missing `corepack enable` step in workflow | Check `npm-publish.yml` has the "Enable Corepack" step |
| CDN not updated | `dist.yml` workflow failed | Check the workflow run; it runs on every push to `main` |
| PR title rejected | Doesn't follow Conventional Commits format | Use `feat:`, `fix:`, `docs:`, `chore:`, etc. prefix |
| Chromatic skipped | Commit or PR title contains `[skip chromatic]` | Intentional; remove the flag to run visual tests |
