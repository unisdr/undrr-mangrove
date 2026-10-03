# Mangrove Figma kit learnings

This exploration record complements [README.md](README.md), the [component brief](FIGMA-KIT-BRIEF.md) and exporter recipes. An implemented recipe is not evidence of a rendered component.

## Evidence at the current checkpoint

Checkpoint: 3 October 2026. This record distinguishes the earlier desktop import from subsequent remote font checks.

| Area                | Established evidence                                                                                                                                      | Remaining check                                                                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Variables           | Earlier desktop import created 219 variables in one UNDRR mode. Remote import preserved their IDs and added 23 source-backed roles/helpers, reaching 242. | Button and Tab outer-radius helpers bring the next exporter build to 244; import and rendered brand switching still need checks.                                                         |
| Foundation styles   | Remote import recovered the three missing Roboto Condensed Regular styles: all 12 selected Regular foundations and four effect styles now exist.          | This does not establish that the separate desktop font runtime recovered. Component font matching still needs Storybook comparison.                                                      |
| Font runtime        | Remote execution loaded Regular and Bold for both Roboto families.                                                                                        | Verify the bundled CSS600/Bold700 representation against rendered source.                                                                                                                |
| Native components   | Real Figma construction created six families and 41 variants: Button 16, Text input 6, ComboBox option 6, ComboBox 6, Tab trigger 6 and composed Tabs 1.  | Creation is established; visual fidelity across every state, theme and width is not.                                                                                                     |
| Repeat construction | Button and Text input re-import created zero new nodes and preserved their IDs.                                                                           | Repeat construction for the other families and preservation of edited review overrides require further checks.                                                                           |
| Focus diagnostic    | An isolated Figma test showed the original order as a 4px gold band. Reversed order showed a 2px neutral separator and 2px gold band.                     | Apply the ordering correction to shared effects and inspect actual components. Outline focus needs native stroke geometry because effects on its unfilled frame did not draw the spread. |
| Narrow Button       | The narrow review example exposed an overflowing or apparently clipped label.                                                                             | Conventional Button has no source nowrap declaration. A finite-width review label can wrap; retain the main HUG geometry and verify the correction.                                      |
| Errors              | A real font rejection was a string. The importer preserves it and the mock includes the case.                                                             | Other failures may differ; retain affected asset identity and underlying message.                                                                                                        |
| Registration        | A stale Desktop registration ran old code. Removing it let the checkout version run.                                                                      | Check manifest paths when updates appear stale.                                                                                                                                          |
| Cloud/Desktop state | Earlier desktop reconnect warning prompted a local backup. Remote execution now reads and updates the canonical kit.                                      | Agreement with the separate open desktop session is not yet established.                                                                                                                 |

Earlier variables/styles mock results verify importer logic, not rendering. The native construction and focused diagnostic results above are real-file observations. They do not establish that every component passes visual acceptance.

## Source findings

### Follow the current cascade

The original brief described legacy tab colours and an underline. Current Tab.jsx renders a pill rail, and higher-specificity tab.scss selectors override that treatment. The new tab roles include alpha casts and computed rail geometry. A matching colour from another role is not its semantic replacement.

Text input and ComboBox share only part of their appearance. Text input disabled colours are explicit white/neutral-400; ComboBox uses 0.55 root opacity. Their errors use font-size/300 and 200 respectively. ComboBox input and trigger focus separately, and option focus is inward. The corrected brief records these differences.

Compiled source also establishes a validation/focus distinction: `.mg-form-input:focus-visible` has greater specificity than `.mg-form-input--error`, so focused invalid TextInput takes the focus border colour. ComboBox's root-invalid selector is more specific than its input-focused selector, so its invalid border wins. Preserve the actual cascade in the kit and record a proposed behaviour change separately. Browser inspection remains useful for the full state appearance.

### Shadows and transparent borders

Raised is a zero blur 1px inset boundary in neutral-600 at 0.24 alpha; raised-hover is a 2px interactive inset boundary. These are inner effects. The ComboBox source does not add elevated drop shadows.

Transparent borders still occupy space. Figma auto layout must account for border widths when producing button heights. Keep proposed improvements, such as a larger target, separate from faithful source representation.

### Focus geometry and finite-width labels

The isolated effect-order diagnostic is evidence about Figma rendering, not merely a mock. Reversing the two effects produced the intended neutral separator and gold outer band. Shared-style corrections and component checks remain separate follow-up work.

An unfilled outlined button did not render the effect spread. Its recipe now describes native stroke decorations: a neutral OUTSIDE stroke of focus offset on the control boundary, then a gold OUTSIDE stroke of focus width on a boundary expanded by the offset. A derived corner-radius helper follows button radius plus offset across brands. This preserves the transparent interior without requiring clipping for shadow spread. The decoration still requires inspection after import and resizing.

Both focused Tab trigger variants now use the same opaque native-stroke approach. The inactive trigger has no fill, and the selected trigger's fill has 0.12 alpha; neither should determine focus-ring opacity or spread. Its derived outer radius follows `tab/radius` plus the separator offset. These recipe changes and the latest runtime have not been applied to the real file after the remote quota was reached. ComboBox option FocusVisible still uses the inward effect and requires a separate rendered check for opacity masking; that representation has not been silently changed.

Conventional `.mg-button` does not declare nowrap, clipping or width limits. Its only nearby nowrap rule hides the responsive-icon label on mobile. Global foundational CSS allows word wrapping. The kit keeps its main labels at HUG size and marks Button's narrow review specimen for responsive label sizing. The review correction must not be described as a source-mandated nowrap behaviour or silently become a new default for every variant.

### Source literals belong in recipes

Trigger width 2.75rem, root max width 28rem, disabled opacity 0.55 and literal border widths have source meaning even without public tokens. Export helpers with source references instead of duplicating constants in runtime construction code. Unsupported source expressions should fail visibly.

### Font weight and line height need actual checks

Button, selected options and tabs request CSS 600. Bundled Roboto and Roboto Condensed have no 600 face; Bold 700 is the inferred browser matching candidate in the scaffold. Compare rendered stories before accepting it. Figma's available SemiBold face could differ from the browser's bundled source face.

Discover and load exact font names before creation. A listed font can still fail to load, as the desktop import demonstrated. Remote execution has since loaded Regular and Bold for both families; desktop recovery remains a separate observation. Report affected families without substituting another family.

Body line height is a length-valued 1.5em, computing 24px at 16px. Descendants inherit a computed length, so 12.5px help text can retain 24px line height. This follows the [CSS computed-value rules](https://www.w3.org/TR/CSS2/visudet.html#line-height); actual story inheritance and form-control defaults still need inspection. Record pixel line height alongside declared CSS. A review corrected component styles to preserve the body length instead of applying 150% to smaller text.

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

## Record the next observation

For each meaningful result, record:

- Date, plugin source revision and recipe version.
- Component/token source and Figma representation.
- Brand, exact font family/style and relevant dimensions.
- Operation, observed report and affected asset identity.
- Structural check, visual comparison and repeat-update result.
- Remaining discrepancy and next concrete action.

Keep private file identifiers, credentials and user-specific backup paths out of repository documentation. Link public API documentation and source paths; describe private-file observations without exposing its identifier.

## Current access boundary

The Starter connector allowance subsequently rejected both screenshot reads and a foundation write. The code now exports 244 variables including Button and Tab outline-focus radius helpers, but the file remains at the last successful 242-variable import. Focus effect ordering, outline decoration geometry, the InvalidFocused Text input cascade and the narrow Button review fix are locally checked and await application. Desktop control is also timing out. Do not mark those corrections as rendered or expand the canvas blindly. Resume with the existing identities, apply the corrections, inspect real bindings and take bounded screenshots before adding more families.
