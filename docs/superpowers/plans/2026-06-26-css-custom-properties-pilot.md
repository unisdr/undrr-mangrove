# CSS Custom Properties Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the raw color palette and spacing scale to CSS custom properties (Phase A), then migrate the Tab component end-to-end as the first fully-migrated component (Phase C), establishing the patterns for the full v2.0 migration.

**Architecture:** All palette colors are emitted as space-separated RGB channel values on `:root` (`--mg-color-X: R G B`), consumed via `rgb(var(--mg-color-X))` or `rgb(var(--mg-color-X) / alpha)`. SCSS aliases (`$mg-color-X: var(--mg-color-X)`) preserve existing component SCSS except for the handful of files that call Sass `rgba()` on palette variables — those must be updated as part of Phase A. The Tab component is then migrated end-to-end to use `var()` directly, and MCR tab overrides move into a new `_theme-mcr.scss` scoped selector file.

**Tech Stack:** Dart Sass, Storybook 8, SCSS

## Global Constraints

- Color format: space-separated RGB channels, not hex (`--mg-color-blue-900: 0 79 145`, NOT `#004f91`)
- All custom properties on `:root` unless they are theme overrides (`.mg-theme-mcr { }`)
- SCSS `$_` prefix + `--raw` suffix for private build-time variables (e.g. `$_mg-color-blue-900--raw`)
- `#{...}` interpolation required when emitting Sass-computed values into CSS custom property declarations
- Breakpoints, `$mg-html-font-size`, path variables: keep as plain SCSS, annotate `// BUILD-TIME ONLY`
- `$mg-tabs-border-bottom` boolean: keep as SCSS, annotate with full `BUILD-TIME ONLY` block
- No SCSS aliases for Tab-specific tokens — Phase C is the target end state (full `var()` in component)
- Do not commit on `main` — all work on feature branch `css-custom-properties-pilot`
- No version bump to `package.json`
- Build verification command: `npm run build` from the library root
- Storybook dev server: `npm run storybook` (port 6006)

---

## File Map

| File | Change |
|---|---|
| `stories/assets/scss/_variables.scss` | Restructure color palette + spacing to emit `:root` custom properties; add `$_raw` privates and SCSS aliases; annotate BUILD-TIME ONLY vars; fix 2 `rgba()` definitions |
| `stories/Components/Cards/Card/card.scss` | Fix 2 `rgba($mg-color-neutral-600, ...)` calls |
| `stories/Components/Hero/hero.scss` | Fix 1 `rgba($mg-color-neutral-900, ...)` call |
| `stories/Components/MegaMenu/mega-menu.scss` | Fix 1 `rgba($mg-color-black, ...)` call |
| `stories/Components/Tab/tab.scss` | Replace all `$mg-*` tab-specific tokens with `var(--mg-*)` |
| `stories/assets/scss/_variables-mcr.scss` | Remove tab section (moved to `_theme-mcr.scss`) |
| `stories/assets/scss/_theme-mcr.scss` | **NEW** — `.mg-theme-mcr { }` scoped custom property overrides for Tab |
| `stories/assets/scss/style-mcr.scss` | Add `@import "./theme-mcr"` after `@import "./variables-mcr"` |

---

## Task 1: Create feature branch and draft PR shell

**Files:** none

- [ ] **Step 1: Create the branch**

```bash
git checkout -b css-custom-properties-pilot
```

- [ ] **Step 2: Verify the build is clean before any changes**

```bash
npm run build
```

Expected: exits 0, no Sass errors or warnings about our own files.

- [ ] **Step 3: Push the branch and open a draft PR**

```bash
git push -u origin css-custom-properties-pilot
```

Then open the draft PR on GitHub:

```bash
gh pr create \
  --repo unisdr/undrr-mangrove \
  --draft \
  --title "feat(tokens): CSS custom properties pilot — color palette + Tab component (v2.0 groundwork)" \
  --body "$(cat <<'EOF'
## Summary

Pilot branch for [#1060](https://github.com/unisdr/undrr-mangrove/issues/1060). Establishes the migration approach for CSS custom properties before committing to a full v2.0 rewrite.

**Phase A:** Raw color palette and spacing scale emitted as CSS custom properties on `:root`. Colors stored as space-separated RGB channels (`--mg-color-blue-900: 0 79 145`) for universal alpha capability. SCSS aliases preserved so no component changes are needed (except files that called Sass `rgba()` on palette variables, which are updated).

**Phase C:** Tab component migrated end-to-end to `var(--mg-*)`. MCR tab overrides moved from `_variables-mcr.scss` into a new `_theme-mcr.scss` scoped selector file — the pattern for all sub-brand theme migrations.

## What this validates

- The `$_raw` / `:root` / SCSS alias pattern in `_variables.scss`
- Space-separated RGB channels as the color format
- Dropping SCSS aliases for a fully-migrated component (Tab)
- Sub-brand overrides as scoped CSS selectors (`.mg-theme-mcr`)
- `_theme-mcr.scss` as the progress-tracking file for MCR migration

## Out of scope

Typography, breakpoints, non-Tab components. Those follow in the full v2.0 migration once this pilot is reviewed.

## Related

- Closes partial work toward #1060
- Related: #683 (Dart Sass `@use` migration, bundled at v2.0)
EOF
)"
```

---

## Task 2: Phase A — Migrate color palette to CSS custom properties

**Files:**
- Modify: `stories/assets/scss/_variables.scss`

This task restructures the entire color palette section. For each color group, replace the existing `$mg-color-*: #hex;` declarations with the three-part pattern: `$_raw` private, `:root` emission, SCSS alias.

Also fix two `rgba()` definitions in `_variables.scss` that use palette variables (they will break as soon as their palette vars become `var()` aliases).

- [ ] **Step 1: Replace the blue palette block**

Find the blue section (currently lines 47–58) and replace:

```scss
// MG-COLORS BLUE SHADES (#004f91)
$_mg-color-blue-50--raw: 230 237 244;
$_mg-color-blue-100--raw: 204 220 233;
$_mg-color-blue-200--raw: 179 202 222;
$_mg-color-blue-300--raw: 153 185 211;
$_mg-color-blue-400--raw: 128 167 200;
$_mg-color-blue-500--raw: 102 149 189;
$_mg-color-blue-600--raw: 77 132 178;
$_mg-color-blue-700--raw: 51 114 167;
$_mg-color-blue-800--raw: 26 97 156;
$_mg-color-blue-900--raw: 0 79 145;

:root {
  --mg-color-blue-50:  #{$_mg-color-blue-50--raw};
  --mg-color-blue-100: #{$_mg-color-blue-100--raw};
  --mg-color-blue-200: #{$_mg-color-blue-200--raw};
  --mg-color-blue-300: #{$_mg-color-blue-300--raw};
  --mg-color-blue-400: #{$_mg-color-blue-400--raw};
  --mg-color-blue-500: #{$_mg-color-blue-500--raw};
  --mg-color-blue-600: #{$_mg-color-blue-600--raw};
  --mg-color-blue-700: #{$_mg-color-blue-700--raw};
  --mg-color-blue-800: #{$_mg-color-blue-800--raw};
  --mg-color-blue-900: #{$_mg-color-blue-900--raw};
}

$mg-color-blue-50:  var(--mg-color-blue-50);
$mg-color-blue-100: var(--mg-color-blue-100);
$mg-color-blue-200: var(--mg-color-blue-200);
$mg-color-blue-300: var(--mg-color-blue-300);
$mg-color-blue-400: var(--mg-color-blue-400);
$mg-color-blue-500: var(--mg-color-blue-500);
$mg-color-blue-600: var(--mg-color-blue-600);
$mg-color-blue-700: var(--mg-color-blue-700);
$mg-color-blue-800: var(--mg-color-blue-800);
$mg-color-blue-900: var(--mg-color-blue-900);
```

- [ ] **Step 2: Replace the orange palette block**

```scss
// MG-COLORS ORANGE SHADES (#eb752a)
$_mg-color-orange-50--raw: 253 241 234;
$_mg-color-orange-100--raw: 251 227 212;
$_mg-color-orange-200--raw: 249 214 191;
$_mg-color-orange-300--raw: 247 200 170;
$_mg-color-orange-400--raw: 245 186 149;
$_mg-color-orange-500--raw: 243 172 127;
$_mg-color-orange-600--raw: 241 158 106;
$_mg-color-orange-700--raw: 239 145 85;
$_mg-color-orange-800--raw: 237 131 63;
$_mg-color-orange-900--raw: 235 117 42;

:root {
  --mg-color-orange-50:  #{$_mg-color-orange-50--raw};
  --mg-color-orange-100: #{$_mg-color-orange-100--raw};
  --mg-color-orange-200: #{$_mg-color-orange-200--raw};
  --mg-color-orange-300: #{$_mg-color-orange-300--raw};
  --mg-color-orange-400: #{$_mg-color-orange-400--raw};
  --mg-color-orange-500: #{$_mg-color-orange-500--raw};
  --mg-color-orange-600: #{$_mg-color-orange-600--raw};
  --mg-color-orange-700: #{$_mg-color-orange-700--raw};
  --mg-color-orange-800: #{$_mg-color-orange-800--raw};
  --mg-color-orange-900: #{$_mg-color-orange-900--raw};
}

$mg-color-orange-50:  var(--mg-color-orange-50);
$mg-color-orange-100: var(--mg-color-orange-100);
$mg-color-orange-200: var(--mg-color-orange-200);
$mg-color-orange-300: var(--mg-color-orange-300);
$mg-color-orange-400: var(--mg-color-orange-400);
$mg-color-orange-500: var(--mg-color-orange-500);
$mg-color-orange-600: var(--mg-color-orange-600);
$mg-color-orange-700: var(--mg-color-orange-700);
$mg-color-orange-800: var(--mg-color-orange-800);
$mg-color-orange-900: var(--mg-color-orange-900);
```

- [ ] **Step 3: Replace the red palette block**

```scss
// MG-COLORS RED SHADES (#c10920)
$_mg-color-red-50--raw: 249 230 233;
$_mg-color-red-100--raw: 243 206 210;
$_mg-color-red-200--raw: 236 181 188;
$_mg-color-red-300--raw: 230 157 166;
$_mg-color-red-400--raw: 224 132 144;
$_mg-color-red-500--raw: 218 107 121;
$_mg-color-red-600--raw: 212 83 99;
$_mg-color-red-700--raw: 205 58 77;
$_mg-color-red-800--raw: 199 34 54;
$_mg-color-red-900--raw: 193 9 32;

:root {
  --mg-color-red-50:  #{$_mg-color-red-50--raw};
  --mg-color-red-100: #{$_mg-color-red-100--raw};
  --mg-color-red-200: #{$_mg-color-red-200--raw};
  --mg-color-red-300: #{$_mg-color-red-300--raw};
  --mg-color-red-400: #{$_mg-color-red-400--raw};
  --mg-color-red-500: #{$_mg-color-red-500--raw};
  --mg-color-red-600: #{$_mg-color-red-600--raw};
  --mg-color-red-700: #{$_mg-color-red-700--raw};
  --mg-color-red-800: #{$_mg-color-red-800--raw};
  --mg-color-red-900: #{$_mg-color-red-900--raw};
}

$mg-color-red-50:  var(--mg-color-red-50);
$mg-color-red-100: var(--mg-color-red-100);
$mg-color-red-200: var(--mg-color-red-200);
$mg-color-red-300: var(--mg-color-red-300);
$mg-color-red-400: var(--mg-color-red-400);
$mg-color-red-500: var(--mg-color-red-500);
$mg-color-red-600: var(--mg-color-red-600);
$mg-color-red-700: var(--mg-color-red-700);
$mg-color-red-800: var(--mg-color-red-800);
$mg-color-red-900: var(--mg-color-red-900);
```

- [ ] **Step 4: Replace the neutral palette block**

```scss
// MG-COLORS NEUTRAL
$_mg-color-neutral-0--raw:   255 255 255;
$_mg-color-neutral-25--raw:  242 242 242;
$_mg-color-neutral-50--raw:  230 230 230;
$_mg-color-neutral-100--raw: 204 204 204;
$_mg-color-neutral-200--raw: 179 179 179;
$_mg-color-neutral-300--raw: 153 153 153;
$_mg-color-neutral-400--raw: 128 128 128;
$_mg-color-neutral-500--raw: 102 102 102;
$_mg-color-neutral-600--raw: 77 77 77;
$_mg-color-neutral-700--raw: 51 51 51;
$_mg-color-neutral-800--raw: 26 26 26;
$_mg-color-neutral-900--raw: 0 0 0;

:root {
  --mg-color-neutral-0:   #{$_mg-color-neutral-0--raw};
  --mg-color-neutral-25:  #{$_mg-color-neutral-25--raw};
  --mg-color-neutral-50:  #{$_mg-color-neutral-50--raw};
  --mg-color-neutral-100: #{$_mg-color-neutral-100--raw};
  --mg-color-neutral-200: #{$_mg-color-neutral-200--raw};
  --mg-color-neutral-300: #{$_mg-color-neutral-300--raw};
  --mg-color-neutral-400: #{$_mg-color-neutral-400--raw};
  --mg-color-neutral-500: #{$_mg-color-neutral-500--raw};
  --mg-color-neutral-600: #{$_mg-color-neutral-600--raw};
  --mg-color-neutral-700: #{$_mg-color-neutral-700--raw};
  --mg-color-neutral-800: #{$_mg-color-neutral-800--raw};
  --mg-color-neutral-900: #{$_mg-color-neutral-900--raw};
}

$mg-color-neutral-0:   var(--mg-color-neutral-0);
$mg-color-neutral-25:  var(--mg-color-neutral-25);
$mg-color-neutral-50:  var(--mg-color-neutral-50);
$mg-color-neutral-100: var(--mg-color-neutral-100);
$mg-color-neutral-200: var(--mg-color-neutral-200);
$mg-color-neutral-300: var(--mg-color-neutral-300);
$mg-color-neutral-400: var(--mg-color-neutral-400);
$mg-color-neutral-500: var(--mg-color-neutral-500);
$mg-color-neutral-600: var(--mg-color-neutral-600);
$mg-color-neutral-700: var(--mg-color-neutral-700);
$mg-color-neutral-800: var(--mg-color-neutral-800);
$mg-color-neutral-900: var(--mg-color-neutral-900);
$mg-color-black: var(--mg-color-neutral-800);
$mg-color-white: var(--mg-color-neutral-0);
```

- [ ] **Step 5: Replace the accent palette block**

```scss
// MG-COLORS ACCENT
$_mg-color-accent-100--raw: 244 228 150;
$_mg-color-accent-200--raw: 211 206 169;
$_mg-color-accent-300--raw: 253 246 217;
$_mg-color-accent-400--raw: 10 105 105;

:root {
  --mg-color-accent-100: #{$_mg-color-accent-100--raw};
  --mg-color-accent-200: #{$_mg-color-accent-200--raw};
  --mg-color-accent-300: #{$_mg-color-accent-300--raw};
  --mg-color-accent-400: #{$_mg-color-accent-400--raw};
}

$mg-color-accent-100: var(--mg-color-accent-100);
$mg-color-accent-200: var(--mg-color-accent-200);
$mg-color-accent-300: var(--mg-color-accent-300);
$mg-color-accent-400: var(--mg-color-accent-400);
```

- [ ] **Step 6: Fix `$mg-color-hero-button-secondary-background` (rgba on neutral-0)**

This definition uses `rgba($mg-color-neutral-0, 0.9)`. After Step 4, `$mg-color-neutral-0` is `var(--mg-color-neutral-0)` — Sass `rgba()` cannot evaluate it. Replace the definition (currently around line 356):

```scss
$mg-color-hero-button-secondary-background: rgb(var(--mg-color-neutral-0) / 0.9) !default;
```

- [ ] **Step 7: Fix `$mg-color-modal-scrim` (rgba on neutral-900)**

Replace the definition (currently around line 423):

```scss
$mg-color-modal-scrim: rgb(var(--mg-color-neutral-900) / 0.85) !default;
```

- [ ] **Step 8: Annotate BUILD-TIME ONLY variables**

Add the following comment above the breakpoints section:

```scss
// BUILD-TIME ONLY — breakpoints cannot be CSS custom properties.
// @media queries require static values resolved at compile time; var() is invalid there.
// Do not add --mg-breakpoint-* custom properties.
$mg-breakpoint-mobile:       480px;
$mg-breakpoint-tablet:       900px;
$mg-breakpoint-desktop:      1164px;
$mg-breakpoint-desktop-wide: 1440px;
```

Add `// BUILD-TIME ONLY` inline comments to `$mg-html-font-size`, `$mgIconFontPath`, and the `$img-path-*` variables.

- [ ] **Step 9: Verify the build compiles**

```bash
npm run build
```

Expected: exits 0, no Sass errors. If you see `Error: ...is not a color` on any `rgba()` call, find the call site with the reported line number and apply the same `rgb(var(--mg-color-X) / alpha)` fix.

- [ ] **Step 10: Commit**

```bash
git add stories/assets/scss/_variables.scss
git commit -m "feat(tokens): emit color palette as CSS custom properties (Phase A)"
```

---

## Task 3: Phase A — Fix rgba() call sites in component files

**Files:**
- Modify: `stories/Components/Cards/Card/card.scss`
- Modify: `stories/Components/Hero/hero.scss`
- Modify: `stories/Components/MegaMenu/mega-menu.scss`

These three component files call Sass `rgba()` on palette variables that are now `var()` aliases. They will produce a Sass compile error until fixed. This is the complete list — do not update any other `rgba()` calls (those use semantic variables untouched in Phase A).

- [ ] **Step 1: Fix card.scss — two neutral-600 calls**

In `stories/Components/Cards/Card/card.scss`, find and replace both occurrences of:

```scss
border: 1px solid rgba($mg-color-neutral-600, 0.2);
```

with:

```scss
border: 1px solid rgb(var(--mg-color-neutral-600) / 0.2);
```

(There are two: around lines 62 and 250.)

- [ ] **Step 2: Fix hero.scss — one neutral-900 call**

In `stories/Components/Hero/hero.scss`, find and replace:

```scss
background: rgba($mg-color-neutral-900, 0.75);
```

with:

```scss
background: rgb(var(--mg-color-neutral-900) / 0.75);
```

- [ ] **Step 3: Fix mega-menu.scss — one $mg-color-black call**

In `stories/Components/MegaMenu/mega-menu.scss`, find and replace:

```scss
border-inline-end: 2px solid rgba($mg-color-black, 0.2);
```

with:

```scss
border-inline-end: 2px solid rgb(var(--mg-color-neutral-800) / 0.2);
```

Note: `$mg-color-black` is an alias for `neutral-800`. Using `--mg-color-neutral-800` directly here makes the intent explicit.

- [ ] **Step 4: Verify the build compiles cleanly**

```bash
npm run build
```

Expected: exits 0, no Sass errors.

- [ ] **Step 5: Spot-check in Storybook**

```bash
npm run storybook
```

Open http://localhost:6006 and verify:
- Card component renders with correct neutral border tint (subtle gray border on outlined variant)
- Hero component renders with correct dark scrim overlay
- MegaMenu renders with correct separator border

- [ ] **Step 6: Commit**

```bash
git add stories/Components/Cards/Card/card.scss \
        stories/Components/Hero/hero.scss \
        stories/Components/MegaMenu/mega-menu.scss
git commit -m "fix(tokens): update rgba() call sites broken by Phase A palette aliasing"
```

---

## Task 4: Phase A — Migrate spacing scale to CSS custom properties

**Files:**
- Modify: `stories/assets/scss/_variables.scss`

The spacing scale must be emitted as custom properties so that `_theme-mcr.scss` can reference `var(--mg-spacing-*)` in Phase C without hardcoded values.

- [ ] **Step 1: Replace the spacing block in `_variables.scss`**

Find the `@tokens Spacing` section (currently around line 177) and replace:

```scss
/**
 * @tokens Spacing
 * @presenter Spacing
 */
$_mg-spacing-0--raw:    0;
$_mg-spacing-25--raw:   mg-rem(2.5);
$_mg-spacing-50--raw:   mg-rem(5);
$_mg-spacing-75--raw:   mg-rem(7.5);
$_mg-spacing-100--raw:  mg-rem(10);
$_mg-spacing-150--raw:  mg-rem(15);
$_mg-spacing-175--raw:  mg-rem(18);
$_mg-spacing-200--raw:  mg-rem(20);
$_mg-spacing-250--raw:  mg-rem(24);
$_mg-spacing-300--raw:  mg-rem(30);
$_mg-spacing-350--raw:  mg-rem(35);
$_mg-spacing-400--raw:  mg-rem(50);
$_mg-spacing-500--raw:  mg-rem(60);
$_mg-spacing-600--raw:  mg-rem(80);
$_mg-spacing-800--raw:  mg-rem(100);
$_mg-spacing-1000--raw: mg-rem(400);

:root {
  --mg-spacing-0:    #{$_mg-spacing-0--raw};
  --mg-spacing-25:   #{$_mg-spacing-25--raw};
  --mg-spacing-50:   #{$_mg-spacing-50--raw};
  --mg-spacing-75:   #{$_mg-spacing-75--raw};
  --mg-spacing-100:  #{$_mg-spacing-100--raw};
  --mg-spacing-150:  #{$_mg-spacing-150--raw};
  --mg-spacing-175:  #{$_mg-spacing-175--raw};
  --mg-spacing-200:  #{$_mg-spacing-200--raw};
  --mg-spacing-250:  #{$_mg-spacing-250--raw};
  --mg-spacing-300:  #{$_mg-spacing-300--raw};
  --mg-spacing-350:  #{$_mg-spacing-350--raw};
  --mg-spacing-400:  #{$_mg-spacing-400--raw};
  --mg-spacing-500:  #{$_mg-spacing-500--raw};
  --mg-spacing-600:  #{$_mg-spacing-600--raw};
  --mg-spacing-800:  #{$_mg-spacing-800--raw};
  --mg-spacing-1000: #{$_mg-spacing-1000--raw};
}

$mg-spacing-0:    var(--mg-spacing-0);
$mg-spacing-25:   var(--mg-spacing-25);
$mg-spacing-50:   var(--mg-spacing-50);
$mg-spacing-75:   var(--mg-spacing-75);
$mg-spacing-100:  var(--mg-spacing-100);
$mg-spacing-150:  var(--mg-spacing-150);
$mg-spacing-175:  var(--mg-spacing-175);
$mg-spacing-200:  var(--mg-spacing-200);
$mg-spacing-250:  var(--mg-spacing-250);
$mg-spacing-300:  var(--mg-spacing-300);
$mg-spacing-350:  var(--mg-spacing-350);
$mg-spacing-400:  var(--mg-spacing-400);
$mg-spacing-500:  var(--mg-spacing-500);
$mg-spacing-600:  var(--mg-spacing-600);
$mg-spacing-800:  var(--mg-spacing-800);
$mg-spacing-1000: var(--mg-spacing-1000);
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: exits 0. If you see errors about spacing variables in `calc()` or arithmetic expressions, those files use Sass math on spacing vars and will need the same treatment as rgba() — report them in the PR rather than silently fixing, as they indicate components that need end-to-end migration.

- [ ] **Step 3: Commit**

```bash
git add stories/assets/scss/_variables.scss
git commit -m "feat(tokens): emit spacing scale as CSS custom properties (Phase A)"
```

---

## Task 5: Phase C — Add Tab tokens to `:root` in `_variables.scss`

**Files:**
- Modify: `stories/assets/scss/_variables.scss`

Tab-specific variables move from SCSS `$mg-*` declarations to `:root` custom properties. Unlike Phase A, no SCSS aliases are created — Tab is the first fully-migrated component and its SCSS will use `var()` directly.

- [ ] **Step 1: Replace the tabs section in `_variables.scss`**

Find the `// tabs` section (currently around line 366) and replace the entire block of `$mg-color-tab-*`, `$mg-radius-tab`, `$mg-padding-tab` etc. declarations with:

```scss
// tabs
// BUILD-TIME ONLY: $mg-tabs-border-bottom drives @if conditional in tab.scss.
// Cannot become a CSS custom property — no runtime conditional equivalent exists.
// All sub-brands use true. To disable, set to false before @use.
$mg-tabs-border-bottom: true !default;

:root {
  --mg-color-tabbar-background:      rgb(var(--mg-color-blue-50));
  --mg-color-tab-background:         rgb(var(--mg-color-blue-200));
  --mg-color-tab-background--inactive: rgb(var(--mg-color-blue-50));
  --mg-color-tab-border:             rgb(var(--mg-color-neutral-700));
  --mg-color-tab-border--hover:      rgb(var(--mg-color-neutral-900));
  --mg-color-tab-border--active:     rgb(var(--mg-color-blue-800));
  --mg-color-tab-background--hover:  rgb(var(--mg-color-blue-800));
  --mg-radius-tab:                   0;
  --mg-padding-tab:                  var(--mg-spacing-75) var(--mg-spacing-150);
  --mg-color-text-tab:               rgb(var(--mg-color-neutral-700));
  --mg-color-text-tab--hover:        rgb(var(--mg-color-neutral-0));
  --mg-color-text-tab-active:        rgb(var(--mg-color-neutral-700));
  --mg-color-text-tab-no-results:    rgb(var(--mg-color-neutral-500));
  --mg-color-tab-section-background: rgb(var(--mg-color-neutral-0));
  --mg-padding-tab-section:          var(--mg-spacing-100) var(--mg-spacing-0);
  --mg-radius-tab-section:           0;
  --mg-box-shadow-tab-section:       none;
}
```

Note: the default values reference other custom properties (e.g. `rgb(var(--mg-color-blue-50))`). This works because all palette custom properties are already defined on `:root` earlier in the same file. Do not define raw hex fallbacks here — if there's a cascade issue in a browser that doesn't support custom properties, we don't support that browser.

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: exits 0. At this point `tab.scss` still references `$mg-color-tab-*` SCSS variables that no longer exist — expect Sass errors like `Undefined variable "$mg-color-tab-background"`. That is correct; it means Task 6 must immediately follow.

- [ ] **Step 3: Do NOT commit yet** — tab.scss is broken until Task 6 is complete.

---

## Task 6: Phase C — Migrate `tab.scss` to CSS custom properties

**Files:**
- Modify: `stories/Components/Tab/tab.scss`

Replace every `$mg-color-tab-*`, `$mg-radius-tab`, `$mg-padding-tab`, `$mg-box-shadow-tab-section`, and `$mg-color-text-tab-*` reference with `var(--mg-*)`. References to `$mg-spacing-*`, `$mg-breakpoint-*`, `$mg-font-*`, and `$mg-font-family-*` are left unchanged.

- [ ] **Step 1: Apply all replacements in `tab.scss`**

Make the following find-and-replace substitutions (each is a whole-word match to avoid partial replacements):

| Find | Replace |
|---|---|
| `$mg-color-tabbar-background` | `var(--mg-color-tabbar-background)` |
| `$mg-color-tab-background--inactive` | `var(--mg-color-tab-background--inactive)` |
| `$mg-color-tab-background--hover` | `var(--mg-color-tab-background--hover)` |
| `$mg-color-tab-background` | `var(--mg-color-tab-background)` |
| `$mg-color-tab-border--hover` | `var(--mg-color-tab-border--hover)` |
| `$mg-color-tab-border--active` | `var(--mg-color-tab-border--active)` |
| `$mg-color-tab-border` | `var(--mg-color-tab-border)` |
| `$mg-radius-tab` | `var(--mg-radius-tab)` |
| `$mg-padding-tab` | `var(--mg-padding-tab)` |
| `$mg-color-text-tab--hover` | `var(--mg-color-text-tab--hover)` |
| `$mg-color-text-tab-active` | `var(--mg-color-text-tab-active)` |
| `$mg-color-text-tab-no-results` | `var(--mg-color-text-tab-no-results)` |
| `$mg-color-text-tab` | `var(--mg-color-text-tab)` |
| `$mg-color-tab-section-background` | `var(--mg-color-tab-section-background)` |
| `$mg-padding-tab-section` | `var(--mg-padding-tab-section)` |
| `$mg-radius-tab-section` | `var(--mg-radius-tab-section)` |
| `$mg-box-shadow-tab-section` | `var(--mg-box-shadow-tab-section)` |
| `$mg-color-interactive` (tab.scss only — focus outline) | `var(--mg-color-interactive)` |

Note: the `$mg-color-interactive` reference in tab.scss is the focus outline (`outline: 2px solid $mg-color-interactive`). `$mg-color-interactive` is a semantic variable not yet migrated, but since it is a `var()` alias after Phase A it can be referenced as either `$mg-color-interactive` (which resolves to `var(--mg-color-interactive)` via the SCSS alias) or directly as `var(--mg-color-interactive)`. Use the direct `var()` form to be consistent with the rest of the file.

- [ ] **Step 2: Verify no `$mg-color-tab` or `$mg-radius-tab` or `$mg-padding-tab` remain**

```bash
grep -n '\$mg-color-tab\|\$mg-radius-tab\|\$mg-padding-tab\|\$mg-box-shadow-tab\|\$mg-color-text-tab\|\$mg-color-tabbar' stories/Components/Tab/tab.scss
```

Expected: no output.

- [ ] **Step 3: Verify the build compiles**

```bash
npm run build
```

Expected: exits 0, no Sass errors.

- [ ] **Step 4: Commit both tasks 5 and 6 together**

```bash
git add stories/assets/scss/_variables.scss \
        stories/Components/Tab/tab.scss
git commit -m "feat(tokens): migrate Tab component to CSS custom properties (Phase C)"
```

---

## Task 7: Phase C — Create `_theme-mcr.scss` and wire it in

**Files:**
- Create: `stories/assets/scss/_theme-mcr.scss`
- Modify: `stories/assets/scss/_variables-mcr.scss`
- Modify: `stories/assets/scss/style-mcr.scss`

This task creates the new MCR theme file and moves the Tab overrides out of `_variables-mcr.scss`. The file pattern (`_variables-mcr.scss` holds build-time Sass config; `_theme-mcr.scss` holds runtime CSS overrides) will be used for all sub-brand migration going forward.

- [ ] **Step 1: Create `_theme-mcr.scss`**

Create `stories/assets/scss/_theme-mcr.scss` with the following content:

```scss
// MCR theme — runtime CSS custom property overrides.
// Applied when .mg-theme-mcr is present on <body> or a wrapping element.
//
// As v2.0 migration progresses, sections move from _variables-mcr.scss into here.
// When _variables-mcr.scss contains only comments, delete it.

// MCR brand palette (local to this file — not emitted as global :root properties)
$_mcr-purple--raw:     89 26 97;
$_mcr-purple-800--raw: 110 38 119;
$_mcr-purple-200--raw: 222 208 215;

.mg-theme-mcr {
  // Tab overrides (migrated from _variables-mcr.scss)
  --mg-color-tabbar-background:        none;
  --mg-color-tab-background:           rgb(#{$_mcr-purple-800--raw});
  --mg-color-tab-background--inactive: rgb(var(--mg-color-neutral-0));
  --mg-color-tab-border:               rgb(#{$_mcr-purple-200--raw});
  --mg-color-tab-border--hover:        rgb(#{$_mcr-purple-800--raw});
  --mg-color-tab-border--active:       rgb(#{$_mcr-purple-200--raw});
  --mg-color-tab-background--hover:    rgb(#{$_mcr-purple-800--raw} / 0.6);
  --mg-radius-tab:                     var(--mg-spacing-150) var(--mg-spacing-150) 0 0;
  --mg-padding-tab:                    var(--mg-spacing-200) var(--mg-spacing-300);
  --mg-color-text-tab:                 rgb(var(--mg-color-neutral-700));
  --mg-color-text-tab--hover:          rgb(var(--mg-color-neutral-0));
  --mg-color-text-tab-active:          rgb(var(--mg-color-neutral-0));
  --mg-padding-tab-section:            var(--mg-spacing-500);
  --mg-radius-tab-section:             var(--mg-spacing-200);
  --mg-box-shadow-tab-section:         rgb(var(--mg-color-neutral-900) / 0.24) 0 6px 5px 0;
}
```

- [ ] **Step 2: Remove the Tab section from `_variables-mcr.scss`**

In `_variables-mcr.scss`, delete the entire `// Tabs` section (from `// Tabs` comment through the last tab variable). After deletion, that section of the file should be absent. The remaining content (MCR palette, hover colors, buttons, forms, hero) stays untouched.

The lines to remove are currently:

```scss
// Tabs
$mg-color-tabbar-background: none;
$mg-color-tab-background: $mcr-color-purple-800;
$mg-color-tab-background--inactive: $mg-color-white;
$mg-color-tab-border: $mcr-color-purple-200;
$mg-color-tab-border--hover: $mcr-color-purple-800;
$mg-color-tab-border--active: $mcr-color-purple-200;
$mg-color-tab-background--hover: rgba($mcr-color-purple-800, 0.6);
$mg-radius-tab: $mg-spacing-150 $mg-spacing-150 0 0;
$mg-padding-tab: $mg-spacing-200 $mg-spacing-300;
$mg-color-text-tab: $mg-color-neutral-700;
$mg-color-text-tab--hover: $mg-color-white;
$mg-color-text-tab-active: $mg-color-white;
$mg-padding-tab-section: $mg-spacing-500;
$mg-radius-tab-section: $mg-spacing-200;
$mg-box-shadow-tab-section: rgb(0 0 0 / 0.24) 0 6px 5px 0;
$mg-tabs-border-bottom: true;
```

Add a comment at the top of `_variables-mcr.scss` to explain the two-file pattern:

```scss
// MCR build-time Sass configuration.
// Runtime CSS custom property overrides live in _theme-mcr.scss.
// As the v2.0 migration progresses, sections move from this file to _theme-mcr.scss.
// When this file contains only comments, delete it.
```

- [ ] **Step 3: Wire `_theme-mcr.scss` into `style-mcr.scss`**

In `stories/assets/scss/style-mcr.scss`, add the import after `@import "./variables-mcr"`:

```scss
@import "./variables";
@import "./variables-mcr";
@import "./theme-mcr";
@import "./fonts";
@import "./breakpoints";
@import "./mixins";
@import "./utility";
@import "./foundational";
@import "./components";
```

- [ ] **Step 4: Verify the build compiles**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 5: Verify Tab in Storybook under the MCR theme**

```bash
npm run storybook
```

Open http://localhost:6006 and navigate to the Tab component story. Toggle the MCR theme (apply `.mg-theme-mcr` via the Storybook globals panel or by using the MCR-themed story if one exists). Verify:

- Tab bar has purple background (not blue)
- Active tab has purple border
- Hover state shows purple at 60% opacity
- Tab border radius is rounded on top corners (not square)
- Section below active tab has box shadow

Open browser DevTools, inspect `.mg-tabs__link`, and confirm:
- `--mg-color-tab-background` shows `110 38 119` (MCR purple-800)
- The value is set on `.mg-theme-mcr`, not `:root`

- [ ] **Step 6: Commit**

```bash
git add stories/assets/scss/_theme-mcr.scss \
        stories/assets/scss/_variables-mcr.scss \
        stories/assets/scss/style-mcr.scss
git commit -m "feat(tokens): create _theme-mcr.scss, move Tab overrides out of _variables-mcr"
```

---

## Task 8: Final verification and PR readiness

**Files:** none (verification only)

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: exits 0, no errors.

- [ ] **Step 2: Confirm no remaining `$mg-color-tab-*` variables in any SCSS**

```bash
grep -rn '\$mg-color-tab\|\$mg-radius-tab\|\$mg-padding-tab\|\$mg-box-shadow-tab\|\$mg-color-tabbar\|\$mg-color-text-tab' stories/ --include="*.scss" | grep -v storybook-static
```

Expected: no output.

- [ ] **Step 3: Confirm all palette custom properties are present in built CSS**

```bash
grep -c '\-\-mg-color-blue-900' dist/css/style.css 2>/dev/null || grep -c '\-\-mg-color-blue-900' storybook-static/css/style.css 2>/dev/null || echo "Check built CSS output for --mg-color-blue-900"
```

Expected: at least 1 hit (the `:root` declaration).

- [ ] **Step 4: Confirm spacing custom properties are present in built CSS**

```bash
grep '\-\-mg-spacing-150' dist/css/style.css 2>/dev/null || echo "Check built CSS output for --mg-spacing-150"
```

- [ ] **Step 5: Mark the draft PR ready for review**

```bash
gh pr ready --repo unisdr/undrr-mangrove
```

Or leave as draft if you want to keep iterating — the PR description already explains the pilot intent.

- [ ] **Step 6: Update the PR body with any findings**

Add a "## Findings" section to the PR description noting:
- Any unexpected Sass errors or warnings encountered
- Any cascade surprises in Storybook
- Whether the `$_raw` / `:root` / alias pattern felt maintainable
- Anything that should change before the full v2.0 migration

These findings feed directly into the v2.0 implementation plan.
