# Mangrove Figma kit learnings

This exploration record complements [README.md](README.md), the [component brief](FIGMA-KIT-BRIEF.md) and exporter recipes. An implemented recipe is not evidence of a rendered component.

## Evidence at the current checkpoint

Checkpoint: 3 October 2026. This record distinguishes the earlier desktop import, subsequent remote checks and the resumed desktop corrections.

| Area                | Established evidence                                                                                                                                                   | Remaining check                                                                                                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Variables           | Earlier desktop import created 219 variables in one UNDRR mode. Remote import preserved their IDs and added 23 source-backed roles/helpers, reaching 242.              | Resumed desktop import preserved the 242 variables and added two radius helpers, reaching 244. The measured-black and Textarea height helpers bring the file to 246, preserving all original IDs. Five brand inspections establish values/aliases and identity preservation; full rendered brand acceptance remains open. |
| Foundation styles   | Remote import recovered the three missing Roboto Condensed Regular styles: all 12 selected Regular foundations and four effect styles now exist.                       | Resumed desktop import still rejected three Condensed styles; the existing remote-created styles remain in place.                                                                                                                                                                                                         |
| Font runtime        | Remote execution loaded Regular and Bold for both Roboto families. Chromium source comparison confirmed bundled Bold for CSS600.                                       | Figma font-file equivalence and glyph-level fallback remain separate checks.                                                                                                                                                                                                                                              |
| Native components   | Real Figma construction created seven families and 47 variants: Button 16, Text input 6, ComboBox option 6, ComboBox 6, Tab trigger 6, composed Tabs 1 and Textarea 6. | Creation is established; visual fidelity across every state, theme and width is not.                                                                                                                                                                                                                                      |
| Repeat construction | Button and Text input re-import created zero new nodes and preserved their IDs.                                                                                        | Resumed desktop rebuild retained the four selected Roboto families' variant/property IDs. A subsequent repeat of all four selected Roboto families created zero nodes and updated 301 without errors. Edited override preservation still needs a real check for ComboBox/options.                                         |
| Focus diagnostic    | An isolated Figma test showed the original order as a 4px gold band. Reversed order showed a 2px neutral separator and 2px gold band.                                  | Desktop import applied the ordering correction to all four effects. A scoped rebuild added outline Button stroke geometry; its rendering still needs inspection. Outline focus needs native stroke geometry because effects on its unfilled frame did not draw the spread.                                                |
| Narrow Button       | The narrow review example exposed an overflowing or apparently clipped label.                                                                                          | Conventional Button has no source nowrap declaration. A finite-width review label can wrap; retain the main HUG geometry and verify the correction.                                                                                                                                                                       |
| Errors              | A real font rejection was a string. The importer preserves it and the mock includes the case.                                                                          | Other failures may differ; retain affected asset identity and underlying message.                                                                                                                                                                                                                                         |
| Registration        | A stale Desktop registration ran old code. Removing it let the checkout version run.                                                                                   | Check manifest paths when updates appear stale.                                                                                                                                                                                                                                                                           |
| Cloud/Desktop state | Earlier desktop reconnect warning prompted a local backup. Remote execution now reads and updates the canonical kit.                                                   | A resumed desktop inspection matched all 242 pre-correction variable IDs and six component sets. Cloud synchronisation remains unconfirmed.                                                                                                                                                                               |

Earlier variables/styles mock results verify importer logic, not rendering. The native construction and focused diagnostic results above are real-file observations. They do not establish that every component passes visual acceptance.

## Source findings

### Follow the current cascade

The original brief described legacy tab colours and an underline. Current Tab.jsx renders a pill rail, and higher-specificity tab.scss selectors override that treatment. The new tab roles include alpha casts and computed rail geometry. A matching colour from another role is not its semantic replacement.

Text input and ComboBox share only part of their appearance. Text input disabled colours are explicit white/neutral-400; ComboBox uses 0.55 root opacity. Their errors use font-size/300 and 200 respectively. ComboBox input and trigger focus separately, and option focus is inward. The corrected brief records these differences.

Compiled source establishes a validation/focus distinction: `.mg-form-input:focus-visible` has greater specificity than `.mg-form-input--error`, so focused invalid TextInput takes the focus border colour. Chromium computed styles confirmed the invalid border changing from red to focus blue. ComboBox's root-invalid selector is more specific than its input-focused selector, so its invalid border wins. Preserve the actual cascade in the kit and record a proposed behaviour change separately.

### Shadows and transparent borders

Raised is a zero blur 1px inset boundary in neutral-600 at 0.24 alpha; raised-hover is a 2px interactive inset boundary. These are inner effects. The ComboBox source does not add elevated drop shadows.

Transparent borders still occupy space. Figma auto layout must account for border widths when producing button heights. Keep proposed improvements, such as a larger target, separate from faithful source representation.

### Focus geometry and finite-width labels

The isolated effect-order diagnostic is evidence about Figma rendering, not merely a mock. Reversing the two effects produced the intended neutral separator and gold outer band. The resumed desktop import applied the shared-style ordering correction. Component rendering remains a separate follow-up check.

An unfilled outlined button did not render the effect spread. Its recipe now describes native stroke decorations: a neutral OUTSIDE stroke of focus offset on the control boundary, then a gold OUTSIDE stroke of focus width on a boundary expanded by the offset. A derived corner-radius helper follows button radius plus offset across brands. This preserves the transparent interior without requiring clipping for shadow spread. The decoration still requires inspection after import and resizing.

Both focused Tab trigger variants now use the same opaque native-stroke approach. The inactive trigger has no fill, and the selected trigger's fill has 0.12 alpha; neither should determine focus-ring opacity or spread. Its derived outer radius follows `tab/radius` plus the separator offset. The resumed desktop import applied its radius helper, but a Tabs rebuild remains blocked by desktop Condensed font loading. ComboBox option FocusVisible still uses the inward effect and requires a separate rendered check for opacity masking; that representation has not been silently changed.

Conventional `.mg-button` does not declare nowrap, clipping or width limits. Its only nearby nowrap rule hides the responsive-icon label on mobile. Global foundational CSS allows word wrapping. The kit keeps its main labels at HUG size and marks Button's narrow review specimen for responsive label sizing. The review correction must not be described as a source-mandated nowrap behaviour or silently become a new default for every variant. The explicit narrow Button refresh now repairs an existing specimen while preserving its label; normal builds still preserve formatting overrides. Rows allocate 256px including review padding, giving a true 240px consumer. The real refreshed Button measured 240px by 50px with two unclipped lines, matching the measured source height at that width.

### Source literals belong in recipes

Trigger width 2.75rem, root max width 28rem, disabled opacity 0.55 and literal border widths have source meaning even without public tokens. Export helpers with source references instead of duplicating constants in runtime construction code. Unsupported source expressions should fail visibly.

### Font weight and line height need actual checks

Button, selected options and tabs request CSS 600. Bundled Roboto and Roboto Condensed have no 600 face. The isolated Chromium comparison reported actual custom Roboto-Bold for Button and selected options, and RobotoCondensed-Bold for tabs. This establishes the browser's face selection. It does not prove that Figma loads the identical font-file version.

Discover and load exact font names before creation. A listed font can still fail to load, as the desktop import demonstrated. Remote execution has since loaded Regular and Bold for both families; desktop recovery remains a separate observation. Report affected families without substituting another family.

Body line height is a length-valued 1.5em, computing 24px at 16px. Descendants inherit a computed length, so 12.5px help text retains 24px line height in the source comparison. This follows the [CSS computed-value rules](https://www.w3.org/TR/CSS2/visudet.html#line-height). TextInput is an exception: the vendored Normalize forms rule sets `line-height: 1.15`, producing 18.4px at 16px. ComboBox's `font: inherit` restores the body's 24px. The recipe now guards Normalize's forms selector and exports 115% for TextInput, retaining pixel-valued body inheritance for help and errors.

### Browser acceptance measurements

On 3 October 2026, an isolated headless Chrome 153.0.8010.47 session rendered the actual React components at source revision `b9e3b001`, using freshly compiled SCSS. It did not reuse the older Storybook build or a user browser profile. The fixture used UNDRR and explicit consumer widths; it was not the complete Storybook shell.

| Consumer  | Measured source behaviour                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button    | 14px font and line height; default height 36px. At a 240px consumer width, the long label wraps to two lines and height becomes 50px.                                                 |
| TextInput | 16px font, 18.4px line height, 46px control height. Labels/errors use 16px/24px; help uses 12.5px/24px.                                                                               |
| ComboBox  | Input 16px/24px and 276px wide beside a 44px trigger, both 46px high in a 320px field. Options are 44px high; three options produce a 139px popover including its border and padding. |
| Tabs      | Trigger 18px/25.578px, minimum height 44px and radius 30px. Rail height 61px and radius 37.5px. Labels remain `nowrap`.                                                               |

Computed `font-weight: 600` alone is insufficient evidence of the loaded face. The comparison used [Chrome's rendered-font inspection](https://chromedevtools.github.io/devtools-protocol/tot/CSS/#method-getPlatformFontsForNode) and found the custom Bold faces described above. The ComboBox glyph `▾` instead used local Lucida Grande fallback on this macOS host despite its declared Roboto family. Preserve the source glyph and record coverage separately; do not silently replace the control font or claim cross-platform equivalence.

These measurements strengthen source acceptance. They do not establish Figma rendering, every brand or every browser. The resumed desktop rebuild applied the corrections to the four selected Roboto families. Render those corrected consumers against the measurements before accepting fidelity.

Two additional observations constrain fidelity. Entered TextInput text is black in Chromium because its user-agent stylesheet applies the `fieldtext` system colour; the form source declares no explicit text colour. The first correction bound `color/black`, but real consumer inspection showed that Mangrove token resolving to #1a1a1a rather than measured #000000. The recipe now exports `component/text-input/browser-fieldtext` as an explicitly documented browser-baseline helper, with a source guard against a later authored input colour and a limitation in the JSON. This is not an authored semantic role or evidence of every browser's system colour. ComboBox explicitly uses `control/text` and remains separate.

Required labels at 240px width wrap to two 24px lines. The browser's red `::after` marker immediately follows the final word. The current HUG label frame and separate Boolean-controlled marker do not reproduce that multiline inline flow. Making the text FILL would wrap it but place the marker beside the text block, so that change alone would not fix fidelity. Preserve the useful properties and report the limitation until a native representation is accepted; do not claim the long required-label case passes.

### Composed components must expose useful properties

A Tabs rail containing nested trigger instances is not yet convenient to edit if only its `Layout` property is exposed. Recipes now mark primary nested Tabs triggers and open ComboBox options for exposure. The builder sets `isExposedInstance` on those primary construction instances, where the [Figma API permits writes](https://developers.figma.com/docs/plugins/api/InstanceNode/#isexposedinstance-boolean). Inspection records their exposed IDs. The resumed desktop rebuild applied this to ComboBox. Final real inspection confirms all three open option instances are exposed and component/property IDs are preserved; ease of editing still needs a user check. Tabs exposure remains pending.

Long-label review targets must address actual anatomy. The Tabs recipe explicitly targets its first nested trigger rather than attempting to change a nonexistent root `Label` property. Review text and responsive formatting are seeded only on new specimens, preserving designer edits on repeat construction. The existing Tabs review specimens were created before this target existed: after rebuilding, explicitly edit their exposed first-trigger label or create a fresh review instance for acceptance. The builder does not guess whether an existing label is a designer edit. Horizontal tab labels retain their source nowrap behaviour.

### Brand and script are separate layers

The current collection represents five brands with Latin roles. Arabic routing in _fonts.scss uses Noto Sans Arabic for text/UI and Noto Kufi Arabic for heading/display. Mirroring corners or alignment does not reproduce that routing. Script and direction need separate acceptance.

The older UI-designer and brand-guardian prompts still describe four brands, Sass-only tokens, separate theme compilation and icon fonts. Their shared-structure and contrast principles remain useful. Current implementation guidance should reference five brands, YAML plus runtime roles and SVG masks.

## Autonomous iteration

1. Inspect existing variables, styles and importer-owned nodes before writing. Preserve user-authored layers and instance overrides.
2. Read JSX, current selectors, inheritance and rendered stories together. A token name or older brief is insufficient.
3. Put source values, expressions and references in exporter recipes. Keep plugin construction generic and source guards actionable.
4. Preflight one bounded family. Resolve aliases per brand and load exact fonts. Build dependencies before composites; report affected families clearly.
5. Verify native sets, variant axes, text/boolean properties, bindings and stable identities. Exercise repeat import and renamed assets.
6. Compare rendered default/focused states, long labels and narrow widths with Storybook. Inspect effects on actual bound shapes.
7. Re-import one brand at a time on Starter, or inspect all modes where available. Check alpha composition and contrast on real surfaces. Restore the chosen review baseline afterward.
8. Record the evidence and remaining discrepancy, then expand to the next family.

An update failure on existing objects may leave partial changes. Reports must distinguish skipped families from incomplete updates. A pre-existing style ID alone does not prove its latest definition imported successfully. Keep construction in importer-owned component/review areas and retain editable review instances.

## Starter workflow and migration

Local variables, styles and components can be assembled and reused in one file. The observed file accepts one mode, so use one canonical kit and the brand switcher. Do not create per-brand component copies.

Shared-library publishing and five simultaneous brand modes require a suitable paid team file and seat. Direct remote canvas writes have their own documented access requirements. The local plugin has already imported foundations in the free file; connector installation alone does not establish write access or tool exposure. See [the dated access record](README.md#free-account-now-professional-later).

When Professional access arrives, use the user's own account with a Full seat and edit access to the team file. Move the canonical kit and re-import all brands. Migration has mock coverage but needs real-file verification. Code Connect remains a separate later option requiring Organization or Enterprise access.

Professional access is planned. Follow [the handoff checklist](MAINTAINING-KIT.md#professional-access-handoff) from the latest Radio checkpoint below: 290 variables, 13 families and 123 variants with UNDRR restored. The earlier 246-variable checkpoint remains historical evidence. It records the documented 10-mode allowance, library publishing and MCP read limits, then the actual migration, brand review and consumer-update checks still required. Condensed font loading, cloud synchronisation and component fidelity remain separate unresolved issues after access changes.

## Record the next observation

For each meaningful result, record:

- Date, plugin source revision and recipe version.
- Component/token source and Figma representation.
- Brand, exact font family/style and relevant dimensions.
- Operation, observed report and affected asset identity.
- Structural check, visual comparison and repeat-update result.
- Remaining discrepancy and next concrete action.

Keep private file identifiers, credentials and user-specific backup paths out of repository documentation. Link public API documentation and source paths; describe private-file observations without exposing its identifier.

## Resumed desktop corrections

On 3 October 2026, desktop control resumed. A full inspection and local backup preceded writes: all 242 pre-correction variable IDs and the six component sets matched the earlier canonical kit. Import then created two radius helpers, updated 242 variables and set 244 UNDRR values. Nine selected text styles and all four effects updated; three Condensed styles failed loading again. No font substitution or system font change was made.

The first attempt to rebuild only the four Roboto families exposed an implementation bug. The builder loaded every font under the shared review container, including unselected Tabs, and failed on Roboto Condensed Bold. An existing-object failure can leave partial changes, so this failed attempt is not evidence of successful construction.

The fix prepares whole shared containers only when their explicit collection mode changes, before style or canvas writes. An unchanged mode no longer forces unrelated font loading; selected families and their review specimens retain exact font preparation. Two new mock cases cover an existing kit with unavailable unselected Tabs and an actual container-mode transition blocked before writes.

The subsequent real desktop build succeeded for Button, Text input, ComboBox option and ComboBox. Its downloaded full operation report records four new outline decoration nodes, 297 updated nodes, zero errors and unchanged selected set, variant and property IDs. It also reports six component text styles and three required effects updated without font errors. This establishes construction and identity preservation, not complete rendering. The next repeat created zero nodes and updated 301 without errors; selected set, variant and property IDs remained unchanged.

The UI now retains complete JSON operation reports for download independently of inspection reports. Operations are serialised while busy, and a previous valid report survives a failed operation. Save the report before closing the plugin; it is retained only for that window's lifetime.

## Current access boundary

The Starter connector allowance still rejects reads and writes. Desktop control allowed the 244-variable import and scoped corrections. After inspection, the screenshot showed a completed report while accessibility still showed Working. Opening and dismissing a native menu refreshed an observation; selecting the canonical kit in the native Window menu later revealed a pending Save As dialog. The completed inspections and review PNGs were downloaded. Do not infer failure or acceptance from stale accessibility or screenshot state alone.

The open file still shows a reconnect warning. Cloud synchronisation is unconfirmed, so the app was left open and no restart or cache clearing was attempted. Roboto Condensed Regular/Bold remain listed but unloadable in the desktop runtime. The final rendered review shows opaque two-band filled/outlined Button and input focus, a visible disabled ComboBox and an unclipped two-line narrow Button. Tabs corrections, other inward-focus consumers, outline resizing/corners across brands, narrow field labels, edited overrides and brand switching remain acceptance work. Multiline required-label flow is a known representation gap.

### Opacity units differ between variables and nodes

The real disabled ComboBox and its review instance had opacity 0.0055, even though the bound helper resolved to 0.55 and every descendant stayed at opacity 1. This made the control almost invisible. The helper had bypassed the exporter's percentage conversion: Figma [layer opacity variables use 0 to 100](https://help.figma.com/hc/en-us/articles/14506821864087-Overview-of-variables-collections-and-modes), while [native node opacity uses 0 to 1](https://developers.figma.com/docs/plugins/api/ComponentNode/).

Export the source's 0.55 as 55 and divide the resolved percentage by 100 when preparing a native property before binding. Paint alpha remains a fraction. The mock now models percentage binding and validates the native range, component/instance opacity, unchanged descendants and repeat updates. A permissive mock setter had previously hidden this real API difference.

### Targeted corrections verified in desktop Figma

The final import added the browser-fieldtext helper, updated the preceding 244 variables and set all 245 UNDRR values. Its report retained the same three Condensed text failures, with nine text styles and four effects updated. The subsequent four-family build created zero nodes, updated 302 and reported no errors; its explicit narrow review refresh retained the existing label and identities.

The saved final inspection confirms 245 variables, all 242 original variable IDs and all six set/variant/property identities. Disabled ComboBox component and review opacity resolve to 0.55 with descendants at 1. Filled input paint resolves to RGBA 0/0/0/1 through its documented helper. Input typography resolves to 115%; the three nested open options are exposed. The latest review PNG confirms the corrected disabled appearance, two focus bands and narrow Button wrapping. These are bounded UNDRR observations; they do not establish all-brand or every-state acceptance.

## Brand round-trip and Textarea extension

On 3 October 2026, desktop imports reused the same physical Starter mode for DELTA, IRP, MCR2030 and PreventionWeb, then restored UNDRR. DELTA and IRP kept 245 variables; the subsequent MCR2030 import added the one Textarea helper, reaching 246. Saved full inspections for every brand match all 245 preceding exported values and aliases within floating-point precision. They preserve variable IDs, the six original set/variant IDs and property definitions. No complete rendered brand matrix was captured, so colour, font and geometry acceptance across all consumers remains open.

Inspection is now structural by default. Font loading is an explicit checkbox, and unchecked reports record `fonts: null`. The window displays a compact inventory summary instead of the complete multi-megabyte JSON. Full downloads retain all values, nodes, bindings and errors. Both the actual desktop summary/download and the large-report UI VM checks were exercised. This is a display improvement, not a proven explanation for stale accessibility or delayed native Save As windows.

Textarea was measured from current React and fresh SCSS in isolated Chromium 153 on macOS. Four rows measure 88.0625px, with Roboto 16px, 18.4px line height, 6.25px padding and 1px border. The source formula yields 88.1px; the 0.0375px difference is browser quantisation. InvalidFocused retains the blue focus border through CSS specificity; disabled labels, value and border use neutral-400.

The first actual Textarea build created six variants and a 240px multiline review specimen: 131 nodes created, two shared containers updated and no errors. The saved inspection gives a 240 × 88.099998px bound control and a 225.5 × 126px Value layer containing six explicit lines, including a wrapped line. Its PNG confirms top alignment, line-break retention, wrapping, overflow clipping, both focus bands and disabled styling. The control clips a later partial line, providing a bounded representation of overflow without browser scrolling. The narrow label still overflows; Required inline flow, long help/error messages, native scrolling/resizing and exact cross-runtime font metrics remain separate gaps.

The generic `review.specimens` contract adds up to eight stable examples with an exact variant, finite consumer width and named TEXT/BOOLEAN overrides. Preflight rejects unknown or mistyped properties; fresh instances receive values and repeats preserve edits. The mock verifies identities and edited Value/visibility retention, but does not measure real text layout. Consult [MAINTAINING-KIT.md](MAINTAINING-KIT.md) when adding components or updating existing anatomy, tokens and states.

The existing PR was updated successfully through the known-number GitHub CLI GraphQL route after direct REST updates encountered a TCP refusal. Listing endpoints remain suppressed for this organisation. GitHub Actions remain unavailable, so local verification is the recorded gate.

The desktop Textarea repeat created zero nodes, updated 77 and reported no errors, with unchanged set, variant and property IDs. A fresh local `.fig` backup was saved after restoring UNDRR. Cloud synchronisation remains unconfirmed; the desktop file was left open. Edited multiline Value/visibility retention has mock coverage; an actual edited-instance repeat remains pending.

## Table, Text CTA and native composition checks on 3 October 2026

Source baseline `ea33e7b8`, with the recipes and runtime in this change, expands the exporter to **277 variables, 73 text definitions, four effects, 12 families and 93 variants**. Table contributes Header cell 4, Body cell 4, Row 24 and Table 8; Text CTA contributes six. The source was measured using actual JSX and freshly compiled SCSS in isolated browser fixtures, including narrow content and conventional actions. The [architecture review](ARCHITECTURE-REVIEW.md) records independent Plugin API guidance and concrete acceptance gates.

### Native instance geometry can fail silently

The initial mock accepted nested row heights and cell widths on Table review instances. Real Figma returned success but retained the masters' dimensions and bindings. The screenshot showed overlapping content. Restoring sizing axes and clearing inherited bindings did not make these nested dimensions effective. Do not infer successful native geometry from API return values or a mock.

The repair puts shared columns on Row masters and selects linked Story/NarrowStory Table presets. Review nodes seed TEXT properties only; descendant width/height seeds are rejected before writes. The explicit review refresh selects the current master preset and restores the root width while preserving content. Ordinary builds retain existing review references and edits. The mock now reproduces ignored nested INSTANCE resize and width/height binding calls, and records `resize()` fixing both sizing axes.

Figma's narrow text still breaks into more lines than the browser at the measured column widths. The cause is unverified; exact installed font-file equivalence and engine line-breaking remain open. Default Story rows/cells now hug their content above browser-measured minimum heights. Actual narrow body rows grow to 262.5/263px, compared with source 222.015625/222.515625px, so the content fits. Wide story rows retain source heights 65.28125/65.78125px. The narrow table remains 292.703125px wide in a 240px consumer and is 1116.78125px high. Equal short templates and bordered seams remain bounded fixtures, with no claim of arbitrary native column resizing or the HTML auto-table algorithm.

### Source-defined CTA context and wrapping

Default Latin TextCta headings inherit Roboto. The headline utility gives 32px/40px desktop and 23px/28.75px mobile, rather than requiring Condensed. Strong conventional actions need neutral-0 fill, neutral-0 at 0.72 alpha border and hero-coloured Label. The generic native-instance appearance contract binds those paints without detaching Button.

Short CTA masters retain HUG actions; explicit long presets put 200px/120px actions and FILL/HEIGHT labels on their masters. Actual desktop actions measure 200 × 64px and 120 × 106px with unclipped wrapping. The 720px desktop CTA is 259px high. The 320px mobile CTA is 325px versus browser 324.5px; this is a measured half-pixel difference, not exact metric parity. The bounded six-variant set does not establish arbitrary responsive resizing, extra actions, rich text, media, editorial CTA links or Arabic typography.

### Identity, evidence and access

The desktop file now contains 277 variables, 12 sets/93 variants, 25 selected text styles and four effects. Inspection reports no errors. All 246 preceding variable IDs and seven original sets/47 variants remain unchanged. A normal repeat creates zero nodes, updates 322 and has no errors, preserving selected family, variant and property IDs. Designer text/visibility edits and migration behaviours have mock checks; a new edited native consumer experiment and all-brand visual acceptance remain pending.

Saved local evidence includes `mangrove-kit-before-table-2026-10-03.json`, `mangrove-table-cta-build-2026-10-03.json`, `mangrove-table-cta-repeat-2026-10-03.json` and `mangrove-kit-table-cta-final-2026-10-03.json`. Keep actual asset IDs and private paths in the local evidence ledger. Cloud synchronisation remains unconfirmed and the file stays open. The connector is available but still rejects library discovery at its Starter allowance; that failure is not evidence that no libraries exist.

The connector codec now packs LZW codes at the smallest required width and preserves complete metadata. Full Table/Row/CTA builds exceed 50,000 characters or bytes and require explicit variant batches. Mocks execute all eight Table and six CTA batches, retain IDs, arrange every retained main variant without overlap and verify zero-node repeats. Native connector batch assembly remains unverified while quota is exhausted. Full desktop builds work independently of that allowance.

Local gates: token Jest 3 suites/1328 tests, lint 0 errors/22 existing warnings, importer 10 scenarios, kit 15 scenarios, CTA 6 scenarios and UI 2 scenarios pass. Touched-file Prettier and whitespace checks are recorded with the final commit. No production JSX or SCSS changed.

## Radio and bounded verification on 3 October 2026

Source revision `25114200` was measured using actual Radio JSX, freshly compiled shared form SCSS and isolated Chrome. The exporter now has **290 variables, 73 text definitions, five effects, 13 families and 123 variants**. Desktop inspection found 25 selected text styles and all five effects. Radio contributes 30 variants: Checked × seven states × Before/After label order, plus Default/Invalid checked long-content presets. Its label and error use actual browser Roboto Regular 400 at 16/24px, with inline error placement and a 2.5px top margin. Invalid wins over disabled at the border; checked changes fill only. The native source ellipse retains its state-owned stroke.

The runtime now supports native leaf ELLIPSE recipes. Preflight rejects children, frame-only layout fields, corner radii and HUG sizing; FILL is permitted in an auto-layout parent. The two measured 240px source consumers have 11.140625 × 24px and 8.484375 × 24px controls because CSS permits shrinking. Their native label/error wrappers retain the source 96px/144px row heights. Short native masters hug occupied content; the source block-level flex row fills its containing width. These bounded presets do not reproduce the CSS flex algorithm at arbitrary sizes.

The first native PNG caught an effect difference that passing mocks and a literal binding inspection missed. CSS places a 3px white inset inside the 2px border. Figma's inner shadow starts at the ellipse's outer edge, and its inside stroke paints over the outer 2px. Binding a literal spread of 3px therefore left only a 1px white band. The source inset helper remains 3px, and a separately described native helper binds spread to 5px. A normal rebuild kept the effect and component identities. The corrected PNG shows a 3px white band and 14px blue centre on the 24px checked control, preserving checked focus bands and source border precedence. Do not infer painted extent from a correct literal effect field alone.

The initial native build created 543 nodes, updated two shared containers and had no errors. The final normal repeat created zero nodes, updated 331 and had no errors. Actual inspection confirms all 277 preceding variable IDs and all main set/variant/property IDs survive, including the first Radio build. The file has 13 main sets/123 variants plus the separate diagnostic component. A fresh local `.fig` backup was saved. Evidence filenames: `mangrove-radio-build-2026-10-03.json`, `mangrove-radio-repeat-2026-10-03.json`, `mangrove-kit-radio-final-2026-10-03.json` and `mangrove-radio-accepted-2026-10-03.png`. Private IDs and paths stay in the local ledger.

### Scale review and connector imports explicitly

The full review sheet has grown to 800 × 15663.859375px. The new **Export selected family PNG** reads exactly one owned family section without temporary canvas writes. Its actual Radio export is 736 × 2254.5px, producing a 1472 × 4509 PNG at 2×. Display renames retain ownership. Export preflight rejects foreign, duplicate or misplaced sections; the UI rejects zero/multiple selected families. Full review and focus exports remain useful. Mocks cover the ownership failures and byte-preserving downloads, while the scoped Radio export has now been exercised in the desktop app.

The complete foundation connector import exceeded its 50,000 character/byte ceiling as source roles grew. Explicit `variableIds`/`styleIds` batches now retain full metadata, include alias and style-binding dependencies, report requested/actual scope and force pruning off. All five brand mock round-trips retain all 290 variables and 78 text/effect definitions, with stable IDs and 17,194–33,790 byte payloads. Empty/duplicate/unknown selections fail before writes. Complete every batch before accepting a one-mode Starter brand switch, since partial imports temporarily mix brands. Real connector batches remain unverified while quota is exhausted; whole desktop imports remain available.

### Next source choices

Actual Checkbox/Switch source browser research is complete at `25114200`; it does not establish native acceptance. Checked Checkbox overrides both fill and border after invalid/disabled rules, unlike Radio. Its inline SVG checkmark is a precise source path, not a library-icon substitute. At narrow widths CSS repeats smaller square tiles vertically: the checked image is not a single stretched 24px glyph. Native vector import, tiling and in-place identity require bounded acceptance before building that family.

Switch tracks do not shrink. Default track/thumb/travel are 42/20/18px; Small are 31.5/15/13.5px, with authored 1.5px borders quantised to 1px in the observed Chrome rendering. Its pending/aria-disabled paints combine washes and shadows, and reduced motion replaces the rotating arc with a static dotted ring. Use measured geometry and bound paint layers rather than root opacity or an invented loader. Keep source media conditions distinct from Figma prototype behaviour.

Before/focused narrow Radio, Arabic/RTL typography, all-brand visual coverage, exact Figma font-file equivalence, edited native consumer experiments, Condensed loading, cloud sync and Professional publication remain open. The full component goal remains active in [COMPONENT-INVENTORY.md](COMPONENT-INVENTORY.md).

Local gates for this checkpoint: `npx jest tokens` passes three suites/1,328 tests; `yarn lint:check` has zero errors and 22 existing warnings. Importer mock 10, kit mock 16, choice mock seven, CTA mock six, scoped export mock two and UI mock three scenarios pass. Targeted ESLint, touched Prettier and `git diff --check` pass. GitHub Actions remain unavailable. Exact PR-number updates are used because organisation listing endpoints are suppressed.

## Checkbox, SVG and editable summary styles on 4 October 2026

The export now contains 308 variables, 75 text definitions, five effects and 159 variants across 15 families. Native inspection found 27 selected text styles and five effects. Checkbox adds 30 variants using the shared source state/order contract, including two measured 240px long examples. Its first desktop build created 647 nodes and updated two; the repeat created none, updated 375 and had no errors. A scoped PNG matched the source white checkmark, state-owned square borders and rounded clipping. Checked overrides both fill and border even for Invalid/Disabled, unlike Radio. Coverage is bounded to the measured UNDRR Latin specimens.

### Preserve the actual source SVG

The Checkbox checkmark comes from the exact decoded SCSS SVG path. It imports as native vectors inside a source-viewBox frame. Fixed square rescaling changes vector geometry and stroke weight together; merely resizing the wrapper would leave the path at the wrong size. Narrow source consumers repeat smaller square tiles vertically, so native recipes retain separate tiles and clipping instead of stretching one glyph. Real Figma accepted this source viewport and repeated rebuilds retained its imported nodes.

The runtime records exact markup, asset identity, paint policy, topology and native vector geometry. Source/asset or native path/stroke changes require an explicit migration and are rejected before a normal rebuild. Original white paint is retained. Optional monochrome binding rejects multicolour assets. The mock handles explicit fixture paths and cannot prove arbitrary SVG parsing or rendering. Refer to [Figma SVG import](https://developers.figma.com/docs/plugins/api/figma/) and [node rescaling](https://developers.figma.com/docs/plugins/api/properties/nodes-rescale/).

Connector compilation includes SVG code only when the selected recipes need it. Non-SVG scripts exclude the importer; an explicit checked Default Checkbox batch fits the transport ceiling and passes mock execution and repeat identity checks. The full ComboBox matrix now also needs explicit variant batches. Connector execution remains unverified because the Starter allowance is exhausted.

### Native text behavior can differ from the mock

The first error-summary attempt failed because Figma rejected textWrapStyle WRAP. Its actual enum is AUTO, BALANCE or PRETTY, independently of the frame layoutWrap enum. The runtime and mock now reject WRAP/TRUNCATE before writes. The corrected six-variant build created 220 nodes, updated two and reported no errors. See [TextWrapStyle](https://developers.figma.com/docs/plugins/api/TextWrapStyle/).

A native PNG then showed that link underlines were missing even though the mock passed. Inspection confirmed NONE on those text nodes. Applying decoration after character property references fixed the main variants, but long review consumers edited through text properties still lost it. Exporting UNDERLINE in the shared link TextStyle fixed the edited long examples; the shared title style also carries BALANCE. The final scoped PNG shows underlines on every wrapped link line and the balanced title. A subsequent update created zero nodes, updated 114 and reported no errors. This records the observed correction without claiming a general cause for Figma's text reset behavior. [TextStyle](https://developers.figma.com/docs/plugins/api/TextStyle/) supports both fields.

The mock does not simulate native descendant styling resets or render font glyphs. Error-summary bullets are a native Regular text glyph representing the browser disc, with measured marker width and gap. Short and long layouts retain source spacing and font roles; font-file equivalence, other brands/scripts and inline fragmented focus remain open. No source icon exists in this component, so none was added.

### Real edited consumers and final checkpoint

Three native ComboBox/Radio probes received root TEXT/BOOLEAN edits, three exposed option Labels and direct text alignment. A normal scoped rebuild created no nodes and preserved every edited readback: all 441 assertions passed, with no errors. The probes were visually reviewed after moving them clear of the review sheet. Their original transparent root overlaid the review because it used the same x position; fresh preparation now computes a position beyond all finite existing page-level bounds. A second native preparation verified the corrected placement beyond the existing page bounds.

After restarting the plugin, the saved root ID recovered its ledger for exact-owned cleanup. All 32 recorded nodes were removed, none retained, with no errors. Final inspection found 308 variables, 27 selected text styles, five effects, 15 sets and 159 recipe variants plus one historical diagnostic component. All 290 preceding variables and 136 preceding family set/variant IDs survived. All 34 native summary link nodes read UNDERLINE/AUTO; all 14 titles read BALANCE. A fresh local `.fig` backup was saved. Cloud synchronisation is still unconfirmed.

The title's exported line-height remains 17.6px, but native Figma reports 18px line boxes. Native short heights 79.5/137.5px and long height 341.5px differ slightly from Chrome's 79.09375/137.09375/340.28125px. The exact renderer rounding and font-file equivalence remain separate evidence gaps; do not alter source typography to conceal them.

Local gates for this checkpoint: token Jest passes three suites/1,328 tests; repository lint has zero errors and 22 existing warnings. Importer ten and kit 16 scenarios pass, including all-five-brand 308-variable/80-style connector import batches. Checkbox four, Summary eight, SVG five, acceptance seven and UI four grouped checks pass. Targeted ESLint, touched-file Prettier and whitespace checks pass; the rebuilt desktop bundle passes JavaScript syntax checking. The checked Checkbox connector payload is 47,751 bytes. GitHub Actions remain unavailable; known PR-number reads and updates avoid the organisation's suppressed listing endpoints.

## Switch and native capability investigation on 4 October 2026

The source-backed Switch extension exports 335 variables, 75 text definitions, seven effects and 201 variants across 17 families. Switch has 22 variants and Switch small 20: off/on with default, focus, native disabled, aria-disabled and Invalid combinations; two default-size long-label presets use 240px consumers. Source geometry and paints come from current `_form-base.scss` and the exported Checkbox Switch stories, measured in Chrome 153 at source `25114200`. This is the supported HTML/CSS Switch, not an invented `Switch.jsx` API. Pending, custom sizes, reduced-motion spinner, forced colours and RTL remain unimplemented.

Native construction created 977 nodes and updated two with no errors. Subsequent scoped rebuilds created zero, updated 573 and retained both set IDs, all 42 variant IDs and property keys. The bounded default-size UNDRR render now shows red feedback only for Invalid states, an opaque aria-disabled focus ring and a nonshrinking track with a four-line label at 240px. All 308 preceding variable IDs and 175 preceding family set/component IDs, including the historical diagnostic component, survived the inspected extension. These observations do not establish all-brand fonts, compositing, general edited-consumer resizing or complete source coverage.

### Boolean references can change shared defaults

The initial Switch bound Show error to the wrapper that also carried source `visible: invalid`. Figma's shared BOOLEAN default made every review error visible. Moving the property to the inner error TEXT, as Radio does, separates authoring visibility from the state-owned outer wrapper. During the migration, assigning the old referenced wrapper's literal visibility changed the shared default to false, temporarily hiding all feedback. Clear an obsolete managed reference before writing source visibility. A subsequent native repeat restored the source true default through the referenced inner text; the final scoped PNG showed the correct Invalid-only feedback. Property IDs and layer IDs stayed intact throughout. This observed default mutation is absent from the ordinary mock unless explicitly modelled.

### Font names and loading do not prove font identity

A new read-only diagnostic derives exact requested faces from source style bindings, reads an already-returned available-font inventory, tests at most four exact names and reads variable-axis tags. The native report confirmed that listed `Roboto Condensed` Regular and Bold both fail loading, while listed `Roboto` styles `Condensed Regular` and `Condensed Bold` load. The former family reports static; Roboto reports `wdth` and `wght`. Candidate names have no supplied variation settings, so their actual width/weight coordinates are unknown. No font was assigned and no variable, text style or role binding was changed.

Matching concatenated display labels identifies naming candidates only. Successful loading exposes no selected font-file path, version or checksum. The installed Condensed files are static version 3.009, while source SCSS names an earlier version; source response provenance and the Figma-selected provider still need evidence before any equivalence decision. Further load calls cannot establish binary identity. The documented load API ignores variation settings; the axis API returns tags rather than named-instance values or ranges. [Font loading](https://developers.figma.com/docs/plugins/api/properties/figma-loadfontasync/), [variation-axis tags](https://developers.figma.com/docs/plugins/api/properties/figma-getfontfamilyvariationaxes/), [FontName](https://developers.figma.com/docs/plugins/api/FontName/)

### Browser font response provenance is now confirmed

A fresh isolated browser captured the actual font HTTP responses used by the recorded `25114200` CSS fixture. Roboto Regular, Roboto Condensed Regular and Bold all returned HTTP 200 from the source assets URLs. HAR response bodies were decoded directly; each is static Version 2.137 (2017), with 1,294 glyphs and 896 mapped codepoints. The corresponding installed files inspected on the diagnostic machine are static 3.009 (2024), with 1,321 glyphs and 922 mapped codepoints. Some advance widths differ by one font unit. These decoded differences establish different font data, independently of WOFF2 versus TTF packaging.

Chrome confirmed custom Roboto Regular for body text, Condensed Regular for a source UI sample and Condensed Bold for the Tab's CSS weight 600. This was a font provenance experiment, not component or all-script acceptance. The source CSS was reused from the recorded fixture rather than regenerated from the latest checkout. Figma's selected provider, file version and candidate axis coordinates remain unknown; source-versus-installed equivalence is disproven, while source-versus-Figma equivalence remains unestablished. No font installation, assignment or application settings changed.

### FormGroup needs actual capability checks

The first isolated native experiment found that a HUG legend wraps and returns to its short width at a master's fixed cap. Writing a smaller maxWidth to its instance descendant was ignored: a 240px instance retained a 298px legend. The HEIGHT text configuration became WIDTH_AND_HEIGHT when its horizontal sizing was HUG. Figma rejected `vectorPaths` on an instance with the error that vector data cannot be overridden. A contour-refresh contract based on editing consumer vector paths is therefore unavailable in this session.

Native `createSlot()` exists on this Starter file. Inserting a recorded instance into an instance SLOT regenerated node identities, invalidating a captured text handle. The initial test and exact-ledger cleanup reported that failure and retained the temporary root. Recovery remains conservative: generated descendants must have proven owned provenance; a new direct slot child is not adopted merely because it sits inside the probe. Fresh native lookup and a separate saved-ledger audit are required. Slot content preservation is still under investigation. [Component properties and slots](https://developers.figma.com/docs/plugins/working-with-component-properties/)

For FormGroup, prototype a single-line legend with native HUG/FILL split border segments. Use separately measured multiline/narrow masters where a live contour cannot follow arbitrary consumer edits. A padded FRAME with an opaque legend patch would conceal the source boundary and surface geometry. Document source presets and stale-contour limitations explicitly; do not detach instances to bypass the API restriction.

### Hero source is mapped, with dependencies still open

Ninety current-source browser snapshots at `f60eb97d`, across 1280, 910, 900, 390 and 320px viewports, map Hero surfaces, split ratios, background/mobile composition and actual fonts. Title/label/detail require exact Condensed faces. Hero actions use the editorial CtaButton CTA with a 22px circular badge and inverse focus, which differs from both the kit's conventional Button and Text CTA. Media, layered gradients, rich text and title letter spacing need explicit native contracts. Hero source mapping is not native construction or font acceptance.

### Final Switch and repeat evidence

The final desktop inspection reports one collection, 335 variables, 27 selected text styles, seven effects, 17 main component sets and 201 recipe variants plus the historical diagnostic component. It reports no inspection errors. All preceding variable and component IDs remain present. Both Switch sizes have scoped rendered review evidence, with Invalid-only feedback, native-disabled opacity and distinct aria-disabled paints. The final Small specimen retains the source 31.5px track and 15px thumb. Coverage remains bounded to these UNDRR Latin source states.

After the visibility guard was added, a normal ComboBox/option/Radio/Switch rebuild created no nodes and reported no errors. Three actual edited ComboBox/Radio consumers passed all 441 preservation assertions. Their temporary area appeared beyond the existing page bounds, clear of the review sheet. Restart recovery then removed exactly 32 recorded nodes, retained none and reported no errors. A named local `.fig` backup was saved after cleanup. Cloud synchronisation remains unconfirmed.

The initial capability probe required manual recovery. Read-only inspection found 37 nodes with the experiment's ownership marker and exact source-component provenance, including all children regenerated by the first slot insertion. The selected temporary root was visually reviewed and removed through Figma's recoverable canvas deletion. This was manual recovery, not a successful exact-ledger cleanup. The revised probe validates the complete ordered first-customisation transition before recording fresh child IDs; ordinary saved-ledger recovery remains strict. Its next native trial is still pending.

### Editorial CTA construction and a text property mismatch

Editorial CTA adds 23 source-backed variants, 15 helpers and four Roboto Bold text definitions. Generated output now contains 350 variables, 79 text definitions, seven effects, 18 families and 224 variants. The first native construction created 310 nodes, updated two shared containers and imported four text styles, without reported errors. Transparent controls have separate padded review surfaces for Hero Primary, Tertiary and Quaternary, leaving captions readable on the neutral sheet. The source 22px circle retains its actual `›` glyph and optical padding; native absolute END/CENTER placement reports MAX/CENTER constraints. A short native master measures 175 × 44px against Chrome's 174.90625 × 44px; default badge x=152 and Hover x=155 preserve the measured 3px movement.

The first PNG exposed a material state mismatch: all main Label nodes had the final Focus TextStyle, UNDERLINE and AUTO offset, including Default and Hover. Exported recipes correctly request separate Default/Hover/Focus styles and explicit decorations. Native construction success and passing mocks therefore do not establish CTA acceptance. An isolated shared-text-property experiment is required before a styling or property migration. Existing source and component IDs are retained while this is investigated.

Underline offset is exported as source style metadata and applied to native TextNodes after their style, decoration and property references. Native TextStyle has no documented offset field, so the importer validates this metadata without assigning an invented native style property. NONE nodes report a null offset. Editable Label updates and arbitrary finite-width reflow still require actual-file acceptance. [TextStyle](https://developers.figma.com/docs/plugins/api/TextStyle/), [TextNode](https://developers.figma.com/docs/plugins/api/TextNode/), [underline offset](https://developers.figma.com/docs/plugins/api/TextDecorationOffset/)

The revised Slot test reported a different native outcome from the first test: its default child IDs remained, while the inserted child's advertised TEXT ID was unavailable through ID lookup. This fails the exact topology criteria and does not prove arbitrary editable content preservation. Exact cleanup removed 30 recorded nodes, reported one absent and retained none, with no errors. The next diagnostic distinguishes readable raw handles from missing or invalid handles; no relaxed ownership or saved-ledger adoption is authorised by a read-only snapshot.

Current local gates pass token Jest (three suites, 1,328 tests) and repository lint (zero errors, 22 existing warnings across 479 source files). The importer passes ten grouped checks with 350 variables; the kit mock passes 16, including all-five-brand 350-variable/86-style scoped imports at 19,813–34,444 bytes. Absolute/offset/surface contracts pass seven, editorial CTA five, SVG five and UI seven grouped checks. These results cover control flow and API contracts; the recorded native CTA styling mismatch remains unresolved. The current explicit checked Default Checkbox connector payload is 49,915 bytes, close to the 50,000 ceiling; repeat its exact scope after further runtime changes. Actual remote connector execution remains unverified.

### Isolated text-property stages reproduce the mismatch

Three private variants using existing CTA styles were correct before linking: Default NONE/null, Hover UNDERLINE/PERCENT20 and Focus UNDERLINE/AUTO. Linking the Hover node to the shared Label property changed its offset to AUTO. A later Focus style write propagated the Focus TextStyle to all three labels. Detaching every Label reference allowed all three intended styles to be restored, but relinking copied the stored Focus style back into the labels. A detach/relink correction alone is therefore insufficient in this file. These observations concern exact native write stages, not a documented general guarantee.

The experiment changed no canonical styles or component nodes. Exact cleanup removed 37 recorded nodes, reported one absent and retained none. Slot diagnostics now confirm its inserted child's raw TEXT handle reports removed=true as well as being absent through ID lookup, so a readable-handle fallback would not repair this observed case. Properties created separately on variants before combining need their own bounded native trial; no canonical property migration has been performed.

## Chips source and first native construction

Forty source browser snapshots confirm Roboto Medium500 for Chip labels and Regular400 for the source multiplication glyph. Latin source Roboto declares Medium as well as Regular/Bold; the earlier phrase that CSS600 matches a binary400/700 Latin bundle was too specific. Browser-rendered Bold700 evidence for the existing 600 controls remains valid. New source contexts need their own actual-font measurement.

Chips adds 16 variants, nine helpers and two exact text definitions. Generated output now has 359 variables, 81 text definitions, seven effects, 19 families and 240 variants. Native construction created 172 nodes, updated two containers, imported both exact faces and updated the shared raised effect, without errors. Inspection found 33 selected text styles, seven effects, 19 sets and 240 recipe variants plus the historical diagnostic component, with no errors.

Native short masters measure 65/85 × 40px against Chrome's 64.125/84.125 × 40px. The measured 240px long examples are 46px tall in Figma versus 45px in Chrome. At an 80px containing region, source min-content overflows to 91.28125/124.828125px rather than squeezing the labels; native recipes retain those bounded widths. Native heights are 100/82px versus browser 97.5/80px, reflecting the observed 18px native line boxes against the CSS17.5px role. Do not alter source font size or line height to hide renderer/font differences. Font-name loading does not establish binary equivalence.

The first PNG also showed a review construction issue: generic specimens resized every variant to 320px, stretching intrinsic Short chips and widening fixed Long/Narrow masters. The explicitly seeded 240px and overflow consumers were correct within their recorded geometry, but generic captions alone do not prove the named size. The opt-in review sizing contract now makes fresh or explicitly refreshed generic specimens inherit main sizing. A native refresh created zero nodes, updated 124 and reported no errors; inspection confirmed 65/85px HUG short controls, fixed 240px long controls and 91.28125/124.828125px narrow overflow controls. Every preceding inspected node ID survived. An ordinary repeat also created zero, updated 124 and reported no errors. Rendered review confirms these bounded examples; arbitrary designer-edited Chips consumers still need a native preservation check.

### Independent inspection audit exposes additional text gaps

The saved native inspection can now be audited offline against the generated recipes, including exact main TEXT identities, style IDs, decoration, explicit wrapping and underline offsets. All 482 source TEXT paths across 19 families matched. Eighteen wrong style IDs occur only in Editorial CTA. Separate findings are six Tabs labels with missing fonts, six Text CTA headings requesting BALANCE but reporting AUTO, nine Editorial CTA Default labels reporting UNDERLINE instead of NONE, and 18 Editorial CTA offset mismatches. These 57 findings include unverified fonts, so a matching style ID alone is insufficient acceptance. The audit does not load fonts, modify the canvas or establish rendered parity.

### Native editable editorial consumers retain geometry but fail decoration

Three temporary Base CTA instances exercised short, French and unbroken text at 260, 320 and 240px. Labels retained the available width of consumer width minus 29px; 22px badges retained END/CENTER constraints and the source state offsets. French text at 260px yielded a 54px root; the unbroken 240px example yielded 82px. Short text returned to a 44px root. All failed assertions concerned the known Default underline and Hover offset mismatch. This is native geometry evidence, not complete CTA acceptance. Exact cleanup removed 13 nodes and retained none.

The range-setter experiment also failed to isolate variant styles: full-range style and decoration writes, followed by whole-node offsets, propagated the final Focus styling across the shared Label variants. Edited instance text and IDs survived, but initial and repeated styles did not match the requested states. Its property-before-combine experiment initially queried a variant's componentPropertyDefinitions after combining, which Figma rejects. The diagnostic now captures standalone definitions before combining and reads only the set afterward. The corrected native trial merged the three standalone Label keys into a new set key. Its edited consumers retained distinct styles, but subsequent main writes still made all three mains Hover, then Focus. Cached edited consumer styling therefore does not prove that masters or fresh instances are correct. Hover offset also remained wrong. Exact cleanups removed 50 and then 56 recorded nodes, with one absent per run, none retained and no errors. No canonical property migration was made.

One intervening run lost its in-window report because generating tokens also rebuilds the watched development-plugin bundle. The isolated temporary root was visually identified and removed through recoverable canvas deletion; this was manual recovery, not strict ledger cleanup. Freeze plugin-folder writes, token generation, bundle builds and mock harnesses that rebuild output until native reports are saved and temporary assets are cleaned up. The uninterrupted rerun supplied the corrected evidence above.

### Text CTA balanced wrapping correction

Both existing desktop/mobile heading styles now export BALANCE in every brand, and explicit node wrapping is applied after property references and sizing. The scoped native build created zero nodes, updated 125 and reported no errors. All six main headlines read BALANCE, with their preceding style IDs retained. All 4,980 preceding inspected asset IDs survived. The offline Text CTA audit matched all 12 main TEXT paths with no saved-field gaps. This corrects the recorded AUTO mismatch; live edited Headline persistence, arbitrary consumer widths and rendered browser parity remain separate checks.

### Connector scope guards retain a transport margin

The intrinsic-review extension initially pushed the checked Default Checkbox batch to 51,214 bytes, above the 50,000 ceiling. The compiler now conditionally removes schema/runtime branches only when their declarations are absent from the exact embedded subset: absolute positioning, intrinsic review, source review surfaces, underline offsets and nested review seeds. Property-presence checks keep malformed null/false/zero declarations on the validating path. Nine exact source anchors fail closed if the runtime changes. Existing surface retirement still clears and hides obsolete owned wrappers. Metadata is preserved losslessly.

The checked Checkbox batch now measures 47,532 bytes, with 2,468 bytes of margin. Scoped Chips is 38,301, Hero-context editorial Hover 43,304 and Table Story 47,103 bytes. Compiled-payload mocks verify enabled features, malformed preflight refusal, repeat identity and edited Label preservation. These remain local transport/control-flow checks; remote connector execution is unverified while the Starter allowance is exhausted.

### Existing-set repair must preserve references and edits

A further private native trial renamed the three Label layers per state, preserving their IDs and shared property key. Repeated main style writes still collapsed their styles, and fresh consumers inherited the wrong styling. Layer naming alone is insufficient. A second trial moved one variant out and back at a time, preserving the original component set instead of emptying it. After the first return, the original reference and consumer character-preservation gates failed, so the experiment stopped immediately. It did not attempt the remaining variants or a repeat migration. Native component sets can delete themselves when emptied, so evacuation of all variants would also threaten identity. [ComponentSetNode](https://developers.figma.com/docs/plugins/api/ComponentSetNode/)

Exact cleanup removed 74 of the 75 recorded probe nodes, with one absent, none retained and no errors. No canonical nodes, properties or styles were migrated. The editorial CTA issue remains an acceptance gap; a more substantial property/composition change needs a concrete mapping and native evidence before use.

Latest local checks pass token Jest (three suites, 1,328 tests), repository lint (zero errors, 22 existing warnings), targeted ESLint, touched-file Prettier and whitespace checks. Importer ten, kit 16, Switch eight, Chips six, editorial CTA five, contracts eight, editorial acceptance five, native-text audit five, connector scope four, font diagnostics six, capability 12, SVG five, Checkbox four, Summary eight, acceptance seven, Text CTA six and UI eight grouped checks pass. Five-brand scoped import batches retain all 359 variables and 88 styles at 16,598–34,444 bytes. Native gaps remain the separately recorded 51 saved-field/font findings.

## Details and closed Select on 4 October 2026

Details adds 20 presets, 23 helpers, five exact text styles and one Hover effect. First native construction created 369 nodes and updated two, without errors; repeat created zero and updated 221. All 140 owned main identities and 50 main TEXT paths survived. The native shadow retains source black alpha0.1, offset0/2, blur4, spread0; summary focus has square corners except HoverFocus radius2. Native long heights1280/900/390/240 are116/163/195/303px versus browser115.59375/162.1875/195/303px. Unbroken240 is263px in both. The small MediumUp differences reflect measured line-box quantization, not clipping.

Independent review found that generic390/240 captions sat over900px instances, even though masters and dedicated stress specimens were correct. Details now opts into preserveVariantSizing. Explicit native refresh created zero nodes, updated221 and reported no errors. All20 generic instances now match their390/900/240 source presets; narrow Closed/Open heights90/131 match the measured masters. Inspection and rendered review confirm the correction, with preceding IDs preserved. BelowMedium/MediumUp are explicit typography variants; resizing does not execute the source48em breakpoint. Grouped/flush Accordion, active marker scaling, motion, keyboard behavior, exact font files and broader brand/script coverage remain unverified.

Closed Select adds five short-value states using existing field roles and four shared Regular styles, plus the exact source12×8 SVG chevron in a fixed END/CENTER wrapper. Initial native build created148 nodes and updated two without errors; repeat created zero and updated84. Controls read320/240×46px, end padding20px, chevron x300.75/220.75 and y19. Default and selected Values retain the same surface; InvalidFocus uses the focus blue boundary while retaining error feedback. All25 main TEXT paths pass saved-field checks. Source single-line/truncated long Values are still outside the generic wrapping TEXT contract; native popup/keyboard behavior, required inline marker flow and cross-platform UA styling remain separate scope.

A source/native review found Chromium153/macOS user-agent opacity0.7 on disabled Select, absent from the first native build. The source SVG remains authored#1a1a1a; the UA dims its arrow, boundary and value together. An exported70% OPACITY helper is scoped only to the disabled control, with the observed raw0.7 recorded as browser provenance. Label/help are outside that opacity boundary. This is an explicit browser baseline, not an invented SCSS token or cross-platform guarantee; The corrected native repeat created zero nodes, updated84 and reported no errors. Fresh inspection reads control opacity0.699999988079071, with the new variable bound only to the control; label/help and descendant local opacities remain1. The saved PNG confirms the dimmed arrow and boundary. This does not establish another platform's UA baseline.

A complete category-by-category identity comparison enumerates actual node, variable, collection, text-style and effect-style IDs. The earlier recursive scan counted4,846 referenced identities; the complete pre-Details inventory has4,980 actual asset IDs, all retained by the Text CTA update. The new Details inventory has5,378, first Select5,527 and corrected Select5,528; every preceding ID survives each extension. Native inspection now finds384 variables,38 selected text styles,eight effects,21 sets and265 recipe variants plus the historical diagnostic component. Default foundation imports still report the three known Condensed-font failures; both new scoped families load their exact requested Regular/Bold faces successfully. A fresh local backup was saved after the final opacity correction; cloud synchronisation remains unconfirmed. The native audit matches557/557 main TEXT paths across21 families; the two new families add no saved-field gaps. The same51 older Tabs-font/editorial-CTA findings remain. New edited-consumer and all-brand acceptance must not be inferred from unchanged-content repeats.

The independent architecture review recommends separate internal Normal/Hover/Focus Label masters as a future editorial CTA candidate, each with a local text property and stable style. Expose the active nested instance for one editing control. That cannot preserve the current outer Label key automatically, so it needs a concrete mapping and fresh/edited/state-switch/repeat native acceptance before migration. State-specific public fields or a hidden legacy field with plugin-only mirroring would make the editing contract unreliable. Keep the current canonical family and its known gap until a candidate proves the required behavior.

### Details and Select local verification

Token Jest passes three suites and1,328 tests. Repository lint has zero errors and22 existing warnings across481 source files. Importer10, kit16, Details6, Select5, SVG5 and connector scope4 grouped checks pass. Five-brand scoped imports retain384 variables and94 styles at21,190–34,444 bytes. The shared SVG mock now includes the exact source Select path and near-black paint fixture; it still refuses unknown paths rather than claiming arbitrary SVG parsing. Native evidence remains bounded to the recorded UNDRR short Select values and explicit Details widths.
