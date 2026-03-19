# Migrating to 16px root font-size in v2

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/MIGRATION-V2-ROOT-FONT-SIZE.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-migration-v2-root-font-size--docs).

Starting in v2, Mangrove sets the default root font-size to the browser standard of 16px. This page explains what changed, who is affected, and how to migrate.

## What changed

Mangrove v1 set `html { font-size: 10px }` by default, making `1rem = 10px` throughout. In v2, the SCSS variable `$mg-html-font-size` changes from `10` to `16`. This means:

- The `html { font-size: 10px }` override is **no longer emitted** by default
- The browser's native root font-size (16px, or the user's configured preference) is respected
- All Mangrove components render at **identical pixel sizes** — the `mg-rem()` function recalculates every token at compile time, so `mg-rem(16)` produces `1.6rem` at root 10 and `1rem` at root 16, both resolving to 16px

This change aligns Mangrove with the approach used by Bootstrap, Material UI, Tailwind CSS, and other major design systems. It also improves accessibility by respecting the user's browser font-size preference.

### Before and after

| | v1 (root = 10) | v2 (root = 16) |
|---|---|---|
| `$mg-html-font-size` default | `10` | `16` |
| `html` font-size rule | `font-size: 10px` | Not emitted (browser default) |
| `mg-rem(16)` output | `1.6rem` | `1rem` |
| Rendered size of `mg-rem(16)` | 16px | 16px |

## Who is affected

**You need to migrate** if your site loads Mangrove CSS and also has custom CSS that uses raw `rem` values not derived from Mangrove tokens. Under a 10px root, `2rem` means 20px. Under a 16px root, `2rem` means 32px. Any hard-coded rem values in your custom stylesheets will scale differently.

**You are not affected** if:
- Your custom CSS uses only Mangrove classes and design tokens (they recalculate automatically)
- Your custom CSS uses `px` or `em` units instead of `rem`
- You are building a new site on the Delta Resilience theme (it was built for the 16px root from the start)

## Migration options

You have three options, from least effort to most thorough.

### Option A: switch to legacy theme CSS (zero code changes)

Each theme ships a `-legacy` variant that preserves the v1 behavior (`html { font-size: 10px }`). Change your CSS import path:

| Standard theme (v2) | Legacy theme (v1 behavior) |
|---|---|
| `style.css` | `style-legacy.css` |
| `style-preventionweb.css` | `style-preventionweb-legacy.css` |
| `style-mcr.css` | `style-mcr-legacy.css` |
| `style-irp.css` | `style-irp-legacy.css` |

Legacy themes produce CSS identical to v1. No other changes are needed.

**CDN example:**

```html
<!-- Before (v1) -->
<link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/1.3.3/css/style.css">

<!-- After (v2, using legacy variant) -->
<link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/2.0.0/css/style-legacy.css">
```

### Option B: set the variable in your SCSS

If your project imports Mangrove SCSS source files, set `$mg-html-font-size` to `10` before importing:

```scss
$mg-html-font-size: 10;
@import "@undrr/undrr-mangrove/stories/assets/scss/style";
```

This produces the same compiled CSS as v1. The `!default` flag on Mangrove's variable lets your value take precedence.

### Option C: migrate to 16px root (recommended)

This is the recommended path. Audit your custom CSS for raw `rem` values and convert them to work with a 16px root.

**Conversion formula:**

A rem value written for a 10px root needs to be multiplied by `0.625` for a 16px root:

```
new_rem = old_rem * (10 / 16)
new_rem = old_rem * 0.625
```

**Examples:**

| Purpose | 10px root | 16px root | Rendered size |
|---|---|---|---|
| 20px spacing | `2rem` | `1.25rem` | 20px |
| 14px font | `1.4rem` | `0.875rem` | 14px |
| 24px heading | `2.4rem` | `1.5rem` | 24px |
| 100px width | `10rem` | `6.25rem` | 100px |

**Better approach:** Replace raw rem values with Mangrove spacing and font-size tokens where possible:

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

## Legacy theme deprecation timeline

Legacy themes (`style-legacy.css`, `style-preventionweb-legacy.css`, etc.) will be maintained alongside the standard themes for a transition period. There is no fixed end date. When deprecation is scheduled, it will be announced with at least two minor release cycles of advance notice, giving teams time to plan their migration.

Each legacy theme's compiled CSS includes a comment header identifying it as a legacy variant:

```css
/* Mangrove legacy theme — 10px root (deprecated, use standard theme) */
```

## For component authors

When writing SCSS inside Mangrove, follow these rules to ensure your styles work at any root font-size:

1. **Use `mg-rem($px)` for all rem values.** Pass the intended pixel value. Never hard-code a rem number.

    ```scss
    // Correct
    padding: mg-rem(12);

    // Wrong — breaks when root changes
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
