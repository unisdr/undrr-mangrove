# Brief: Mangrove form controls in Figma

Build native, reusable components in the file holding Mangrove variables. Follow the current source and its CSS cascade. The exporter owns values and the plugin owns construction. See [README.md](README.md) for importing and [LEARNINGS.md](LEARNINGS.md) for observations and remaining checks.

## Foundations and rules

Mangrove serves five brands through shared structure: UNDRR, PreventionWeb, IRP, MCR2030 and DELTA Resilience. Build every component once. On Starter, import one brand and re-import another to switch the file. On a paid team file with sufficient modes, use brand modes.

1. Bind component fills, strokes, padding, gaps, radii, geometry, font family and font size to exported variables and styles. Prefer the actual source role even where another role currently has the same value.
2. Source literals belong in exporter recipes with source references. Trigger width, disabled opacity and line-height ratios must not become unexplained plugin constants. Derived helpers are permitted when CSS has no public token.
3. Use auto layout and preserve transparent borders where CSS allocates space for them. Specimen-board spacing is separate from component dimensions.
4. Preserve component, variable, style and layer identities on updates. Review instances and their labels are editable.
5. Name anatomy after source classes, such as `mg-combobox__trigger` and `mg-tabs__rail`. Variant names describe properties rather than brands.
6. Mirror logical start and end for right-to-left layouts. The first scaffold is Latin and left to right; it does not establish Arabic typography.
7. Place focus on the actual focused element. Use outward `Mangrove/focus-ring` or inward `Mangrove/focus-ring-inset` according to source, then verify geometry and clipping on actual nodes.

Regular foundations have automatic line height. Component typography needs explicit source weights and line heights. Buttons request CSS 600 and line height 100%; tabs request CSS 600 and 142.1%. Bundled Roboto and Roboto Condensed assets lack 600 faces, so Bold 700 is an inferred matching candidate. Confirm it against rendered stories. Report missing or unloadable fonts without substituting another family.

Body line height is 1.5em on a 16px body, computing 24px. Descendants can inherit that fixed computed length even when smaller. Component help and ComboBox errors must preserve that inheritance; applying 150% to their 12.5px text would produce a different line height. Browser-native TextInput defaults still require a computed-style check.

## Button (`mg-button`)

Source: [cta-button.scss](../../stories/Components/Buttons/CtaButton/cta-button.scss) and [CtaButton.jsx](../../stories/Components/Buttons/CtaButton/CtaButton.jsx).

| Treatment/state           | Fill                                | Text                                   | Stroke                          |
| ------------------------- | ----------------------------------- | -------------------------------------- | ------------------------------- |
| Filled primary            | `color/button-background`           | `color/button`                         | `border-color/button-primary`   |
| Filled secondary          | `color/button-secondary-background` | `color/button`                         | `border-color/button-secondary` |
| Filled hover              | Corresponding background `--hover`  | `color/button`                         | Corresponding filled border     |
| Outline primary/secondary | Transparent                         | Corresponding `color/button-outline-*` | Same outline role               |
| Outline hover             | Corresponding outline `--hover`     | `color/button`                         | Same outline role               |
| Disabled                  | `color/neutral-500`                 | `color/neutral-0`                      | Transparent                     |

Base geometry uses `radius/button`, `padding/button/block`, `padding/button/inline`, `border-width/button` and `spacing/50` gap. Text uses `font-family/text` and `font-size/button`. Focus adds the outward two-band ring. Filled buttons use the shared effect; outlined focused buttons use source-backed native stroke decorations when the unfilled frame cannot render shadow spread. Verify both representations on actual nodes.

Initial matrix: `Emphasis=Primary|Secondary`, `Treatment=Filled|Outline`, `State=Default|Hover|Focus|Disabled`, 16 variants. Expose Label as a text property.

Conventional Button has no explicit nowrap, clipping or width-limit rule. Keep the default HUG label and test wrapping in a finite-width review instance separately. The source does not impose 44px minimum height on conventional buttons. Default UNDRR height is approximately 36px including border. Record proposed accessibility changes separately from source fidelity. Editorial CTA, standalone ghost, icon-only 36px and compact 28px controls are separate later families. Optional icons are deferred; use existing paths from [icon definitions](../../stories/Atom/Icons/_icon-definitions.scss) when adding them.

## Text input (`mg-form-input`)

Source: [form base](../../stories/Components/Forms/_form-base.scss) and [TextInput.jsx](../../stories/Components/Forms/TextInput/TextInput.jsx).

- Base: `form-input/background`, `form-input/border-color`, `form-input/border-width`, `form-input/block-size`, `form-input/padding`, `radius/form-input`; text `font-family/text`, `font-size/form-input`.
- Label: `font-size/300`, gap `spacing/25`. Required adds source ` *` in `color/red-900`.
- Placeholder: `color/neutral-500`.
- Filled: `form-input/background--focus`. CSS requires a placeholder attribute and nonempty value.
- Focus: focus background, `color/form-focus` border and outward focus effect.
- Invalid: `color/red-900` border. InvalidFocused uses `color/form-focus` because the source focus selector has greater specificity; the error message stays red and the focus effect remains visible. Record any proposed change to that source behaviour separately.
- Disabled: white fill; label, input text, placeholder and border `color/neutral-400`. No root opacity reduction.
- Help: `font-size/200`, `color/neutral-500`, gap `spacing/25`.
- Error: `font-size/300`, `color/red-900`, gap `spacing/25`. This size differs from ComboBox error.

Initial matrix: `State=Default|Filled|Focused|Invalid|InvalidFocused|Disabled`, six variants. Expose label, value, help and error text, with booleans for label, help and required-marker visibility. Hover has no separate source treatment. Browser-native date and other input affordances remain outside this first family.

## ComboBox (`mg-combobox`)

Source: [ComboBox SCSS](../../stories/assets/scss/aria/_combo-box.scss) and [ComboBox.jsx](../../stories/Components/Forms/ComboBox/ComboBox.jsx).

- Root: `font-family/text`, `control/text`; source max width 28rem, 448px at the default root size.
- Label: `font-size/300`, lower gap `spacing/25`.
- Input: `control/surface`, `control/border`, `control/text`, placeholder `control/muted-text`; `form-input/border-width`, `form-input/block-size` as minimum height, `form-input/padding`, start-side `radius/form-input` corners.
- Input uses `font: inherit`. Its normal body-context size is `font-size/300`, not an explicit `font-size/form-input` declaration.
- Trigger: matching fill and stroke; no start border; end corners only; source minimum width 2.75rem, 44px. Render the actual `▾` text glyph.
- InputFocused changes input fill to `control/surface-focus`, stroke to `control/border-focus`, with outward focus on the input. TriggerFocused puts a separate outward ring on the trigger.
- Invalid changes input border only to `control/error`. Disabled applies 0.55 root opacity.
- Popover: `control/surface-focus`, `control/border`, source 1px border, `radius/form-input`, `spacing/25` padding, inset `Mangrove/shadow/raised`. There is no elevated drop shadow in source.
- Popover width follows the trigger row with viewport constraints; height caps at `min(20rem, 60vh)` rather than unconditional 320px.
- Options: `spacing/100` padding, `radius/form-input`, `control/text`; hover or keyboard focus uses `control/option-hover`; selection uses `control/option-selected` and requested weight 600. Selection fill wins over hover. FocusVisible uses the inset two-band effect.
- Error: `font-size/200`, `control/error`, gap `spacing/25`. Help follows shared form-help source.

Initial matrix: `State=Default|InputFocused|TriggerFocused|Open|Invalid|Disabled`, six variants. Option matrix: `Selected=False|True`, `State=Default|Hover|FocusVisible`, six variants. Compose the open specimen from option instances.

A first open specimen can show the popover in flow to expose anatomy. Mark that approximation. React Aria manages runtime overlay positioning, portals, filtering, scrolling and focus; native component construction does not prove those behaviours.

## Current horizontal Tabs (`mg-tabs--horizontal`)

Source: [Tab.jsx](../../stories/Components/Tab/Tab.jsx), [tab.scss](../../stories/Components/Tab/tab.scss) and [tab roles](../../stories/assets/scss/_tokens-tabs.scss).

Current React markup renders a rounded pill rail. Horizontal selectors override earlier legacy filled tabs and underlines. Do not use legacy `color/tab-background`, `color/text-tab*` or `tab/indicator-size` to approximate it.

- Rail: `tab/rail-background`, `tab/rail-border`, source 1px border, `tab/rail-padding`, `tab/rail-gap`. Padding resolves `max(var(--mg-spacing-75), calc(var(--mg-focus-ring-offset) + var(--mg-focus-ring-width) + 1px))`, currently 7.5px. Rail radius is `tab/radius + tab/rail-padding`, currently 37.5px.
- Trigger: `tab/radius`, currently 30px; `spacing/75` vertical and `spacing/150` horizontal padding; `tab/min-block-size`; `font-family/ui`, `font-size/tab`, requested weight 600 and line height 142.1%.
- Inactive: transparent fill/border, `tab/color` text.
- Hover: `tab/background--hover`, interactive at 0.06 alpha; `tab/color--hover` text.
- Selected: `tab/background--active`, interactive at 0.12 alpha; full 1px `tab/indicator--active` border; `tab/color--active` text. Selected hover keeps this appearance.
- Focus: outward two-band ring represented by opaque native stroke decorations for both selected and inactive triggers. An absent or translucent fill must not mask the focus bands. The outer radius helper follows `tab/radius` plus `focus-ring/offset`. Panel separation follows `tab/panel-gap`.

Trigger matrix: `Selected=False|True`, `State=Default|Hover|Focus`, six variants. Compose three editable trigger instances into a rail. Panel content, scroll overflow fades and responsive stacked disclosures are later scaffolds. Stacked tabs use neutral disclosures with plus/minus markers rather than vertically rearranged pills.

## Acceptance before expanding

- Confirm native sets, variants, instances and editable properties.
- Re-import and verify stable identities and preserved instance overrides.
- Check long labels, narrow widths, transparent-border sizing and focus on filled nodes, including ordering and ancestor clipping.
- Compare each state with rendered Storybook source, exact font loading, browser font matching and computed line heights.
- Re-import each brand on Starter or inspect all modes on a capable file. Check colour bindings, alpha composition and contrast on actual surfaces.
- Treat direction checks separately from Arabic fonts. Code maps Arabic text/UI to Noto Sans Arabic and heading/display to Noto Kufi Arabic; those routes are not yet exported.
- Record source facts, API documentation, mock checks and real Figma observations separately. Native construction has been observed; visual acceptance remains pending for the full state and theme matrix. See the dated learnings for exact checks.
