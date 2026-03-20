# Mangrove 1.4 release notes

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-1.4.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v1-4--docs).

Mangrove 1.4 stops overriding the browser's root font-size, adds the DELTA Resilience theme, ships an AI component manifest, and includes search, documentation, and accessibility improvements.

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

**You need to take action** if your site loads Mangrove CSS and also has custom CSS that uses raw `rem` values not derived from Mangrove tokens. Under a 10px root, `2rem` means 20px. Under the browser default, `2rem` means 32px. Any hard-coded rem values in your custom stylesheets will scale differently.

**No action is needed** if:
- Your custom CSS uses only Mangrove classes and design tokens (they recalculate automatically)
- Your custom CSS uses `px` or `em` units instead of `rem`
- You are building a new site on the DELTA Resilience theme (it was built for the browser-default root from the start)

### Option A: switch to legacy theme CSS (no code changes)

Each theme ships a `-legacy` variant that keeps the old behavior (`html { font-size: 10px }`). Change the CSS import path:

| Standard theme (1.4) | Legacy theme (1.3.x behavior) |
|---|---|
| `style.css` | `style-legacy.css` |
| `style-preventionweb.css` | `style-preventionweb-legacy.css` |
| `style-mcr.css` | `style-mcr-legacy.css` |
| `style-irp.css` | `style-irp-legacy.css` |

Legacy themes produce CSS identical to 1.3.x. No other changes are needed.

The DELTA Resilience theme (`style-delta.css`) has no legacy variant. It was designed for the browser-default root and is unaffected by this change.

Use this option if you load compiled CSS from the CDN or from `dist/css/`.

**CDN example:**

```html
<!-- Before (1.3.x) -->
<link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/1.3.3/css/style.css">

<!-- After (1.4, using legacy variant) — replace {version} with the version you upgrade to -->
<link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/{version}/css/style-legacy.css">
```

### Option B: set the variable in your SCSS

Use this if your build pipeline imports Mangrove SCSS source files and compiles them.

Set `$mg-html-font-size` to `10` before importing:

```scss
$mg-html-font-size: 10;
@import "@undrr/undrr-mangrove/stories/assets/scss/style";
```

This produces the same compiled CSS as 1.3.x. The `!default` flag on Mangrove's variable lets your value take precedence.

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

### Legacy theme deprecation timeline

Legacy themes (`style-legacy.css`, `style-preventionweb-legacy.css`, etc.) ship alongside standard themes and will be maintained through the end of 2026. They will be removed in v2. Compiling a legacy theme emits a warning with a link to this guide.

Note that legacy themes continue to override user font-size preferences (`html { font-size: 10px }`), which does not conform to WCAG 1.4.4 Resize Text. Migrating to standard themes (Option C) is recommended when feasible.

## DELTA Resilience theme

DELTA Resilience gets its own theme (`style-delta.scss`) with a dedicated landing page template, theme-specific color tokens, and adjusted component styles. It was built for the browser-default root from the start, so there is no legacy variant.

## AI integration

Mangrove now ships an AI component manifest (`manifest.json`) and an `llms.txt` file so AI coding tools can discover and render Mangrove components. The manifest includes auto-rendering instructions, React component metadata, and vanilla HTML examples.

## Search improvements

The search widget adds native filter controls for content type, country, and date range. Elasticsearch query handling was optimized and a four-card syndication layout was added. Separately, debounce timing was increased and URL query parameter handling was fixed to eliminate a UI bounce during typing.

## Documentation

Storybook organization was cleaned up, semantic CSS rationale was added, and the About page was rewritten. Developer guides now cross-reference each other better and the sidebar ordering makes more sense.

## Bug fixes

- **Footer**: mobile responsive layout fixed for narrow viewports
- **AI manifest**: import statement validation now checks against actual npm exports

## Upgrading from 1.3.x

1. Update your dependency: `yarn add @undrr/undrr-mangrove@^1.4.0` (or update `package.json` and run `yarn install`)
2. If you load Mangrove CSS from the CDN, update the version number in your `<link>` tags
3. Check the [root font-size: browser alignment](#root-font-size-browser-alignment) section above — you may need Option A, B, or C depending on your custom CSS
4. If you use the SCSS source, run a build and check for the legacy theme deprecation warning

React component APIs are unchanged — same props, same exports, same `data-mg-*` attributes.

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

- [Architecture: root font-size and mg-rem()](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-architecture--docs) — technical details on how the function works
- [Release process](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-release-process--docs) — how Mangrove versions are published
