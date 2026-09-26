# React Aria inside Mangrove

Mangrove's public contract is the component name, props or HTML attributes, `mg-` classes, theme tokens, accessibility baseline and documented behaviour. React Aria can implement part of a React component's interaction. It does not name a second set of Mangrove components.

Mangrove serves server-rendered Drupal and vanilla JavaScript, and some Drupal pages also mount React components. MegaMenu and ShareButtons are examples of React Mangrove components used within Drupal integrations; their data may come from Drupal APIs or server-side builders. Drupal is therefore not a React-free consumer. The boundary is at each component: a server-rendered form or other vanilla control must remain usable without loading React, while a React island can use React Aria behind its Mangrove API. Shared tokens and component contracts connect both paths.

## One control for each user need

| User need | Mangrove contract | React Aria decision |
| --- | --- | --- |
| Ordinary action | `.mg-button` and native `<button>` | Do not publish a parallel React Aria Button. A React wrapper may use React Aria internally if it preserves the same variants, classes and semantics. |
| Fixed single choice | Native `Select` / `.mg-form-select` | Keep the native control. A custom listbox with the same job needs a demonstrated requirement and a migration plan for the existing API. |
| Searchable or free-text choice | `ComboBox` / `.mg-combobox` | New, distinct capability. React Aria provides filtering, keyboard interaction and collection behaviour behind Mangrove's API. |
| Tabs | `Tab` / `.mg-tabs` and its vanilla runtime | Keep one public tab contract. Any React Aria implementation must preserve it and prove parity across themes and hydration contexts before replacing the current engine. |
| Drawer or modal panel | `Drawer` / `.mg-drawer` | Keep one public drawer contract. Do not add a second modal or drawer just because React Aria offers Modal and Dialog primitives. A future generic Dialog needs its own user need and must reuse Mangrove's overlay, focus and theme decisions. |
| Date entry, rich collections and other gaps | Define a Mangrove component first | Use React Aria when its behaviour addresses the demonstrated need; publish only the Mangrove wrapper and its scoped CSS. |

`aria/react-aria.css` remains a Storybook research artifact and is excluded from the npm and CDN package. It targets React Aria's default classes across many controls and would create a second visual API beside the existing `mg-` controls. Those default classes also disappear when an application supplies `className`, so they are a weak contract for consumer code. See [React Aria's styling guide](https://react-aria.adobe.com/styling).

## Adding a React Aria implementation

1. State the user need and compare the existing Mangrove component. If the job is the same, extend or replace that component behind its current public API; document migration only when the API must change. If the job differs, give it a distinct, user-facing name such as ComboBox.
2. Define props, rendered states, `mg-` classes and neutral `--mg-*` tokens in Mangrove. Keep `.react-aria-*`, `--mg-aria-*`, and React Aria prop names out of the public contract unless there is a documented reason. Class selectors must still work when a consumer supplies its own `className`.
3. Import React Aria only in an optional React component entry. The package declares it as an optional peer, so a CSS-only or server-rendered control does not install it. A Drupal page that mounts this React entry supplies the React Aria peer, just as another React host would. React islands share one runtime as more controls are added.
4. Publish scoped CSS for that component. Check cascade behaviour in an actual consumer, including Tailwind layers and legacy unlayered CSS. Use Mangrove's focus mixins, typography roles and theme values.
5. For overlays, define portal placement and theme inheritance with the consumer. The current ComboBox has a `popoverContainer` escape hatch because React Aria's portal container API is unstable. The first Escape closes suggestions inside Mangrove's Drawer; check focus and stacking order in the consuming host. Before adding a second overlay-based control, decide on one shared portal policy rather than repeating escape hatches.
6. Verify the five themes, keyboard, pointer and touch, validation, Arabic/RTL, zoom, forced colours and reduced motion as applicable. Keep both the React and vanilla/Drupal paths usable where Mangrove already supports both.

The [ComboBox](../stories/Components/Forms/ComboBox/ComboBox.mdx) is the first candidate under this policy. It is still a pilot until a product application exercises the published package and its CSS cascade. The broad gallery remains useful for evaluating primitives; it is not a catalogue of promised Mangrove components.
