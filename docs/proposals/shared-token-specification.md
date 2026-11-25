# Shared Mangrove–Delta Token Specification (Plain-English Annex)

This plain-text specification lists **every token** in the shared [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/) contract, what it means in plain English, its CSS custom property name, and concrete sample values from both brands:

- **Migrated Delta 2027 JSON (clean shared contract):** [`delta-shared-contract.dtcg.tokens.json`](delta-shared-contract.dtcg.tokens.json)
- **Mangrove / UNDRR JSON (clean shared contract):** [`mangrove-shared-contract.dtcg.tokens.json`](mangrove-shared-contract.dtcg.tokens.json)
- **Migration guide for Anders's PoC:** [`delta-poc-migration-guide.md`](delta-poc-migration-guide.md)

> **How to read this document:**
> Use **`semantic.*`**, **`typography.*`**, **`spacing.*`**, **`radius.*`**, **`shadow.*`**, **`motion.*`**, **`layout.*`**, and **`accessibility.*`** in components and feature code. **`primitive.*`** tokens are raw colour palettes that feed `semantic.*` and can change structure per brand.

---

## 1. Semantic Colour Roles (`semantic.*`)

Semantic tokens describe **intent** rather than hue. Every semantic colour exists in both brands and emits `--mg-semantic-*` in Delta 2027 CSS.

### Surfaces & Backgrounds (`semantic.background.*`)

| DTCG path                      | CSS property                        | Plain-English meaning                                                       | Mangrove / UNDRR      | Delta 2027             |
| ------------------------------ | ----------------------------------- | --------------------------------------------------------------------------- | --------------------- | ---------------------- |
| `semantic.background.default`  | `--mg-semantic-background-default`  | Main page canvas behind cards and panels                                    | `#FFFFFF`             | `#FAF9F5` (warm paper) |
| `semantic.background.surface`  | `--mg-semantic-background-surface`  | Raised cards, panels, dialogs, and text inputs                              | `#FFFFFF`             | `#FFFFFF`              |
| `semantic.background.inset`    | `--mg-semantic-background-inset`    | Subtle tinted fill for row hover, current nav item, and tags                | `#F0F3F6`             | `#F0EEE6`              |
| `semantic.background.disabled` | `--mg-semantic-background-disabled` | Fill for disabled inputs, checkboxes, and controls (decoupled from `inset`) | `#E4E7EA`             | `#F0EEE6`              |
| `semantic.background.overlay`  | `--mg-semantic-background-overlay`  | Translucent modal backdrop / scrim behind dialogs                           | `#000000` (85% alpha) | `#111829` (48% alpha)  |
| `semantic.background.toast`    | `--mg-semantic-background-toast`    | Dark high-contrast surface for toast notifications and tooltips             | `#1A1A1A`             | `#1E273B`              |

### Borders & Dividers (`semantic.border.*`)

| DTCG path                 | CSS property                   | Plain-English meaning                                                                               | Mangrove / UNDRR | Delta 2027 |
| ------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------- | ---------------- | ---------- |
| `semantic.border.subtle`  | `--mg-semantic-border-subtle`  | Quiet hairline dividers inside cards, tables, and lists                                             | `#E4E7EA`        | `#ECEAE2`  |
| `semantic.border.default` | `--mg-semantic-border-default` | Standard borders on popovers, dialogs, and grouped containers                                       | `#CACDD0`        | `#E0DDD2`  |
| `semantic.border.strong`  | `--mg-semantic-border-strong`  | High-emphasis borders such as file-upload dashed dropzones                                          | `#B1B4B7`        | `#CFCBBE`  |
| `semantic.border.control` | `--mg-semantic-border-control` | Borders on interactive controls (inputs, selects, secondary buttons) meeting WCAG 1.4.11 (`>= 3:1`) | `#7E8082`        | `#8F8C82`  |

### Text & Ink (`semantic.text.*`)

| DTCG path                 | CSS property                   | Plain-English meaning                                                                                                                         | Mangrove / UNDRR | Delta 2027         |
| ------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------ |
| `semantic.text.primary`   | `--mg-semantic-text-primary`   | Main body copy, headings, labels, and card titles                                                                                             | `#1A1A1A`        | `#141413`          |
| `semantic.text.secondary` | `--mg-semantic-text-secondary` | Supporting copy, table headers, help text, and **readable `<input>` placeholders**                                                            | `#4D4D4D`        | `#5E5D59`          |
| `semantic.text.disabled`  | `--mg-semantic-text-disabled`  | **Disabled controls and decorative cues only.** Never use for placeholders or readable text (renamed from v0.7.2 `semantic.text.placeholder`) | `#666666`        | `#9BA3B8` (2.52:1) |
| `semantic.text.inverse`   | `--mg-semantic-text-inverse`   | White/light text on dark or brand-filled surfaces (primary buttons, toasts, tooltips)                                                         | `#FFFFFF`        | `#FFFFFF`          |

### Actions & Interactive Accents (`semantic.action.*`)

| DTCG path                        | CSS property                           | Plain-English meaning                                                       | Mangrove / UNDRR         | Delta 2027             |
| -------------------------------- | -------------------------------------- | --------------------------------------------------------------------------- | ------------------------ | ---------------------- |
| `semantic.action.default`        | `--mg-semantic-action-default`         | Primary interactive brand colour (primary buttons, links, checked controls) | `#004F91`                | `#2D6FA3`              |
| `semantic.action.hover`          | `--mg-semantic-action-hover`           | Hover state for primary interactive elements                                | `#3372A7`                | `#245A85`              |
| `semantic.action.active`         | `--mg-semantic-action-active`          | Pressed / active state for primary interactive elements                     | `#1A619C`                | `#1A4464`              |
| `semantic.action.disabled`       | `--mg-semantic-action-disabled`        | Fill for disabled primary buttons and disabled checked controls             | `#7E8082`                | `#C4CAD9`              |
| `semantic.action.selected`       | `--mg-semantic-action-selected`        | Soft brand tint for selected table rows or selected tree items              | `#E6EDF4`                | `#E8F1F9`              |
| `semantic.action.secondary`      | `--mg-semantic-action-secondary`       | Secondary brand accent for two-colour brands                                | `#EB752A` (UNDRR orange) | `#007B7A` (UNDRR teal) |
| `semantic.action.secondaryHover` | `--mg-semantic-action-secondary-hover` | Hover state for secondary brand accent                                      | `#ED833F`                | `#006968`              |

### Status Feedback (`semantic.status.*`)

| DTCG path                                  | CSS property                                    | Plain-English meaning                                             | Mangrove / UNDRR | Delta 2027 |
| ------------------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------- | ---------------- | ---------- |
| `semantic.status.positive.text`            | `--mg-semantic-status-positive-text`            | Positive/success dot, icon, and WCAG-readable label colour        | `#0A6969`        | `#146B40`  |
| `semantic.status.positive.background`      | `--mg-semantic-status-positive-background`      | Positive banner/notice background tint                            | `#EDF4F4`        | `#E6F4EC`  |
| `semantic.status.positive.border`          | `--mg-semantic-status-positive-border`          | Positive banner/notice border                                     | `#9BC1C1`        | `#C0E4CE`  |
| `semantic.status.warning.text`             | `--mg-semantic-status-warning-text`             | Warning dot, icon, and readable label colour                      | `#866200`        | `#A85C00`  |
| `semantic.status.warning.background`       | `--mg-semantic-status-warning-background`       | Warning banner/notice background tint                             | `#FDF6D9`        | `#FEF3E2`  |
| `semantic.status.warning.border`           | `--mg-semantic-status-warning-border`           | Warning banner/notice border                                      | `#F4E496`        | `#FDDBA6`  |
| `semantic.status.critical.text`            | `--mg-semantic-status-critical-text`            | Error/destructive dot, icon, field error text, and invalid border | `#C10920`        | `#C8352A`  |
| `semantic.status.critical.background`      | `--mg-semantic-status-critical-background`      | Error banner background tint                                      | `#F9E6E9`        | `#FDECEA`  |
| `semantic.status.critical.border`          | `--mg-semantic-status-critical-border`          | Error banner border                                               | `#ECB5BC`        | `#F9C5C1`  |
| `semantic.status.critical.hover`           | `--mg-semantic-status-critical-hover`           | Hover fill for destructive action buttons                         | `#9B0719`        | `#9C2820`  |
| `semantic.status.informational.text`       | `--mg-semantic-status-informational-text`       | Informational dot, icon, and readable label colour                | `#004F91`        | `#2D6FA3`  |
| `semantic.status.informational.background` | `--mg-semantic-status-informational-background` | Informational banner background tint                              | `#E6EDF4`        | `#E8F1F9`  |
| `semantic.status.informational.border`     | `--mg-semantic-status-informational-border`     | Informational banner border                                       | `#B3CADE`        | `#C8DCF0`  |

### Keyboard Focus (`semantic.focus.*`)

| DTCG path                    | CSS property                       | Plain-English meaning                                                   | Mangrove / UNDRR | Delta 2027 |
| ---------------------------- | ---------------------------------- | ----------------------------------------------------------------------- | ---------------- | ---------- |
| `semantic.focus.ring`        | `--mg-semantic-focus-ring`         | Keyboard `:focus-visible` outline / inset ring colour on light surfaces | `#866200`        | `#2D6FA3`  |
| `semantic.focus.ringInverse` | `--mg-semantic-focus-ring-inverse` | Keyboard `:focus-visible` indicator on dark or brand-filled surfaces    | `#FFFFFF`        | `#FFFFFF`  |

---

## 2. Typography (`typography.*`)

Role-named font sizes (`typography.size.*`) replace pixel-named keys (`typography.scale.14`) so brands with a `16px` body base and brands with a `14px` body base share one contract.

| DTCG path                      | CSS property                         | Type         | Plain-English meaning                                   | Mangrove / UNDRR                                                            | Delta 2027                                    |
| ------------------------------ | ------------------------------------ | ------------ | ------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------- |
| `typography.font.sans`         | `--mg-typography-font-sans`          | `fontFamily` | Primary UI and prose font stack                         | `Roboto, sans-serif`                                                        | `Inter, system-ui, -apple-system, sans-serif` |
| `typography.font.mono`         | `--mg-typography-font-mono`          | `fontFamily` | Monospace font for IDs and record codes                 | `ui-monospace, SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace` | `IBM Plex Mono, Fira Code, monospace`         |
| `typography.size.caption`      | `--mg-typography-size-caption`       | `dimension`  | Captions, timestamps, and format hints                  | `11.25px`                                                                   | `11px`                                        |
| `typography.size.label`        | `--mg-typography-size-label`         | `dimension`  | Table headers, helper text, tags, and small labels      | `12.5px`                                                                    | `12px`                                        |
| `typography.size.body`         | `--mg-typography-size-body`          | `dimension`  | Default UI text, form inputs, buttons, and table cells  | `16px`                                                                      | `14px`                                        |
| `typography.size.subheading`   | `--mg-typography-size-subheading`    | `dimension`  | Card titles, modal headers, and section headings (`h2`) | `18px`                                                                      | `16px`                                        |
| `typography.size.title`        | `--mg-typography-size-title`         | `dimension`  | Top-level page/screen headings (`h1`)                   | `23px`                                                                      | `20px`                                        |
| `typography.size.kpi`          | `--mg-typography-size-kpi`           | `dimension`  | Large KPI numbers (with `tabular-nums`)                 | `32px`                                                                      | `24px`                                        |
| `typography.size.display`      | `--mg-typography-size-display`       | `dimension`  | Hero / large display headlines                          | `40px`                                                                      | `30px`                                        |
| `typography.weight.regular`    | `--mg-typography-weight-regular`     | `fontWeight` | Standard body and button weight                         | `400`                                                                       | `400`                                         |
| `typography.weight.medium`     | `--mg-typography-weight-medium`      | `fontWeight` | Headings, column headers, and emphasis                  | `500`                                                                       | `500`                                         |
| `typography.weight.semibold`   | `--mg-typography-weight-semibold`    | `fontWeight` | Strong UI accents where semi-bold is needed             | `600`                                                                       | `600`                                         |
| `typography.weight.bold`       | `--mg-typography-weight-bold`        | `fontWeight` | Heavy emphasis (editorial headings)                     | `700`                                                                       | `700`                                         |
| `typography.lineHeight.tight`  | `--mg-typography-line-height-tight`  | `number`     | Compact line height for headings, buttons, and labels   | `1.25`                                                                      | `1.25`                                        |
| `typography.lineHeight.normal` | `--mg-typography-line-height-normal` | `number`     | Comfortable reading line height for body copy           | `1.5`                                                                       | `1.5`                                         |

---

## 3. Spacing, Radius, Elevation, Motion, Layout & Accessibility

### Spacing Steps (`spacing.{2xs..3xl}`)

T-shirt steps replace `spacing.1..16` so they never collide with Mangrove's existing `spacing.0..1000` numeric scale.

| DTCG path     | CSS property       | Former Delta v0.7.2 | Plain-English meaning                              | Mangrove / UNDRR | Delta 2027 |
| ------------- | ------------------ | ------------------- | -------------------------------------------------- | ---------------- | ---------- |
| `spacing.2xs` | `--mg-spacing-2xs` | `spacing.1`         | Icon gaps and tight inline adjustments             | `5px`            | `4px`      |
| `spacing.xs`  | `--mg-spacing-xs`  | `spacing.2`         | Badge/chip padding and label-to-icon gaps          | `10px`           | `8px`      |
| `spacing.sm`  | `--mg-spacing-sm`  | `spacing.3`         | Compact control horizontal padding                 | `12.5px`         | `12px`     |
| `spacing.md`  | `--mg-spacing-md`  | `spacing.4`         | Default card/component padding and mobile gutter   | `15px`           | `16px`     |
| `spacing.lg`  | `--mg-spacing-lg`  | `spacing.6`         | Modal padding, section gaps, tablet/desktop gutter | `24px`           | `24px`     |
| `spacing.xl`  | `--mg-spacing-xl`  | `spacing.8`         | Separation between major sections                  | `30px`           | `32px`     |
| `spacing.2xl` | `--mg-spacing-2xl` | `spacing.12`        | Large section breaks                               | `50px`           | `48px`     |
| `spacing.3xl` | `--mg-spacing-3xl` | `spacing.16`        | Page-level vertical separation                     | `60px`           | `64px`     |

### Border Radius (`radius.*`)

| DTCG path     | CSS property       | Plain-English meaning                             | Mangrove / UNDRR | Delta 2027 |
| ------------- | ------------------ | ------------------------------------------------- | ---------------- | ---------- |
| `radius.sm`   | `--mg-radius-sm`   | Small chips, tags, checkboxes, and bar-chart caps | `5px`            | `4px`      |
| `radius.md`   | `--mg-radius-md`   | Buttons, inputs, tooltips, and segmented controls | `5px`            | `6px`      |
| `radius.lg`   | `--mg-radius-lg`   | Cards, notices, message banners, and toasts       | `5px`            | `8px`      |
| `radius.xl`   | `--mg-radius-xl`   | Modals, dialogs, and dropdown menus               | `5px`            | `12px`     |
| `radius.full` | `--mg-radius-full` | Pills, avatars, nav triggers, and status dots     | `9999px`         | `9999px`   |

### Elevation / Shadows (`shadow.*`)

| DTCG path   | CSS property     | Plain-English meaning                        | Mangrove / UNDRR                       | Delta 2027                          |
| ----------- | ---------------- | -------------------------------------------- | -------------------------------------- | ----------------------------------- |
| `shadow.sm` | `--mg-shadow-sm` | Subtle card edge or light elevation          | `0 0 0 1px rgb(77 77 77 / 0.24) inset` | `0 1px 2px 0 rgb(17 24 41 / 0.06)`  |
| `shadow.md` | `--mg-shadow-md` | Dropdown menus, popovers, and chart tooltips | `0 4px 12px 0 rgb(0 0 0 / 0.12)`       | `0 4px 12px 0 rgb(17 24 41 / 0.1)`  |
| `shadow.lg` | `--mg-shadow-lg` | Modal dialogs and high-elevation overlays    | `0 18px 55px 0 rgb(0 0 0 / 0.22)`      | `0 8px 24px 0 rgb(17 24 41 / 0.14)` |

### Motion (`motion.duration.*`, `motion.easing.*`)

| DTCG path                | CSS property                  | Type          | Plain-English meaning                               | Mangrove / UNDRR             | Delta 2027                      |
| ------------------------ | ----------------------------- | ------------- | --------------------------------------------------- | ---------------------------- | ------------------------------- |
| `motion.duration.fast`   | `--mg-motion-duration-fast`   | `duration`    | Hover states, focus rings, and tooltips             | `160ms`                      | `100ms`                         |
| `motion.duration.normal` | `--mg-motion-duration-normal` | `duration`    | Dropdowns, modals, and toasts                       | `300ms`                      | `200ms`                         |
| `motion.duration.slow`   | `--mg-motion-duration-slow`   | `duration`    | Page transitions and large panels                   | `400ms`                      | `300ms`                         |
| `motion.easing.default`  | `--mg-motion-easing-default`  | `cubicBezier` | Standard transition curve (fast out, smooth settle) | `cubic-bezier(0.2, 0, 0, 1)` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `motion.easing.in`       | `--mg-motion-easing-in`       | `cubicBezier` | Elements leaving the screen                         | `cubic-bezier(0.4, 0, 1, 1)` | `cubic-bezier(0.4, 0, 1, 1)`    |
| `motion.easing.out`      | `--mg-motion-easing-out`      | `cubicBezier` | Elements entering the screen                        | `cubic-bezier(0, 0, 0.2, 1)` | `cubic-bezier(0, 0, 0.2, 1)`    |

### Layout & Accessibility (`layout.*`, `accessibility.*`)

| DTCG path                 | CSS property                    | Type        | Plain-English meaning                                  | Mangrove / UNDRR | Delta 2027 |
| ------------------------- | ------------------------------- | ----------- | ------------------------------------------------------ | ---------------- | ---------- |
| `layout.maxWidth`         | `--mg-layout-max-width`         | `dimension` | Maximum page content container width                   | `1440px`         | `1280px`   |
| `accessibility.targetMin` | `--mg-accessibility-target-min` | `dimension` | Minimum clickable target size (WCAG 2.5.8 Target Size) | `24px`           | `24px`     |

---

## 4. Primitive Palettes (`primitive.*`)

Primitives are raw colour ramps used internally by `semantic.*`. They are marked `private: true` in CSS builds and are **not** intended for direct component styling.

- **`primitive.neutral.{50, 100..1100}`** — Neutral slate/grey scale (`#F0F3F6`..`#000000` in Mangrove; `#F0F3F6`/`#F7F8FA`..`#080C17` in Delta 2027).
- **`primitive.surface.{50, 100, 200, 300, 400, 700, 1000}`** _(renamed from `primitive.warm.*`)_ — Surface & ink ramp (`#F0F3F6`..`#1A1A1A` cool neutrals in Mangrove; `#FAF9F5`..`#141413` warm neutrals in Delta 2027).
- **`primitive.brand.primary.{100, 200, [300..500], 600, 700, 800, [900..1100]}`** _(renamed from `primitive.accent.*`)_ — Primary brand ramp (`#004F91` UNDRR blue at `600` in Mangrove; `#2D6FA3` Delta blue at `600` in Delta 2027). Delta 2027 includes the full 11-step `100..1100` scale; Mangrove defines steps `100, 200, 600, 700, 800`.
- **`primitive.brand.secondary.{600, 700}`** — Secondary brand colour (`#EB752A` / `#ED833F` UNDRR orange in Mangrove; `#007B7A` / `#006968` UNDRR teal in Delta 2027).
- **`primitive.green.{100, 200, 500, 600, 700}`**, **`primitive.amber.{100, 200, 500, 600, 700}`**, **`primitive.red.{100, 200, 500, 600, 700}`** — Status colour ramps backing `semantic.status.*`.
