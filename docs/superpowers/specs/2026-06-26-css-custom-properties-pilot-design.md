# CSS Custom Properties Pilot — Design Spec

**Date:** 2026-06-26
**Issue:** [#1060](https://github.com/unisdr/undrr-mangrove/issues/1060)
**Scope:** Pilot branch only. Full migration tracked in #1060 for v2.0.

## Goals

Validate the migration approach for CSS custom properties before committing to a full rewrite. Primary concerns: maintainability (easy to trace where a value comes from), understandability (new contributors can follow the system), and flexibility (sub-brands can override without a Sass build).

## What this pilot covers

Two sequential phases in one branch:

- **Phase A:** Migrate the raw color palette to CSS custom properties, keeping SCSS aliases so no component files change.
- **Phase C:** Migrate the Tab component end-to-end — custom properties in variables, `var()` in component SCSS, MCR overrides as a scoped CSS selector.

## What this pilot does NOT cover

- Spacing, typography, breakpoints, or any non-color variables (except spacing custom properties needed for Phase C MCR overrides — see below).
- Any component other than Tab in Phase C.
- Removing the SCSS alias layer (that happens in the full v2.0 migration).
- The `@use`/`@forward` Dart Sass migration (tracked separately in #683, bundled at v2.0).

---

## Phase A: Raw color palette

### Variables that move

The raw color palette scales in `_variables.scss`:

- `$mg-color-blue-*` (50–900)
- `$mg-color-orange-*` (50–900)
- `$mg-color-red-*` (50–900)
- `$mg-color-neutral-*` (0–900, plus `$mg-color-black` / `$mg-color-white`)
- `$mg-color-accent-*` (100–400)

Sendai colors (`$sendai-*`) and deprecated UNDP colors (`$mg-color-green`, `$mg-color-azure`, etc.) are **excluded** — they are not part of the core palette and will be addressed separately.

### Color format: space-separated RGB channels

All palette colors are stored as space-separated RGB channel values, not hex strings. This makes every color automatically alpha-capable with no extra variables, and eliminates the need for `-rgb` twin properties.

```scss
:root {
  --mg-color-blue-900: 0 79 145;
  --mg-color-neutral-900: 0 0 0;
  --mg-color-neutral-0: 255 255 255;
}
```

Usage in component SCSS:

```scss
color: rgb(var(--mg-color-blue-900));               // solid
background: rgb(var(--mg-color-blue-900) / 0.15);   // with alpha
```

SCSS aliases follow the same pattern — the alias value is the `var()` reference, and usages in component SCSS that currently call `rgba($mg-color-X, 0.5)` migrate to `rgb(var(--mg-color-X) / 0.5)`. Because Phase A keeps SCSS aliases in place and does not change component SCSS, `rgba()` call sites in components are **not** updated in Phase A — they are addressed when each component is migrated end-to-end (Phase C and beyond).

**`$mg-color-modal-scrim` edge case:** This semantic variable is defined in `_variables.scss` as `rgba($mg-color-neutral-900, 0.85)`. Once `$mg-color-neutral-900` aliases to `var(--mg-color-neutral-900)`, Sass cannot evaluate the `rgba()` call at build time. Fix: rewrite the definition to use `rgb()` with the channel variable directly:

```scss
$mg-color-modal-scrim: rgb(var(--mg-color-neutral-900) / 0.85) !default;
```

This is the only semantic variable definition that must change in Phase A.

**Future:** OKLCH (perceptually uniform, better for palette generation) is the intended color space for v3. The channel approach adopted here is a stepping stone — the infrastructure is identical, only the channel format changes.

### Pattern for each variable

Every palette variable follows this three-part structure in `_variables.scss`:

```scss
// Raw channel values — private, used only to populate :root
$_mg-color-blue-900--raw: 0 79 145;

// :root emission — the CSS custom property
:root {
  --mg-color-blue-900: #{$_mg-color-blue-900--raw};
}

// SCSS alias — so existing component files keep working unchanged
$mg-color-blue-900: var(--mg-color-blue-900);
```

The `$_` prefix and `--raw` suffix mark the private variable as internal. It is never referenced outside `_variables.scss`. The interpolation `#{...}` is required so Sass emits the channel values literally rather than attempting to evaluate them.

### What stays SCSS-only

The following remain as plain SCSS variables with no custom property equivalent. Each is annotated with a `// BUILD-TIME ONLY` comment:

- **Breakpoints** (`$mg-breakpoint-mobile` etc.) — cannot be used in `@media` queries as custom properties; build-time only forever.
- **`$mg-html-font-size`** — drives the `mg-rem()` function at compile time.
- **`$mgIconFontPath`**, **`$img-path-*`** — file paths resolved at build time.

### Semantic/interactive variables

The `!default`-flagged semantic layer (`$mg-color-interactive`, `$mg-color-button-*`, `$mg-color-tag-*`, etc.) is **not changed in Phase A**. These variables still reference palette variables — after Phase A, they resolve through the SCSS alias chain (`$mg-color-interactive → $mg-color-blue-900 → var(--mg-color-blue-900)`), which is correct and intentional. The full semantic layer migration is Phase C and beyond.

---

## Phase C: Tab component end-to-end

### Tab-specific variables in `_variables.scss`

The following variables in the `// tabs` section are migrated to CSS custom properties and their SCSS aliases are **dropped** (unlike Phase A, the Tab component SCSS will use `var()` directly):

```
--mg-color-tabbar-background
--mg-color-tab-background
--mg-color-tab-background--inactive
--mg-color-tab-border
--mg-color-tab-border--hover
--mg-color-tab-border--active
--mg-color-tab-background--hover
--mg-radius-tab
--mg-padding-tab
--mg-color-text-tab
--mg-color-text-tab--hover
--mg-color-text-tab-active
--mg-color-text-tab-no-results
--mg-color-tab-section-background
--mg-padding-tab-section
--mg-radius-tab-section
--mg-box-shadow-tab-section
```

These are defined on `:root` in `_variables.scss`. No SCSS `$mg-*` alias is kept for these — the tab component is the test case for the target state (full `var()` usage).

Note: `$mg-tabs-border-bottom` is **not migrated** (see below).

### `tab.scss`

All `$mg-color-tab-*`, `$mg-radius-tab`, `$mg-padding-tab`, `$mg-box-shadow-tab-section`, and `$mg-color-text-tab-*` references are replaced with their `var(--mg-*)` equivalents.

References to `$mg-spacing-*`, `$mg-breakpoint-*`, `$mg-font-*`, and `$mg-font-family-*` are left as SCSS variables — spacing and typography are out of scope for this pilot. Exception: the spacing values used by Tab's MCR overrides require `--mg-spacing-*` custom properties to exist (see Phase C MCR overrides below).

The `@if $mg-tabs-border-bottom` block stays as-is with an explicit comment:

```scss
// BUILD-TIME ONLY: drives conditional ::after border generation.
// Cannot become a CSS custom property — no runtime conditional equivalent exists.
// All sub-brands use true. To disable, set $mg-tabs-border-bottom: false before @use.
@if $mg-tabs-border-bottom {
  // ...
}
```

### Spacing custom properties (required for Phase C)

The MCR tab overrides use spacing values (`$mg-spacing-150`, `$mg-spacing-200`, `$mg-spacing-300`, `$mg-spacing-500`) for radius and padding. For the `.mg-theme-mcr` selector to reference these cleanly without hardcoded values, the spacing scale must be emitted as custom properties first.

The full spacing scale is emitted on `:root` in `_variables.scss` using the same `$_raw` / `:root` / alias pattern as Phase A colors. SCSS aliases (`$mg-spacing-X: var(--mg-spacing-X)`) are kept so existing component SCSS is unaffected.

Note: spacing values are computed by `mg-rem()` at build time. The `$_raw` privates hold the rem-computed value:

```scss
$_mg-spacing-150--raw: mg-rem(15); // → 0.9375rem (root=16)

:root {
  --mg-spacing-150: #{$_mg-spacing-150--raw};
}

$mg-spacing-150: var(--mg-spacing-150);
```

### MCR theme overrides for Tab

The Tab section is removed from `_variables-mcr.scss` and placed in a new file `_theme-mcr.scss`. This separation is intentional: `_variables-mcr.scss` holds build-time Sass configuration (palette variables, `!default` overrides); `_theme-mcr.scss` holds runtime CSS custom property overrides as a scoped selector block.

As the v2.0 migration progresses, content moves from `_variables-mcr.scss` into `_theme-mcr.scss`. When `_variables-mcr.scss` is empty, it is deleted. The two-file state is an honest progress indicator.

```scss
// _theme-mcr.scss
.mg-theme-mcr {
  --mg-color-tab-background:           #6e2677; /* mcr-purple-800 */
  --mg-color-tab-background--inactive:  #ffffff;
  --mg-color-tab-border:               #ded0d7; /* mcr-purple-200 */
  --mg-color-tab-border--hover:        #6e2677;
  --mg-color-tab-border--active:       #ded0d7;
  --mg-color-tab-background--hover:    rgb(var(--mg-color-mcr-purple-800) / 0.6);
  --mg-radius-tab:                     var(--mg-spacing-150) var(--mg-spacing-150) 0 0;
  --mg-padding-tab:                    var(--mg-spacing-200) var(--mg-spacing-300);
  --mg-color-text-tab:                 #333333; /* mg-color-neutral-700 */
  --mg-color-text-tab--hover:          #ffffff;
  --mg-color-text-tab-active:          #ffffff;
  --mg-padding-tab-section:            var(--mg-spacing-500);
  --mg-radius-tab-section:             var(--mg-spacing-200);
  --mg-box-shadow-tab-section:         rgb(var(--mg-color-neutral-900) / 0.24) 0 6px 5px 0;
  --mg-color-tabbar-background:        none;
}
```

`_theme-mcr.scss` is `@import`ed (or `@use`d after #683) from `style-mcr.scss`, after `_variables-mcr.scss`.

### Applied in Drupal / HTML

The `.mg-theme-mcr` class is applied to `<body>` or a wrapping element by the Drupal theme. This is unchanged from the approach the MCR Drupal theme already uses for its body class.

---

## File structure after the pilot

```
stories/assets/scss/
  _variables.scss               # Emits :root { --mg-* } for colors + spacing; $_raw privates; SCSS aliases
  _variables-mcr.scss           # MCR build-time Sass config (shrinks as migration progresses; deleted when empty)
  _theme-mcr.scss               # NEW: .mg-theme-mcr { --mg-* overrides } (runtime CSS)
  _variables-irp.scss           # Unchanged in this pilot
  _variables-preventionweb.scss # Unchanged in this pilot
  _variables-delta.scss         # Unchanged in this pilot

stories/Components/Tab/
  tab.scss                      # Uses var(--mg-*) for all tab-specific tokens
```

---

## What we learn from this pilot

- Whether the `$_raw` / `:root` / alias pattern is readable and maintainable in practice.
- Whether dropping SCSS aliases in Phase C (Tab) causes any unexpected build or cascade issues.
- Whether `.mg-theme-mcr {}` overrides work correctly in Storybook for the MCR theme.
- Whether the `-rgb` channel twin pattern for `rgba()` is clear to contributors.
- Any tooling issues (Storybook hot reload, CSS output size, build warnings).

Findings feed directly into the v2.0 full migration plan.

---

## Acceptance criteria

- [ ] All raw palette color variables (`$mg-color-blue-*`, orange, red, neutral, accent) emitted as CSS custom properties on `:root`
- [ ] All palette colors stored as space-separated RGB channels (`--mg-color-X: R G B`), not hex strings
- [ ] `$mg-color-modal-scrim` definition updated to `rgb(var(--mg-color-neutral-900) / 0.85)` — the only semantic variable changed in Phase A
- [ ] SCSS aliases (`$mg-color-X: var(--mg-color-X)`) in place for all Phase A variables; existing component SCSS compiles without changes
- [ ] Tab component SCSS uses `var(--mg-*)` for all tab-specific tokens; no remaining `$mg-color-tab-*` or `$mg-radius-tab` references
- [ ] Spacing scale (`$mg-spacing-*`) emitted as `--mg-spacing-*` custom properties on `:root` with SCSS aliases
- [ ] `_theme-mcr.scss` created; Tab overrides expressed as `.mg-theme-mcr { --mg-* }` selector block
- [ ] Corresponding Tab SCSS variable assignments removed from `_variables-mcr.scss`
- [ ] `_theme-mcr.scss` imported in `style-mcr.scss` after `_variables-mcr.scss`
- [ ] `$mg-tabs-border-bottom` boolean retained with `BUILD-TIME ONLY` comment block
- [ ] Breakpoints, `$mg-html-font-size`, and path variables annotated with `BUILD-TIME ONLY` comments
- [ ] Storybook builds and renders Tab component correctly in both default and MCR theme
- [ ] No new Sass warnings or errors introduced
