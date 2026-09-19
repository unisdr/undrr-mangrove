# Release process guide

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASES.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/contributing-release-process--docs).

This guide explains the release process for the UNDRR Mangrove component library.

## Overview

Releases use **manual versioning** with automated npm publishing: choose the
version, update `package.json`, tag, and let CI publish.

### Why not automated semantic-release?

We use Conventional Commits for readable history, but not semantic-release for
automatic bumps. In an actively evolving component library, strict automation
would trigger too many major bumps for scoped component-level breaks. Manual
versioning keeps release signaling intentional.

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

Then preview the npm tarball exactly as the publish workflow will assemble it, and compare it with the last published version. The comparison lists files added, removed, or with changed content, and should show only what genuinely changed this release. Compiled component bundles always differ in their `Compiled on:` build timestamp; those files are counted but not listed as changed:

```bash
yarn pack:preview --compare <previous-version>   # e.g. --compare 2.0.0-rc.1
```

Never run `npm pack` at the repo root. The root `package.json` has no `files` field, so it packs the **entire repo** (600+ files including source and config), which is not what gets published. See [Package contents](#package-contents).

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

> **Automated changelog endpoints:** You only maintain `CHANGELOG.md` and per-component `## Changelog` sections in MDX files. The build pipeline (`scripts/ai-manifest/generate-ai-manifest.js`) automatically parses `CHANGELOG.md` to generate the machine-readable `releases.json` endpoint and updates `llms.txt`/`llms.json`. Storybook renders `CHANGELOG.md` directly via `stories/Documentation/Changelog.mdx` without any duplicate files to maintain.

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
- Packages distribution files and SCSS sources (`scripts/assemble-npm-package.mjs`, the same script as `yarn pack:preview`)
- Publishes to the npm registry

### 7. Create a GitHub Release

Go to [GitHub Releases](https://github.com/unisdr/undrr-mangrove/releases) and create a release from the tag.

Write release notes as a **curated, themed narrative**, not a flat commit list, using the standard format below. Every release from `v2.0.0-rc.1` on follows it; see [v2.0.0-rc.1](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-rc.1) and [v2.0.0-rc.2](https://github.com/unisdr/undrr-mangrove/releases/tag/v2.0.0-rc.2) for worked examples.

Start from the PRs merged since the previous tag, and read each PR's description rather than relying on commit subjects:

```bash
git log v2.0.0-rc.1..v2.0.0-rc.2 --oneline
```

Use GitHub "Generate release notes" as a checklist of what landed, then rewrite it into the format.

#### Release notes format

1. **Title:** the version without the `v` prefix (`2.0.0-rc.2`). Tick **Set as a pre-release** for any version with a hyphen.
2. **Intro paragraph:** one or two sentences saying what kind of release this is and its main themes, written for consumers. No section heading above it.
3. **Full detail link:** for a major version line with its own release notes page, link it and its source file on the next line. Otherwise, link the relevant `CHANGELOG.md` section.
4. **Sections**, as `##` headings, in this order. Leave out any section with nothing in it, and don't add others:
   - **Breaking and visible changes**: anything a consumer may need to act on or will notice (API or default export changes, changed defaults, appearance changes, renamed ids, moved URLs). Each bullet says what to do.
   - **New features**: user-visible additions.
   - **Bug fixes and hardening**: notable fixes, accessibility and contrast fixes, security and robustness.
   - **Documentation and discoverability**: docs, Storybook, AI manifests (`llms.txt`, `ai-components/`), and the docs host.
   - **Dependencies**: batched dependency updates, on one line where possible.
   - **CDN**: always last, with the stylesheet snippet for the new version.
5. **Bullets:** start with a **bold component or feature name** followed by a colon (or a bold one-sentence summary ending in a full stop for breaking changes), then one or two sentences on consumer impact. End with the PR links, then any issue links, in parentheses, as full URLs. Group closely related sub-items as nested bullets under one parent.
6. **Leave out** repo-only tooling that doesn't change the published package, Storybook site or manifests (for example pack scripts or CI artifact tweaks). Those belong in `CHANGELOG.md`.
7. **No attribution lines** (such as "Generated with …") and no commit hashes.

#### Template

~~~markdown
The Nth release candidate for Mangrove X.Y. It <main themes, in consumer terms>.

Full detail and migration steps: [vX.Y release notes](https://mangrove.undrr.org/?path=/docs/getting-started-release-notes-vX-Y--docs) (source: [`docs/RELEASE-X.Y.md`](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-X.Y.md)).

## Breaking and visible changes

- **<What changed, as a sentence>.** <What consumers see and what to do.> ([#NNNN](https://github.com/unisdr/undrr-mangrove/pull/NNNN))

## New features

- **<Component or feature>:** <what it adds and how to use it>. ([#NNNN](https://github.com/unisdr/undrr-mangrove/pull/NNNN), [#NNNN](https://github.com/unisdr/undrr-mangrove/issues/NNNN))

## Bug fixes and hardening

- **<Area>:** <what was wrong and what is fixed>. ([#NNNN](https://github.com/unisdr/undrr-mangrove/pull/NNNN))

## Documentation and discoverability

- **<Area>:** <what changed for readers or agents>. ([#NNNN](https://github.com/unisdr/undrr-mangrove/pull/NNNN))

## CDN
```html
<link rel="stylesheet" href="https://assets.undrr.org/mangrove/X.Y.Z/css/style.css">
```
~~~

To create the release from the command line instead of the web UI, save the notes to a file and run:

```bash
gh release create vX.Y.Z --title X.Y.Z --verify-tag --notes-file release-notes.md
# add --prerelease for any version with a hyphen
```

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

A manual re-run for a tag created before `scripts/assemble-npm-package.mjs` existed fails at "Prepare package files", because the workflow checks out the tag and the script is not in it. It fails safely and nothing is published. For those tags, follow the [break-glass steps](#break-glass-fully-local-release-ciactions-unavailable) from a checkout that has the script (for example, copy `scripts/assemble-npm-package.mjs` into the tag checkout and run `node scripts/assemble-npm-package.mjs`).

## Break-glass: fully local release (CI/Actions unavailable)

Use this **only** when GitHub Actions cannot run at all (for example, org
flag/suspension and all workflows down). This path trades away normal CI
guarantees.

### Prerequisites

- npm account with **publish rights to the `@undrr` scope** and 2FA configured.
- Local checkout on the exact commit you intend to tag, fully built and passing (`yarn test`, `yarn lint`, `yarn build`, `yarn validate-manifest`).

### Gate: is token publish allowed?

The package uses [OIDC trusted publishing](#npm-trusted-publishing). If its **Publishing access** setting is "Require two-factor authentication or an automation/granular access token" that's fine, but if it is set to **require trusted publishing**, a `npm login` (token) publish is rejected and this path is impossible — you wait for CI.

**`npm publish --dry-run` does NOT test this.** It packs the tarball but does
not contact npm auth endpoints, so it cannot reveal trusted-publisher rejection.
Only two checks are reliable:

1. Check **Settings → Publishing access** on [the package page](https://www.npmjs.com/package/@undrr/undrr-mangrove/access) before starting.
2. Just attempt the real publish (step 4). A rejected publish **does not consume the version number**, so it is safe to try — it either succeeds or 403s with a clear message.

### 1. Prepare the release

Follow the normal [Release steps](#release-steps) 1–5 (version bump, CDN links, CHANGELOG, commit, tag) and `npm login`. You still commit and tag on `main` — the tag just won't trigger a publish.

### 2. Assemble the package exactly as CI does

The `npm-publish.yml` workflow does **not** publish the repo root. It runs `scripts/assemble-npm-package.mjs`, which builds a curated `npm-package/` directory from `dist/` (compiled `components/`, `css/`, `js/`, `fonts/`, `error-pages/`, the `scss/` sources, and a slimmed `package.json`). Run the same script from the repo root after a clean `yarn build`:

```bash
yarn pack:assemble   # replaces npm-package/ (gitignored)
```

The script only deletes an output directory that is inside the repo, outside its source directories, and either empty or a previous package build. Anything else stops it with an error. It also fails if a `dist/` directory it copies from exists but is empty, as the old `cp -r dir/*` step did.

Two things worth knowing:

- **The published package has no root entry point, deliberately.** The slimmed `package.json` has no `main` and no `exports`, so `import '@undrr/undrr-mangrove'` does not resolve; consumers import the subpath dirs (`components/`, `css/`, …). Through 2.0.0-rc.2 it carried `main: "dist/index.js"`, a dangling pointer — the slim `files` array excludes `dist/`, so no tarball has ever contained that file — and 2.0.0 drops it rather than starting to ship one (unisdr/undrr-mangrove#1252). Do not add `main` back, and do not add an `exports` map without `"./*": "./*"` alongside: an `exports` map with only a `"."` entry makes every working subpath fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`. `scripts/__tests__/assemble-npm-package.test.js` fails on either.
- `npm-package/` is gitignored, but still delete it once the release is done so a stale copy is never published later.

### 3. Verify the tarball before publishing

Never `npm pack` at the repo root — the root `package.json` has no `files` field, so it packs the **entire repo** (600+ files including source and config), which is not what gets published. Only pack from `npm-package/`.

Confirm contents against the previous published release — the diff should be *only* files that genuinely changed this release:

```bash
yarn pack:preview --compare <previous-version>
```

This re-assembles `npm-package/`, prints the file count and unpacked size from `npm pack --dry-run`, downloads the published `<previous-version>` tarball from npm to a temp directory, and prints the files only in one or the other plus the files whose content changed. Files that differ only in the `Compiled on:` build timestamp are counted in a final line, not listed. For a rebuild of an already published version, expect no added, removed or changed files.

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

Run this in a **real interactive terminal**: with 2FA enabled, npm prompts for
OTP and non-interactive shells hang. (Alternative: `--otp=<code>`.)

This is also the real [gate](#gate-is-token-publish-allowed): success means
token publishing is allowed; 403/trusted-publisher means stop. A rejected
attempt does not consume the version number.

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

- **Component changelogs** (in each component's MDX file): Track per-component version history. Update these whenever a PR modifies a component's behavior, API, or appearance. See the [component standards](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs#changelog-format) for the required format (source: `stories/Documentation/ComponentContribution.mdx` → "Changelog format").
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

The layout and the slimmed `package.json` are produced by `scripts/assemble-npm-package.mjs`, used by both the publish workflow and `yarn pack:assemble` / `yarn pack:preview`. Change that script, not the workflow, to change what is published.

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
https://assets.undrr.org/mangrove/2.0.0-rc.2/css/style.css
https://assets.undrr.org/mangrove/2.0.0-rc.2/components/MegaMenu.js
https://assets.undrr.org/mangrove/2.0.0-rc.2/js/tabs.js
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
