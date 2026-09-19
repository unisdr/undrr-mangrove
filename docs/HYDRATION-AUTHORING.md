# Adding hydration support

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/HYDRATION-AUTHORING.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-hydration--docs).

How to add layered hydration support so a Mangrove component can render into
server-generated HTML containers. For consumer usage, see the
[Hydration guide](https://mangrove.undrr.org/?path=/docs/getting-started-integration-hydration-guide--docs).

## Quick reference

Add hydration support by creating **3 files** and updating **1 config**:

```
ComponentName/
├── ComponentName.jsx              # (existing) React component
├── ComponentName.fromElement.js   # NEW — pure function: DOM element → props
├── ComponentName.hydrate.js       # NEW — barrel re-exporting component + fromElement
└── __tests__/
    └── ComponentName.fromElement.test.js  # NEW — tests for prop extraction
```

```js
// webpack.config.js — change the entry to point at the barrel
ComponentName: './stories/Components/ComponentName/ComponentName.hydrate.js',
```

### Rendering your own marker

A component may render the same `data-mg-*` marker its hydration selector
matches — `SyndicationSearchWidget` renders `data-mg-search-widget` on its root
so its pager can find the widget to scroll to. That is allowed: `createHydrator`
skips a match that sits inside a hydrated container the same selector matches,
so a re-scan cannot mount a second copy into your own output
([#1227](https://github.com/unisdr/undrr-mangrove/issues/1227)).

The skip is scoped to your own selector, not to every hydrated container.
`ScrollContainer` and `Drawer` read the consumer's markup in their
`fromElement` and re-emit it through `dangerouslySetInnerHTML`, so another
component's hydration host nested inside one must still hydrate — a scrolling
row of hydrated cards is `ScrollContainer`'s canonical use, and on Drupal that
nested markup is author-entered.

Two things follow for an author:

- If your component re-emits consumer markup, do not also render your own
  hydration marker into it. The runtime cannot tell the two apart, and a
  container of your own kind nested inside one of yours will not hydrate.
- If your component clears its container and renders only markup it wrote, a
  self-identifying root marker is a reasonable convention and the runtime
  tolerates it.

`createHydrator` is not the only auto-init mechanism with this shape. The
vanilla runtimes in `stories/assets/js/` scan for their own `data-mg-*`
markers, and five React components render those markers into their own output:
`ShowMore.jsx` (`data-mg-show-more`), `Tab.jsx` (`data-mg-js-tabs`),
`TableOfContents.jsx` (`data-mg-table-of-contents`), `OnThisPageNav.jsx`
(`data-mg-on-this-page-nav`) and `PreviewAccess.jsx` (`data-mg-preview-access`).
Those are safe because each runtime records which elements it has already
initialised and returns early on a second pass. Four of them write a per-element
`…Initialized` dataset flag (`mgShowMoreInitialized`,
`mgTableOfContentsInitialized`, `mgOnThisPageNavInitialized`,
`mgPreviewAccessInitialized`); `tabs.js` instead keys two module-scope
`WeakMap`s on the container and checks them in `isInitialised()`. A new vanilla
runtime needs one or the other. Prefer the dataset flag: it survives a second
copy of the runtime on the page, which a module-scope `WeakMap` does not.

`drawer.js` is the current worked example. It marks each enhanced container
with `data-mg-js-drawer-initialized` and skips anything already carrying it, so
`mgDrawer(scope)` can be called again after inserting markup without binding a
second set of listeners. It keeps its handles in a `WeakMap` under a
`Symbol.for('@undrr/mangrove/drawer@1')` registry as well, so a second copy of
the module can still destroy an instance the first one created — the dataset
flag is what makes the two copies agree, and the shared registry is what lets
either of them clean up.

A runtime with a marker of its own also needs to keep clear of the hydration
selector for the same component. `Drawer` has both paths: the React hydrator
matches `[data-mg-drawer]` and the vanilla module matches `[data-mg-js-drawer]`.
Two markers, so a container is driven by one path or the other and never both.
Reusing one marker for both would leave no way to tell which lifecycle a
container asked for.

---

## Step-by-step walkthrough

Example below uses a hypothetical `AlertBanner` with `message`, `variant`, and
`dismissible` props.

### 1. Write fromElement

Create `AlertBanner.fromElement.js` next to the component:

```js
export default function alertBannerFromElement(container) {
  const { dataset } = container;
  return {
    message: dataset.message || '',
    variant: dataset.variant || 'info',
    dismissible: dataset.dismissible === 'true',
  };
}
```

**Rules:**

- **Export a named default function.** The name should be `{componentName}FromElement` for grep-ability.
- **Use `container.dataset`** for data attributes. The browser auto-converts `data-my-prop` to `dataset.myProp`.
- **Provide defaults for every optional prop.** The function must return a valid props object even when every attribute is missing.
- **Keep it pure.** No side effects, no DOM mutation, no API calls. This function is called _before_ the container is cleared.

### 2. Create the barrel file

Create `AlertBanner.hydrate.js`:

```js
export { default } from './AlertBanner.jsx';
export { default as fromElement } from './AlertBanner.fromElement.js';
```

This makes the built bundle (`dist/components/AlertBanner.js`) export both the
component and `fromElement` from one import path.

**If the component uses a named export instead of default:**

```js
// Gallery uses `export function Gallery` not `export default`
export { Gallery, Gallery as default } from './Gallery.jsx';
export { default as fromElement } from './Gallery.fromElement.js';
```

### 3. Update webpack.config.js

Change the component's entry point from the `.jsx` to the `.hydrate.js` barrel:

```diff
 entry: {
-  AlertBanner: './stories/Components/AlertBanner/AlertBanner.jsx',
+  AlertBanner: './stories/Components/AlertBanner/AlertBanner.hydrate.js',
 },
```

Existing named exports are preserved through the barrel.

### 4. Write tests

Create `__tests__/AlertBanner.fromElement.test.js`:

```js
import fromElement from '../AlertBanner.fromElement';

function makeContainer(attrs = {}) {
  const el = document.createElement('div');
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(`data-${key}`, value);
  });
  return el;
}

describe('alertBannerFromElement', () => {
  it('returns defaults when no attributes are set', () => {
    const props = fromElement(makeContainer());
    expect(props).toEqual({
      message: '',
      variant: 'info',
      dismissible: false,
    });
  });

  it('extracts all attributes', () => {
    const props = fromElement(makeContainer({
      message: 'System maintenance tonight',
      variant: 'warning',
      dismissible: 'true',
    }));
    expect(props.message).toBe('System maintenance tonight');
    expect(props.variant).toBe('warning');
    expect(props.dismissible).toBe(true);
  });

  it('treats missing dismissible as false', () => {
    const props = fromElement(makeContainer({ message: 'Hello' }));
    expect(props.dismissible).toBe(false);
  });
});
```

Run with `yarn test __tests__/AlertBanner.fromElement.test.js`.

### 5. Build and verify

```bash
yarn build
ls dist/components/AlertBanner.js  # should exist
```

The built file should export both `default` (the component) and `fromElement`:

```bash
# Quick check — look for fromElement in the export statement
tail -c 200 dist/components/AlertBanner.js
# Should contain: export{... as default,... as fromElement}
```

---

## Common fromElement patterns

### Strings with defaults

```js
title: dataset.title || 'Untitled',
```

### Booleans (default true)

```js
// Attribute absent or any value except "false" → true
showArrows: dataset.showArrows !== 'false',
```

### Booleans (default false)

```js
// Only "true" → true, everything else → false
dismissible: dataset.dismissible === 'true',
```

### Integers with fallback

```js
resultsPerPage: dataset.resultsPerPage ? parseInt(dataset.resultsPerPage, 10) : 50,
```

### JSON arrays (with fallback)

```js
try {
  props.media = dataset.media ? JSON.parse(dataset.media) : [];
} catch {
  props.media = [];
}
```

### Optional props (`undefined` when absent)

```js
// Only include if explicitly set — lets the component use its own default
attribution: dataset.attribution || undefined,
```

### Content extraction from server-rendered HTML

```js
// Read innerHTML BEFORE createHydrator clears the container
// (fromElement is called before clearing)
const contentWrapper = container.querySelector('.mg-scroll__content');
if (contentWrapper) {
  props.children = Array.from(contentWrapper.children).map(child => child.outerHTML);
}
```

---

## Related docs

- [Component guide](COMPONENT-GUIDE.md) — step-by-step tutorial for building a component
- [Review checklist](REVIEW-CHECKLIST.md) — pre-submission component checklist
- [Hydration guide](https://mangrove.undrr.org/?path=/docs/getting-started-integration-hydration-guide--docs) — consumer-facing guide for using hydrated components
- [Architecture](ARCHITECTURE.md) — build system and distribution channels
- [Component standards](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs) — code standards reference
