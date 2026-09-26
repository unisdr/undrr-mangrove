# Mangrove 2 and React Aria: the first production-shaped slice

This work tests a narrower contract than the original #1088 global React Aria skin. Mangrove owns theme values and public `mg-` classes. React Aria supplies interaction in a React-only ComboBox. The existing Drupal, vanilla and native Select contracts stay in place. The [component ownership decision](REACT-ARIA-BOUNDARY.md) governs further adoption.

## Boundaries

| Layer | Contract in this change |
| --- | --- |
| Mangrove themes | Additive `--mg-control-*` semantic roles in the five normal CSS themes and standalone brand token files. They alias existing Mangrove 2 colours and form surfaces. |
| React control | `components/ComboBox.js` uses React Aria behaviour and stable Mangrove classes. `css/combo-box.css` styles only this control. The broad stock-class skin stays in Storybook research and is not published. |
| App | Supplies translated strings, item data, controlled state if needed, and a portal container when the theme is scoped below `<body>`. It chooses the cascade order. |

## Try the pilot

In a React application or a React island on a Drupal page, install `react-aria-components`, import a Mangrove theme (or one `css/tokens/{brand}.css` file), then `css/combo-box.css`, and render `components/ComboBox.js`. React and React Aria Components are optional peers so hosts share one runtime as more controls are added. The scoped CSS is about 4 KB; a server-rendered form or vanilla control does not load the React entry.

The [ComboBox Storybook page](../stories/Components/Forms/ComboBox/ComboBox.mdx) has the prop contract and a Tailwind 4 layer import recipe. The [packaged consumer example](../examples/react-aria-consumer/README.md) loads Mangrove from its assembled npm package, supplies taxonomy-like data from a JSON API, and nests ComboBox in the existing Drawer. It lets reviewers exercise validation, keyboard selection, portal placement, theme switching and translation in a realistic React island. The broad stock-class galleries remain available only with `yarn storybook:aria-research` or `yarn build:storybook:aria-research`; normal Storybook builds do not import their research skin. The obsolete standalone React Aria token partials were removed from normal token generation.

## Evidence and next decision

The build resolves the CSS custom properties against all five theme files, the focused component tests cover input, disabled state and resting accessibility, and the packaged example checks keyboard selection, runtime MCR2030 theme values, RTL and a narrow viewport. This remains a consumer simulation against the assembled package; a product application has not yet imported a published release. Forced-colours and 200% zoom still need product browser checks.

Keep #1088 in draft until a consuming product tries this slice with its own Tailwind and legacy CSS, translates it, tests scoped portals, and checks the five themes, zoom and forced-colours mode. Further React Aria controls should be proposed under the ownership rule, with one Mangrove API per user need.
