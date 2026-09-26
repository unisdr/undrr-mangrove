# React Aria consumer example

This example bundles **the assembled npm package**, not the Storybook source. The page explains the data, behaviour and presentation layers alongside a working form, tabs and an in-memory CRUD workflow. It models a React island on a server-rendered Drupal page: a small API response supplies taxonomy terms, while Mangrove owns the Drawer, ComboBox, Tab, native Select and TextInput controls, button styles, CSS and theme. For convenience the standalone demo renders its whole page with React; a Drupal site would mount only the island. The JSON file is a fixture; a real integration replaces the `fetch` URL and maps its API response to `{ id, label }` items.

From the repository root:

```sh
yarn example:aria:build
yarn example:aria:serve
```

Open `http://127.0.0.1:6101/`. The build assembles the same `npm-package/` directory used for publishing, then webpack resolves `@undrr/undrr-mangrove/*` imports to that directory. A released consumer removes the local alias and installs the package normally. React and React Aria Components are supplied by the host.

## What to check

1. Open the Drawer, submit the empty required field and confirm the translated error appears and is connected to the input.
2. Type part of a hazard name, choose an option with the keyboard, and save. The submitted value is the taxonomy ID.
3. Reopen, open the suggestions and press Escape twice. The first press closes suggestions and keeps focus in the field; the second closes Drawer and returns focus to the opener.
4. Switch across the five Mangrove themes with the visible Theme control. The portaled lists stay inside their themed host or Drawer and follow its colours and typography.
5. Switch to Arabic. The host and popup become RTL, and the label, help, error and options are translated. French is a second LTR translation check.
6. At a narrow viewport or 200% zoom, the field and popup should stay usable without horizontal page overflow. In forced-colours mode, check focus and selected-option visibility.
7. Change the theme while looking at the live controls. `--mg-color-interactive` feeds the ComboBox's selected-option tint through `--mg-control-option-selected` and the active Mangrove Tab indicator through `--mg-tab-indicator--active`. Use the arrow keys to change tabs. Load `/#mg-tabs__section-consumer-integration-2` to check that a URL fragment selects the second panel.
8. Choose a hazard in the searchable filter and check that the record table filters. Clear the filter, sort a column, and use keyboard arrows to navigate the React Aria table.
9. Add a record, edit it, and delete it. The editor uses Mangrove TextInput, ComboBox, native Select, Drawer and button classes. Delete opens a short native modal with the record name and Cancel focused first; Escape cancels. Records live in memory and reset on reload.

`app.css` imports `style-all.css` for runtime brand switching and places scoped ComboBox CSS in a named layer before utilities. The theme and language controls use Mangrove's published native `Select`; the actions use its `mg-button` classes. A small unlayered site rule represents an existing host stylesheet. This checks the package in a realistic cascade without asking the host to use the broad `.react-aria-*` research skin. React Aria supplies ComboBox interaction here; using its stock Button or Select classes would introduce a second public control pattern for the same tasks.

The example does not claim that every Drupal form uses React. Server-rendered controls continue to work without this island or the React Aria dependency.

## Why the CRUD table uses React Aria

Mangrove's existing `.mg-table` is suitable for presenting server-rendered data. This example needs an interactive collection: sortable column headers and keyboard navigation across records. [React Aria Table](https://react-aria.adobe.com/Table) provides that behaviour in this optional React island. The table layout CSS is scoped to this example; it is not a new published Mangrove Table API. Record editing continues to use Mangrove's published fields, Drawer, status labels and button classes. The short delete confirmation uses a native `<dialog>` with Mangrove tokens, following the existing ShareButtons pattern; it is not a new public Dialog API. The broader Storybook CRUD spike remains research, while this page exercises the boundary with a smaller working workflow and the assembled package.

## Why the Tabs stay Mangrove

The live Tab is Mangrove's published React wrapper over its existing vanilla JavaScript tabs runtime. That runtime can also enhance server-rendered markup without mounting React. It already supplies ARIA semantics, keyboard navigation, RTL, hash links and mobile stacking. [React Aria Tabs](https://react-aria.adobe.com/Tabs) offers other modes, including vertical orientation and manual activation, but those capabilities alone do not justify a second public Tabs API. If a consumer needs them, an implementation should preserve the existing `Tab`/`.mg-tabs` contract and first prove parity with its Drupal and React use cases.

The Tab panels in this example contain only fixed, authored HTML strings. The published Tab renders panel HTML without sanitising it; a consumer passing CMS content must filter that content upstream, as described in the [Tab documentation](../../stories/Components/Tab/Tab.mdx).
