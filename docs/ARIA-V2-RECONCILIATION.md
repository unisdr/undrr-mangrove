# Mangrove 2 and React Aria: the first production-shaped slice

This work tests a narrower contract than the original #1088 global React Aria skin. Mangrove owns theme values and public `mg-` classes. React Aria supplies interaction in a React-only ComboBox. The existing Drupal, vanilla and native Select contracts stay in place. The [component ownership decision](REACT-ARIA-BOUNDARY.md) governs further adoption.

## Boundaries

| Layer | Contract in this change |
| --- | --- |
| Mangrove themes | Additive `--mg-control-*` semantic roles in the five normal CSS themes and standalone brand token files. They alias existing Mangrove 2 colours and form surfaces. |
| React control | `components/ComboBox.js` uses React Aria behaviour and stable Mangrove classes. `css/combo-box.css` styles only this control. The broad stock-class skin stays in Storybook research and is not published. |
| App | Supplies translated strings, item data, controlled state if needed, and a portal container when the theme is scoped below `<body>`. It chooses the cascade order. |

## Try the pilot

In a React application, install `react-aria-components`, import a Mangrove theme (or one `css/tokens/{brand}.css` file), then `css/combo-box.css`, and render `components/ComboBox.js`. React and React Aria Components are optional peers so applications share one runtime as more controls are added. The scoped CSS is about 4 KB; a page using only Mangrove's Drupal or vanilla components does not load the React entry.

The [ComboBox Storybook page](../stories/Components/Forms/ComboBox/ComboBox.mdx) has the prop contract and a Tailwind 4 layer import recipe. The existing CRUD fixture now uses this wrapper for its searchable hazard field, so reviewers can test it beside Mangrove controls.

## Evidence and next decision

The build resolves the CSS custom properties against all five theme files, the focused component tests cover input, disabled state and resting accessibility, and the browser fixture checks keyboard selection, runtime MCR2030 theme values, RTL and a narrow viewport. This fixture is a consumer simulation; a product application has not imported the published entry yet.

Keep #1088 in draft until a consuming product tries this slice with its own Tailwind and legacy CSS, translates it, tests scoped portals, and checks the five themes, zoom and forced-colours mode. Further React Aria controls should be proposed under the ownership rule, with one Mangrove API per user need.
