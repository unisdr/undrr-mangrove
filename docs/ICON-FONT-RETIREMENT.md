# Icon-font retirement

This breaking change completes the Mangrove portion of [unisdr/undrr-mangrove#906](https://github.com/unisdr/undrr-mangrove/issues/906). SVG rendering already ships; this change removes the parallel font implementation.

## Merge and release gate

The pull request may merge into the isolated `release/3.0` branch after code review and green CI, provided preview publication remains separate from stable Pages, dist/CDN and npm latest. This gives Drupal a shared SVG-only migration candidate. Integration does not authorise promotion to `main` or a stable release.

Stable 3.0 publication remains blocked until [undrr/web-backlog#3185](https://gitlab.com/undrr/web-backlog/-/issues/3185) is deployed and verified in production. That tracker owns Drupal templates/modules, editor previews, stored content, font-codepoint SCSS, local font copies and historical content restoration. Its local database audit is a baseline, not proof of production readiness.

Before promoting 3.0 to `main` or publishing stable assets, record the Drupal deployment and verification evidence on the tracker and upstream issue. Confirm affected themes, frontend and editor rendering, editor validation, restored revisions, RTL, forced colours, print and zoom against the SVG-only CSS built from this pull request, with Drupal's local legacy icon-font copies disabled. Disabling only the font does not reproduce the removal of aliases, sizing/spacing helpers and legacy selector exclusions. Record the exact tested commit and candidate asset URLs. Recheck whether Drupal needed additional SVG mappings and ensure its consumed Mangrove release already supplies them. Do not rely on closing the tracker alone as evidence of a verified rollout.

The Drupal rollout must first stop editors generating legacy values, then run an idempotent content migration with counts/logging and invalidate affected render and editor asset caches. Re-inventory after migration and account for content edited during rollout. Record a database backup/recovery procedure and a code/CSS rollback path that preserves subsequent editorial work; do not blindly restore an old database over newer edits.

Ship this in a release that explicitly announces the breaking change. Integration does not choose a package release number or publish a release. Older versioned assets remain valid for consumers pinned to those versions.

## Removed surface

- The `FontAwesome` icon-font declaration and all `fa-*` glyph aliases, including `.fa`, `.fab`, `.fas`, `.fa-before` and `.fa-2x` helpers.
- The special React `<Icon name="fa-globe" />` format. Use `<Icon name="globe" />`, `<Icon name="mg-icon-globe" />` or a full Mangrove class string. The older Mangrove `mg-globe` name format still works.
- `$mgIconFontPath` and the `stories/assets/fonts/mangrove-icon-set/` source tree. The earlier `$mg-font-family-icons` removal warning remains, with wording updated for SVG rendering.
- The `fonts/mangrove-icon-set/` package/CDN files and duplicate copy under `assets/fonts/`. New builds no longer produce a top-level `fonts/` package directory. Text fonts are unaffected.

## Consumer migration

Use `<span class="mg-icon mg-icon-globe" aria-hidden="true"></span>` for decorative HTML icons. Give an icon-only button or link an accessible name. See the migration table in [Icons.mdx](../stories/Atom/Icons/Icons.mdx).

Choose replacements from `scripts/icon-map.cjs`; unsupported FontAwesome names cannot be migrated by prefix replacement alone. Treat spacing and width modifiers separately: use a layout gap or logical margin instead of `.fa-before`, and `mg-icon--xl` or `font-size: 2em` instead of `.fa-2x`.

Replace custom `font-family: FontAwesome` plus private-use `content` rules with SVG masks or CSS shapes. Migrate editor attributes, saved markup and hydration JSON together, and verify that older content can still be restored safely.

## Build verification

Build into a clean `dist/` when checking removal: webpack does not clean old outputs automatically. Confirm the generated theme CSS has no FontAwesome declaration, font URL or `fa-*` selector, and the new package contains no icon-font files. Do not remove historical versioned CDN files as part of this change.
