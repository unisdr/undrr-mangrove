# Drupal to Mangrove style migration plan

This document outlines the strategy for consolidating utility styles between the Mangrove component library and the Drupal theme (`undrr_common`), establishing Mangrove as the single source of truth for all foundational styling.

## Table of contents

- [Executive summary](#executive-summary)
- [Current state analysis](#current-state-analysis)
- [Migration strategy](#migration-strategy)
- [Phase 0: Cleanup undefined classes (prerequisite)](#phase-0-cleanup-undefined-classes-prerequisite)
- [Phase 1: Seed Mangrove with foundational utilities](#phase-1-seed-mangrove-with-foundational-utilities)
- [Phase 2: Create migration bridge layer](#phase-2-create-migration-bridge-layer)
- [Phase 3: Drupal template migration](#phase-3-drupal-template-migration)
- [Phase 4: Bootstrap removal](#phase-4-bootstrap-removal)
- [Class mapping reference](#class-mapping-reference)
- [Migration tooling](#migration-tooling)
- [Risk mitigation](#risk-mitigation)
- [Success criteria](#success-criteria)

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
- Risk of class collisions
- Technical debt from Bootstrap 3.3.7

### The solution

Establish Mangrove as the **single source of truth** for all styling by:

1. Adding comprehensive utility classes to Mangrove
2. Creating a backward-compatibility bridge for Drupal
3. Progressively migrating Drupal templates to Mangrove classes
4. Removing Bootstrap and legacy utilities

---

## Current state analysis

### Mangrove strengths

| Feature | Status | Notes |
|---------|--------|-------|
| Design tokens | ✅ Complete | Colors, spacing, typography scales |
| Color utilities | ✅ Complete | `.mg-u-background-color--*`, `.mg-u-color--*` |
| Component styles | ✅ Complete | Buttons, forms, cards, navigation |
| Namespacing | ✅ Complete | `mg-` prefix prevents collisions |
| Theme variants | ✅ Complete | MCR, IRP, PreventionWeb themes |

### Mangrove gaps

| Feature | Status | Priority |
|---------|--------|----------|
| Spacing utilities | ❌ Missing | **Critical** |
| Display utilities | ❌ Missing | **Critical** |
| Flexbox utilities | ❌ Missing | **High** |
| Typography utilities | ❌ Missing | **High** |
| Border utilities | ❌ Missing | Medium |
| Shadow utilities | ❌ Missing | Medium |
| Position utilities | ❌ Missing | Medium |
| Sizing utilities | ❌ Missing | Medium |

### Drupal theme inventory

**File**: `themes/custom/undrr_common/scss/components/variations.scss` (1,175 lines)

| Category | Classes | Example |
|----------|---------|---------|
| Display | 6 | `.dp-fl`, `.dp-ib`, `.dp-il` |
| Margin | 32 | `.mt-10`, `.mb-20`, `.ml-5` |
| Padding | 24 | `.pt-15`, `.pb-30`, `.pr-10` |
| Background color | 8 | `.bg-c--bp`, `.bg-c--333` |
| Text color | 5 | `.t-c--w`, `.t-c--bp` |
| Position | 3 | `.ps-ab`, `.ps-rl`, `.pr` |
| Width | 6 | `.w-100`, `.w-vw--50` |
| Z-index | 2 | `.zi--1`, `.zi-1` |

**Dependencies**:
- Bootstrap 3.3.7 (50+ SCSS files)
- Custom field/view/paragraph styling
- CKEditor integration styles

---

## Migration strategy

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  PHASE 0        PHASE 1           PHASE 2           PHASE 3        PHASE 4          │
│  ────────       ────────          ────────          ────────       ────────         │
│                                                                                      │
│  Cleanup    →   Seed Mangrove  →  Bridge Layer  →   Migrate    →   Remove           │
│  dead code      with utilities    for backward      Drupal         Bootstrap        │
│                                   compatibility     templates      + legacy         │
│                                                                                      │
│  ┌──────────┐   ┌─────────────┐  ┌─────────────┐   ┌────────┐     ┌────────┐        │
│  │ Remove   │   │ _spacing    │  │ drupal-     │   │ .twig  │     │ Delete │        │
│  │ undefined│   │ _display    │  │ compat.scss │   │ files  │     │ old    │        │
│  │ classes  │   │ _flexbox    │  │             │   │        │     │ files  │        │
│  │ from     │   │ _typography │  │ Maps old →  │   │ Update │     │        │        │
│  │ Drupal   │   │ _borders    │  │ new classes │   │ classes│     │ Remove │        │
│  │ config   │   │ _shadows    │  │             │   │        │     │ BS 3.3 │        │
│  └──────────┘   └─────────────┘  └─────────────┘   └────────┘     └────────┘        │
│                                                                                      │
│  Drupal         Mangrove         Mangrove          Drupal         Drupal            │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Cleanup undefined classes (prerequisite)

Before any migration work begins, dead code must be removed from Drupal config. These are classes that are referenced in entity view displays but have **no CSS definitions** — they have no visual effect.

### 0.1 Classes to remove

See [Appendix C, Section 1](#1-classes-used-in-config-but-not-defined-in-scss--do-not-migrate) for the complete list. Summary:

| Category | Count | Examples |
|----------|-------|----------|
| Undefined semantic classes | 17 | `g-lb--up`, `t-cnd`, `dv-v--tp` |
| Missing padding utilities | 5 | `pt-5`, `pt-10`, `pb-40` |
| **Total** | **22** | |

### 0.2 Cleanup process

```bash
# 1. Export Drupal config
drush cex -y

# 2. Find affected files
grep -rln "g-lb--up\|g-lb--bd\|g-lb--cnd\|g-lb--sz--14\|t-cnd\|t-wg--rg" config/sync/
grep -rln "t-alg--right\|t-sz--12\|t-sz--16\|t-w--m\|t-up\|dv-v--tp" config/sync/
grep -rln "fl-comma\|st-sht\|st-bks\|ps-ab--b--0\|ps-ab--l--0" config/sync/
grep -rln "pt-5\|pt-10\|pb-5\|pb-40\|bg-c--333--70" config/sync/

# 3. Remove class references from YAML files
# (Manual edit or sed script)

# 4. Import cleaned config
drush cim -y

# 5. Clear caches and verify
drush cr
```

### 0.3 Deliverables

- [ ] Audit all 22 undefined classes in Drupal config
- [ ] Remove class references from entity view display configs
- [ ] Verify no visual regressions (expected: none)
- [ ] Commit cleaned config with descriptive message
- [ ] Document any classes that were intentionally left (with justification)

### 0.4 Success criteria

- [ ] Zero references to undefined classes in `config/sync/*.yml`
- [ ] All existing pages render identically before and after cleanup
- [ ] Cleanup committed to version control

---

## Phase 1: Seed Mangrove with foundational utilities

### 1.1 New file structure

```
stories/assets/scss/
├── utilities/
│   ├── _index.scss           # Barrel file (imports all)
│   ├── _spacing.scss         # Margin & padding
│   ├── _display.scss         # Display & visibility
│   ├── _flexbox.scss         # Flex container & item utilities
│   ├── _typography.scss      # Font size, weight, alignment
│   ├── _borders.scss         # Border width, color, radius
│   ├── _shadows.scss         # Box shadows
│   ├── _sizing.scss          # Width & height
│   └── _position.scss        # Position & z-index
├── _utility.scss             # Existing (unchanged)
└── _utility-complete.scss    # New entry point (imports all)
```

### 1.2 Spacing utilities

**File**: `stories/assets/scss/utilities/_spacing.scss`

Uses existing Mangrove spacing tokens (see [Appendix A](#appendix-a-spacing-token-reference) for full list).

**Naming convention**: `mg-u-{property}-{size}`

- Full property names for clarity: `margin-top`, `padding-left`, etc.
- Consistent with existing utilities like `mg-u-background-color--blue-500`

**Classes generated**:

```scss
// Margin: .mg-u-margin-{direction}-{size}
.mg-u-margin-0           { margin: 0; }
.mg-u-margin-100         { margin: $mg-spacing-100; }  // 1rem = 10px
.mg-u-margin-top-200     { margin-top: $mg-spacing-200; }  // 2rem = 20px
.mg-u-margin-right-150   { margin-right: $mg-spacing-150; }  // 1.5rem = 15px
.mg-u-margin-bottom-300  { margin-bottom: $mg-spacing-300; }  // 3rem = 30px
.mg-u-margin-left-100    { margin-left: $mg-spacing-100; }
.mg-u-margin-x-auto      { margin-left: auto; margin-right: auto; }
.mg-u-margin-y-200       { margin-top: $mg-spacing-200; margin-bottom: $mg-spacing-200; }

// Padding: .mg-u-padding-{direction}-{size}
.mg-u-padding-0          { padding: 0; }
.mg-u-padding-100        { padding: $mg-spacing-100; }
.mg-u-padding-top-200    { padding-top: $mg-spacing-200; }
.mg-u-padding-right-150  { padding-right: $mg-spacing-150; }
.mg-u-padding-bottom-300 { padding-bottom: $mg-spacing-300; }
.mg-u-padding-left-100   { padding-left: $mg-spacing-100; }
.mg-u-padding-x-200      { padding-left: $mg-spacing-200; padding-right: $mg-spacing-200; }
.mg-u-padding-y-200      { padding-top: $mg-spacing-200; padding-bottom: $mg-spacing-200; }
```

### 1.3 Display utilities

**File**: `stories/assets/scss/utilities/_display.scss`

```scss
// Base display
.mg-u-display--none          { display: none; }
.mg-u-display--block         { display: block; }
.mg-u-display--inline        { display: inline; }
.mg-u-display--inline-block  { display: inline-block; }
.mg-u-display--flex          { display: flex; }
.mg-u-display--inline-flex   { display: inline-flex; }
.mg-u-display--grid          { display: grid; }

// Responsive variants
// Pattern: .mg-u-{property}--{value}--{breakpoint}
// Follows existing pattern: .mg-u-responsive--show-large
.mg-u-display--none--sm      { } // Hidden on mobile (≤480px)
.mg-u-display--block--md     { } // Block on tablet+ (≥900px)
.mg-u-display--flex--lg      { } // Flex on desktop+ (≥1164px)
.mg-u-display--none--xl      { } // Hidden on wide desktop (≥1440px)
```

**Responsive breakpoint suffixes**:

| Suffix | Breakpoint | Variable |
|--------|------------|----------|
| `--sm` | ≤480px | `$mg-breakpoint-mobile` |
| `--md` | ≥900px | `$mg-breakpoint-tablet` |
| `--lg` | ≥1164px | `$mg-breakpoint-desktop` |
| `--xl` | ≥1440px | `$mg-breakpoint-desktop-wide` |

### 1.4 Flexbox utilities

**File**: `stories/assets/scss/utilities/_flexbox.scss`

```scss
// Direction
.mg-u-flex-direction--row            { flex-direction: row; }
.mg-u-flex-direction--column         { flex-direction: column; }
.mg-u-flex-direction--row-reverse    { flex-direction: row-reverse; }
.mg-u-flex-direction--column-reverse { flex-direction: column-reverse; }

// Wrap
.mg-u-flex-wrap--wrap     { flex-wrap: wrap; }
.mg-u-flex-wrap--nowrap   { flex-wrap: nowrap; }

// Justify content
.mg-u-justify-content--start    { justify-content: flex-start; }
.mg-u-justify-content--end      { justify-content: flex-end; }
.mg-u-justify-content--center   { justify-content: center; }
.mg-u-justify-content--between  { justify-content: space-between; }
.mg-u-justify-content--around   { justify-content: space-around; }
.mg-u-justify-content--evenly   { justify-content: space-evenly; }

// Align items
.mg-u-align-items--start     { align-items: flex-start; }
.mg-u-align-items--end       { align-items: flex-end; }
.mg-u-align-items--center    { align-items: center; }
.mg-u-align-items--baseline  { align-items: baseline; }
.mg-u-align-items--stretch   { align-items: stretch; }

// Gap (using spacing tokens)
.mg-u-gap-100  { gap: $mg-spacing-100; }
.mg-u-gap-150  { gap: $mg-spacing-150; }
.mg-u-gap-200  { gap: $mg-spacing-200; }
.mg-u-gap-300  { gap: $mg-spacing-300; }
.mg-u-gap-400  { gap: $mg-spacing-400; }

// Flex item
.mg-u-flex--1       { flex: 1 1 0%; }
.mg-u-flex--auto    { flex: 1 1 auto; }
.mg-u-flex--none    { flex: none; }
.mg-u-flex-grow--0  { flex-grow: 0; }
.mg-u-flex-grow--1  { flex-grow: 1; }
.mg-u-flex-shrink--0 { flex-shrink: 0; }
.mg-u-flex-shrink--1 { flex-shrink: 1; }
```

### 1.5 Typography utilities

**File**: `stories/assets/scss/utilities/_typography.scss`

```scss
// Font size (using Mangrove tokens)
.mg-u-font-size-100  { font-size: $mg-font-size-100; }  // 1rem (10px)
.mg-u-font-size-200  { font-size: $mg-font-size-200; }  // 1.25rem (12.5px)
.mg-u-font-size-300  { font-size: $mg-font-size-300; }  // 1.6rem (16px) - body
.mg-u-font-size-400  { font-size: $mg-font-size-400; }  // 1.8rem (18px)
.mg-u-font-size-500  { font-size: $mg-font-size-500; }  // 2.3rem (23px)
.mg-u-font-size-600  { font-size: $mg-font-size-600; }  // 3.2rem (32px)
.mg-u-font-size-800  { font-size: $mg-font-size-800; }  // 3.6rem (36px)
.mg-u-font-size-900  { font-size: $mg-font-size-900; }  // 4rem (40px)

// Font weight
.mg-u-font-weight--normal    { font-weight: 400; }
.mg-u-font-weight--medium    { font-weight: 500; }
.mg-u-font-weight--semibold  { font-weight: 600; }
.mg-u-font-weight--bold      { font-weight: 700; }

// Text alignment
.mg-u-text-align--left    { text-align: left; }
.mg-u-text-align--center  { text-align: center; }
.mg-u-text-align--right   { text-align: right; }

// Responsive text alignment
.mg-u-text-align--center--sm { } // Center on mobile
.mg-u-text-align--left--md   { } // Left on tablet+

// Line height
.mg-u-line-height--none     { line-height: 1; }
.mg-u-line-height--tight    { line-height: $mg-font-line-height-500; }  // 1.25
.mg-u-line-height--normal   { line-height: $mg-font-line-height-700; }  // 1.5
.mg-u-line-height--relaxed  { line-height: 1.75; }

// Text transform
.mg-u-text-transform--uppercase   { text-transform: uppercase; }
.mg-u-text-transform--lowercase   { text-transform: lowercase; }
.mg-u-text-transform--capitalize  { text-transform: capitalize; }
.mg-u-text-transform--none        { text-transform: none; }

// Text decoration
.mg-u-text-decoration--underline     { text-decoration: underline; }
.mg-u-text-decoration--none          { text-decoration: none; }
.mg-u-text-decoration--line-through  { text-decoration: line-through; }

// White space
.mg-u-white-space--normal    { white-space: normal; }
.mg-u-white-space--nowrap    { white-space: nowrap; }
.mg-u-white-space--pre       { white-space: pre; }
.mg-u-white-space--pre-wrap  { white-space: pre-wrap; }

// Text overflow
.mg-u-text-overflow--truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### 1.6 Border utilities

**File**: `stories/assets/scss/utilities/_borders.scss`

```scss
// Border (shorthand)
.mg-u-border           { border: 1px solid $mg-color-neutral-300; }
.mg-u-border--none     { border: 0; }
.mg-u-border-top       { border-top: 1px solid $mg-color-neutral-300; }
.mg-u-border-right     { border-right: 1px solid $mg-color-neutral-300; }
.mg-u-border-bottom    { border-bottom: 1px solid $mg-color-neutral-300; }
.mg-u-border-left      { border-left: 1px solid $mg-color-neutral-300; }

// Border width
.mg-u-border-width--1  { border-width: 1px; }
.mg-u-border-width--2  { border-width: 2px; }
.mg-u-border-width--4  { border-width: 4px; }

// Border color
.mg-u-border-color--neutral-100 { border-color: $mg-color-neutral-100; }
.mg-u-border-color--neutral-200 { border-color: $mg-color-neutral-200; }
.mg-u-border-color--neutral-300 { border-color: $mg-color-neutral-300; }
.mg-u-border-color--neutral-400 { border-color: $mg-color-neutral-400; }
.mg-u-border-color--blue-500    { border-color: $mg-color-blue-500; }
.mg-u-border-color--blue-900    { border-color: $mg-color-blue-900; }

// Border radius
.mg-u-border-radius--none  { border-radius: 0; }
.mg-u-border-radius--sm    { border-radius: 2px; }
.mg-u-border-radius        { border-radius: 4px; }
.mg-u-border-radius--md    { border-radius: 6px; }
.mg-u-border-radius--lg    { border-radius: 8px; }
.mg-u-border-radius--xl    { border-radius: 12px; }
.mg-u-border-radius--full  { border-radius: 9999px; }
```

### 1.7 Shadow utilities

**File**: `stories/assets/scss/utilities/_shadows.scss`

```scss
.mg-u-box-shadow--none { box-shadow: none; }
.mg-u-box-shadow--sm   { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.mg-u-box-shadow       { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
                                     0 1px 2px -1px rgba(0, 0, 0, 0.1); }
.mg-u-box-shadow--md   { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                                     0 2px 4px -2px rgba(0, 0, 0, 0.1); }
.mg-u-box-shadow--lg   { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
                                     0 4px 6px -4px rgba(0, 0, 0, 0.1); }
.mg-u-box-shadow--xl   { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                                     0 8px 10px -6px rgba(0, 0, 0, 0.1); }
```

### 1.8 Position utilities

**File**: `stories/assets/scss/utilities/_position.scss`

```scss
// Position type
.mg-u-position--static   { position: static; }
.mg-u-position--relative { position: relative; }
.mg-u-position--absolute { position: absolute; }
.mg-u-position--fixed    { position: fixed; }
.mg-u-position--sticky   { position: sticky; }

// Inset (using spacing tokens)
.mg-u-inset-0     { top: 0; right: 0; bottom: 0; left: 0; }
.mg-u-top-0       { top: 0; }
.mg-u-right-0     { right: 0; }
.mg-u-bottom-0    { bottom: 0; }
.mg-u-left-0      { left: 0; }

// Z-index
.mg-u-z-index--0     { z-index: 0; }
.mg-u-z-index--10    { z-index: 10; }
.mg-u-z-index--20    { z-index: 20; }
.mg-u-z-index--30    { z-index: 30; }
.mg-u-z-index--40    { z-index: 40; }
.mg-u-z-index--50    { z-index: 50; }
.mg-u-z-index--auto  { z-index: auto; }
```

### 1.9 Sizing utilities

**File**: `stories/assets/scss/utilities/_sizing.scss`

```scss
// Width
.mg-u-width--auto    { width: auto; }
.mg-u-width--full    { width: 100%; }
.mg-u-width--screen  { width: 100vw; }
.mg-u-width--half    { width: 50%; }
.mg-u-width--third   { width: 33.333333%; }
.mg-u-width--quarter { width: 25%; }

// Max width
.mg-u-max-width--none   { max-width: none; }
.mg-u-max-width--full   { max-width: 100%; }
.mg-u-max-width--prose  { max-width: 65ch; }

// Height
.mg-u-height--auto    { height: auto; }
.mg-u-height--full    { height: 100%; }
.mg-u-height--screen  { height: 100vh; }

// Min height
.mg-u-min-height--0       { min-height: 0; }
.mg-u-min-height--full    { min-height: 100%; }
.mg-u-min-height--screen  { min-height: 100vh; }
```

### 1.10 Storybook documentation

Create comprehensive documentation pages for each utility category with interactive examples:

```
stories/Documentation/Utilities/
├── Overview.mdx           # Introduction to utility system
├── Spacing.mdx            # Margin & padding utilities
├── Display.mdx            # Display & visibility utilities
├── Flexbox.mdx            # Flex container & item utilities
├── Typography.mdx         # Text styling utilities
├── Borders.mdx            # Border utilities
├── Shadows.mdx            # Box shadow utilities
├── Position.mdx           # Position & z-index utilities
├── Sizing.mdx             # Width & height utilities
├── Colors.mdx             # Background & text color utilities
├── Responsive.mdx         # Responsive modifier patterns
└── DrupalMigration.mdx    # Migration guide for Drupal developers
```

#### Documentation requirements per utility file

Each `.mdx` file must include:

1. **Overview section**
   - Purpose of the utility category
   - When to use vs. when to use component classes
   - Design token reference (link to relevant tokens)

2. **Complete class reference table**
   - Class name
   - CSS output
   - Token value (where applicable)
   - Example usage

3. **Interactive examples**
   - Live Storybook canvas showing each utility in action
   - Before/after comparisons
   - Responsive behavior demonstrations

4. **Code snippets**
   - Copy-pasteable HTML examples
   - SCSS import examples for Drupal integration

5. **Accessibility considerations**
   - Focus state compatibility
   - Screen reader implications

#### Example: Spacing.mdx structure

```mdx
import { Meta, Canvas, Story } from '@storybook/blocks';

<Meta title="Documentation/Utilities/Spacing" />

# Spacing utilities

Spacing utilities control margin and padding using Mangrove's spacing tokens.

## Design tokens

All spacing utilities use the Mangrove spacing scale:

| Token | Class suffix | Value | Pixels |
|-------|--------------|-------|--------|
| `$mg-spacing-0` | `-0` | 0 | 0px |
| `$mg-spacing-50` | `-50` | 0.5rem | 5px |
| `$mg-spacing-100` | `-100` | 1rem | 10px |
| `$mg-spacing-150` | `-150` | 1.5rem | 15px |
| `$mg-spacing-200` | `-200` | 2rem | 20px |
| ... | ... | ... | ... |

## Margin utilities

### Naming convention

```
.mg-u-margin-{direction}-{size}
```

Where `{direction}` is one of:
- `top`, `right`, `bottom`, `left`
- `x` (left + right), `y` (top + bottom)
- (none) for all sides

### Examples

<Canvas>
  <Story name="Margin Top">
    <div className="mg-u-background-color--neutral-100 mg-u-padding-200">
      <div className="mg-u-margin-top-200 mg-u-background-color--blue-100 mg-u-padding-100">
        .mg-u-margin-top-200
      </div>
    </div>
  </Story>
</Canvas>

<Canvas>
  <Story name="Margin Scale">
    {() => {
      const sizes = [0, 50, 100, 150, 200, 250, 300];
      return (
        <div className="mg-u-display--flex mg-u-gap-100">
          {sizes.map(size => (
            <div key={size} className="mg-u-background-color--neutral-100">
              <div className={`mg-u-margin-top-${size} mg-u-background-color--blue-500 mg-u-padding-100`}>
                {size}
              </div>
            </div>
          ))}
        </div>
      );
    }}
  </Story>
</Canvas>

## Responsive margin

Add breakpoint suffixes for responsive behavior:

```html
<div class="mg-u-margin-top-100 mg-u-margin-top-300--md mg-u-margin-top-400--lg">
  Margin increases at larger breakpoints
</div>
```

## Drupal migration

If migrating from the legacy Drupal utility classes:

| Legacy class | New Mangrove class |
|--------------|-------------------|
| `.mt-10` | `.mg-u-margin-top-100` |
| `.mt-15` | `.mg-u-margin-top-150` |
| `.mt-20` | `.mg-u-margin-top-200` |
| ... | ... |

See [Drupal Migration Guide](/docs/documentation-utilities-drupalmigration--docs) for the complete migration process.
```

#### DrupalMigration.mdx requirements

The Drupal migration documentation must include:

```mdx
import { Meta } from '@storybook/blocks';

<Meta title="Documentation/Utilities/Drupal migration" />

# Migrating from Drupal utilities to Mangrove

This guide helps Drupal developers migrate from legacy utility classes to Mangrove utilities.

## Why migrate?

- **Single source of truth**: All styling defined in Mangrove
- **Design token alignment**: Utilities use consistent spacing, colors, typography
- **Bootstrap removal**: Eliminates Bootstrap 3.3.7 dependency
- **Smaller CSS bundle**: Reduced duplication

## Migration approach

### Phase 1: Import Mangrove utilities

Update your Drupal theme's `base.scss`:

\`\`\`scss
// Before
@import "utils/variables";
@import "bootstrap/bootstrap";
@import "components/variations";

// After
@import "~@undrr/undrr-mangrove/scss/drupal-integration";
\`\`\`

The `drupal-integration.scss` file includes a compatibility layer that maps legacy class names to new Mangrove classes. This allows gradual migration.

### Phase 2: Update templates

Replace legacy classes with Mangrove equivalents:

\`\`\`twig
{# Before #}
<div class="dp-fl mt-20 mb-30 bg-c--bp t-c--w">

{# After #}
<div class="mg-u-display--flex mg-u-margin-top-200 mg-u-margin-bottom-300 mg-u-background-color--blue-900 mg-u-color--white">
\`\`\`

### Phase 3: Remove compatibility layer

Once all templates are updated, remove the compatibility import:

\`\`\`scss
// Final state - no compatibility layer needed
@import "~@undrr/undrr-mangrove/scss/style";
\`\`\`

## Complete class mapping

[Include full mapping tables from DRUPAL_MIGRATION_PLAN.md]

## Spacing conversion

Mangrove uses a 10px base, making conversion straightforward:

| Legacy pixels | Mangrove token | Class suffix |
|---------------|----------------|--------------|
| 10px | 1rem | `-100` |
| 15px | 1.5rem | `-150` |
| 20px | 2rem | `-200` |
| 30px | 3rem | `-300` |

## Bootstrap replacement

| Bootstrap class | Mangrove equivalent |
|-----------------|---------------------|
| `.container` | `.mg-container` |
| `.row` | `.mg-grid` |
| `.col-md-6` | `.mg-grid__col--span-3` |
| `.btn-primary` | `.mg-button.mg-button-primary` |
| `.text-center` | `.mg-u-text-align--center` |

## Troubleshooting

### Visual differences

Minor visual differences may occur due to token rounding:
- 25px → 24px (2.4rem)
- 35px → 30px (3rem)

These are intentional design token alignments.

### RTL support

All Mangrove utilities include RTL support. Margin/padding left/right are automatically flipped in RTL contexts.

### Missing classes

If you need a utility that doesn't exist in Mangrove, either:
1. Request it be added to Mangrove
2. Add a custom utility in your theme using Mangrove tokens
```

### 1.11 Deliverables

- [ ] Create `stories/assets/scss/utilities/` directory structure
- [ ] Implement `_spacing.scss` with margin/padding utilities
- [ ] Implement `_display.scss` with display utilities
- [ ] Implement `_flexbox.scss` with flex utilities
- [ ] Implement `_typography.scss` with text utilities
- [ ] Implement `_borders.scss` with border utilities
- [ ] Implement `_shadows.scss` with shadow utilities
- [ ] Implement `_position.scss` with position utilities
- [ ] Implement `_sizing.scss` with width/height utilities
- [ ] Create `_index.scss` barrel file
- [ ] Update `style.scss` to import utilities
- [ ] Create Storybook documentation for each category
- [ ] Add unit tests for utility class generation
- [ ] Release as minor version (e.g., 1.x.0)

---

## Phase 2: Create migration bridge layer

### 2.1 Backward compatibility mapping

**File**: `stories/assets/scss/_drupal-compat.scss`

This file maps legacy Drupal class names to new Mangrove utilities, allowing a gradual migration.

```scss
// =============================================================================
// DRUPAL COMPATIBILITY LAYER
// =============================================================================
// This file provides backward compatibility for legacy Drupal utility classes.
// It should be removed once all Drupal templates have been migrated.
//
// Usage: Import this file AFTER the main Mangrove utilities.
// =============================================================================

// -----------------------------------------------------------------------------
// Display utilities
// -----------------------------------------------------------------------------
.dp-il  { @extend .mg-u-display--inline; }
.dp-bl  { @extend .mg-u-display--block; }
.dp-ib  { @extend .mg-u-display--inline-block; }
.dp-if  { @extend .mg-u-display--inline-flex; }
.dp-fl  { @extend .mg-u-display--flex; }

// -----------------------------------------------------------------------------
// Position utilities
// -----------------------------------------------------------------------------
.ps-ab  { @extend .mg-u-position--absolute; }
.ps-rl  { @extend .mg-u-position--relative; }
.pr     { @extend .mg-u-position--relative; }

// -----------------------------------------------------------------------------
// Margin utilities
// Mapping: pixel values → closest Mangrove spacing token
// Note: Mangrove uses 10px base, so 1rem = 10px, 2rem = 20px, etc.
// -----------------------------------------------------------------------------

// Margin top
.mt-0   { @extend .mg-u-margin-top-0; }
.mt-10  { @extend .mg-u-margin-top-100; }   // 10px → 1rem (10px) ✓ exact
.mt-15  { @extend .mg-u-margin-top-150; }   // 15px → 1.5rem (15px) ✓ exact
.mt-16  { @extend .mg-u-margin-top-150; }   // 16px → 1.5rem (15px) ~close
.mt-20  { @extend .mg-u-margin-top-200; }   // 20px → 2rem (20px) ✓ exact
.mt-25  { @extend .mg-u-margin-top-250; }   // 25px → 2.4rem (24px) ~close
.mt-30  { @extend .mg-u-margin-top-300; }   // 30px → 3rem (30px) ✓ exact
.mt-35  { @extend .mg-u-margin-top-300; }   // 35px → 3rem (30px) ~close
.mt-40  { @extend .mg-u-margin-top-400; }   // 40px → 5rem (50px) ~shift up

// Margin right
.mr-0   { @extend .mg-u-margin-right-0; }
.mr-10  { @extend .mg-u-margin-right-100; }
.mr-15  { @extend .mg-u-margin-right-150; }
.mr-20  { @extend .mg-u-margin-right-200; }
.mr-25  { @extend .mg-u-margin-right-250; }
.mr-30  { @extend .mg-u-margin-right-300; }
.mr-35  { @extend .mg-u-margin-right-300; }
.mr-40  { @extend .mg-u-margin-right-400; }

// Margin bottom
.mb-0   { @extend .mg-u-margin-bottom-0; }
.mb-8   { @extend .mg-u-margin-bottom-75; }    // 8px → 0.75rem (7.5px) ~close
.mb-10  { @extend .mg-u-margin-bottom-100; }
.mb-15  { @extend .mg-u-margin-bottom-150; }
.mb-16  { @extend .mg-u-margin-bottom-150; }
.mb-20  { @extend .mg-u-margin-bottom-200; }
.mb-25  { @extend .mg-u-margin-bottom-250; }
.mb-30  { @extend .mg-u-margin-bottom-300; }
.mb-35  { @extend .mg-u-margin-bottom-300; }

// Margin left
.ml-0   { @extend .mg-u-margin-left-0; }
.ml-5   { @extend .mg-u-margin-left-50; }      // 5px → 0.5rem (5px) ✓ exact
.ml-10  { @extend .mg-u-margin-left-100; }
.ml-11  { @extend .mg-u-margin-left-100; }
.ml-12  { @extend .mg-u-margin-left-100; }
.ml-15  { @extend .mg-u-margin-left-150; }
.ml-20  { @extend .mg-u-margin-left-200; }
.ml-24  { @extend .mg-u-margin-left-250; }     // 24px → 2.4rem (24px) ✓ exact
.ml-25  { @extend .mg-u-margin-left-250; }
.ml-30  { @extend .mg-u-margin-left-300; }
.ml-35  { @extend .mg-u-margin-left-300; }

// Negative margins
.mt-10-neg { margin-top: -$mg-spacing-100; }
.mt-20-neg { margin-top: -$mg-spacing-200; }
.mt-30-neg { margin-top: -$mg-spacing-300; }

// Remove margins
.rm-m   { @extend .mg-u-margin-0; }

// -----------------------------------------------------------------------------
// Padding utilities
// -----------------------------------------------------------------------------

// Padding top
.pt-10  { @extend .mg-u-padding-top-100; }
.pt-15  { @extend .mg-u-padding-top-150; }
.pt-20  { @extend .mg-u-padding-top-200; }
.pt-25  { @extend .mg-u-padding-top-250; }
.pt-30  { @extend .mg-u-padding-top-300; }
.pt-35  { @extend .mg-u-padding-top-300; }

// Padding right
.pr-10  { @extend .mg-u-padding-right-100; }
.pr-15  { @extend .mg-u-padding-right-150; }
.pr-20  { @extend .mg-u-padding-right-200; }
.pr-25  { @extend .mg-u-padding-right-250; }
.pr-30  { @extend .mg-u-padding-right-300; }
.pr-35  { @extend .mg-u-padding-right-300; }

// Padding bottom
.pb-10  { @extend .mg-u-padding-bottom-100; }
.pb-15  { @extend .mg-u-padding-bottom-150; }
.pb-20  { @extend .mg-u-padding-bottom-200; }
.pb-25  { @extend .mg-u-padding-bottom-250; }
.pb-30  { @extend .mg-u-padding-bottom-300; }
.pb-35  { @extend .mg-u-padding-bottom-300; }

// Padding left
.pl-10  { @extend .mg-u-padding-left-100; }
.pl-15  { @extend .mg-u-padding-left-150; }
.pl-20  { @extend .mg-u-padding-left-200; }
.pl-25  { @extend .mg-u-padding-left-250; }
.pl-30  { @extend .mg-u-padding-left-300; }
.pl-35  { @extend .mg-u-padding-left-300; }

// -----------------------------------------------------------------------------
// Background color utilities
// -----------------------------------------------------------------------------
.bg-c--bp        { @extend .mg-u-background-color--blue-900; }
.bg-c--bs        { @extend .mg-u-background-color--blue-500; }
.bg-c--333       { @extend .mg-u-background-color--neutral-900; }
.bg-c--garnet    { @extend .mg-u-background-color--sendai-red; }
.bg-c--orange    { @extend .mg-u-background-color--sendai-orange; }
.bg-c--purple    { @extend .mg-u-background-color--sendai-purple; }
.bg-c--turquoise { @extend .mg-u-background-color--sendai-turquoise; }

// -----------------------------------------------------------------------------
// Text color utilities
// -----------------------------------------------------------------------------
.t-c--w   { @extend .mg-u-color--white; }
.t-c--bp  { @extend .mg-u-color--blue-900; }
.t-c--bs  { @extend .mg-u-color--blue-500; }
.t-c--tc  { @extend .mg-u-color--neutral-900; }
.t-c--333 { @extend .mg-u-color--neutral-900; }

// -----------------------------------------------------------------------------
// Width utilities
// -----------------------------------------------------------------------------
.w-100       { @extend .mg-u-width--full; }
.w-26        { width: 26%; }  // No direct equivalent
.w-vw--100   { @extend .mg-u-width--screen; }
.w-vw--75    { width: 75vw; }
.w-vw--50    { width: 50vw; }
.w-vw--25    { width: 25vw; }

// -----------------------------------------------------------------------------
// Z-index utilities
// -----------------------------------------------------------------------------
.zi--1  { @extend .mg-u-z-index--10; }
.zi-1   { @extend .mg-u-z-index--10; }

// -----------------------------------------------------------------------------
// Text utilities
// -----------------------------------------------------------------------------
.t-lh--n        { @extend .mg-u-line-height--normal; }
.text-m-center  {
  @include devicebreak(small) {
    @extend .mg-u-text-align--center;
  }
}
```

### 2.2 Drupal integration entry point

**File**: `stories/assets/scss/drupal-integration.scss`

```scss
// =============================================================================
// DRUPAL INTEGRATION
// =============================================================================
// Entry point for Drupal themes consuming Mangrove.
// Import this single file to get all Mangrove utilities + Drupal compatibility.
// =============================================================================

// 1. Design tokens
@import 'variables';
@import 'breakpoints';
@import 'mixins';

// 2. Foundational styles
@import 'fonts';
@import 'foundational';

// 3. Complete utility system
@import 'utilities/index';

// 4. Existing Mangrove utilities (color utilities, etc.)
@import 'utility';

// 5. Backward compatibility layer
// Remove this import once Drupal templates are fully migrated
@import 'drupal-compat';
```

### 2.3 Drupal-specific styles (permanent)

Some styles must remain Drupal-specific but should use Mangrove tokens:

**File**: `stories/assets/scss/drupal/_fields.scss`

```scss
// Drupal field display styling using Mangrove tokens

.field--label {
  font-weight: 600;
  margin-bottom: $mg-spacing-100;
}

.field--label-inline {
  .field--label {
    display: inline;
    margin-right: $mg-spacing-100;

    &::after {
      content: ":";
    }
  }

  .field--items,
  .field--item {
    display: inline;
  }
}

.field--label-above {
  .field--label {
    display: block;
    margin-bottom: $mg-spacing-100;
  }
}
```

**File**: `stories/assets/scss/drupal/_views.scss`

```scss
// Drupal views styling using Mangrove tokens

.views-row {
  border-bottom: 1px solid $mg-color-neutral-200;
  padding: $mg-spacing-400 0;

  &:last-child {
    border-bottom: 0;
  }
}

.view-empty {
  padding: $mg-spacing-400;
  text-align: center;
  color: $mg-color-neutral-600;
}
```

### 2.4 Deliverables

- [ ] Create `_drupal-compat.scss` with all legacy class mappings
- [ ] Create `drupal-integration.scss` entry point
- [ ] Create `drupal/_fields.scss` for field styling
- [ ] Create `drupal/_views.scss` for view styling
- [ ] Create `drupal/_paragraphs.scss` for paragraph styling
- [ ] Test backward compatibility with existing Drupal templates
- [ ] Document migration path in Storybook

---

## Phase 3: Drupal template migration

### 3.1 Migration order

Prioritize by impact and traffic:

1. **Core templates** (highest impact)
   - `html.html.twig`
   - `page.html.twig`
   - `node.html.twig`
   - `region.html.twig`

2. **Layout templates**
   - `layout--*.html.twig`
   - `block.html.twig`

3. **Content templates**
   - `node--*.html.twig` (by content type)
   - `paragraph--*.html.twig`

4. **Field templates**
   - `field--*.html.twig`

5. **View templates**
   - `views-view.html.twig`
   - `views-view-*.html.twig`

### 3.2 Template update process

For each template:

1. **Audit**: Run grep to find legacy class usage
2. **Map**: Use reference table to identify new classes
3. **Update**: Replace legacy classes with Mangrove equivalents
4. **Test**: Visual regression check
5. **Commit**: One template per commit for easy rollback

**Example transformation**:

```twig
{# Before #}
<div class="dp-fl mt-20 mb-30">
  <div class="w-100 pt-15 bg-c--bp t-c--w">
    {{ content }}
  </div>
</div>

{# After #}
<div class="mg-u-display-flex mg-u-mt-300 mg-u-mb-600">
  <div class="mg-u-w-full mg-u-pt-200 mg-u-background-color--blue-900 mg-u-color--white">
    {{ content }}
  </div>
</div>
```

### 3.3 Drupal theme updates

**Update**: `themes/custom/undrr_common/scss/base.scss`

```scss
// Before
@import "utils/variables";
@import "bootstrap/bootstrap";
@import "components/variations";

// After (Phase 3)
@import "~@undrr/undrr-mangrove/scss/drupal-integration";

// Keep only Drupal-specific overrides
@import "components/drupal-overrides";
```

### 3.4 Deliverables

- [ ] Create migration audit script
- [ ] Document class mapping reference (see below)
- [ ] Migrate core templates
- [ ] Migrate layout templates
- [ ] Migrate content type templates
- [ ] Migrate paragraph templates
- [ ] Migrate field templates
- [ ] Migrate view templates
- [ ] Visual regression testing
- [ ] Remove `variations.scss` from Drupal theme

---

## Phase 4: Bootstrap removal

### 4.1 Bootstrap usage audit

Current Bootstrap 3.3.7 features in use:

| Feature | Usage | Replacement |
|---------|-------|-------------|
| Grid system | `.container`, `.row`, `.col-*` | `.mg-container`, `.mg-grid` |
| Buttons | `.btn`, `.btn-primary` | `.mg-button`, `.mg-button-primary` |
| Forms | `.form-control`, `.form-group` | Mangrove form components |
| Tables | `.table`, `.table-striped` | Mangrove table styles |
| Utilities | `.text-center`, `.hidden-*` | Mangrove utilities |
| Responsive | `.visible-*`, `.hidden-*` | `.mg-u-display-*@breakpoint` |

### 4.2 Bootstrap removal steps

1. **Identify all Bootstrap class usage** in templates
2. **Create Mangrove equivalents** where missing
3. **Update templates** to use Mangrove classes
4. **Remove Bootstrap import** from `base.scss`
5. **Delete Bootstrap files** from theme

### 4.3 Grid migration

```twig
{# Bootstrap grid #}
<div class="container">
  <div class="row">
    <div class="col-md-8">Main</div>
    <div class="col-md-4">Sidebar</div>
  </div>
</div>

{# Mangrove grid #}
<div class="mg-container">
  <div class="mg-grid mg-grid--col-3">
    <div class="mg-grid__col--span-2">Main</div>
    <div>Sidebar</div>
  </div>
</div>
```

### 4.4 Deliverables

- [ ] Complete Bootstrap usage audit
- [ ] Create any missing Mangrove equivalents
- [ ] Update all templates using Bootstrap classes
- [ ] Remove Bootstrap import from theme
- [ ] Delete Bootstrap SCSS files
- [ ] Verify no Bootstrap classes remain in codebase
- [ ] Update documentation

---

## Class mapping reference

### Display classes

| Legacy (Drupal) | Mangrove | CSS |
|-----------------|----------|-----|
| `.dp-il` | `.mg-u-display--inline` | `display: inline` |
| `.dp-bl` | `.mg-u-display--block` | `display: block` |
| `.dp-ib` | `.mg-u-display--inline-block` | `display: inline-block` |
| `.dp-if` | `.mg-u-display--inline-flex` | `display: inline-flex` |
| `.dp-fl` | `.mg-u-display--flex` | `display: flex` |

### Position classes

| Legacy | Mangrove | CSS |
|--------|----------|-----|
| `.ps-ab` | `.mg-u-position--absolute` | `position: absolute` |
| `.ps-rl` | `.mg-u-position--relative` | `position: relative` |
| `.pr` | `.mg-u-position--relative` | `position: relative` |

### Spacing classes

> Note: Mangrove uses 10px base, so token-100 = 10px, token-150 = 15px, etc.

| Legacy | Mangrove | Pixel | Token (10px base) |
|--------|----------|-------|-------------------|
| `.mt-0` | `.mg-u-margin-top-0` | 0 | 0 |
| `.mt-10` | `.mg-u-margin-top-100` | 10px | 1rem (10px) ✓ |
| `.mt-15` | `.mg-u-margin-top-150` | 15px | 1.5rem (15px) ✓ |
| `.mt-20` | `.mg-u-margin-top-200` | 20px | 2rem (20px) ✓ |
| `.mt-25` | `.mg-u-margin-top-250` | 25px | 2.4rem (24px) |
| `.mt-30` | `.mg-u-margin-top-300` | 30px | 3rem (30px) ✓ |
| `.mt-35` | `.mg-u-margin-top-300` | 35px | 3rem (30px) |
| `.mt-40` | `.mg-u-margin-top-400` | 40px | 5rem (50px) |

*Same pattern applies for `margin-right`, `margin-bottom`, `margin-left`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left`*

### Color classes

| Legacy | Mangrove |
|--------|----------|
| `.bg-c--bp` | `.mg-u-background-color--blue-900` |
| `.bg-c--bs` | `.mg-u-background-color--blue-500` |
| `.bg-c--333` | `.mg-u-background-color--neutral-900` |
| `.bg-c--garnet` | `.mg-u-background-color--sendai-red` |
| `.bg-c--orange` | `.mg-u-background-color--sendai-orange` |
| `.bg-c--purple` | `.mg-u-background-color--sendai-purple` |
| `.bg-c--turquoise` | `.mg-u-background-color--sendai-turquoise` |
| `.t-c--w` | `.mg-u-color--white` |
| `.t-c--bp` | `.mg-u-color--blue-900` |
| `.t-c--bs` | `.mg-u-color--blue-500` |
| `.t-c--333` | `.mg-u-color--neutral-900` |

### Width classes

| Legacy | Mangrove |
|--------|----------|
| `.w-100` | `.mg-u-width--full` |
| `.w-vw--100` | `.mg-u-width--screen` |
| `.w-vw--75` | (no equivalent - keep custom) |
| `.w-vw--50` | (no equivalent - keep custom) |

### Bootstrap to Mangrove

| Bootstrap | Mangrove |
|-----------|----------|
| `.container` | `.mg-container` |
| `.row` | `.mg-grid` |
| `.col-md-6` | `.mg-grid__col--span-3` (in 6-col grid) |
| `.btn` | `.mg-button` |
| `.btn-primary` | `.mg-button-primary` |
| `.text-center` | `.mg-u-text-align--center` |
| `.hidden-xs` | `.mg-u-display--none` + `.mg-u-display--block--md` |

---

## Migration tooling

### Audit script

**File**: `scripts/audit-drupal-classes.sh`

```bash
#!/bin/bash
# Audit Drupal templates for legacy utility classes

DRUPAL_THEME="../../../themes/custom/undrr_common"

echo "=== LEGACY CLASS AUDIT ==="
echo ""

echo "## Display classes"
grep -rn --include="*.twig" "dp-il\|dp-bl\|dp-ib\|dp-fl\|dp-if" "$DRUPAL_THEME/templates/" | wc -l
echo "instances found"

echo ""
echo "## Spacing classes (margin)"
grep -rn --include="*.twig" "mt-[0-9]\|mr-[0-9]\|mb-[0-9]\|ml-[0-9]" "$DRUPAL_THEME/templates/" | wc -l
echo "instances found"

echo ""
echo "## Spacing classes (padding)"
grep -rn --include="*.twig" "pt-[0-9]\|pr-[0-9]\|pb-[0-9]\|pl-[0-9]" "$DRUPAL_THEME/templates/" | wc -l
echo "instances found"

echo ""
echo "## Color classes"
grep -rn --include="*.twig" "bg-c--\|t-c--" "$DRUPAL_THEME/templates/" | wc -l
echo "instances found"

echo ""
echo "## Bootstrap classes"
grep -rn --include="*.twig" "col-xs-\|col-sm-\|col-md-\|col-lg-" "$DRUPAL_THEME/templates/" | wc -l
echo "instances found"

echo ""
echo "=== DETAILED RESULTS ==="
echo ""
echo "### Files with legacy display classes:"
grep -rln --include="*.twig" "dp-il\|dp-bl\|dp-ib\|dp-fl\|dp-if" "$DRUPAL_THEME/templates/"

echo ""
echo "### Files with legacy spacing classes:"
grep -rln --include="*.twig" "\bm[trbl]-[0-9]\|\bp[trbl]-[0-9]" "$DRUPAL_THEME/templates/"
```

### Migration helper (find and replace)

**File**: `scripts/migrate-classes.js`

```javascript
#!/usr/bin/env node
/**
 * Migrate legacy Drupal classes to Mangrove utilities
 * Usage: node migrate-classes.js <file.twig>
 */

const fs = require('fs');

const mappings = {
  // Display
  'dp-il': 'mg-u-display--inline',
  'dp-bl': 'mg-u-display--block',
  'dp-ib': 'mg-u-display--inline-block',
  'dp-if': 'mg-u-display--inline-flex',
  'dp-fl': 'mg-u-display--flex',

  // Position
  'ps-ab': 'mg-u-position--absolute',
  'ps-rl': 'mg-u-position--relative',
  'pr': 'mg-u-position--relative',

  // Margin (Mangrove 10px base: token-100 = 10px, token-150 = 15px, etc.)
  'mt-0': 'mg-u-margin-top-0',
  'mt-10': 'mg-u-margin-top-100',
  'mt-15': 'mg-u-margin-top-150',
  'mt-20': 'mg-u-margin-top-200',
  'mt-25': 'mg-u-margin-top-250',
  'mt-30': 'mg-u-margin-top-300',
  // ... add all margin/padding mappings (see _drupal-compat.scss for full list)

  // Colors
  'bg-c--bp': 'mg-u-background-color--blue-900',
  't-c--w': 'mg-u-color--white',
  // ... add all color mappings
};

function migrateFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  let changes = 0;

  for (const [legacy, mangrove] of Object.entries(mappings)) {
    const regex = new RegExp(`\\b${legacy}\\b`, 'g');
    const matches = content.match(regex);
    if (matches) {
      changes += matches.length;
      content = content.replace(regex, mangrove);
    }
  }

  if (changes > 0) {
    fs.writeFileSync(filepath, content);
    console.log(`✓ ${filepath}: ${changes} classes migrated`);
  } else {
    console.log(`○ ${filepath}: no changes needed`);
  }
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: node migrate-classes.js <file.twig>');
  process.exit(1);
}

migrateFile(file);
```

---

## Risk mitigation

### Visual regression

- Use Chromatic for visual regression testing during migration
- Compare before/after screenshots for each template change
- Flag any unexpected visual changes for review

### Rollback strategy

- Keep `_drupal-compat.scss` until migration is 100% complete
- One commit per template for easy git revert
- Maintain feature branch until phase completion

### Spacing token approximation

Because Mangrove uses a 10px base font size (`html { font-size: 10px }`), most legacy pixel values map very closely to Mangrove tokens:

| Legacy | Mangrove Token | Actual Value | Difference |
|--------|----------------|--------------|------------|
| 10px | `$mg-spacing-100` (1rem) | 10px | ✓ Exact |
| 15px | `$mg-spacing-150` (1.5rem) | 15px | ✓ Exact |
| 20px | `$mg-spacing-200` (2rem) | 20px | ✓ Exact |
| 25px | `$mg-spacing-250` (2.4rem) | 24px | 1px less |
| 30px | `$mg-spacing-300` (3rem) | 30px | ✓ Exact |
| 35px | `$mg-spacing-300` (3rem) | 30px | 5px less |
| 40px | `$mg-spacing-400` (5rem) | 50px | 10px more |

**Decision**: Map to closest token, accepting minor visual shifts. The 10px base means most mappings are exact or within 1-2px, which is imperceptible.

### Testing checklist

For each template migration:

- [ ] Visual comparison (desktop)
- [ ] Visual comparison (tablet)
- [ ] Visual comparison (mobile)
- [ ] RTL layout check
- [ ] Accessibility check (focus states)
- [ ] Browser testing (Chrome, Firefox, Safari, Edge)

---

## Success criteria

### Phase 0 complete when:

- [ ] All 22 undefined classes identified in Appendix C removed from Drupal config
- [ ] Zero references to dead-code classes in `config/sync/*.yml`
- [ ] No visual regressions (expected: none, since classes had no effect)
- [ ] Cleanup committed to version control

### Phase 1 complete when:

- [ ] All utility files created in Mangrove
- [ ] Storybook documentation published
- [ ] Unit tests passing
- [ ] npm package released

### Phase 2 complete when:

- [ ] Drupal compatibility layer working
- [ ] All legacy classes have mappings
- [ ] Drupal theme compiles with new imports
- [ ] No visual regressions in staging

### Phase 3 complete when:

- [ ] All Drupal templates updated
- [ ] `variations.scss` removed from Drupal
- [ ] Zero legacy class usage in templates
- [ ] Visual regression tests passing

### Phase 4 complete when:

- [ ] Bootstrap removed from Drupal theme
- [ ] CSS bundle size reduced by >50%
- [ ] All pages render correctly
- [ ] Documentation updated

### Overall success metrics:

| Metric | Target |
|--------|--------|
| Undefined/dead-code classes removed | 22 (100%) |
| CSS bundle size reduction | >50% |
| Duplicate style definitions | 0 |
| Legacy utility classes in Drupal | 0 |
| Mangrove as single source | 100% |
| Visual regressions | 0 |

---

## Appendix A: Spacing token reference

| Token | Value | Pixels (at 10px base) |
|-------|-------|----------------------|
| `$mg-spacing-0` | 0 | 0px |
| `$mg-spacing-25` | 0.25rem | 2.5px |
| `$mg-spacing-50` | 0.5rem | 5px |
| `$mg-spacing-75` | 0.75rem | 7.5px |
| `$mg-spacing-100` | 1rem | 10px |
| `$mg-spacing-150` | 1.5rem | 15px |
| `$mg-spacing-175` | 1.8rem | 18px |
| `$mg-spacing-200` | 2rem | 20px |
| `$mg-spacing-250` | 2.4rem | 24px |
| `$mg-spacing-300` | 3rem | 30px |
| `$mg-spacing-400` | 5rem | 50px |
| `$mg-spacing-500` | 6rem | 60px |
| `$mg-spacing-600` | 8rem | 80px |
| `$mg-spacing-800` | 10rem | 100px |
| `$mg-spacing-1000` | 40rem | 400px |

> **Note**: Mangrove uses a 10px base font size (`html { font-size: 10px }`), so 1rem = 10px.

## Appendix B: Breakpoint reference

| Name | Variable | Value | Usage |
|------|----------|-------|-------|
| Mobile | `$mg-breakpoint-mobile` | 480px | Small phones |
| Tablet | `$mg-breakpoint-tablet` | 900px | Tablets and small laptops |
| Desktop | `$mg-breakpoint-desktop` | 1164px | Standard desktop |
| Desktop wide | `$mg-breakpoint-desktop-wide` | 1440px | Large monitors |

---

## Pull request description

Use this template when creating the PR for this migration plan:

---

### PR title

```
docs: add Drupal to Mangrove style migration plan
```

### PR body

```markdown
## Summary

This PR adds a comprehensive migration plan for consolidating utility styles between the Mangrove component library and the Drupal theme (`undrr_common`).

### The problem

Currently, styling is split across two locations:
- **Mangrove**: Higher-order React components with strong design tokens but limited utility classes
- **Drupal theme**: ~1,175 lines of utility classes in `variations.scss` plus Bootstrap 3.3.7

This creates style drift, duplicate maintenance, and Bootstrap legacy debt.

### The solution

A four-phase migration to establish Mangrove as the **single source of truth**:

1. **Phase 1**: Add comprehensive utility classes to Mangrove (spacing, display, flexbox, typography, borders, shadows, position, sizing)
2. **Phase 2**: Create backward-compatibility bridge layer for gradual migration
3. **Phase 3**: Migrate Drupal templates to use Mangrove classes
4. **Phase 4**: Remove Bootstrap 3.3.7 and legacy utilities

### Key decisions

- **Naming convention**: Full property names for clarity (e.g., `mg-u-margin-top-200` not `mg-u-mt-200`)
- **Spacing mapping**: Map legacy pixel values to closest Mangrove token (10px base makes most mappings exact)
- **Responsive utilities**: Support `--sm`, `--md`, `--lg`, `--xl` breakpoint suffixes
- **Bootstrap removal**: Complete removal as part of Phase 4

### What's in this PR

- `DRUPAL_MIGRATION_PLAN.md`: Detailed migration strategy with:
  - Current state analysis
  - Four-phase implementation plan
  - Complete class mapping reference
  - Migration tooling (audit scripts, find/replace helper)
  - Risk mitigation strategies
  - Success criteria

## Test plan

- [ ] Review migration plan for completeness
- [ ] Validate spacing token mappings against Mangrove `_variables.scss`
- [ ] Confirm naming conventions align with existing Mangrove patterns
- [ ] Verify breakpoint values match Mangrove configuration

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

---

## Appendix C: Complete Drupal class audit

This appendix documents ALL utility classes found in the Drupal theme and config exports.

### Critical findings

#### 1. Classes used in config but NOT defined in SCSS — DO NOT MIGRATE

The following classes are referenced in Drupal entity view display configs but have **no corresponding CSS definitions**. These are effectively dead code — they have no visual effect on the site.

> **⛔ DO NOT CREATE MANGROVE EQUIVALENTS FOR THESE CLASSES.**
>
> These classes should be **removed from Drupal config** as a prerequisite cleanup task before migration begins. Creating Mangrove equivalents would be counterproductive — it would formalize technical debt rather than eliminating it.

**Semantic classes (never implemented) — REMOVE FROM CONFIG:**
| Class | Usage count | Purpose (inferred) | Action |
|-------|-------------|-------------------|--------|
| `g-lb--up` | 12 | Group label uppercase? | ❌ Remove from config |
| `g-lb--bd` | 12 | Group label bold? | ❌ Remove from config |
| `g-lb--cnd` | 13 | Group label condensed? | ❌ Remove from config |
| `g-lb--sz--14` | 12 | Group label size 14px? | ❌ Remove from config |
| `t-cnd` | 8+ | Text condensed | ❌ Remove from config |
| `t-wg--rg` | 3 | Text weight regular | ❌ Remove from config |
| `t-alg--right` | 4 | Text align right | ❌ Remove from config |
| `t-sz--12` | 1 | Text size 12px | ❌ Remove from config |
| `t-sz--16` | 1 | Text size 16px | ❌ Remove from config |
| `t-w--m` | 1 | Text weight medium | ❌ Remove from config |
| `t-up` | 1 | Text uppercase | ❌ Remove from config |
| `dv-v--tp` | 8 | Div vertical align top? | ❌ Remove from config |
| `fl-comma` | 1 | Field comma separated | ❌ Remove from config |
| `st-sht` | 4 | Style short? | ❌ Remove from config |
| `st-bks` | 1 | Style books? | ❌ Remove from config |
| `ps-ab--b--0` | 1 | Position absolute bottom 0 | ❌ Remove from config |
| `ps-ab--l--0` | 1 | Position absolute left 0 | ❌ Remove from config |

**Missing padding utilities — REMOVE FROM CONFIG:**
| Class | Usage count | Status | Action |
|-------|-------------|--------|--------|
| `pt-5` | 1 | NOT DEFINED | ❌ Remove from config |
| `pt-10` | 1 | NOT DEFINED | ❌ Remove from config |
| `pb-5` | 1 | NOT DEFINED | ❌ Remove from config |
| `pb-40` | 1 | NOT DEFINED | ❌ Remove from config |
| `bg-c--333--70` | 1 | NOT DEFINED (color with 70% opacity) | ❌ Remove from config |

### Pre-migration cleanup task

Before beginning Phase 1, the following Drupal config files must be audited and cleaned:

```bash
# Find all config files referencing undefined classes
grep -rn "g-lb--up\|g-lb--bd\|g-lb--cnd\|g-lb--sz--14\|t-cnd\|t-wg--rg\|t-alg--right" \
  config/sync/*.yml

grep -rn "t-sz--12\|t-sz--16\|t-w--m\|t-up\|dv-v--tp\|fl-comma\|st-sht\|st-bks" \
  config/sync/*.yml

grep -rn "ps-ab--b--0\|ps-ab--l--0\|pt-5\|pt-10\|pb-5\|pb-40\|bg-c--333--70" \
  config/sync/*.yml
```

**Cleanup process:**
1. Export Drupal config (`drush cex`)
2. Search for each undefined class in the exported YAML files
3. Remove the class references from the config
4. Import the cleaned config (`drush cim`)
5. Visually verify no regressions (there shouldn't be any since these classes had no effect)
6. Commit the cleaned config

> **Note**: If any of these classes were *intended* to have styling but were simply never implemented, that's a separate feature request — not a migration task. File a new issue to implement the missing feature using proper Mangrove tokens.

#### 2. Bootstrap grid classes (heavy usage)

Found in **75+ template files** and **20+ config files**:

| Class pattern | Usage count | Replacement needed |
|---------------|-------------|-------------------|
| `.col-xs-*` | 15+ | `.mg-grid__col--span-*` |
| `.col-sm-*` | 10+ | `.mg-grid__col--span-*` |
| `.col-md-*` | 25+ | `.mg-grid__col--span-*` |
| `.col-12` | 5+ | `.mg-grid__col--span-all` |
| `.row` | 50+ | `.mg-grid` |
| `.container` | 10+ | `.mg-container` |
| `.container-fluid` | 5+ | `.mg-container--full-width` |
| `.btn-default` | 14 | `.mg-button` |
| `.btn-primary` | 2 | `.mg-button.mg-button-primary` |

#### 3. Tag/label system (Drupal-specific)

These are custom semantic classes tightly integrated with Drupal field display:

**Tag styling classes:**
| Class | Count | Defined | Purpose |
|-------|-------|---------|---------|
| `.st-tag` | 101 | ✓ Yes | Base tag styling |
| `.st-tag--spl` | 15+ | ✓ Yes | Single tag |
| `.st-tag--mlt` | 10+ | ✓ Yes | Multiple tags |
| `.st-tag--spl--bg_sg` | 3 | ✓ Yes | Sendai garnet background |
| `.st-tag--spl--bg_so` | 2 | ✓ Yes | Sendai orange background |
| `.st-tag--spl--bg_sp` | 5 | ✓ Yes | Sendai purple background |
| `.st-tag--spl--bg_st` | 2 | ✓ Yes | Sendai turquoise background |
| `.st-tag--mlt--bg_bp` | 2 | ✓ Yes | Blue primary background |

**Link/attachment styling:**
| Class | Count | Defined | Purpose |
|-------|-------|---------|---------|
| `.st-lnk` | 8 | ✓ Yes | Styled link |
| `.st-attch` | 1 | ✓ Yes | Attachment styling |
| `.st-attch-mlt` | 1 | ✓ Yes | Multiple attachments |
| `.st-mlt` | 13 | ✓ Yes | Multiple items |

**Group label styling:**
| Class | Count | Defined | Purpose |
|-------|-------|---------|---------|
| `.g-lb--c--333` | 9 | ✓ Yes | Label color #333 |
| `.g-lb--c--w` | - | ✓ Yes | Label color white |
| `.g-lb--c--b` | - | ✓ Yes | Label color black |

#### 4. Display utilities (well defined)

| Class | Count | Defined | Mangrove equivalent |
|-------|-------|---------|-------------------|
| `.dp-ib` | 18 | ✓ Yes | `.mg-u-display--inline-block` |
| `.dp-ib-c` | 12 | ✓ Yes | (custom - children inline-block) |
| `.dp-il` | 2 | ✓ Yes | `.mg-u-display--inline` |
| `.dp-il--imp` | 1 | ✓ Yes | (inline !important) |
| `.dp-fl` | - | ✓ Yes | `.mg-u-display--flex` |
| `.dp-if` | 1 | ✓ Yes | `.mg-u-display--inline-flex` |
| `.dp-bl` | - | ✓ Yes | `.mg-u-display--block` |

#### 5. Spacing utilities (partially defined)

**Margin - DEFINED:**
| Class | Defined | Mangrove equivalent |
|-------|---------|-------------------|
| `.mt-0` | ✓ Yes | `.mg-u-margin-top-0` |
| `.mt-10` | ✓ Yes | `.mg-u-margin-top-100` |
| `.mt-15` | ✓ Yes | `.mg-u-margin-top-150` |
| `.mt-20` | ✓ Yes | `.mg-u-margin-top-200` |
| `.mt-10-neg` | ✓ Yes | `.mg-u-margin-top-negative-100` |
| `.mt-20-neg` | ✓ Yes | `.mg-u-margin-top-negative-200` |
| `.mt-30-neg` | ✓ Yes | `.mg-u-margin-top-negative-300` |
| `.mb-0` | ✓ Yes | `.mg-u-margin-bottom-0` |
| `.mb-8` | ✓ Yes | `.mg-u-margin-bottom-75` |
| `.mb-15` | ✓ Yes | `.mg-u-margin-bottom-150` |
| `.mb-35` | ✓ Yes | `.mg-u-margin-bottom-300` |
| `.ml-11` | ✓ Yes | `.mg-u-margin-left-100` |
| `.ml-12` | ✓ Yes | `.mg-u-margin-left-100` |

**Padding - PARTIALLY DEFINED:**
| Class | Count | Defined | Mangrove equivalent |
|-------|-------|---------|-------------------|
| `.pt-20` | 11 | ✓ Yes | `.mg-u-padding-top-200` |
| `.pt-15` | 1 | ✓ Yes | `.mg-u-padding-top-150` |
| `.pt-10` | 1 | ❌ NO | `.mg-u-padding-top-100` |
| `.pt-5` | 1 | ❌ NO | `.mg-u-padding-top-50` |
| `.pb-20` | 2 | ✓ Yes | `.mg-u-padding-bottom-200` |
| `.pb-15` | 1 | ✓ Yes | `.mg-u-padding-bottom-150` |
| `.pb-10` | 1 | ❌ NO | `.mg-u-padding-bottom-100` |
| `.pb-5` | 1 | ❌ NO | `.mg-u-padding-bottom-50` |
| `.pb-40` | 1 | ❌ NO | `.mg-u-padding-bottom-400` |
| `.pr-25` | 2 | ✓ Yes | `.mg-u-padding-right-250` |
| `.pl-25` | 2 | ✓ Yes | `.mg-u-padding-left-250` |

#### 6. Other utilities

| Class | Count | Defined | Purpose |
|-------|-------|---------|---------|
| `.fl-show` | 8 | ✓ Yes | Show field label with colon |
| `.label-dot` | 1 | ✓ Yes | Add colon after label |
| `.t-lh--n` | 3 | ✓ Yes | Line height normal |
| `.pr` | 2 | ✓ Yes | Position relative |
| `.ps-ab` | 1 | ✓ Yes | Position absolute |
| `.w-100` | 1 | ✓ Yes | Width 100% |
| `.full-w` | 1 | ✓ Yes | Full width images |
| `.pub_image` | 1 | ✓ Yes | Publication image styling |
| `.bc-gr` | 1 | ✓ Yes | Border color grey |
| `.a-cl--333` | 1 | ✓ Yes | Anchor color #333 |
| `.mnm` | 1 | ✓ Yes | Remove paragraph margins |
| `.text-m-center` | 1 | ✓ Yes | Text center on mobile |
| `.rm-m` | 1 | ✓ Yes | Remove margins |

#### 7. Mangrove classes already in use

Some Mangrove classes are already used in Drupal config:

| Class | Count | Notes |
|-------|-------|-------|
| `.mg-card__title` | 29 | Card component |
| `.mg-card__label` | 9 | Card component |
| `.mg-card__image` | 9 | Card component |
| `.mg-card__summary` | 2 | Card component |
| `.mg-card__visual` | 1 | Card component |
| `.mg-u-comma-between` | 3 | Utility class |
| `.mg-container` | 2 | Layout component |
| `.mg-grid` | 2 | Layout component |
| `.mg-button` | 2 | Button component |

### Files requiring migration

**Twig templates with utility classes (17 files):**
1. `templates/view/views-view-unformatted--highlights.html.twig`
2. `templates/view/teaser-4-6-2--node-event-teaser.html.twig`
3. `templates/view/teaser-3-6-3--node-event-teaser.html.twig`
4. `templates/layout/full-content-2-column-9-3-header.html.twig`
5. `templates/layout/full-content-2-column-9-3-header-national-platform.html.twig`
6. `templates/layout/teaser-3-6-3.html.twig`
7. `templates/layout/card-vertical--node-publication-content-card-vertical.html.twig`
8. `templates/layout/full-content-2-column-4-8.html.twig`
9. `templates/layout/teaser-2-10.html.twig`
10. `templates/layout/full-content-1-column.html.twig`
11. `templates/field/field--expert--node--bundle-field--node--landing.html.twig`
12. `templates/field/field--expert--node--bundle-field--node--landing-page-gutenberg.html.twig`
13. `templates/field/field--expert--dynamic-token-field--node-read-the-original-story.html.twig`
14. Plus **75+ templates** with Bootstrap grid classes

**Config files with utility classes (30+ files):**
- `core.entity_view_display.node.*.yml` files
- `views.view.*.yml` files

### Recommendations

1. **Immediate action**: Add missing padding utilities (`pt-5`, `pt-10`, `pb-5`, `pb-10`, `pb-40`) to Mangrove
2. **Investigate**: Determine if undefined semantic classes (`g-lb--up`, `t-cnd`, etc.) are dead code or need implementation
3. **Migration priority**: Start with highest-usage classes (Bootstrap grid, display utilities)
4. **Keep Drupal-specific**: Tag/label system (`st-*`, `g-lb-*`) may need to stay in Drupal theme using Mangrove tokens

---

## Document history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-02 | Claude Code | Initial draft |
| 1.1 | 2026-01-02 | Claude Code | Added Appendix C with complete class audit |
| 1.2 | 2026-01-02 | Claude Code | Added Phase 0 (prerequisite cleanup); marked 22 undefined classes as "do not migrate" with explicit removal instructions |
