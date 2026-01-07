# Drupal to Mangrove style migration plan

This document outlines the strategy for consolidating utility styles between the Mangrove component library and the Drupal theme (`undrr_common`), establishing Mangrove as the single source of truth for foundational styling.

## Table of contents

- [Executive summary](#executive-summary)
- [Architecture decision](#architecture-decision)
- [Phase 1: Mangrove utilities](#phase-1-mangrove-utilities)
- [Phase 2: Drupal theme integration](#phase-2-drupal-theme-integration)
- [Phase 3: Template migration](#phase-3-template-migration)
- [Phase 4: Bootstrap removal](#phase-4-bootstrap-removal)
- [Class mapping reference](#class-mapping-reference)

---

## Executive summary

### The problem

The UNDRR web ecosystem has styling spread across two locations:

1. **Mangrove** (component library): Higher-order React components with strong design tokens but limited utility classes
2. **Drupal theme** (`undrr_common`): Extensive utility classes (~1,175 lines) with legacy Bootstrap 3.3.7 dependency

This creates:
- Style drift between systems
- Duplicate maintenance burden
- Inconsistent naming conventions
- Technical debt from Bootstrap 3.3.7

### The solution

Establish Mangrove as the **single source of truth** for foundational styling by:

1. Adding essential utility classes to Mangrove
2. Drupal theme imports Mangrove utilities
3. Progressively migrating Drupal templates to Mangrove classes
4. Removing Bootstrap and legacy utilities from Drupal

---

## Architecture decision

### Separation of concerns

**Mangrove provides:**
- Design tokens (colors, spacing, typography)
- Utility classes (display, flexbox, spacing, etc.)
- React components
- Storybook documentation

**Drupal theme provides:**
- Drupal-specific entity styling (fields, views, paragraphs)
- Backward compatibility layer for legacy classes
- Bootstrap compatibility layer (during migration)
- Template overrides

### Why this separation?

1. **Mangrove stays clean**: No Drupal-specific code in the component library
2. **Drupal owns integration**: The theme controls how Mangrove is consumed
3. **Easier upgrades**: Mangrove can be updated without Drupal coupling
4. **Clear boundaries**: Each system has defined responsibilities

---

## Phase 1: Mangrove utilities

### 1.1 Utility file structure

```
stories/assets/scss/
├── utilities/
│   ├── _index.scss           # Barrel file (imports all)
│   ├── _spacing.scss         # Margin & padding
│   ├── _display.scss         # Display & visibility
│   ├── _flexbox.scss         # Flex container & item utilities
│   ├── _typography.scss      # Font size, weight, alignment
│   ├── _colors.scss          # Background & text colors
│   ├── _borders.scss         # Border & radius
│   ├── _shadows.scss         # Box shadows
│   ├── _sizing.scss          # Width & height
│   └── _position.scss        # Position & z-index
└── style.scss                # Main entry point
```

### 1.2 Utility classes (simplified for page builders)

Mangrove utilities are kept minimal and focused on common page builder needs:

**Flexbox:**
- Direction: `row`, `column`, `row--md`, `column--md`
- Wrap: `wrap`, `nowrap`
- Justify: `start`, `end`, `center`, `between`
- Align: `start`, `end`, `center`, `stretch`
- Gap: `0`, `50`, `100`, `200`, `300`, `400`
- Item: `flex--1`, `flex--none`, `flex-shrink--0`

**Borders:**
- Border: `border`, `border--none`, `border-top`, `border-bottom`
- Color: `neutral-300`, `neutral-500`, `blue-500`, `transparent`
- Radius: `none`, default, `lg`, `full`

**Shadows:**
- Box shadow: `none`, `sm`, default, `md`, `lg`, `xl`, `2xl`, `inner`

**Position:**
- Type: `static`, `relative`, `absolute`, `fixed`, `sticky`
- Inset: `top-0`, `right-0`, `bottom-0`, `left-0`
- Z-index: `0`, `10`, `20`, `30`, `40`, `50`, semantic values
- Overflow: `auto`, `hidden`, `visible`

### 1.3 Deliverables

- [x] Create `stories/assets/scss/utilities/` directory structure
- [x] Implement essential utility classes
- [x] Create Storybook documentation
- [x] Simplify utilities to page builder essentials
- [ ] Release npm package update

---

## Phase 2: Drupal theme integration

### 2.1 Drupal theme imports Mangrove

The Drupal theme (`undrr_common`) imports Mangrove utilities:

**File**: `themes/custom/undrr_common/scss/base.scss`

```scss
// Import Mangrove design tokens and utilities
@import "~@undrr/undrr-mangrove/scss/variables";
@import "~@undrr/undrr-mangrove/scss/breakpoints";
@import "~@undrr/undrr-mangrove/scss/mixins";
@import "~@undrr/undrr-mangrove/scss/utilities/index";

// Drupal-specific styles (using Mangrove tokens)
@import "components/fields";
@import "components/views";
@import "components/paragraphs";

// Backward compatibility (remove after migration)
@import "components/drupal-compat";
@import "components/bootstrap-compat";
```

### 2.2 Drupal-specific styles (in Drupal theme)

These files live in the Drupal theme, not in Mangrove:

**File**: `themes/custom/undrr_common/scss/components/_fields.scss`
```scss
// Drupal field display styling using Mangrove tokens
.field--label {
  font-weight: 600;
  margin-bottom: $mg-spacing-100;
}
```

**File**: `themes/custom/undrr_common/scss/components/_drupal-compat.scss`
```scss
// Backward compatibility for legacy classes
// Remove once all templates are migrated
.dp-fl { @extend .mg-u-display--flex; }
.mt-20 { @extend .mg-u-margin-top-200; }
// ... etc
```

### 2.3 Deliverables

- [ ] Update Drupal theme to import Mangrove utilities
- [ ] Create drupal-compat.scss in Drupal theme
- [ ] Create bootstrap-compat.scss in Drupal theme
- [ ] Test backward compatibility

---

## Phase 3: Template migration

### 3.1 Migration process

For each Drupal template:

1. **Audit**: Find legacy class usage
2. **Map**: Identify Mangrove equivalents
3. **Update**: Replace legacy classes
4. **Test**: Visual regression check
5. **Commit**: One template per commit

### 3.2 Example transformation

```twig
{# Before #}
<div class="dp-fl mt-20 mb-30">
  <div class="w-100 pt-15 bg-c--bp t-c--w">
    {{ content }}
  </div>
</div>

{# After #}
<div class="mg-u-display--flex mg-u-margin-top-200 mg-u-margin-bottom-300">
  <div class="mg-u-width--full mg-u-padding-top-150 mg-u-background-color--blue-900 mg-u-color--white">
    {{ content }}
  </div>
</div>
```

### 3.3 Deliverables

- [ ] Migrate core templates
- [ ] Migrate layout templates
- [ ] Migrate content type templates
- [ ] Migrate field templates
- [ ] Remove drupal-compat.scss after complete migration

---

## Phase 4: Bootstrap removal

### 4.1 Bootstrap compatibility layer

During migration, the Drupal theme provides Bootstrap class equivalents using Mangrove tokens:

**File**: `themes/custom/undrr_common/scss/components/_bootstrap-compat.scss`

```scss
// Grid system
.container { @extend .mg-container; }
.row { @extend .mg-grid; }

// Utilities
.text-center { @extend .mg-u-text-align--center; }
.pull-left { @extend .mg-u-float--left; }
.sr-only { @extend .mg-u-sr-only; }
```

### 4.2 Deliverables

- [ ] Complete Bootstrap usage audit
- [ ] Create Bootstrap compatibility layer in Drupal theme
- [ ] Visual regression testing
- [ ] Remove Bootstrap import from theme
- [ ] Delete Bootstrap SCSS files

---

## Class mapping reference

### Display classes

| Legacy (Drupal) | Mangrove |
|-----------------|----------|
| `.dp-il` | `.mg-u-display--inline` |
| `.dp-bl` | `.mg-u-display--block` |
| `.dp-ib` | `.mg-u-display--inline-block` |
| `.dp-if` | `.mg-u-display--inline-flex` |
| `.dp-fl` | `.mg-u-display--flex` |

### Position classes

| Legacy | Mangrove |
|--------|----------|
| `.ps-ab` | `.mg-u-position--absolute` |
| `.ps-rl` | `.mg-u-position--relative` |

### Margin top

| Legacy | Mangrove | Pixels |
|--------|----------|--------|
| `.mt-0` | `.mg-u-margin-top-0` | 0 |
| `.mt-10` | `.mg-u-margin-top-100` | 10px |
| `.mt-15` | `.mg-u-margin-top-150` | 15px |
| `.mt-16` | `.mg-u-margin-top-150` | ~16px |
| `.mt-20` | `.mg-u-margin-top-200` | 20px |
| `.mt-25` | `.mg-u-margin-top-250` | 25px |
| `.mt-30` | `.mg-u-margin-top-300` | 30px |
| `.mt-35` | `.mg-u-margin-top-300` | ~35px |
| `.mt-40` | `.mg-u-margin-top-400` | 40px |

### Margin right

| Legacy | Mangrove | Pixels |
|--------|----------|--------|
| `.mr-0` | `.mg-u-margin-right-0` | 0 |
| `.mr-10` | `.mg-u-margin-right-100` | 10px |
| `.mr-15` | `.mg-u-margin-right-150` | 15px |
| `.mr-20` | `.mg-u-margin-right-200` | 20px |
| `.mr-25` | `.mg-u-margin-right-250` | 25px |
| `.mr-30` | `.mg-u-margin-right-300` | 30px |
| `.mr-35` | `.mg-u-margin-right-300` | ~35px |
| `.mr-40` | `.mg-u-margin-right-400` | 40px |

### Margin bottom

| Legacy | Mangrove | Pixels |
|--------|----------|--------|
| `.mb-0` | `.mg-u-margin-bottom-0` | 0 |
| `.mb-8` | `.mg-u-margin-bottom-75` | ~8px |
| `.mb-10` | `.mg-u-margin-bottom-100` | 10px |
| `.mb-15` | `.mg-u-margin-bottom-150` | 15px |
| `.mb-16` | `.mg-u-margin-bottom-150` | ~16px |
| `.mb-20` | `.mg-u-margin-bottom-200` | 20px |
| `.mb-25` | `.mg-u-margin-bottom-250` | 25px |
| `.mb-30` | `.mg-u-margin-bottom-300` | 30px |
| `.mb-35` | `.mg-u-margin-bottom-300` | ~35px |

### Margin left

| Legacy | Mangrove | Pixels |
|--------|----------|--------|
| `.ml-0` | `.mg-u-margin-left-0` | 0 |
| `.ml-5` | `.mg-u-margin-left-50` | 5px |
| `.ml-10` | `.mg-u-margin-left-100` | 10px |
| `.ml-11` | `.mg-u-margin-left-100` | ~11px |
| `.ml-12` | `.mg-u-margin-left-100` | ~12px |
| `.ml-15` | `.mg-u-margin-left-150` | 15px |
| `.ml-20` | `.mg-u-margin-left-200` | 20px |
| `.ml-24` | `.mg-u-margin-left-250` | ~24px |
| `.ml-25` | `.mg-u-margin-left-250` | 25px |
| `.ml-30` | `.mg-u-margin-left-300` | 30px |
| `.ml-35` | `.mg-u-margin-left-300` | ~35px |

### Negative margins

| Legacy | Mangrove | Pixels |
|--------|----------|--------|
| `.mt-10-neg` | `.mg-u-margin-top-negative-100` | -10px |
| `.mt-20-neg` | `.mg-u-margin-top-negative-200` | -20px |
| `.mt-30-neg` | `.mg-u-margin-top-negative-300` | -30px |

### Padding top

| Legacy | Mangrove | Pixels |
|--------|----------|--------|
| `.pt-5` | `.mg-u-padding-top-50` | 5px |
| `.pt-10` | `.mg-u-padding-top-100` | 10px |
| `.pt-15` | `.mg-u-padding-top-150` | 15px |
| `.pt-20` | `.mg-u-padding-top-200` | 20px |
| `.pt-25` | `.mg-u-padding-top-250` | 25px |
| `.pt-30` | `.mg-u-padding-top-300` | 30px |
| `.pt-35` | `.mg-u-padding-top-300` | ~35px |

### Padding right

| Legacy | Mangrove | Pixels |
|--------|----------|--------|
| `.pr-10` | `.mg-u-padding-right-100` | 10px |
| `.pr-15` | `.mg-u-padding-right-150` | 15px |
| `.pr-20` | `.mg-u-padding-right-200` | 20px |
| `.pr-25` | `.mg-u-padding-right-250` | 25px |
| `.pr-30` | `.mg-u-padding-right-300` | 30px |
| `.pr-35` | `.mg-u-padding-right-300` | ~35px |

### Padding bottom

| Legacy | Mangrove | Pixels |
|--------|----------|--------|
| `.pb-5` | `.mg-u-padding-bottom-50` | 5px |
| `.pb-10` | `.mg-u-padding-bottom-100` | 10px |
| `.pb-15` | `.mg-u-padding-bottom-150` | 15px |
| `.pb-20` | `.mg-u-padding-bottom-200` | 20px |
| `.pb-25` | `.mg-u-padding-bottom-250` | 25px |
| `.pb-30` | `.mg-u-padding-bottom-300` | 30px |
| `.pb-35` | `.mg-u-padding-bottom-300` | ~35px |
| `.pb-40` | `.mg-u-padding-bottom-400` | 40px |

### Padding left

| Legacy | Mangrove | Pixels |
|--------|----------|--------|
| `.pl-10` | `.mg-u-padding-left-100` | 10px |
| `.pl-15` | `.mg-u-padding-left-150` | 15px |
| `.pl-20` | `.mg-u-padding-left-200` | 20px |
| `.pl-25` | `.mg-u-padding-left-250` | 25px |
| `.pl-30` | `.mg-u-padding-left-300` | 30px |
| `.pl-35` | `.mg-u-padding-left-300` | ~35px |

### Background colors

| Legacy | Mangrove | Color |
|--------|----------|-------|
| `.bg-c--bp` | `.mg-u-background-color--blue-900` | UNDRR Primary Blue |
| `.bg-c--bs` | `.mg-u-background-color--blue-500` | UNDRR Secondary Blue |
| `.bg-c--333` | `.mg-u-background-color--neutral-700` | Dark gray |
| `.bg-c--garnet` | `.mg-u-background-color--sendai-red` | Sendai Red |
| `.bg-c--orange` | `.mg-u-background-color--sendai-orange` | Sendai Orange |
| `.bg-c--purple` | `.mg-u-background-color--sendai-purple` | Sendai Purple |
| `.bg-c--turquoise` | `.mg-u-background-color--sendai-turquoise` | Sendai Turquoise |

### Text colors

| Legacy | Mangrove | Color |
|--------|----------|-------|
| `.t-c--w` | `.mg-u-color--white` | White |
| `.t-c--bp` | `.mg-u-color--blue-900` | Primary Blue |
| `.t-c--bs` | `.mg-u-color--blue-500` | Secondary Blue |
| `.t-c--tc` | `.mg-u-color--neutral-800` | Text color |
| `.t-c--333` | `.mg-u-color--neutral-700` | Dark gray |

### Width classes

| Legacy | Mangrove | Value |
|--------|----------|-------|
| `.w-100` | `.mg-u-width--full` | 100% |
| `.w-vw--100` | `.mg-u-width--screen` | 100vw |
| `.w-vw--75` | `.mg-u-width--vw-75` | 75vw |
| `.w-vw--50` | `.mg-u-width--vw-50` | 50vw |
| `.w-vw--25` | `.mg-u-width--vw-25` | 25vw |

### Typography classes

| Legacy | Mangrove |
|--------|----------|
| `.t-lh--n` | `.mg-u-line-height--normal` |
| `.text-m-center` | `.mg-u-text-align--center--sm` |

### Utility classes

| Legacy | Mangrove | Purpose |
|--------|----------|---------|
| `.rm-m` | `.mg-u-margin-0` | Remove all margins |

### Bootstrap to Mangrove

| Bootstrap | Mangrove |
|-----------|----------|
| `.container` | `.mg-container` |
| `.row` | `.mg-grid` |
| `.text-center` | `.mg-u-text-align--center` |
| `.sr-only` | `.mg-u-sr-only` |

---

## Deprecated classes (remove, no replacement)

These classes were never fully implemented or are obsolete. Remove from templates:

### Group label utilities
- `.g-lb--bd` - Never implemented
- `.g-lb--cnd` - Never implemented
- `.g-lb--sz--14` - Never implemented
- `.g-lb--c--333` - Never implemented

**Note:** `.g-lb--up` IS defined in IRP theme — keep if used there.

### Text utilities
- `.t-cnd` - Never implemented
- `.t-wg--rg` - Never implemented
- `.t-alg--right` - Never implemented (use `.mg-u-text-align--right`)
- `.t-sz--12` - Never implemented
- `.t-w--m` - Never implemented
- `.t-up` - Never implemented

**Note:** `.t-sz--16` IS defined in gutenberg-integration.css — keeping it.

### Div/field utilities
- `.dv-v--tp` - Never implemented
- `.st-sht` - Never implemented
- `.st-bks` - Never implemented

**Note:** `.fl-comma` IS defined in PW theme — keep if used there.

### Position utilities
- `.ps-ab--b--0` - Never implemented
- `.ps-ab--l--0` - Never implemented

### Padding utilities
- `.pt-5` - Never implemented → use `.mg-u-padding-top-50` (5px)
- `.pb-5` - Never implemented → use `.mg-u-padding-bottom-50` (5px)
- `.pb-40` - Never implemented → use `.mg-u-padding-bottom-400` (40px)

### Background utilities
- `.bg-c--333--70` - Never implemented (opacity variant)

---

## Document history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-02 | Claude Code | Initial draft |
| 2.0 | 2026-01-04 | Claude Code | **Major revision**: Removed Drupal-specific files from Mangrove. Drupal integration now lives in Drupal theme. Simplified utilities to page builder essentials. |
| 2.1 | 2026-01-04 | Claude Code | **Added comprehensive class mappings**: Full mapping tables for all spacing, colors, typography, and position utilities. Added deprecated classes section documenting classes to remove. |
