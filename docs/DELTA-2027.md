# Delta 2027 theme

Delta 2027 applies Anders's v0.7.2 design handoff to existing Mangrove components. It adds a separate theme alongside the existing Delta theme, which keeps its name, stylesheet and appearance.

The implementation is available for review in [draft PR #1498](https://github.com/unisdr/undrr-mangrove/pull/1498), on the Mangrove 3 stack. Design approval and validation in the Delta application are still pending.

## Try the theme

Start with the [local review guide](DELTA-2027-LOCAL-REVIEW.md) to compare both themes and use the buttons, fields and tabs.

In a package built from this branch, load `css/style-delta-2027.css` and add `mg-theme-delta-2027` to the body or a wrapper. For a page that switches between brands, load `css/style-all.css` instead. These paths describe the new build; earlier published packages do not contain the theme.

The repository Sass entry is `stories/assets/scss/style-delta-2027.scss`. The installed-package entry is `scss/assets/scss/style-delta-2027.scss`.

Use separate wrappers or frames for different brands. Nesting another brand inside Delta 2027 does not reset its component sizes and spacing. A popup added outside the themed wrapper also needs the theme class. The wrapper's class does not automatically reach a popup appended to the body.

## How the tokens reach components

A token gives a value a name, such as an action colour or a spacing size. Under the aligned shared contract ([proposal](proposals/delta-token-exchange.md)), `tokens/delta-2027.tokens.json` uses the same top-level groups and paths (`primitive`, `semantic`, `typography`, `spacing.{2xs..3xl}`, `radius`, `shadow`, `motion`, `layout`, `accessibility`) as Mangrove's base and UNDRR sources, emitting clean `--mg-semantic-*`, `--mg-typography-*`, and `--mg-spacing-*` properties alongside legacy `--mg-color-*` adapters.

DTCG defines a shared format for token names, types and values. The Mangrove build combines the Delta source with inherited Mangrove values, then produces CSS and a complete JSON file for other tools. See [Design-token sources](DESIGN-TOKENS.md) for the format and build rules.

The source and exported files have similar names but different purposes:

| Location | Purpose |
| --- | --- |
| Repository: `tokens/delta-2027.tokens.json` | Editable source. It depends on inherited Mangrove values. |
| Build output: `dist/tokens/delta-2027.tokens.json` | Complete exchange file, including the values and references other tools need. |
| Built npm package: `tokens/delta-2027.tokens.json` | The same complete exchange file, ready for a consuming application or design tool. |

The original v0.7.2 handoff contained 112 `$value` entries. Of these, 111 describe typed values. The remaining entry, “WCAG 2.2 AA”, is an accessibility target, so it stays in metadata. Additional semantic roles (`semantic.action.selected`, `semantic.action.secondary`, `semantic.action.secondaryHover`, `semantic.background.disabled`, `semantic.background.toast`, `semantic.focus.ringInverse`) align with shared Mangrove multi-brand requirements. The source also records the original file's SHA-256 and retains component descriptions as metadata.

## Edit values and override colours

Edit the repository source and run `yarn scss` to regenerate the token outputs and rebuild the styles. If only the exchange JSON and generated Sass are needed, run `yarn build:tokens` instead.

The two colour representations need different CSS. For example, within Delta 2027:

| Property | Example value | Read it in CSS |
| --- | --- | --- |
| `--mg-semantic-action-default` | `rgb(45 111 163)` | `color: var(--mg-semantic-action-default)` |
| `--mg-color-interactive` | `45 111 163` | `color: rgb(var(--mg-color-interactive))` |

The first property contains a complete CSS colour. The second keeps Mangrove's existing three-channel format. Do not wrap the complete colour in another `rgb()`.

The build calculates the channel value from the complete colour. Editing the source and rebuilding updates both outputs. Changing only the complete-colour property in the browser updates components that read it directly; it does not update the channel value already calculated by the build. Hover, pressed and disabled colours also have separate tokens. The local review's override control demonstrates this limited runtime change. Its [standalone token example](DELTA-2027-LOCAL-REVIEW.md#check-token-use-without-mangrove-components) separately shows temporary source edits, regenerated exports and an independent HTML consumer.

## Components covered and work still pending

Existing Mangrove components receive the warm page surface, new accent, Inter typography, compact controls, pill tabs, status dots, quieter cards and tables, and related dialog and notification surfaces. Their behaviour and public markup remain shared. Theme-specific rules live in `stories/assets/scss/_delta-2027-components.scss`; some sizes and spacing come from the handoff's component descriptions rather than individual tokens.

The handoff also describes components and variants Mangrove does not currently expose. A native Select keeps its native popup, so it does not demonstrate the handoff's checkmark-only custom menu. New text-button ghost and destructive variants need a separate component API decision. Existing toast placement at the top of the viewport and its lifecycle remain unchanged. The handoff's bottom-positioned toast still needs a separate placement decision.

A separate [ComboBox proof branch](https://github.com/unisdr/undrr-mangrove/blob/khawkins98/delta-2027-combobox-proof/docs/DELTA-2027-COMBOBOX-PROOF.md) connects Delta 2027 to the [React Aria pilot, #1088](https://github.com/unisdr/undrr-mangrove/pull/1088). It checks checkmark-only selection, popup theme inheritance, inset focus and disabled colours. Those changes remain outside the main theme branch; production integration and application validation are still pending.

## Accessibility and fonts

Field placeholders use the readable secondary text colour. The handoff's pale placeholder colour remains available for decorative or disabled use. Normal status labels use the supplied 8px dot with visible text; forced-colours mode retains Mangrove's distinguishing status shapes. Fields use inset focus with a system-colour outline in forced-colours mode.

Inter and IBM Plex Mono are self-hosted under `fonts/delta-2027/` in the built npm package, next to `css/`. Keep the OFL licences with the font files when redistributing them. The repository source folder, `stories/assets/fonts/delta-2027/`, contains the licences, original download URLs and checksums.

Sass consumers with another asset layout can configure `$font-path-delta-2027`. Its default, `../fonts/delta-2027`, is relative to the compiled stylesheet. If text falls back to a system font, check the browser's network panel for missing font files. Arabic text continues to use Mangrove's Noto families; English content inside an Arabic section returns to Inter.

The [local review guide](DELTA-2027-LOCAL-REVIEW.md#recorded-review) records the visual and automated checks and their limits. Those checks do not establish Figma approval, complete accessibility conformance or compatibility with the consuming Delta application.
