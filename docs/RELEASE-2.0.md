# Mangrove 2.0 release notes

The main change in 2.0: all color and spacing tokens are now CSS custom properties. The SCSS variable theming API is replaced by CSS custom property overrides in `.mg-theme-X { }` selector blocks. Full diff: [v1.8.0...v2.0.0 on GitHub](https://github.com/unisdr/undrr-mangrove/compare/v1.8.0...v2.0.0).

> **If you consume Mangrove via CDN or prebuilt CSS only:** no changes needed. The compiled stylesheets are drop-in replacements and the new theme class pattern is additive.
>
> **If you import Mangrove SCSS directly** or override `$mg-color-*` / `$mg-spacing-*` variables in your own stylesheets: see the [breaking changes](#breaking-changes) below.

> _Edits here show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/RELEASE-2.0.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-release-notes-v2-0--docs)._

## Find your path

| I am... | Go to... |
|---|---|
| A Drupal/CDN consumer, no custom SCSS | [What changed visually](#what-changed-visually) — likely nothing |
| A developer who imports Mangrove SCSS | [Breaking changes](#breaking-changes) |
| A developer who overrides sub-brand tokens | [Sub-brand theming migration](#sub-brand-theming-migration) |
| An AI agent or tool reading this for API context | [Token API summary](#token-api-summary) |

## What changed visually

Nothing, for most users. Colors and spacing are identical — the values moved from SCSS variables to CSS custom properties, but the compiled CSS output is the same.

The one exception: alpha-composited colors (overlays, hover tints, modal scrims) now use the CSS `rgb(var() / alpha)` syntax. Browsers that do not support CSS custom properties will lose those effects. All browsers in the [supported matrix](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-browser-support--docs) handle this correctly.

## Breaking changes

### 1. `$mg-color-*` and `$mg-spacing-*` SCSS aliases removed

The backward-compat SCSS aliases are gone. Any stylesheet that references these variables will fail to compile.

| Old | New |
|---|---|
| `$mg-color-interactive` | `var(--mg-color-interactive)` |
| `$mg-color-blue-900` | `rgb(var(--mg-color-blue-900))` |
| `$mg-spacing-150` | `var(--mg-spacing-150)` |

**Alpha values:** `rgba($mg-color-X, 0.5)` is not valid once the variable chains to `var()`. Use `rgb(var(--mg-color-X) / 0.5)` instead.

**SCSS `color.adjust()` / `darken()` / `lighten()`:** these SCSS functions cannot accept CSS custom properties as arguments. Replace with a computed hex literal or restructure the logic.

The following remain as SCSS variables (BUILD-TIME ONLY — no CSS custom property equivalent):

| Variable | Reason |
|---|---|
| `$mg-breakpoint-*` | `@media` queries require static values at compile time |
| `$mg-font-size-*` | Resolved at compile time for interpolation |
| `$mg-font-family*` | Resolved at compile time |
| `$mg-html-font-size` | Base rem anchor, compile-time only |
| `$mg-tabs-border-bottom` | `@if` conditional, compile-time only |

### 2. Sub-brand `_variables-*.scss` files deleted

The four sub-brand variable override files are gone. Each is replaced by a `_theme-{name}.scss` file.

| Deleted | Replacement |
|---|---|
| `_variables-irp.scss` | `_theme-irp.scss` |
| `_variables-preventionweb.scss` | `_theme-preventionweb.scss` |
| `_variables-mcr.scss` | `_theme-mcr.scss` |
| `_variables-delta.scss` | `_theme-delta.scss` |

If you have a custom SCSS entry point that imports one of these files, update the import:

```scss
// Before
@import "./variables-irp";

// After
@import "./theme-irp";
```

The new files contain a `.mg-theme-irp { }` selector block rather than SCSS variable reassignments. Apply the class to `<body>` or a wrapping element at runtime.

### 3. Hero variant colour map

`hero.scss` stores variant colour names as CSS custom property name strings (`"--mg-color-orange-800"`) rather than resolved SCSS values. Consumers that previously overrode `$mg-color-hero--secondary !default` must instead override the relevant `--mg-color-*` custom property on `:root`.

### 4. `storybook-design-token` plugin removed

If you depend on the plugin being present in the Storybook addon registry, it is gone. The Design decisions/Colors, Spacing, Widths, Breakpoints, and Typography pages use `getComputedStyle` and static tables instead.

## Sub-brand theming migration

The new theming pattern applies CSS custom property overrides at runtime via a selector class, rather than at SCSS compile time via `!default` variable reassignment.

**Before (1.x):**

```scss
// _variables-mytheme.scss — imported before components
$mg-color-interactive: #0a6969 !default;
$mg-color-button-background: #0a6969 !default;
```

**After (2.0):**

```scss
// _theme-mytheme.scss
.mg-theme-mytheme {
  --mg-color-interactive:        var(--mg-color-teal-900);
  --mg-color-button-background:  var(--mg-color-interactive);
}
```

Apply the class in your HTML:

```html
<body class="mg-theme-mytheme">
```

The class can be applied to any ancestor element, not just `<body>`. Multiple theme classes can co-exist on different subtrees.

## Token API summary

All color and spacing tokens are now CSS custom properties on `:root`. Palette colors use space-separated RGB channels to enable alpha compositing:

```css
--mg-color-blue-900: 0 79 145;           /* channel format */
--mg-color-interactive: var(--mg-color-blue-900);  /* semantic alias */
```

Consuming a color:

```css
color: rgb(var(--mg-color-interactive));
background: rgb(var(--mg-color-interactive) / 0.1);  /* with alpha */
```

Full token list: [Design decisions/Colors](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-colors--docs), [Design decisions/Spacing](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-spacing--docs).
