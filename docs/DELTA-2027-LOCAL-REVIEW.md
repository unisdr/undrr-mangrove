# Review Delta 2027 locally

Compare the existing Delta theme with Delta 2027, based on Anders's v0.7.2 handoff. Both panes use the same existing Mangrove components and content. Each pane is a separate document, so its theme styles cannot affect the other pane.

This guide covers the theme review in [draft PR #1498](https://github.com/unisdr/undrr-mangrove/pull/1498). For package paths, token mappings and implementation limits, see [Delta 2027 theme](DELTA-2027.md).

## Open the comparison

Check out the PR branch and follow the [development prerequisites](DEVELOPMENT.md). From the repository root, install dependencies, generate the styles and start Storybook:

```sh
yarn install --immutable
yarn scss
yarn storybook
```

Open [Compare themes](http://localhost:6006/?path=/story/design-decisions-delta-2027--compare-themes).

For more space, open [Same components](http://localhost:6006/?path=/story/design-decisions-delta-2027--same-components&globals=theme:Delta+2027+Theme). Use **Global theme for components** in the toolbar to switch between **DELTA Resilience Theme** and **Delta 2027 Theme**. The new theme is also available on the existing component stories.

## Compare appearance and behaviour

1. Compare the page colour, typography, action buttons and disabled button.
2. Edit **Event name**, choose a hazard and toggle the checkbox. Check the error and disabled fields.
3. Activate **Save draft**. Its confirmation appears only in that preview; it does not save data elsewhere.
4. Use Tab to reach the buttons and fields. Check that keyboard focus is visible. In **Record sections**, use the arrow keys to move between tabs.
5. Follow **View summary** to the existing VerticalCard. Compare its border, radius, padding and type.
6. Compare the records table and status indicators. The table can scroll within its own area when space is limited.
7. Use the direction toolbar to force right-to-left layout. Resize to a mobile viewport and zoom to check reflow. The sample content remains English.

The comparison uses existing React components for buttons, fields, checkbox, tabs and card. Table and status labels use their published HTML and CSS patterns. The layout styles belong to this review page; they are not part of the public component API.

## Open other changed components

The theme changes 21 component guide families. Eight appear in the comparison gallery. The other 13 use their existing Storybook examples. Each link below selects **Delta 2027 Theme**; it opens one representative example rather than every variant or state.

| Component guide family | Example location |
| --- | --- |
| [Buttons](http://localhost:6006/?path=/story/components-buttons-buttons--all-variants&globals=theme:Delta+2027+Theme) | Comparison gallery |
| [Text input](http://localhost:6006/?path=/story/components-forms-text-input--default&globals=theme:Delta+2027+Theme) | Comparison gallery |
| [Select](http://localhost:6006/?path=/story/components-forms-select--default&globals=theme:Delta+2027+Theme) | Comparison gallery |
| [Checkbox and switch](http://localhost:6006/?path=/story/components-forms-checkbox--default&globals=theme:Delta+2027+Theme) | Comparison gallery |
| [Tabs](http://localhost:6006/?path=/story/components-tabs--tabs&globals=theme:Delta+2027+Theme) | Comparison gallery |
| [Vertical card](http://localhost:6006/?path=/story/components-cards-vertical-card--default-vertical-card&globals=theme:Delta+2027+Theme) | Comparison gallery |
| [Table](http://localhost:6006/?path=/story/components-table--default-table&globals=theme:Delta+2027+Theme) | Comparison gallery |
| [Status label](http://localhost:6006/?path=/story/components-status-label--all-statuses&globals=theme:Delta+2027+Theme) | Comparison gallery |
| [Empty state](http://localhost:6006/?path=/story/components-empty-state--default&globals=theme:Delta+2027+Theme) | Separate existing story |
| [Tag](http://localhost:6006/?path=/story/components-tag--default&globals=theme:Delta+2027+Theme) | Separate existing story |
| [Book card](http://localhost:6006/?path=/story/components-cards-book-card--default-book-card&globals=theme:Delta+2027+Theme) | Separate existing story |
| [Horizontal book card](http://localhost:6006/?path=/story/components-cards-horizontal-book-card--default-horizontal-book-card&globals=theme:Delta+2027+Theme) | Separate existing story |
| [Horizontal card](http://localhost:6006/?path=/story/components-cards-horizontal-card--default-horizontal-card&globals=theme:Delta+2027+Theme) | Separate existing story |
| [Dialog](http://localhost:6006/?path=/story/components-dialog--short-message&globals=theme:Delta+2027+Theme) | Separate existing story |
| [Form action](http://localhost:6006/?path=/story/components-forms-form-action--search&globals=theme:Delta+2027+Theme) | Separate existing story |
| [Radio](http://localhost:6006/?path=/story/components-forms-radio--default&globals=theme:Delta+2027+Theme) | Separate existing story |
| [Segmented control](http://localhost:6006/?path=/story/components-forms-segmented-control--default&globals=theme:Delta+2027+Theme) | Separate existing story |
| [Textarea](http://localhost:6006/?path=/story/components-forms-textarea--default&globals=theme:Delta+2027+Theme) | Separate existing story |
| [Tree](http://localhost:6006/?path=/story/components-navigation-tree--default&globals=theme:Delta+2027+Theme) | Separate existing story |
| [Notice](http://localhost:6006/?path=/story/components-notice-notice--info-notice&globals=theme:Delta+2027+Theme) | Separate existing story |
| [Snackbar](http://localhost:6006/?path=/story/components-notice-snackbar--snackbar&globals=theme:Delta+2027+Theme) | Separate existing story |

For the switch, open [Switch toggle](http://localhost:6006/?path=/story/components-forms-checkbox--switch&globals=theme:Delta+2027+Theme) in the Checkbox guide. The catalogue provides review paths; the [recorded review](#recorded-review) states what was actually checked.

## Try a local token override

Expand **Try a local token override** and enable the checkbox in either pane. Change the colour, then disable the checkbox to restore the theme. The preview names the exact CSS property it changes:

| Pane | Property changed |
| --- | --- |
| Existing Delta | `--mg-color-interactive`, a three-channel value |
| Delta 2027 | `--mg-delta-2027-semantic-action-default`, a complete CSS colour |

In Delta 2027, the override changes controls that read that property directly, such as primary buttons. Hover, pressed and disabled states retain their own tokens. Components that use a channel value calculated during the build do not automatically follow this browser-only change. Changing the older channel property does not rewrite the new source property either.

Use this control to check one property's effect. To change the theme's source values and rebuild both representations, follow [Edit values and override colours](DELTA-2027.md#edit-values-and-override-colours).

## Check token use without Mangrove components

The standalone example reads the complete exported token JSON with native HTML controls and its own small stylesheet. It loads no React code or Mangrove component stylesheet.

From this checkout, generate and serve the example:

```sh
node scripts/create-delta-token-consumer.mjs
node scripts/serve-storybook.mjs .cache/token-only-consumer 6105
```

Open [the token-only consumer](http://127.0.0.1:6105/). Compare the original values with a regenerated export after three edits to a temporary source copy: the accent becomes purple, medium weight changes from 500 to 700, and compact spacing changes from 12px to 16px. The repository's token files stay unchanged.

Edit the event name and save in either pane. Expand **Values used by this consumer** to inspect the values. Links on the page show the source edits, both complete JSON files, the independent consumer code and the build report with source hashes. This demonstrates source edits followed by rebuilding, which is different from the browser-only override above.

## Check the React Aria ComboBox separately

The native Select in the gallery does not demonstrate the React Aria popup. Use the separate [ComboBox proof guide](https://github.com/unisdr/undrr-mangrove/blob/khawkins98/delta-2027-combobox-proof/docs/DELTA-2027-COMBOBOX-PROOF.md), on `khawkins98/delta-2027-combobox-proof`, for its setup and review steps.

That proof checks a theme on the body with the normal body portal, and a theme on a wrapper with an explicit popup container inside it. It also covers checkmark-only selection, inset focus, disabled colours and keyboard operation. The main Delta 2027 branch does not contain those ComboBox changes; moving them into the production integration remains a separate decision.

## Run the browser checks against a production build

A development preview alone does not test the production CSS output. Build and serve Storybook in one terminal:

```sh
yarn build
node scripts/serve-storybook.mjs docs-build-temp 6102
```

Keep that server running. In a second terminal, install Playwright's Chromium if it is not already installed, then run the gate:

```sh
yarn playwright install chromium
DELTA_STORYBOOK_URL=http://127.0.0.1:6102 yarn test:delta-2027-browser
```

The gate checks rendered fields, buttons, selection, tabs, error and disabled states, card text, loaded fonts, Arabic/English font boundaries, forced colours with reduced motion, and mobile RTL. It also overrides typography, line-height, spacing and existing button properties, then checks the resulting styles. This catches rules that look correct initially but ignore later token changes. Set `DELTA_STORYBOOK_URL` to the actual server address if a different port is used.

## Recorded review

### Initial theme review

The following results and screenshots record the review on 17 November 2026 at [commit `f8fc7df4`](https://github.com/unisdr/undrr-mangrove/commit/f8fc7df441df616454d4ccd4a5cae92369d90b4e). They are evidence from that build, not a claim that every component or consuming application has been validated.

- [Desktop comparison, 1440 × 1000](review/delta-2027/desktop-comparison.png)
- [Mobile right-to-left fields and controls, 390 × 844](review/delta-2027/mobile-rtl.png)
- [Mobile right-to-left card and scrollable table, 390 × 844](review/delta-2027/mobile-rtl-content.png)

The visual review confirmed that both panes load their own theme, Inter and IBM Plex Mono load, fields remain editable, selection and checkbox changes work, and saving updates the preview confirmation. Arrow keys changed the selected tab. The local token override changed the new primary button and restored its original colour when disabled.

The mobile page stayed within 390px; the wider table scrolled within its own area. Review caught a clipped native select caused by padding intended for a larger field. The theme now uses horizontal field padding with a 32px control height.

These screenshots show normal colours. Orca's WebKit keyboard commands moved focus and activated controls but did not expose `:focus-visible`, so the screenshots do not establish focus-ring appearance. The separate Chromium gate verified keyboard focus, an inset field focus indicator, a visible system-colour outline under forced colours, and usable controls with reduced motion.

Independent red-team review found and verified fixes for field padding, pale colours used as card text, hero title contrast and aliases through complete-colour adapters. Production testing also caught a `:dir()` transform that substituted language selectors and missed English content deliberately displayed in RTL. Select spacing now uses explicit direction boundaries.

All 111 supplied typed values matched the portable export. The six existing single-theme stylesheet bundles remained byte-identical to the foundation baseline. The production build, lint, manifest validation and npm package assembly passed. Lint reported 0 errors and 26 existing warnings. Jest passed 223 suites and 5,113 tests, with one existing skip. The assembled package contained the new stylesheet, complete token exchange file, 19 webfont assets and both font licences.

### Expanded component review

A follow-up review on 17 November 2026 opened all 13 additional representative stories in production Storybook, using Orca's WebKit browser at 1200px desktop and 390px mobile RTL. Each loaded Delta 2027. The pages stayed within their viewport widths, and the card images loaded. The checks below cover those examples and actions, not every variant or state.

| Additional family | Checks performed |
| --- | --- |
| Empty state | Heading, explanation and actions fit on desktop and mobile RTL. |
| Tag | Static chips wrapped within the mobile viewport. |
| Book card | Complete cover and title remained visible. |
| Horizontal book card | Cover, metadata, text and action reflowed on mobile. |
| Horizontal card | Photo, text and action reflowed within the mobile viewport. |
| Dialog | Opened and closed with Escape. Desktop width was 480px; mobile RTL filled the 390 × 844 viewport after the native maximum-width fix. |
| Form action | Search text remained editable; Enter kept the value and stayed on the demonstration page. |
| Radio | The unchecked option could be selected and showed the accent fill. |
| Segmented control | Selection changed to Frequency; after focusing it, ArrowRight selected Exposure. |
| Textarea | Two entered lines were retained in the 80px field. |
| Tree | ArrowLeft collapsed and ArrowRight expanded the branch. Actual row rectangles showed 16px indentation, including the guide border, and 32px pitch in both LTR and mobile RTL after clearing the inherited list inset. |
| Notice | The information notice's heading and explanation remained readable and fitted the mobile viewport. |
| Snackbar | Opened as a 320px dark notification with white text; Close removed its status content on desktop and mobile RTL. Its retained placement is at the top of the viewport. |

The separately linked switch example also toggled successfully and rendered a 32 × 18px track. These visual checks do not establish focus-ring appearance across the added families, screen-reader behaviour or physical-device results. The Chromium regression gate records its own tested keyboard and media conditions.

## What remains outside this review

The review page shows a selection of the changed components. The theme toolbar also allows inspection of other existing component stories. This comparison does not validate the complete handoff, design approval, application compatibility or complete accessibility conformance.

The separate ComboBox proof has its own examples and checks. The native select shown in this gallery does not establish its checkmark selection, popup styling or theme inheritance. Production integration of the proof remains pending. The handoff also describes components that do not yet have a Mangrove equivalent. Their implementation and the remaining integration checks are recorded in [the tracker issue, #1495](https://github.com/unisdr/undrr-mangrove/issues/1495); this theme review does not change those acceptance criteria.
