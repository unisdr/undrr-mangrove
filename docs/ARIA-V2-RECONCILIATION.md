# Mangrove 2 and React Aria: the first production-shaped slice

This stacked change tests a narrower contract than #1088's global React Aria skin. Mangrove owns theme values and public `mg-` classes. React Aria supplies interaction in a React-only ComboBox. The existing Drupal, vanilla and native Select contracts stay in place.

## Boundaries

| Layer | Contract in this change |
| --- | --- |
| Mangrove themes | Additive `--mg-control-*` semantic roles in the five normal CSS themes and standalone Aria brand token files. They alias existing Mangrove 2 colours and form surfaces. |
| React control | `components/AriaComboBox.js` uses React Aria behaviour and stable Mangrove classes. `aria/combo-box.css` styles only this control. Neither normal theme CSS nor the pilot requires the broad `aria/react-aria.css` skin. |
| App | Supplies translated strings, item data, controlled state if needed, and a portal container when the theme is scoped below `<body>`. It chooses the cascade order. |

## Try the pilot

In a React application, import a Mangrove theme (or one `aria/tokens/{brand}.css` file), then `aria/combo-box.css`, and render `components/AriaComboBox.js`. The package entry bundles React Aria, with React external, so it is opt-in. The CSS is about 4 KB; the optional JavaScript entry is about 194 KB before gzip and 58 KB gzipped in the current build. A page using only Mangrove's Drupal or vanilla components does not load it.

The [Aria ComboBox Storybook page](../stories/Components/Forms/AriaComboBox/AriaComboBox.mdx) has the prop contract and a Tailwind 4 layer import recipe. The existing CRUD fixture now uses this wrapper for its searchable hazard field, so reviewers can test it beside Mangrove controls.

## Evidence and next decision

The build resolves the CSS custom properties against all five theme files, the focused component tests cover input, disabled state and resting accessibility, and the browser fixture checks keyboard selection, runtime MCR2030 theme values, RTL and a narrow viewport. This fixture is a consumer simulation; a product application has not imported the published entry yet.

Keep #1088 in draft until a consuming product tries this slice with its own Tailwind and legacy CSS, translates it, tests scoped portals, and checks the five themes, zoom and forced-colours mode. That result should determine whether more components or any portion of the broad stock-class skin belongs in a release.
