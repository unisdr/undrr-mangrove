# Review Delta 2027 locally

Delta 2027 is a separate theme based on Anders's v0.7.2 handoff. Existing Delta keeps its current appearance and import path.

Start Storybook after installing dependencies and generating the tokens:

```sh
yarn install --immutable
yarn build:tokens
yarn storybook
```

Open [Compare themes](http://localhost:6006/?path=/story/design-decisions-delta-2027--compare-themes). The two panes render identical content using the actual existing Delta and Delta 2027 stylesheets. Each pane is a separate document, so one theme's font and root styles cannot affect the other.

For more space, open [Same components](http://localhost:6006/?path=/story/design-decisions-delta-2027--same-components&globals=theme:Delta+2027+Theme). Use **Global theme for components** in the toolbar to switch between **DELTA Resilience Theme** and **Delta 2027 Theme**. The new theme is also available on the existing component stories.

## What to try

1. Compare the page colour, typography, action buttons and disabled button.
2. Edit **Event name**, choose a hazard and toggle the checkbox. Check the error and disabled fields.
3. Activate **Save draft**. Its confirmation appears only in that preview; it does not save data elsewhere.
4. Use Tab to reach the buttons and fields. Check that keyboard focus is visible. In **Record sections**, use the arrow keys to move between tabs.
5. Follow **View summary** to the existing VerticalCard. Compare its border, radius, padding and type.
6. Compare the records table and status indicators. The table can scroll locally when space is limited.
7. Use the direction toolbar to force right-to-left layout. Resize to a mobile viewport and zoom to check reflow. The sample content remains English.
8. Expand **Try a local token override** and enable the checkbox in either pane. Change the colour, then disable the checkbox to restore the theme. The preview shows the exact CSS property it changes. Hover, pressed and disabled states retain their separate tokens; this is not a full recolouring tool.

The override changes one property in each theme: the existing Delta channel value `--mg-color-interactive`, or the new complete-colour value `--mg-delta-2027-semantic-action-default`. These representations remain distinct. The new full-colour source updates controls that read it directly, such as primary buttons. Existing channel adapters are materialized at build time, so components that read those adapters do not automatically follow a runtime source override. A runtime edit to the older adapter role does not rewrite the new source role either. Complete application recolouring needs an explicit mapping for both outputs.

The comparison uses existing React components for buttons, fields, checkbox, tabs and card. Table and status labels use their published HTML and CSS patterns. Story-only layout styles arrange these examples; they are not part of the library's public component API.

## Fonts

Delta 2027 uses Inter for interface text and IBM Plex Mono for identifiers. The font files are self-hosted in `stories/assets/fonts/delta-2027/` and published under `fonts/delta-2027/` in the npm package. The theme does not request Google Fonts at runtime.

That directory also contains each font's SIL Open Font License and `sources.json`, which records the downloaded files, source URLs and checksums. Keep the licence files with the fonts when redistributing them.

Sass consumers can configure `$font-path-delta-2027` through the theme entry point when fonts are served from a different location. Its default is `../fonts/delta-2027`, relative to the compiled stylesheet. Check the browser's network panel for missing font files if the text falls back to a system font.

## Recorded visual review

Screenshots captured on 17 November 2026:

- [Desktop comparison, 1440 × 1000](review/delta-2027/desktop-comparison.png)
- [Mobile right-to-left fields and controls, 390 × 844](review/delta-2027/mobile-rtl.png)
- [Mobile right-to-left card and scrollable table, 390 × 844](review/delta-2027/mobile-rtl-content.png)

The browser review confirmed that each comparison pane loads its own theme, Inter and IBM Plex Mono load successfully, fields remain editable, selection and checkbox changes work, and saving updates the preview confirmation. Tab selection also worked with arrow keys. The local token override changed the new primary button and restored its original colour when disabled.

The mobile page stayed within 390px; the wider table scrolled inside its own region. Review caught a clipped native select caused by padding intended for a larger field. The theme now uses horizontal field padding with a 32px control height.

These screenshots cover normal colours. Orca's WebKit keyboard commands moved focus and activated controls, but did not expose `:focus-visible`, so they do not establish focus-ring appearance. The separate Chromium browser gate verifies native keyboard focus, an inset field focus indicator, a visible system-colour outline under forced colours, and usable controls with reduced motion. These normal-colour images do not show those media states.

## Scope of the review

This page makes the theme mapping visible. It does not establish design approval, production application compatibility or complete accessibility conformance. The separate React Aria ComboBox pilot remains an integration step; a native select here does not demonstrate its popup treatment or portal inheritance.

Delta's handoff also describes components that do not yet have an equivalent in Mangrove. Adding the theme does not create those components automatically. The implementation notes record which mappings and treatments are included and which still need a product or integration decision.

## Automated checks

After building and serving Storybook, run:

```sh
DELTA_STORYBOOK_URL=http://127.0.0.1:6102 yarn test:delta-2027-browser
```

The gate checks actual rendered fields, buttons, selection, tabs, error and disabled states, card text, Arabic/Latin font boundaries, forced colours with reduced motion, and mobile RTL. It caught a production transform that approximated `:dir()` using language selectors, missing English content deliberately displayed in RTL. Select spacing now uses explicit direction boundaries.

Independent red-team review also found and verified fixes for field padding, pale colours mapped to card ink, hero title contrast and aliases through complete-colour adapters. All 111 supplied typed values match the portable export, and the six existing single-theme stylesheet bundles remain byte-identical to the foundation baseline.

Final local validation: production build, lint (0 errors; 26 existing warnings), manifest validation and npm package assembly pass. The full Jest run passes 223 suites and 5,113 tests, with one existing skip. The assembled package includes the new stylesheet, complete token exchange file, 19 webfont assets and both font licences.
