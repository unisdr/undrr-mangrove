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

- Spacing, typography, breakpoints, or any non-color variables.
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

### Pattern for each variable

Every palette variable follows this three-part structure in `_variables.scss`:

```scss
// Raw value — private, used only to populate :root
$_mg-color-blue-900--raw: #004f91;

// :root emission — the CSS custom property
:root {
  --mg-color-blue-900: #{$_mg-color-blue-900--raw};
}

// SCSS alias — so existing component files keep working unchanged
$mg-color-blue-900: var(--mg-color-blue-900);
```

The `--raw` private variable uses the `$_` prefix (single leading underscore by Sass convention indicates internal/private) and the `--raw` suffix to make its role unambiguous. It is never referenced outside `_variables.scss`.

The interpolation `#{$_mg-color-blue-900--raw}` is required because Sass would otherwise emit `var(...)` rather than the literal hex value inside the `:root` block.

### RGB channel twins

Only two palette variables are used inside `rgba()` calls in component SCSS:

- `$mg-color-neutral-600` (card borders)
- `$mg-color-neutral-900` (modal scrim, hero overlay)

These receive `-rgb` channel variants alongside the standard property:

```scss
:root {
  --mg-color-neutral-900:     #000000;
  --mg-color-neutral-900-rgb: 0 0 0;
}
```

The corresponding `rgba()` call sites in component SCSS are updated to use the modern syntax:

```scss
// Before
background-color: rgba($mg-color-neutral-900, 0.85);

// After
background-color: rgb(var(--mg-color-neutral-900-rgb) / 0.85);
```

No other palette variables need `-rgb` twins in this pilot. The `rgba()` calls that use semantic variables (`$mg-color-interactive`, `$mg-color-white`) are not affected by Phase A.

**Edge case:** `$mg-color-modal-scrim` is defined in `_variables.scss` as `rgba($mg-color-neutral-900, 0.85)`. After Phase A aliases `$mg-color-neutral-900` to `var(--mg-color-neutral-900)`, this Sass call breaks at compile time. Fix: rewrite the `$mg-color-modal-scrim` definition to use the `$_raw` private variable:

```scss
$mg-color-modal-scrim: rgb(var(--mg-color-neutral-900-rgb) / 0.85) !default;
```

This is the only semantic variable definition that must be updated as part of Phase A.

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

References to `$mg-spacing-*`, `$mg-breakpoint-*`, `$mg-font-*`, and `$mg-font-family-*` are left as SCSS variables — spacing and typography are out of scope for this pilot.

The `@if $mg-tabs-border-bottom` block stays as-is with an explicit comment:

```scss
// BUILD-TIME ONLY: drives conditional ::after border generation.
// Cannot become a CSS custom property — no runtime conditional equivalent exists.
// All sub-brands use true. To disable, set $mg-tabs-border-bottom: false before @use.
@if $mg-tabs-border-bottom {
  // ...
}
```

### MCR theme overrides for Tab

The Tab section of `_variables-mcr.scss` is removed and replaced with a scoped selector block. Location: either at the end of `_variables-mcr.scss`, or in a new `_theme-mcr.scss` if the team wants to separate theme CSS from build-time configuration — this is an open question for the PR review.

```scss
.mg-theme-mcr {
  --mg-color-tab-background:          #6e2677; /* mcr-purple-800 */
  --mg-color-tab-background--inactive: #ffffff;
  --mg-color-tab-border:              #ded0d7; /* mcr-purple-200 */
  --mg-color-tab-border--hover:       #6e2677;
  --mg-color-tab-border--active:      #ded0d7;
  --mg-color-tab-background--hover:   rgb(110 38 119 / 0.6); /* mcr-purple-800 at 60% */
  --mg-radius-tab:                    var(--mg-spacing-150) var(--mg-spacing-150) 0 0;
  --mg-padding-tab:                   var(--mg-spacing-200) var(--mg-spacing-300);
  --mg-color-text-tab:                #333333; /* mg-color-neutral-700 */
  --mg-color-text-tab--hover:         #ffffff;
  --mg-color-text-tab-active:         #ffffff;
  --mg-padding-tab-section:           var(--mg-spacing-500);
  --mg-radius-tab-section:            var(--mg-spacing-200);
  --mg-box-shadow-tab-section:        rgb(0 0 0 / 0.24) 0 6px 5px 0;
  --mg-color-tabbar-background:       none;
}
```

Note: spacing custom properties (`--mg-spacing-*`) are not defined in this pilot. Until they are, the MCR theme overrides above use hardcoded values for spacing-derived properties rather than `var(--mg-spacing-*)`. A TODO comment marks each one.

### Applied in Drupal / HTML

The `.mg-theme-mcr` class is applied to `<body>` or a wrapping element by the Drupal theme. This is unchanged from the approach the MCR Drupal theme already uses for its body class.

---

## File structure after the pilot

```
stories/assets/scss/
  _variables.scss              # Emits :root { --mg-* } + $_raw privates + SCSS aliases
  _variables-mcr.scss          # MCR palette + .mg-theme-mcr { --mg-* overrides }
  _variables-irp.scss          # Unchanged in this pilot
  _variables-preventionweb.scss # Unchanged in this pilot
  _variables-delta.scss        # Unchanged in this pilot

stories/Components/Tab/
  tab.scss                     # Uses var(--mg-*) for all tab tokens
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
- [ ] `$mg-color-neutral-600` and `$mg-color-neutral-900` have `-rgb` channel twins; `rgba()` call sites updated to `rgb(var() / alpha)` syntax
- [ ] SCSS aliases (`$mg-color-X: var(--mg-color-X)`) in place for all Phase A variables; existing component SCSS compiles without changes
- [ ] Tab component SCSS uses `var(--mg-*)` for all tab-specific tokens; no remaining `$mg-color-tab-*` or `$mg-radius-tab` references
- [ ] MCR tab overrides expressed as `.mg-theme-mcr { --mg-* }` selector block; corresponding SCSS variable assignments removed from `_variables-mcr.scss`
- [ ] `$mg-tabs-border-bottom` boolean retained with `BUILD-TIME ONLY` comment block
- [ ] Breakpoints, `$mg-html-font-size`, and path variables annotated with `BUILD-TIME ONLY` comments
- [ ] Storybook builds and renders Tab component correctly in both default and MCR theme
- [ ] No new Sass warnings or errors introduced
- [ ] PR description documents the open question: should theme CSS live in `_variables-mcr.scss` or a separate `_theme-mcr.scss`?
