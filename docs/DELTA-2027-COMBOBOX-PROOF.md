# Delta 2027 with the React Aria ComboBox pilot

This isolated branch shows Delta 2027 tokens working with the existing ComboBox pilot from [#1088](https://github.com/unisdr/undrr-mangrove/pull/1088). It tests the component differences that a token alias alone cannot provide: selected checkmarks, inset focus and explicit disabled colours.

Use the separate `khawkins98/delta-2027-combobox-proof` branch for this review. The main Delta 2027 PR does not contain these ComboBox changes. The proof keeps #1088 on its existing Mangrove 2.x path and does not merge or publish the broader React Aria research styles.

## Open the examples

Start the development server with the commands below, then open:

- [Body theme](http://127.0.0.1:6103/?path=/story/example-delta-2027-combobox-proof--body-theme): the body has the Delta 2027 theme. The popup uses React Aria's normal body portal.
- [Wrapper theme](http://127.0.0.1:6103/?path=/story/example-delta-2027-combobox-proof--wrapper-theme): the body keeps the default UNDRR theme. Only the field's wrapper has Delta 2027. The example passes that wrapper as the popup's explicit portal container.

Try these steps:

1. Open the suggestions. Flood starts selected, with a checkmark and no selected fill or heavier text.
2. Use the arrow keys and Enter to select another hazard. Escape closes the list.
3. Type part of a hazard name, then use the arrow keys and Enter to select the filtered result.
4. Tab to the field and inspect the inset focus indicator. The disabled field below uses its own background and text colours rather than fading the whole component.
5. Switch the direction toolbar to RTL and narrow the viewport. Check the popup, selection and trigger positions.

The examples contain English sample text. RTL layout does not claim translated application content.

## Why the portal container matters

CSS values inherit through the DOM. A popup appended to the body does not inherit tokens from a wrapper elsewhere in the document.

| Theme location | Popup location | Result |
| --- | --- | --- |
| Delta 2027 on the body | Default body portal | The popup inherits Delta 2027. |
| Delta 2027 on a wrapper | Explicit portal into that wrapper | The popup inherits the wrapper's Delta 2027 values. |
| Delta 2027 on a wrapper | Default body portal | The popup cannot inherit the wrapper's tokens. This combination is not automatic. |

The proof uses the pilot's existing `popoverContainer` prop, which passes through to React Aria's `UNSTABLE_portalContainer`. Its API stability needs review before a production release. The selected checkmark uses React Aria's documented `isSelected` render state and a licensed Lucide SVG.

## What changed

The pilot's source comes from commit `7f0ce8c785009f65078e179ddf4d8d2d7d8094c9`. This branch copies only its ComboBox, scoped ComboBox stylesheet and framework-neutral control aliases. React Aria Components is pinned to `1.22.1`, matching that PR's lockfile.

The integration adds:

- Selection markup for an accessible option label and a decorative checkmark.
- An optional popup offset, set to the supplied 4px in these examples.
- A Delta-only stylesheet mapping the control roles to complete Delta colours.
- The supplied menu radius, padding and shadow, plus 32px controls and options.
- Separate body and wrapper examples and a browser regression script.

The normal pilot remains label-only outside Delta 2027. The new selection indicator is hidden there. No `.react-aria-*` research skin is loaded.

## Reproduce the checks

From a checkout of `khawkins98/delta-2027-combobox-proof`, install dependencies, generate the styles and start Storybook in one terminal:

```sh
yarn install --immutable
yarn scss
yarn storybook --port 6103 --ci
```

Keep the server running. In a second terminal, install Playwright’s Chromium if needed, then run the checks:

```sh
yarn playwright install chromium
node scripts/test-delta-2027-combobox-proof.mjs
```

To check production output after installing dependencies and generating styles, build and serve Storybook in one terminal:

```sh
yarn exec storybook build -o docs-build-temp
node scripts/serve-storybook.mjs docs-build-temp 6106
```

Keep that server running and use a second terminal for the test command:

```sh
COMBOBOX_PROOF_URL=http://127.0.0.1:6106 node scripts/test-delta-2027-combobox-proof.mjs
```

The Chromium checks cover both portal arrangements, selected appearance, keyboard selection and filtering, Escape, field sizing, disabled colours, focus visibility, emulated forced colours with reduced motion, and mobile RTL popup bounds. Screenshots are written under `docs/review/delta-2027-combobox/`. These checks do not represent screen-reader testing or testing on a physical mobile device.

## Review evidence

- [Body portal](review/delta-2027-combobox/body-popup.png)
- [Themed wrapper portal](review/delta-2027-combobox/wrapper-popup.png)
- [Body theme in mobile RTL](review/delta-2027-combobox/body-mobile-rtl.png)
- [Wrapper theme in mobile RTL](review/delta-2027-combobox/wrapper-mobile-rtl.png)
- [Body theme in forced colours](review/delta-2027-combobox/body-forced-colours.png)
- [Wrapper theme in forced colours](review/delta-2027-combobox/wrapper-forced-colours.png)

This provides an isolated ComboBox integration example and repeatable checks. It does not establish consuming-application compatibility, every React Aria component, or complete accessibility conformance. Moving the proven changes into the eventual production integration remains a separate review and packaging decision.

## Accessibility finding retained for review

With the popup open, axe reports `aria-hidden-focus` on another enabled ComboBox outside the list. The same report occurs with the unmodified #1088 component source, as well as both Delta portal arrangements. The [original pilot reference](http://127.0.0.1:6103/?path=/story/example-delta-2027-combobox-proof--pilot-reference) keeps that comparison reproducible.

Native Tab closes the popup and moves to the next enabled field. A capture-phase `focusin` observation confirms that the next field is no longer inside `aria-hidden` when it receives focus. Closed-state axe checks pass for the selected WCAG A and AA rules. The [recorded findings](review/delta-2027-combobox/axe-open-findings.json) retain all three results.

The browser check does not disable that rule globally. It records only the known outside-field target, rejects other findings and verifies the actual focus transition. This evidence does not replace a VoiceOver or NVDA review before production adoption.

Final local validation on 17 November 2026: the production Storybook build and the browser checks pass on port 6106. ESLint, Stylelint and formatting checks pass. The open-popup axe finding above remains recorded for review; this is not a claim of zero accessibility findings.
