# Mangrove 1.4 release notes

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-1.4.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v1-4--docs).

Beginning with 1.4, Mangrove includes detailed release notes for each minor release so there is a clear record of what changed and why.

The main change in 1.4: Mangrove no longer overrides the browser's font-size setting. The previous `html { font-size: 10px }` rule is an accessibility problem — it prevents users from adjusting text size through their browser, which fails WCAG 2.2 SC 1.4.4 (Resize Text). That override is now gone. Read the [migration section](#migration-root-font-size-change) carefully if you maintain a Drupal site.

> **If you manage a site that uses Mangrove:** people who set a larger font size in their browser will now actually get it. The hard-coded `10px` root prevented that. Existing Drupal sites should swap to the legacy theme CSS (one file change) while planning a proper migration. Sites that stay on legacy CSS remain non-conformant with WCAG 1.4.4.

### Find your path

| Your situation | What to do | Section |
|---|---|---|
| Existing Drupal site, need to upgrade now | Use legacy CSS | [Option A](#option-a-switch-to-legacy-theme-css-no-code-changes) |
| Your Drupal theme compiles Mangrove SCSS | Set the SCSS variable (in addition to Option A) | [Option B](#option-b-set-the-variable-in-your-scss) |
| New project, or ready to audit custom CSS | Use the standard theme | [Option C](#option-c-migrate-to-the-browser-default-root-recommended) |
| npm or CDN consumer (compiled CSS only) | Swap to `-legacy` variant, or audit rem values | [Option A](#option-a-switch-to-legacy-theme-css-no-code-changes) or [Option C](#option-c-migrate-to-the-browser-default-root-recommended) |
| Mangrove contributor | Follow the three SCSS rules | [For Mangrove contributors](#for-mangrove-contributors) |

These options are a progression: Option A is the safe immediate upgrade, Option C is the long-term goal. Option B is supplementary for teams that compile Mangrove SCSS source files. Most Drupal sites need both A and B.

## What else is in 1.4

Our last release was 1.3.3. For the complete diff, see the [v1.3.3...v1.4.0 comparison on GitHub](https://github.com/unisdr/undrr-mangrove/compare/v1.3.3...main). Below are the highlights.

### New features

- Browser-default root font-size: Mangrove no longer overrides the user's font-size setting. Legacy theme variants preserve the old behavior for existing sites. See the [full migration guide](#migration-root-font-size-change) below. ([#852](https://github.com/unisdr/undrr-mangrove/pull/852))
- DELTA Resilience theme — an initial proof of concept for integration testing, with a landing page template and component adjustments for the DELTA initiative ([#835](https://github.com/unisdr/undrr-mangrove/pull/835))
- Stacked tabs now support `defaultOpen`, `singleOpen`, and keyword filtering, along with accessibility fixes for keyboard navigation and ARIA attributes. Tabs can now be used in a FAQ-style accordion layout. ([#860](https://github.com/unisdr/undrr-mangrove/pull/860))
- Search widget now includes native filters for content type, country, and date range, plus a four-card syndication layout ([#834](https://github.com/unisdr/undrr-mangrove/pull/834))
- AI component manifest: `manifest.json` and `llms.txt` so AI coding tools can discover and render Mangrove components. Includes vanilla HTML examples, CSS utility inventory, and auto-rendered previews. See the [AI and MCP integration guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-ai-and-mcp-integration--docs) in Storybook. ([#845](https://github.com/unisdr/undrr-mangrove/pull/845), [#846](https://github.com/unisdr/undrr-mangrove/pull/846), [#847](https://github.com/unisdr/undrr-mangrove/pull/847))

### Fixes

- Search: fixed the UI bounce on filter changes, increased debounce, fixed URL query param sync ([#851](https://github.com/unisdr/undrr-mangrove/pull/851))
- Footer: mobile layout fix for narrow viewports ([#838](https://github.com/unisdr/undrr-mangrove/pull/838))
- Removed the `data-viewport`/`inviewport` scroll animation system entirely. It hid elements with `opacity: 0` until a JS observer fired. If the observer was not present (Storybook, or a failed page load), content remained invisible. No `prefers-reduced-motion` support either. ImageCaptionCredit, ImageCaption, and Heading now render immediately. Only Mangrove's own components used this system; consumer templates are not affected. ([#868](https://github.com/unisdr/undrr-mangrove/pull/868))
- `$mg-spacing-350` was identical to `$mg-spacing-300` (both 30px). Now correctly 35px. All internal usages updated. This change is present in both standard and legacy CSS. If your SCSS references this token directly, you will get 35px instead of 30px. ([#852](https://github.com/unisdr/undrr-mangrove/pull/852))

### Cleanup

- Removed CtaLink (`.cta__link`). This component was never integrated into Drupal or exported via npm. If your templates or custom content use the CSS classes `cta__link`, `cta--arrow`, or `cta--space`, they will no longer have associated styles. CtaButton (`.mg-button`) is unaffected. ([#854](https://github.com/unisdr/undrr-mangrove/pull/854))
- Removed 16 dead SCSS placeholders from `_mixins.scss` and cleaned up stale Burmese locale branches from stories ([#856](https://github.com/unisdr/undrr-mangrove/pull/856))
- SCSS partials renamed to kebab-case (`_card-with-image.scss` instead of `_CardWithImage.scss`). Import paths still work; Sass resolves both forms. ([#861](https://github.com/unisdr/undrr-mangrove/pull/861))
- Removed 17 unused dependencies (Babel 6 leftovers, old webpack loaders, unused ESLint configs), dropping 478 transitive packages (~15 MB) from `node_modules` ([#869](https://github.com/unisdr/undrr-mangrove/pull/869))
- Audited CSS-only components and formalized which are CSS-only vs React. Added coding guidelines for AI agents. ([#866](https://github.com/unisdr/undrr-mangrove/pull/866))
- AI manifest import statements are now validated against actual npm exports ([#850](https://github.com/unisdr/undrr-mangrove/pull/850))

### Tooling

- Storybook 10.3.1, webpack-cli 7 ([#863](https://github.com/unisdr/undrr-mangrove/pull/863))
- tar bumped 7.5.10 to 7.5.11, security fix ([#829](https://github.com/unisdr/undrr-mangrove/pull/829))

### Documentation

- Storybook sidebar reorganized, semantic CSS rationale written up, and the [About Mangrove](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-about-mangrove--docs) page rewritten to clarify what Mangrove is and is not ([#833](https://github.com/unisdr/undrr-mangrove/pull/833), [#848](https://github.com/unisdr/undrr-mangrove/pull/848))
- Component creation and maintenance guides are easier to find, for both developers and LLMs ([#862](https://github.com/unisdr/undrr-mangrove/pull/862))

## Migration: root font-size change

Mangrove now respects the browser's own font-size setting instead of overriding it.

Previously, Mangrove set `html { font-size: 10px }`, which overrode whatever the user or browser had configured. Now, Mangrove does not set a root font-size at all. The compiled CSS has no `font-size` rule on `html`. The browser decides.

A rem (root em) is a CSS unit relative to the root element's font size. Why this change matters:

- Users who set their browser to 20px actually get 20px now.
- Third-party CSS that expects the browser default (16px) no longer conflicts with Mangrove styles.
- The old 10px override prevented users from adjusting text size through their browser preferences, a failure of WCAG 2.2 Success Criterion 1.4.4 (Resize Text). That is fixed.

All Mangrove components still render at the same pixel sizes. The `mg-rem()` Sass function recalculates every token at compile time, so `mg-rem(16)` outputs `1rem` instead of the old `1.6rem`. Both resolve to the same size on screen.

### What the `$mg-html-font-size: 16` variable means

This variable does not set the font-size to 16px. It tells `mg-rem()` what the browser default typically is so the rem math comes out right. A user who has set their browser to 24px gets 24px. The variable is a math input, not a CSS override.

### Comparison: 1.3.x vs 1.4

| Setting | 1.3.x (root = 10) | 1.4 (no root override) |
|---|---|---|
| `$mg-html-font-size` default | `10` | `16` |
| `html` font-size rule | `font-size: 10px` | Not emitted (browser default) |
| `mg-rem(16)` output | `1.6rem` | `1rem` |
| Rendered size of `mg-rem(16)` | 16px | 16px |

### Who needs to take action

**Existing Drupal sites** (undrr.org, preventionweb.net, mcr2030.undrr.org, irp.undrr.org): switch to the legacy theme CSS ([Option A](#option-a-switch-to-legacy-theme-css-no-code-changes)). This is a one-file change per theme, and your site renders identically to 1.3.x. You can then plan a full migration ([Option C](#option-c-migrate-to-the-browser-default-root-recommended)) on your own timeline.

**New projects** (any framework or static site): use the standard theme. No action needed.

**No action is needed** if your custom CSS uses only Mangrove classes and design tokens (they recalculate automatically), or uses `px`/`em` units instead of `rem`.

### Option A: switch to legacy theme CSS (no code changes)

Each theme ships a `-legacy` variant that keeps the old behavior (`html { font-size: 10px }`). Legacy themes produce CSS identical to 1.3.x.

| Standard theme (1.4) | Legacy theme (1.3.x behavior) |
|---|---|
| `style.css` | `style-legacy.css` |
| `style-preventionweb.css` | `style-preventionweb-legacy.css` |
| `style-mcr.css` | `style-mcr-legacy.css` |
| `style-irp.css` | `style-irp-legacy.css` |
| `style-delta.css` | No legacy variant (designed for browser-default root) |

Legacy themes will be maintained through the end of 2026 and removed in v2. See [Legacy theme deprecation timeline](#legacy-theme-deprecation-timeline) for details.

**For Drupal sites** — you change the source file you copy rather than an import path. Source paths below are relative to the Mangrove repo root; destination paths are relative to `docroot/`.

| Drupal child theme | Copy this file | To this location |
|---|---|---|
| undrr | `stories/assets/css/style-legacy.css` | `themes/custom/undrr/css/mangrove/mangrove.css` |
| pw | `stories/assets/css/style-preventionweb-legacy.css` | `themes/custom/pw/css/mangrove/mangrove.css` |
| mcr | `stories/assets/css/style-mcr-legacy.css` | `themes/custom/mcr/css/mangrove/mangrove.css` |
| irp | `stories/assets/css/style-irp-legacy.css` | `themes/custom/irp/css/mangrove/mangrove.css` |
| arise (base UNDRR theme) | `stories/assets/css/style-legacy.css` | `themes/custom/arise/css/mangrove/mangrove.css` |
| gp (base UNDRR theme) | `stories/assets/css/style-legacy.css` | `themes/custom/gp/css/mangrove/mangrove.css` |
| sfvc (base UNDRR theme) | `stories/assets/css/style-legacy.css` | `themes/custom/sfvc/css/mangrove/mangrove.css` |

Commit the CSS files to the Drupal repo and deploy. Nothing else changes.

> **Gutenberg CSS note:** `style-gutenberg.css` does not have a legacy variant. Its rem values are recalculated for the browser-default root, which fixes an existing issue where Gutenberg block previews rendered oversized in the editor iframe. If you previously added CSS overrides to compensate for oversized block previews (such as a `font-size` rule on the editor iframe or a zoom transform), search for and remove them. This change applies regardless of whether you use standard or legacy CSS for the front-end theme.

**To roll back:** copy the 1.3.x CSS files back to each child theme and redeploy. No JS or component changes need reverting.

**For CDN consumers:**

```html
<!-- Before (1.3.x) -->
<link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/1.3.3/css/style.css">

<!-- After (1.4.0, using legacy variant) -->
<link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/1.4.0/css/style-legacy.css">
```

**For npm consumers loading compiled CSS:**

```js
// Before
import '@undrr/undrr-mangrove/css/style.css';

// After (legacy)
import '@undrr/undrr-mangrove/css/style-legacy.css';
```

### Option B: set the variable in your SCSS

Add `$mg-html-font-size: 10;` before every Mangrove SCSS import in your project. The `!default` flag on Mangrove's variable means your value takes precedence.

Use this if your build pipeline imports Mangrove SCSS source files and compiles them. Most Drupal sites that `@import` Mangrove's `_variables.scss` need both [Option A](#option-a-switch-to-legacy-theme-css-no-code-changes) (for the pre-compiled CSS) and Option B (for the SCSS build). To check whether this applies to you, search your theme's `.scss` files for `@import` statements that reference `undrr-mangrove`.

**For npm consumers:**

```scss
$mg-html-font-size: 10;
@import "@undrr/undrr-mangrove/stories/assets/scss/style";
```

**For Drupal themes** that import Mangrove variables via relative paths — add the line at the top of the file, before the existing `@import` or `@use`:

```scss
// mangrove/mangrove.scss (PreventionWeb example)
$mg-html-font-size: 10;
@import '../../../../../libraries/undrr-mangrove/stories/assets/scss/variables';
@import '../../../../../libraries/undrr-mangrove/stories/assets/scss/variables-preventionweb';
@import '../../../undrr_common/scss/mangrove-components';
```

```scss
// gutenberg-integration.scss (PreventionWeb example)
$mg-html-font-size: 10;
@import '../../../../libraries/undrr-mangrove/stories/assets/scss/variables';
@import '../../../../libraries/undrr-mangrove/stories/assets/scss/variables-preventionweb';
@import '../../../../libraries/undrr-mangrove/stories/assets/scss/breakpoints';
```

Any file that imports Mangrove's `_variables.scss` needs this line. If you have multiple entry points (theme SCSS, Gutenberg integration SCSS), add it to each one.

### Option C: migrate to the browser-default root (recommended)

This is the long-term goal. After completing Option C, remove the `$mg-html-font-size: 10` override from Option B (if you added one) and switch from legacy CSS back to standard CSS (reversing Option A).

Audit your custom CSS for raw `rem` values and convert them. A rem value written for a 10px root needs to be multiplied by `0.625` for the browser-default 16px root:

```text
new_rem = old_rem * (10 / 16)
new_rem = old_rem * 0.625
```

**Examples:**

| Purpose | 10px root | Browser-default root | Rendered size |
|---|---|---|---|
| 20px spacing | `2rem` | `1.25rem` | 20px |
| 14px font | `1.4rem` | `0.875rem` | 14px |
| 24px heading | `2.4rem` | `1.5rem` | 24px |
| 100px width | `10rem` | `6.25rem` | 100px |

Where a Mangrove token (a reusable style value like spacing or font size) exists, prefer it over raw rem values:

```scss
// Before — raw rem tied to 10px root
.my-component {
  padding: 2rem;        // 20px
  font-size: 1.6rem;    // 16px
  margin-bottom: 1rem;  // 10px
}

// After — Mangrove tokens (root-agnostic)
.my-component {
  padding: $mg-spacing-200;       // 20px at any root
  font-size: $mg-font-size-300;   // 16px at any root
  margin-bottom: $mg-spacing-100; // 10px at any root
}
```

If no matching token exists, use the `mg-rem()` function directly:

```scss
.my-component {
  border-radius: mg-rem(6); // 6px at any root
}
```

#### Pre-flight checklist for Drupal sites migrating to standard themes

This checklist only applies if you are moving from legacy to standard themes (Option C). If you are staying on legacy CSS (Option A), none of this applies — your site renders identically to 1.3.x.

Before deploying the standard theme, search your Drupal theme SCSS for:

- `html` rules that set `font-size` (e.g., `font-size: 10px` or `font-size: 62.5%`). Remove them — they will conflict with the standard theme and cause Mangrove components to render at 62.5% of their intended size.
- Raw `rem` values in custom stylesheets (e.g., `padding: 2rem`). These were written for the 10px root and will render 60% larger under the standard theme. For example, a `2rem` padding that rendered as 20px will render as 32px. Convert them using the formula above or replace with Mangrove tokens.
- Any `$mg-spacing-350` references. This token changed from 30px to 35px (see [what else is in 1.4](#what-else-is-in-14)).

### Legacy theme deprecation timeline

Legacy themes (`style-legacy.css`, `style-preventionweb-legacy.css`, etc.) ship alongside standard themes and will be maintained through the end of 2026. They will be removed in v2 (no earlier than 2027).

Compiling a legacy theme from SCSS emits a build warning with a link to this guide. If you load pre-compiled CSS from the CDN or copy compiled files (as Drupal sites do), you will not see that warning — check the comment block at the top of the CSS file instead, which identifies it as a legacy variant.

Legacy themes continue to override user font-size preferences (`html { font-size: 10px }`), which does not conform to WCAG 2.2 SC 1.4.4 (Resize Text). Users who need larger text to read comfortably cannot adjust it through their browser settings. Migrating to standard themes ([Option C](#option-c-migrate-to-the-browser-default-root-recommended)) is recommended when feasible.

## Upgrading from 1.3.x

1. Update your dependency: `yarn add @undrr/undrr-mangrove@^1.4.0` (or update `package.json` and run `yarn install`)
2. If you load Mangrove CSS from the CDN, update the version number in your `<link>` tags
3. Copy the updated compiled CSS to your Drupal child themes (see the [Option A table](#option-a-switch-to-legacy-theme-css-no-code-changes) for file paths)
4. Check the [migration section](#migration-root-font-size-change) above — existing Drupal sites should default to Option A (legacy theme), new projects need no action
5. If you use the SCSS source, run a build and check for the legacy theme deprecation warning

React component APIs are unchanged — same props, same exports, same `data-mg-*` attributes. Gutenberg blocks use the same data attributes and render logic as before.

### Verifying the upgrade

After deploying, open the browser console and run:

```js
getComputedStyle(document.documentElement).fontSize
```

- Standard theme: should show your browser's default (typically `"16px"`)
- Legacy theme: should show `"10px"`

If it shows `"10px"` and you expected the standard theme, you are loading legacy CSS.

---

## For Mangrove contributors

The following section is for developers contributing to the Mangrove library source code. If you only consume Mangrove through compiled CSS or npm packages, the sections above cover your use case.

Three rules for SCSS inside Mangrove:

1. **Use `mg-rem($px)` for all rem values.** Pass the intended pixel value. Never hard-code a rem number.

    ```scss
    // Correct
    padding: mg-rem(12);

    // Wrong — changes meaning when root changes
    padding: 1.2rem;
    ```

2. **Use tokens when one exists.** Check `_variables.scss` for spacing, font-size, and other tokens before reaching for `mg-rem()` directly.

    ```scss
    // Preferred — uses the token
    gap: $mg-spacing-150;

    // Acceptable — no matching token exists
    gap: mg-rem(18);
    ```

3. **Never set `font-size` on `html`.** The root font-size is controlled by `$mg-html-font-size` in `_foundational.scss`. Component styles should not override it.

## Related documentation

- [Architecture: root font-size and mg-rem()](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-architecture--docs) — technical details on how the function works
- [Release process](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-release-process--docs) — how Mangrove versions are published
