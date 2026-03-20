# Mangrove 1.4 release notes

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-1.4.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v1-4--docs).

We don't usually write long-form release notes for Mangrove. But 1.4 is a bigger release than most, and it represents a new level of maturity for the library. Going forward, we plan to do this for each minor release (1.5, 1.6, etc.) so there is a clear record of what changed and why.

The bulk of these notes cover the **root font-size change** — a modernization that aligns Mangrove with browser standards and fixes a long-standing accessibility gap. The rest of the 1.4 work is summarized below with links to the relevant pull requests.

**For site owners and program managers:** Users who have set a larger font size in their browser will now see that preference respected on sites using the standard Mangrove theme. Previously, Mangrove overrode this setting, which made text harder to read for people who need larger text. Existing Drupal sites should use the legacy theme variant (a one-file swap) while planning a full migration.

## What else is in 1.4

These shipped on `main` since the 1.3.3 tag. Each is a self-contained improvement — the PRs have the full details.

- **DELTA Resilience theme** — new theme, landing page template, and component adjustments for the DELTA initiative ([#835](https://github.com/unisdr/undrr-mangrove/pull/835))
- **AI component manifest** — `manifest.json` and `llms.txt` so AI coding tools can discover and render Mangrove components ([#845](https://github.com/unisdr/undrr-mangrove/pull/845), [#847](https://github.com/unisdr/undrr-mangrove/pull/847))
- **Search widget** — native filters for content type, country, and date range; four-card syndication layout; debounce and URL param fixes ([#834](https://github.com/unisdr/undrr-mangrove/pull/834), [#851](https://github.com/unisdr/undrr-mangrove/pull/851))
- **Documentation** — Storybook reorganization, semantic CSS rationale, sidebar cleanup ([#833](https://github.com/unisdr/undrr-mangrove/pull/833), [#848](https://github.com/unisdr/undrr-mangrove/pull/848))
- **Footer** — mobile responsive layout fix for narrow viewports ([#838](https://github.com/unisdr/undrr-mangrove/pull/838))
- **`$mg-spacing-350` fix** — was identical to `$mg-spacing-300` (both 30px), now correctly 35px. All internal usages updated, no visual change. If your SCSS references this token directly, you will get 35px instead of 30px.
- **CtaLink removed** — the inline call-to-action link component (`.cta__link`) was removed. It was never integrated into Drupal or exported via npm. The CSS classes `cta__link`, `cta--arrow`, and `cta--space` are no longer emitted in compiled theme CSS. The CtaButton component (`.mg-button`) is unaffected.

## Root font-size: browser alignment

Mangrove now respects the browser's own font-size setting instead of overriding it.

Previously, Mangrove set `html { font-size: 10px }`, which overrode whatever the user or browser had configured. Now, Mangrove does not set a root font-size at all. The compiled CSS simply has no `font-size` rule on `html`. The browser decides.

Why this matters:

- Users who set their browser to 20px actually get 20px now.
- Third-party CSS that expects the browser default (16px) no longer conflicts with Mangrove styles.
- The old 10px override prevented users from adjusting text size through their browser preferences, which is a WCAG 2.2 conformance issue (Success Criterion 1.4.4, Resize Text). That's fixed.

All Mangrove components still render at the same pixel sizes. The `mg-rem()` function recalculates every token at compile time, so `mg-rem(16)` outputs `1rem` instead of the old `1.6rem` — both resolve to 16px on screen.

### What the `$mg-html-font-size: 16` variable means

This variable does not set the font-size to 16px. It tells `mg-rem()` what the browser default typically is so the rem math comes out right. A user who has set their browser to 24px gets 24px. The variable is a math input, not a CSS override.

### Before and after

| | 1.3.x (root = 10) | 1.4 (no root override) |
|---|---|---|
| `$mg-html-font-size` default | `10` | `16` |
| `html` font-size rule | `font-size: 10px` | Not emitted (browser default) |
| `mg-rem(16)` output | `1.6rem` | `1rem` |
| Rendered size of `mg-rem(16)` | 16px | 16px |

### Who needs to take action

**Existing Drupal sites** (undrr.org, preventionweb.net, mcr2030.undrr.org, IRP): switch to the legacy theme CSS (Option A below). This is a file rename — your site renders identically to 1.3.x with no other changes needed. You can then plan a full migration (Option C) on your own timeline.

**New projects** (Remix, Next.js, Vite, etc.): use the standard theme. No action needed — the browser-default root is what you want.

**No action is needed** if your custom CSS uses only Mangrove classes and design tokens (they recalculate automatically), or uses `px`/`em` units instead of `rem`.

### Option A: switch to legacy theme CSS (no code changes)

Each theme ships a `-legacy` variant that keeps the old behavior (`html { font-size: 10px }`). Legacy themes produce CSS identical to 1.3.x.

| Standard theme (1.4) | Legacy theme (1.3.x behavior) |
|---|---|
| `style.css` | `style-legacy.css` |
| `style-preventionweb.css` | `style-preventionweb-legacy.css` |
| `style-mcr.css` | `style-mcr-legacy.css` |
| `style-irp.css` | `style-irp-legacy.css` |

The DELTA Resilience theme (`style-delta.css`) has no legacy variant. It was designed for the browser-default root and is unaffected.

**For Drupal sites** — CSS is deployed by copying compiled files, not by changing import paths. For each child theme, copy the legacy variant instead of the standard one:

| Drupal child theme | Copy this file | To this location |
|---|---|---|
| undrr | `stories/assets/css/style-legacy.css` | `themes/custom/undrr/css/mangrove/mangrove.css` |
| pw | `stories/assets/css/style-preventionweb-legacy.css` | `themes/custom/pw/css/mangrove/mangrove.css` |
| mcr | `stories/assets/css/style-mcr-legacy.css` | `themes/custom/mcr/css/mangrove/mangrove.css` |
| irp | `stories/assets/css/style-irp-legacy.css` | `themes/custom/irp/css/mangrove/mangrove.css` |
| arise | `stories/assets/css/style-legacy.css` | `themes/custom/arise/css/mangrove/mangrove.css` |
| gp | `stories/assets/css/style-legacy.css` | `themes/custom/gp/css/mangrove/mangrove.css` |
| sfvc | `stories/assets/css/style-legacy.css` | `themes/custom/sfvc/css/mangrove/mangrove.css` |

Commit the CSS files to the Drupal repo and deploy. Nothing else changes.

**For CDN consumers:**

```html
<!-- Before (1.3.x) -->
<link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/1.3.3/css/style.css">

<!-- After (1.4, using legacy variant) — replace {version} with the version you upgrade to -->
<link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/{version}/css/style-legacy.css">
```

**For npm consumers loading compiled CSS:**

```js
// Before
import '@undrr/undrr-mangrove/css/style.css';

// After (legacy)
import '@undrr/undrr-mangrove/css/style-legacy.css';
```

### Option B: set the variable in your SCSS

Use this if your build pipeline imports Mangrove SCSS source files and compiles them. If your site also loads pre-compiled Mangrove CSS (from CDN or copied files), you need both Option A (for the compiled CSS) and Option B (for your SCSS build).

Add `$mg-html-font-size: 10;` before your first Mangrove import. The `!default` flag on Mangrove's variable means your value takes precedence.

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

Audit your custom CSS for raw `rem` values and convert them. A rem value written for a 10px root needs to be multiplied by `0.625` for the browser-default 16px root:

```
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

Where a Mangrove token exists, prefer it over raw rem values:

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
- Raw `rem` values in custom stylesheets (e.g., `padding: 2rem`). These were written for the 10px root and will render 60% larger under the standard theme. Convert them using the formula above or replace with Mangrove tokens.
- Any `$mg-spacing-350` references. This token changed from 30px to 35px (see [what else is in 1.4](#what-else-is-in-14)).

### Legacy theme deprecation timeline

Legacy themes (`style-legacy.css`, `style-preventionweb-legacy.css`, etc.) ship alongside standard themes and will be maintained through the end of 2026. They will be removed in v2.

Compiling a legacy theme from SCSS emits a build warning with a link to this guide. If you load pre-compiled CSS from the CDN or copy compiled files (as Drupal sites do), you won't see that warning — check the comment block at the top of the CSS file instead, which identifies it as a legacy variant.

Legacy themes continue to override user font-size preferences (`html { font-size: 10px }`), which does not conform to WCAG 1.4.4 Resize Text. This means users who need larger text to read comfortably cannot adjust it through their browser settings. Migrating to standard themes (Option C) is recommended when feasible.

## Upgrading from 1.3.x

1. Update your dependency: `yarn add @undrr/undrr-mangrove@^1.4.0` (or update `package.json` and run `yarn install`)
2. If you load Mangrove CSS from the CDN, update the version number in your `<link>` tags
3. Check the [root font-size: browser alignment](#root-font-size-browser-alignment) section above — existing Drupal sites should default to Option A (legacy theme), new projects need no action
4. If you use the SCSS source, run a build and check for the legacy theme deprecation warning

React component APIs are unchanged — same props, same exports, same `data-mg-*` attributes. Gutenberg blocks use the same data attributes and render logic as before.

Note that `style-gutenberg.css` does not have a legacy variant. Its rem values are recalculated for the browser-default root, which fixes an existing issue where Gutenberg block previews rendered oversized in the editor iframe. If you added compensatory CSS to work around that, you may need to remove it.

### Verifying the upgrade

After deploying, open the browser console and run:

```js
getComputedStyle(document.documentElement).fontSize
```

- Standard theme: should show your browser's default (typically `"16px"`)
- Legacy theme: should show `"10px"`

If it shows `"10px"` and you expected the standard theme, you are loading legacy CSS.

## For Mangrove contributors

The following section is for developers who contribute to the Mangrove library itself, not for sites consuming Mangrove CSS.

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
