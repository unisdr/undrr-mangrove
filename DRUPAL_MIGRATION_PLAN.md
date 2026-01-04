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
| `.dp-fl` | `.mg-u-display--flex` |

### Spacing classes

| Legacy | Mangrove | Pixels |
|--------|----------|--------|
| `.mt-10` | `.mg-u-margin-top-100` | 10px |
| `.mt-15` | `.mg-u-margin-top-150` | 15px |
| `.mt-20` | `.mg-u-margin-top-200` | 20px |
| `.mt-30` | `.mg-u-margin-top-300` | 30px |

### Color classes

| Legacy | Mangrove |
|--------|----------|
| `.bg-c--bp` | `.mg-u-background-color--blue-900` |
| `.bg-c--bs` | `.mg-u-background-color--blue-500` |
| `.t-c--w` | `.mg-u-color--white` |

### Bootstrap to Mangrove

| Bootstrap | Mangrove |
|-----------|----------|
| `.container` | `.mg-container` |
| `.row` | `.mg-grid` |
| `.text-center` | `.mg-u-text-align--center` |
| `.sr-only` | `.mg-u-sr-only` |

---

## Document history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-02 | Claude Code | Initial draft |
| 2.0 | 2026-01-04 | Claude Code | **Major revision**: Removed Drupal-specific files from Mangrove. Drupal integration now lives in Drupal theme. Simplified utilities to page builder essentials. |
