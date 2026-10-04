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

Regular foundations have automatic line height. Component typography needs explicit source weights and line heights; keep component styles out of the default foundation selection with `recommended: false`, since the builder imports required family styles. Buttons request CSS 600 and line height 100%; tabs request CSS 600 and 142.1%. Chromium source comparison confirmed bundled Bold 700 for Button, selected options and tabs. Figma font-file equivalence remains unverified. Report missing or unloadable fonts without substituting another family.

Body line height is 1.5em on a 16px body, computing 24px. Component help and ComboBox errors inherit that fixed computed length; applying 150% to their 12.5px text would produce a different line height. TextInput retains vendored Normalize's 115% ratio, observed as 18.4px at 16px. ComboBox uses `font: inherit` and therefore 24px. See [the measured source baseline](LEARNINGS.md#browser-acceptance-measurements).

## Current native checkpoint

On 4 October 2026, the kit export contains 394 variables, 87 text definitions (60 foundations and 27 component styles), eight effects, 23 families and 271 recipe variants. Final native inspection records 39 local text styles, eight effects and 272 components including one historical diagnostic, with no errors. Loader and Compact Empty State add six bounded variants; ordinary repeat created zero nodes and updated 74. All 5,528 preceding inspected IDs survived and a fresh local backup is saved; cloud sync remains unconfirmed. The full text audit matched 561/561 paths, with the same 51 older Tabs-font/editorial-CTA findings; the four newest families' 79 paths added none. Checkbox and FormErrorSummary retain bounded UNDRR observations, including corrected Summary underlining and balanced titles in ordinary and edited long consumers. These counts do not establish complete state, brand or script coverage. See [COMPONENT-INVENTORY.md](COMPONENT-INVENTORY.md).

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
- Filled: `form-input/background--focus`. CSS requires a placeholder attribute and nonempty value. Text binds `component/text-input/browser-fieldtext`, a literal #000000 helper for Chromium's measured user-agent `fieldtext`; Mangrove's `color/black` is #1a1a1a. The source does not declare a text colour role, and other system colours remain unverified.
- Focus: focus background, `color/form-focus` border and outward focus effect.
- Invalid: `color/red-900` border. InvalidFocused uses `color/form-focus` because the source focus selector has greater specificity; the error message stays red and the focus effect remains visible. Record any proposed change to that source behaviour separately.
- Disabled: white fill; label, input text, placeholder and border `color/neutral-400`. No root opacity reduction.
- Help: `font-size/200`, `color/neutral-500`, gap `spacing/25`.
- Error: `font-size/300`, `color/red-900`, gap `spacing/25`. This size differs from ComboBox error.

Initial matrix: `State=Default|Filled|Focused|Invalid|InvalidFocused|Disabled`, six variants. Expose label, value, help and error text, with booleans for label, help and required-marker visibility. Hover has no separate source treatment. Browser-native date and other input affordances remain outside this first family.

The separate required-marker layer does not reproduce the source inline `::after` position on a wrapping label. The current HUG label geometry also needs a native multiline solution. Record narrow required labels as an acceptance gap; changing the label to FILL alone places the marker beside the block rather than after its final word.

## Textarea (`mg-form-textarea`)

Source: [form base](../../stories/Components/Forms/_form-base.scss) and [Textarea.jsx](../../stories/Components/Forms/Textarea/Textarea.jsx). The textarea partial adds no independent styling.

- Reuse TextInput's form-input fills, border roles, padding and radius, Roboto text family and `font-size/form-input`. Normalize's 115% line height remains in effect.
- The JSX defaults to four rows. CSS extends the form input base but overrides its fixed height with `height: auto`, caps width at 100% and allows vertical resizing.
- The initial kit height is `component/textarea/default-block-size`: four rows times the control font size and Normalize ratio, plus two block paddings and two borders. This source formula gives 88.1px. Chromium 153 on macOS measured 88.0625px at 16px/18.4px, 6.25px padding and 1px border because each row is quantized to 18.390625px.
- Value is a top-aligned, wrapping text layer. Entered text uses the measured `component/text-input/browser-fieldtext` helper; placeholder uses `color/neutral-500`. Preserve newlines when editing the Value property.
- Focus and InvalidFocused use the white focus surface, focus-blue border and outward ring. Invalid uses the red border; its error remains red when focused. Disabled uses white fill and neutral-400 label, value, placeholder and border.
- Label, help and errors reuse TextInput's shared source typography and spacing. The separate required-marker layer has the same multiline inline-flow limitation.

Initial matrix: `State=Default|Filled|Focused|Invalid|InvalidFocused|Disabled`, six variants. Expose Label, Value, Help text and Error message, with booleans for label, help, error and required-marker visibility. The initial specimen represents the default four-row height; Rows is not a native numeric component property.

The Figma frame clips excess text but does not reproduce native scrolling, scrollbars, the browser's resize handle or vertical resize behaviour. Native textarea content preserves newlines (`pre-wrap`); compare real multiline edits before accepting the kit representation. The browser baseline is established, while native Figma rendering remains a separate check.

The review page adds one Filled specimen at a 240px consumer width with six explicit lines and a long line that should wrap. Its `Value` and `Required` properties are seeded only on creation so reimport preserves later edits. This specimen exercises wrapping and clipping; required-label inline flow, long help/error text and native rendering still need separate acceptance checks.

## ComboBox (`mg-combobox`)

Source: [ComboBox SCSS](../../stories/assets/scss/aria/_combo-box.scss) and [ComboBox.jsx](../../stories/Components/Forms/ComboBox/ComboBox.jsx).

- Root: `font-family/text`, `control/text`; source max width 28rem, 448px at the default root size.
- Label: `font-size/300`, lower gap `spacing/25`.
- Input: `control/surface`, `control/border`, `control/text`, placeholder `control/muted-text`; `form-input/border-width`, `form-input/block-size` as minimum height, `form-input/padding`, start-side `radius/form-input` corners.
- Input uses `font: inherit`. Its normal body-context size is `font-size/300`, not an explicit `font-size/form-input` declaration.
- Trigger: matching fill and stroke; no start border; end corners only; source minimum width 2.75rem, 44px. Render the actual `▾` text glyph. Chromium used Lucida Grande fallback for that glyph on the tested macOS host; cross-platform glyph equivalence needs inspection.
- InputFocused changes input fill to `control/surface-focus`, stroke to `control/border-focus`, with outward focus on the input. TriggerFocused puts a separate outward ring on the trigger.
- Invalid changes input border only to `control/error`. Disabled applies 0.55 root opacity. Its Figma opacity variable stores 55 percent; the native node property uses 0.55.
- Popover: `control/surface-focus`, `control/border`, source 1px border, `radius/form-input`, `spacing/25` padding, inset `Mangrove/shadow/raised`. There is no elevated drop shadow in source.
- Popover width follows the trigger row with viewport constraints; height caps at `min(20rem, 60vh)` rather than unconditional 320px.
- Options: `spacing/100` padding, `radius/form-input`, `control/text`; hover or keyboard focus uses `control/option-hover`; selection uses `control/option-selected` and requested weight 600. Selection fill wins over hover. FocusVisible uses the inset two-band effect.
- Error: `font-size/200`, `control/error`, gap `spacing/25`. Help follows shared form-help source.

Initial matrix: `State=Default|InputFocused|TriggerFocused|Open|Invalid|Disabled`, six variants. Option matrix: `Selected=False|True`, `State=Default|Hover|FocusVisible`, six variants. Compose the open specimen from option instances and expose their nested properties.

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

Trigger matrix: `Selected=False|True`, `State=Default|Hover|Focus`, six variants. Compose three editable trigger instances into a rail and expose their nested properties. Long-label review should edit an actual trigger; preserve horizontal nowrap behaviour. Panel content, scroll overflow fades and responsive stacked disclosures are later scaffolds. Stacked tabs use neutral disclosures with plus/minus markers rather than vertically rearranged pills.

## Text CTA (`mg-cta`)

Source: [TextCta.jsx](../../stories/Components/TextCta/TextCta.jsx), [text-cta.scss](../../stories/Components/TextCta/text-cta.scss), [font utilities](../../stories/assets/scss/_utility.scss) and the inherited foundational heading rules. Recipes live in `scripts/figma-cta-recipes.cjs`.

The bounded scaffold is primary, stacked, centred and text only, with one conventional primary action. Four short variants use `Tone=Soft|Strong` and `Viewport=Desktop|Mobile`; two Strong/Long presets use Mobile320 and Narrow240. All six share editable Headline/Body and expose a native Button instance with Label. The default Storybook example uses the separate editorial CTA action, so this is a conventional-action composition rather than a claim to mirror every story or JSX default.

Default Latin headings inherit Roboto, with Bold 32px/40px desktop and Bold 23px/28.75px mobile. The heading utility sets the 1.25 line-height ratio; do not use Condensed because a generic heading assumption suggests it. Headline uses native BALANCE wrapping. Body is Regular 16px/24px. Padding remains 50px, with 10px container gutters and an 800px body maximum. Desktop 720 is a component inside a desktop viewport; it is not an automatic Figma breakpoint.

Strong uses hero background, white headline and neutral-0 body at 0.9 alpha. Its native Button overrides fill to neutral-0, border to neutral-0 at 0.72 alpha and Label to hero. Soft composites the source 8% hero wash over neutral-0 and reuses ordinary primary Button paints. Aliases cannot change alpha, so casts are exporter-owned RGBA helpers. All paints remain bound.

Long master actions have 200px and 120px widths; their Label inherits FILL with automatic height. These are deliberate source-measured presets because resizing nested actions below a consumer instance was not reliable in real Figma. The desktop check measured actions 200 × 64px and 120 × 106px with unclipped wrapping. Main short actions retain HUG labels. Arbitrary consumer resizing, extra actions, secondary accent/rule treatment, rich text, media, editorial badges, interactive states and Arabic routing remain later work. Exact font-file equivalence and Figma/Chromium line breaks remain separate checks.

## Table (`mg-table`)

Source: [TableTag](../../stories/Atom/Table/Table.jsx), [table.scss](../../stories/Atom/Table/table.scss), [shared border placeholders](../../stories/assets/scss/_mixins.scss) and [body typography](../../stories/assets/scss/_foundational.scss).

- The current React source renders three header cells and four body rows. `text` repeats in all headers, `tdtext` repeats in the first two body columns, and `details` fills the third column.
- Source options are `Default|Striped|Border` and `Large|Small`. The initial scope excludes the separate data-table selectors, sorting, pagination, sticky headers and responsive stacked/scroll behaviour.
- Cells use `font-family/text`, logical start alignment and top alignment. Large uses `font-size/300`, line height 140%, `spacing/100` block and `spacing/150` inline padding. Small uses `font-size/250`, line height 140%, `spacing/50` block and `spacing/100` inline padding.
- Headers request weight 600. Chromium 153 on macOS matched the bundled custom Roboto Bold face; body cells matched Roboto Regular 400. Figma font-file equivalence remains unverified.
- Default body rows have a 1px `color/neutral-400` bottom divider. Striped removes those borders and fills body rows two and four with `color/neutral-25`. Border uses collapsed 1px `color/neutral-400` cell borders; adjacent native strokes must not produce doubled seams.
- Short `Header`, `Value`, `Details` source content at 720px has equal columns. Large table heights measured 215.953125px Default, 211.953125px Striped and 217.953125px Border; Small measured 151.96875px, 147.96875px and 153.96875px. Browser line quantization and collapsed half-border allocation affect exact bounds.
- Actual Storybook English content produces unequal columns. At 720px, Large Default columns are 131.78125px, 131.78125px and 456.4375px; Small Default columns are 120.6875px, 120.6875px and 478.625px. Column widths must agree across the header and every body row.
- In a 240px region, actual Large source content overflows to 292.703125px Default or 296.703125px Border. The universal foundational rule gives cells `overflow-wrap: break-word` even though the table declares `anywhere`. A native equal-column layout does not reproduce HTML's automatic minimum-content sizing.

The native inventory is four Header cell variants and four Body cell variants (`Size=Large|Small`, `Border=None|Grid`), 24 Row variants and eight composed Table variants. The original 18 Rows use `Size`, `Treatment=Default|Striped|Border`, `Role=Header|Odd|Even` and `Columns=Equal`; six additional Large Default Rows use measured `Columns=Story|NarrowStory`. The original six Tables use `Content=Short`; two additional Large Default Tables use `Content=Story|NarrowStory`. These content/column axes are finite Figma specimen presets, not new React or CSS variants. Rows and tables expose their nested instances; each cell has an editable `Label`. The source's repeated props seed matching text, while native cell edits are independent.

Short-content main construction uses the builder's finite 320px width; short-content review instances use 720px. Equal short-content rows keep fixed heights and filling cells; longer edits can overflow, including in Border variants whose vertical seams require stretched cells. Story masters have measured 720px outer width, while NarrowStory masters have measured 292.703125px outer width. Their Default rows and cells hug text from the top, with each measured browser row height bound as a Figma minimum. These minimums are a content-preserving translation, not authored CSS `min-height` declarations. Source collapsed-border allocation uses adjacent half strokes for grid seams, centered Default row dividers and the first body's different allocation. Arbitrary native column resizing and HTML automatic column sizing remain unsupported.

The composed review deliberately disables generic root `Label` seeding because Table and Row have no such property. Explicit Large Default examples select the Story/NarrowStory Table masters and seed real nested text only: one 720px table and one 240px consumer region with the measured 292.703125px outer table. Row masters share the measured column widths across all five rows. Text seeds fresh specimens only; reimport preserves designer text edits. Geometry writes below nested Table instances were silently ignored in real Figma, despite passing the previous mock. Dedicated measured masters replace that approach without detaching instances. These dated presets do not implement the native browser table-sizing algorithm.

Browser measurements and structural mock checks establish separate checkpoints. The six short-content variants rendered correctly at 720px in real Figma. The corrected master column widths and bound heights matched their helpers, and the wide Story specimen fit. At the same measured narrow column width, real Figma wrapped the detail text into more lines than Chromium and exceeded the fixed row height. Font-file equivalence and native line-breaking differences remain unverified. Hugging Story/NarrowStory rows preserve that text by growing beyond the browser minimum rather than forcing a font or clipping; The final native narrow specimen grew to 1116.78125px overall, with first/later body rows at 262.5px/263px, and its PNG showed readable text without overlap. The full state/brand matrix and edited-consumer checks remain separate acceptance work.

## Radio (`mg-form-check`)

Source: [Radio.jsx](../../stories/Components/Forms/Radio/Radio.jsx) and [shared form SCSS](../../stories/Components/Forms/_form-base.scss). Recipes live in `scripts/figma-choice-recipes.cjs`.

The native family has 30 variants: Checked=False|True, State=Default|Hover|Focus|Disabled|Invalid|InvalidFocus|InvalidDisabled and LabelPosition=After|Before for 28 short specimens; two checked After LongNarrow presets record measured 240px English content. Invalid hover and disabled hover have the same border appearance as their respective states. Pointer-hover plus focus is not a separate preset yet.

Source root is horizontal, centred and at least 40px tall. The control is 24px with a 2px border. Label and inline error use Roboto Regular 400, 16px/24px; label has 7px inline padding. The JSX error is a horizontal sibling with 2.5px top margin, despite older JSDoc describing below. Label/Error are editable; Show label/Show error default true, while valid states hide the error wrapper.

Checked Radio changes fill only. Border precedence remains Invalid over Disabled over Hover over base. Disabled labels and checked fills do not dim. Native ellipses keep bound colour roles. Focus wraps the 24px circle with the existing opaque two-band geometry. CSS checked inset is a 3px white band inside the border. The initial Figma INNER_SHADOW spread of 3 rendered only a 1px white band because the 2px inside border covered it; the derived native spread adds that border, giving 5, while preserving the source helper at 3. This is a Figma translation, not a changed CSS token.

At 240px, source flex shrink can compress a long-label control to 11.140625 × 24px, or 8.484375 × 24px with a long inline error. Preset label widths are 228.859375px and 148.921875px; error width is 82.59375px. Initial native inspection matched the source 96px and 144px row heights with the recorded English text. These are finite content/width presets rather than a native CSS flex algorithm. Before-label narrow, focused narrow, arbitrary consumer resizing, all-brand and Arabic/RTL acceptance remain work for the full inventory.

## Checkbox (`mg-form-check`)

Source: [Checkbox.jsx](../../stories/Components/Forms/Checkbox/Checkbox.jsx) and [shared form SCSS](../../stories/Components/Forms/_form-base.scss). The component partial adds no independent appearance. Recipes live in `scripts/figma-checkbox-recipes.cjs`.

The native family has 30 variants: Checked=False|True, State=Default|Hover|Focus|Disabled|Invalid|InvalidFocus|InvalidDisabled and LabelPosition=After|Before for 28 short specimens, plus two checked After LongNarrow presets at a 240px English consumer width. The source has no indeterminate design. Label/Error are editable with Show label/Show error booleans; the source error is a horizontal sibling rather than a message stacked below the row.

Geometry shares the 40px minimum row, 24px control, 2px border and 7px label padding with Radio. Labels and inline errors are Roboto Regular 400, 16px/24px. The control radius is `radius/form-input`, currently 5px. Unchecked border precedence is Invalid over Disabled over Hover over base. The later checked selector overrides both fill and border with `color/form-check--checked`, including checked invalid and disabled states. The error text remains red. Preserve this cascade rather than copying Radio's checked-border treatment.

Use the actual source SVG checkmark: viewBox 0 0 16 16, path `M3.5 8l3 3 6-6`, white stroke 2.5 with round caps and joins. Its CSS background scales to the inner width, repeats and clips inside the rounded control. At a normal 24px control the square tile is 20px and the scaled stroke is 3.125px. Source flex shrink narrows the two measured controls to 11.140625px and 8.484375px, with square tiles of 7.140625px and 4.484375px that repeat vertically. This produces multiple tiny checkmarks in narrow consumers. A single tall checkmark or fixed 24px control would change the source.

Native construction uses owned source vector paths and rounded clipping, with bound white paint. Source SVG/vector paint, control shape and repeated narrow marks matched the isolated UNDRR browser specimens. First construction created 647 nodes and updated two; re-import created zero and updated 375, with no errors. These observations do not cover other brands/scripts, arbitrary consumer resizing, Before-label narrow or focused narrow states. Invalid/disabled checked boundaries remain the source blue; document any proposed CSS change separately.

## FormErrorSummary (`mg-form-error-summary`)

Source: [FormErrorSummary.jsx](../../stories/Components/Forms/FormErrorSummary/FormErrorSummary.jsx), [shared form SCSS](../../stories/Components/Forms/_form-base.scss) and [foundational typography](../../stories/assets/scss/_foundational.scss). Recipes live in `scripts/figma-form-summary-recipes.cjs`.

The bounded family has six variants: Errors=One|Three, State=Default|Focus for four short templates, plus two Three/LongNarrow masters at 240px. The source accepts arbitrary error arrays, but these cardinality and content axes are kit presets. Empty or missing errors return no source component; do not create an empty panel variant. Editable Title, Name error, Email error and Interests error have consistent defaults. One uses the email error; Three uses name, email and interests. Fresh long specimens seed actual long text and preserve later designer edits.

- Surface: `color/red-50`, with a square 4px `color/red-900` inline-start accent; source padding `spacing/150`, 15px. External bottom margin is `spacing/200`, 20px, rather than internal component padding.
- Title: `font-family/text`, `font-size/300`, Roboto Bold 700, `color/red-900`, `spacing/75` bottom gap. The source h2 retains foundational line height 1.1, so 16px text uses 17.6px, rather than shared 24px body typography. The shared native title style owns BALANCE wrapping. Its corrected balancing was observed in ordinary and edited long UNDRR consumers; exact font-file and line-break equivalence remains unverified.
- Links: source CSS requests weight600 and Chromium matches bundled Roboto Bold700. Text is 16px/24px, red-900 and underlined through the shared native link style. The component colour rule keeps links red on hover. Corrected underlining survived ordinary and edited long native consumers.
- Markers: the source uses ordinary outside UL disc markers, not an alert icon or source SVG. Marker text inherits Regular400 and normal `color/text`, separate from the Bold red links. Measured browser marker geometry is exported with explicit provenance. The native glyph was visually observed; pixel-identical equivalence to the browser-generated marker has not been established.
- List: source inline indent10px, row gap5px except after the last row. Native source-derived layout preserves title and message alignment; long message text must fill its finite column and hug height.
- Root Focus: source two-band white separator and gold outline around the whole summary. Individual link focus, including its wrapped inline fragments, is not represented by this family. A large rectangle around a wrapped link would change the source focus shape.

Fresh source browser measurements at 320px are approximately 79.09px high for one error and 137.09px for three. The 240px long specimen is approximately 340.28px high. These are browser bounds, not fixed native height requirements: text metrics and line breaking must be checked independently. Source JSX focuses the summary once on its first nonempty render and links to field IDs; native visual states do not implement that behavior or validation.

All six variants were constructed natively: first build created 220 nodes and updated two; the corrected repeat created zero and updated 114, with no errors. Inspection exposed underline and wrapping defects; repairs in the shared link/title styles were then observed in screenshots of ordinary and edited long consumers. This is bounded default-UNDRR acceptance of those treatments. Native marker pixel parity, font-file equivalence, RTL, other brands/scripts, arbitrary arrays and wrapped individual link focus remain unverified.

FormGroup has source/browser measurements but no native family yet. Its responsive legend and fieldset border cutout require a dedicated layout contract. Do not approximate it as a fully stroked padded rectangle, or mark grouped disabled story children with their standalone disabled paints when source only disables them through the fieldset.

## Acceptance before expanding

A separate native comparison passed 441 assertions for edited ComboBox and Radio text, booleans, nested option properties and direct alignment surviving normal builds. The rendered probes were visually reviewed. Cleanup after plugin restart removed 32 temporary probes, retained zero and reported no errors. This verifies those bounded edit-preservation cases, while the remaining checklist still applies.

The explicit Details + closed Select group subsequently passed 274 native assertions for two edited 240px consumers. Its scoped ordinary rebuild created zero nodes and updated 303; strict cleanup removed 20 nodes and retained none. Long Title/Paragraph on open BelowMedium390 Details and short Value with label/help/error/BOOLEAN edits on Invalid Select retained actual properties, identities and FIXED/HUG sizing. This does not accept automatic breakpoint switching, long single-line Select values or other families' edited consumers.

- Confirm native sets, variants, instances and editable properties.
- Re-import and verify stable identities and preserved instance overrides.
- Check long labels, narrow widths, transparent-border sizing and focus on filled nodes, including ordering and ancestor clipping.
- Compare each state with rendered Storybook source, exact font loading, browser font matching and computed line heights.
- Re-import each brand on Starter or inspect all modes on a capable file. Check colour bindings, alpha composition and contrast on actual surfaces.
- Treat direction checks separately from Arabic fonts. Code maps Arabic text/UI to Noto Sans Arabic and heading/display to Noto Kufi Arabic; those routes are not yet exported.
- Record source facts, API documentation, mock checks and real Figma observations separately. Native construction has been observed; visual acceptance remains pending for the full state and theme matrix. See the dated learnings for exact checks.

## Switch (`mg-form-switch`)

Source: the Switch stories in Checkbox and the shared form SCSS. Recipes live in `scripts/figma-switch-recipes.cjs`; there is no separate source `Switch.jsx` component. Two native families preserve Default and Small geometry, with 22 and 20 source-backed variants. Off/on states cover default, focus, native disabled, aria-disabled and Invalid combinations. The default-size family includes measured 240px long labels.

Use editable Label, Help and Error properties with their visibility controls. Source state owns the outer error wrapper; Show error controls its inner text. Preserve compatible BOOLEAN references and edited master defaults on normal rebuilds. Default tracks are 42px with 20px thumbs; Small tracks are 31.5px with 15px thumbs. Native-disabled opacity applies to track chrome, while aria-disabled uses resolved source washes and retains opaque focus and invalid borders. The focused ring does not become translucent with the track.

Both sizes have bounded UNDRR Latin desktop observations. Pending, reduced motion, arbitrary custom sizing, RTL and forced colours are not implemented. Do not invent an animated loader or equate visual specimens with browser form semantics.

## Editorial CTA (`mg-button-cta`)

Recipes live in `scripts/figma-editorial-cta-recipes.cjs`. The family has 23 bounded Base and Hero source-context states, including measured long labels and reduced-motion hover presets. Its actual source circle is 22px and uses the Roboto Bold `›` glyph. Review surface colours belong to padded wrappers, while the component remains transparent. Source underline offset metadata applies only to native text nodes.

Native construction exists, but the first inspection showed every shared Label using the final Focus style. Do not claim Default/Hover typography or consumer resizing accepted until the isolated property experiment and edited-instance checks pass. Hero itself also requires exact Condensed fonts and a media contract.

## Styled Details (`mg-details`)

Use 20 source presets: Open False/True, Default/Hover/Focus/HoverFocus and BelowMedium/MediumUp typography, plus the measured 240px Default/Focus presets. Source typography switches at 48em (768px); native resizing does not run that breakpoint. MeasuredViewport is a documented source preset, not another CSS breakpoint. Summary Title and Paragraph are editable. Closed has no paragraph; do not add a Show body property that conflicts with Open.

Keep the transparent outer root with 1px border, 4px radius and 10px padding. Summary minimum is 48px; its actual Title uses Roboto Bold at 16/18px with 24px line height. Paragraph uses Regular 12.5/16px at 160%. The source +/− marker is Regular18px in a 30px circle, positioned END−10 and CENTER, with an Open−0.5px compensation for the bottom border. Focus belongs to the summary: square corners by default, radius2px when HoverFocus. Hover retains its source alpha fill and outer shadow.

Generic review specimens preserve main widths390/900/240. Explicit long1280/900/390/240 and unbroken240 consumers prove bounded content growth. Accordion groups and flush variants, automatic responsive type, active marker scaling, motion, keyboard behavior, all-brand/RTL and font-file equality remain separate work.

An edited open BelowMedium390 consumer at 240px retained long Title/Paragraph and FIXED/HUG sizing after ordinary rebuild in the Details + closed Select group. The selected typography stays BelowMedium390; narrowing does not run source breakpoints.

## Closed Select (`mg-form-select`)

Use five closed states: Default, Focus, Invalid, InvalidFocus and Disabled. The first native scope supports short placeholder/selected Value copy. Editable Label/Value/Help/Error and presentation booleans retain actual property keys; Invalid owns the outer error state. Focus overrides the Invalid border with blue while feedback remains red. Do not create a separate Filled paint state: selected text uses the same source surface and browser fieldtext black.

Keep the source46px control height,20px end padding and exact inline12×8 SVG chevron with original#1a1a1a fill. Its native fixed wrapper uses END/CENTER; measuredx300.75 at320px andx220.75 at 240px, y19. Chromium's disabled control opacity is0.7, scoped only to the control; this is a recorded UA baseline, not a Mangrove SCSS rule. Label/help remain undimmed except their own source colours.

Native popup/keyboard behavior, long single-line/truncated Values, inline required-marker wrapping, cross-platform UA paint and broader brand/script acceptance remain unimplemented. FILL text currently wraps in Figma, so do not claim arbitrary long-value fidelity.

An edited Invalid240px consumer retained short Value `Depth`, label/help/error copy and presentation booleans after ordinary rebuild in the Details + closed Select group. That short-value observation does not establish a native select's long single-line layout.

## Static Loader (`mg-loader`)

Recipes live in `scripts/figma-loader-recipes.cjs`. Two explicit Viewport presets preserve source border-box geometry: BelowMedium 40px with 8px border and MediumUp 96px with 14px border. Use native filled annular ELLIPSE sectors, bound to `color/blue-600` and `color/neutral-300`. The blue 270-degree sweep crosses a full turn; retain its positive endpoint rather than normalising it to a negative sweep. The neutral top band spans 90 degrees.

This is the source's static zero-degree frame. Do not imply 2s rotation, reduced-motion behaviour or automatic 48em sizing. Native innerRadius has no variable binding; source size/border changes need regeneration and fresh geometry inspection. The accessible source label stays hidden rather than becoming invented visible text. Source/native rasterisation, arbitrary ring resizing and all-brand appearance require separate evidence; ordinary repeat retained identities with zero new nodes.

## Compact Empty State (`mg-empty-state--compact`)

Recipes live in `scripts/figma-empty-state-recipes.cjs`. Scope is the source compact dashboard/chart well: Surface=Plain|Panel and Alignment=Centre|Start, four variants with editable Description and optional Show media. Start represents the current LTR source. General Empty State titles, actions and interaction states are not part of this family.

Keep content-driven vertical auto layout with source compact padding/gap, Panel background/radius and the exact 56×44 tray viewport. The 34px media frame centres its proportionally scaled native source SVG; source paths/joins remain native vectors with the explicit media-colour stroke binding. Description uses its required shared Roboto Regular 14px style, 150% line height, NONE decoration and PRETTY wrapping.

Bind the source 440px max-inline-size to a FILL/HUG FRAME around FILL/HUG Description TEXT. Native Figma rejects maxWidth variable binding directly on TEXT. The wider short-text bounds of native FILL do not reproduce CSS intrinsic text bounds; compare actual alignment and finite-width wrapping. Four bounded default-UNDRR source comparisons passed, while arbitrary edited Description/Show media consumer repeats, live SVG token scaling, font-file equivalence, RTL and all-brand appearance remain unverified. Ordinary repeat created zero nodes, and all four main TEXT paths pass the final saved-field audit.
