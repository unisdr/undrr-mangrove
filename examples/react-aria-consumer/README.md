# React Aria consumer example

This example bundles **the assembled npm package**, not the Storybook source. It represents a React island on a server-rendered Drupal page: a small API response supplies taxonomy terms, while Mangrove owns the Drawer, ComboBox, native Select controls, button styles, CSS and theme. The JSON file is a fixture; a real integration replaces the `fetch` URL and maps its API response to `{ id, label }` items.

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
4. Switch across the five Mangrove themes while the Drawer is open. The portaled list remains inside the themed Drawer body and follows its colours and typography.
5. Switch to Arabic. The host and popup become RTL, and the label, help, error and options are translated. French is a second LTR translation check.
6. At a narrow viewport or 200% zoom, the field and popup should stay usable without horizontal page overflow. In forced-colours mode, check focus and selected-option visibility.

`app.css` imports `style-all.css` for runtime brand switching and places scoped ComboBox CSS in a named layer before utilities. The theme and language controls use Mangrove's published native `Select`; the actions use its `mg-button` classes. A small unlayered site rule represents an existing host stylesheet. This checks the package in a realistic cascade without asking the host to use the broad `.react-aria-*` research skin. React Aria supplies ComboBox interaction here; using its stock Button or Select classes would introduce a second public control pattern for the same tasks.

The example does not claim that every Drupal form uses React. Server-rendered controls continue to work without this island or the React Aria dependency.
