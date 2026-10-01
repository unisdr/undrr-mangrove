# Brief: Mangrove form controls in Figma

Give this to Figma's AI (First Draft or Make) or to a designer, in a file where the Mangrove variables are already imported (see [README.md](README.md)). The brief is written so that every visual value comes from a variable. A component that hard-codes a hex value or a pixel size is wrong, even if it looks right.

## Context

Mangrove is the UNDRR design system. One component library serves five brands: UNDRR, PreventionWeb, IRP, MCR2030 and DELTA Resilience. In code, a brand is a CSS class that re-values the same custom properties. In Figma, the **Mangrove** variable collection has one mode per brand. Build every component once, bound to variables, and the brand is chosen by setting the frame's variable mode. Never make per-brand copies of a component.

## Rules

1. Bind every fill, stroke, radius, gap, padding, font size and font family to a variable from the **Mangrove** collection. Do not type raw values.
2. Prefer the most specific variable: `control/*` for form controls, then component variables (`color/button-background`, `radius/form-input`), then the general scale (`spacing/*`, `font-size/*`). Do not reach for primitives such as `color/blue-900`.
3. Use auto layout everywhere. Bind horizontal padding to the `/inline` variable and vertical padding to the `/block` variable.
4. Use logical, direction-neutral layouts. The kit must also work right to left for Arabic, so do not put meaning in "left" and "right".
5. Name layers and variants after Mangrove's classes so developers can map them: `mg-combobox`, `mg-combobox__input`, `mg-button-primary`, and so on.
6. Text: `font-family/text` (Roboto) for body and controls, and `font-family/ui` (Roboto Condensed) where a component uses the UI role.
7. Every interactive component needs a visible focus state: a 2-band ring with an inner `color/neutral-0` band of `focus-ring/offset` width, then a `color/focus-ring` outline of `focus-ring/width`.

## Components

### ComboBox (`mg-combobox`)

A searchable single choice: a text input with a toggle button, and a popover listing options.

- **Label**: `font-size/300`, `control/text`, gap below it of `spacing/25`.
- **Control row**: a horizontal auto layout of Input and Trigger with no gap.
  - **Input**: fill `control/surface`; stroke `control/border` at `form-input/border-width`; radius `radius/form-input` on the start corners only; min height `form-input/block-size`; padding `form-input/padding`; text `control/text` at `font-size/form-input`; placeholder `control/muted-text`. Fills the remaining width; whole component max width 448.
  - **Trigger**: fill `control/surface`; same stroke with no start-side border; radius `radius/form-input` on the end corners only; min width 44; a chevron icon in `control/text`.
- **Popover**: fill `control/surface-focus`; 1px stroke `control/border`; radius `radius/form-input`; padding `spacing/25`; same width as the control row; max height 320 with scroll; a subtle raised shadow (the shadow is not a variable yet).
- **Option**: padding `spacing/100`; radius `radius/form-input`; text `control/text`.
- **Error message**: `control/error`, `font-size/200`, gap above it of `spacing/25`.

Variant properties:

- `State`: Default, Hover, Focused, Open, Invalid, Disabled.
  - Focused: Input fill `control/surface-focus`, stroke `control/border-focus`, focus ring.
  - Invalid: Input stroke `control/error`, error message shown.
  - Disabled: whole component at 55% opacity.
- Option `State`: Default, Hover (fill `control/option-hover`), Selected (fill `control/option-selected`, semibold), Focus-visible (inset focus ring).

### Button (`mg-button`)

- Base: radius `radius/button`; padding `padding/button/block` and `padding/button/inline`; text `font-size/button`, `font-family/text`; stroke `border-width/button`; icon gap `spacing/50`.
- `Variant`:
  - Primary: fill `color/button-background`, text `color/button`, stroke `border-color/button-primary`. Hover fill `color/button-background--hover`.
  - Secondary: fill `color/button-secondary-background`, text `color/button`, stroke `border-color/button-secondary`. Hover fill `color/button-secondary-background--hover`.
  - Outline: no fill; stroke and text `color/button-outline-primary`. Hover fill `color/button-outline-primary--hover`.
- `State`: Default, Hover, Focus (focus ring), Disabled.
- `Icon`: none, leading, icon-only.

### Text input (`mg-form-input`)

Same anatomy as the ComboBox input on its own, with full radius, `form-input/background` and `form-input/border-color`, and the same states.

### Tabs (`mg-tabs`)

A horizontal row of tab triggers.

- Trigger: padding `tab/padding/block` and `tab/padding/inline`; min height `tab/min-block-size`; text `font-size/tab`.
- Inactive: fill `color/tab-background--inactive`, text `color/text-tab`.
- Hover: fill `color/tab-background--hover`, text `color/text-tab--hover`, border `color/tab-border--hover`.
- Active: fill `color/tab-background`, text `color/text-tab-active`, indicator `color/tab-border--active` of `tab/indicator-size`.

## Check before handing back

- Switch the page between the five modes. Every component must re-theme with no detached values.
- Select each layer and confirm Dev Mode shows a `var(--mg-...)` code name, not a raw value.
- Check text contrast on every state in every mode. PreventionWeb and DELTA use different interactive colours from UNDRR.
