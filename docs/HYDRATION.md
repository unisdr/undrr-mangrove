# Layered hydration

> **Single source:** This file is rendered both on [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/HYDRATION.md) and in the [Storybook docs](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-hydration-guide--docs). Edit this file — changes appear in both places automatically.

Mangrove React components are rendered into server-generated HTML containers via hydration wrappers. This document describes the layered approach that replaces hand-written per-component boilerplate with a shared runtime.

Related: [GitHub issue #803](https://github.com/unisdr/undrr-mangrove/issues/803)

## Quick reference

To add hydration support to a component, you create **3 files** in Mangrove and update **1 config**:

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

The consumer (Drupal, Astro, static HTML) then writes a short wrapper:

```js
// Drupal — uses @mangrove/* import map aliases (resolved by mangrove-components.js)
import createHydrator from "@mangrove/hydrate";
import Component, { fromElement } from "@mangrove/ComponentName";
createHydrator({ selector: "[data-mg-component-name]", component: Component, fromElement });
```

---

## Step-by-step walkthrough

This walks through adding hydration to a hypothetical `AlertBanner` component that accepts `message`, `variant`, and `dismissible` props.

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

This lets the built bundle (`dist/components/AlertBanner.js`) export both the component and `fromElement` from a single import.

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

Existing named exports are preserved — the barrel re-exports everything the component did.

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

### 6. Write the consumer wrapper

In the Drupal theme (`undrr_common/js/mangrove-components/`):

```js
// AlertBanner-wrapper.js — uses @mangrove/* import map aliases
import createHydrator from "@mangrove/hydrate";
import AlertBanner, { fromElement } from "@mangrove/AlertBanner";

const hydrator = createHydrator({
  selector: "[data-mg-alert-banner]",
  component: AlertBanner,
  fromElement,
});

// Re-scan when Drupal adds new DOM (AJAX, BigPipe, modals)
Drupal.behaviors.mangroveAlertBanner = {
  attach(context) {
    hydrator.update(context);
  },
};
```

The corresponding HTML:

```html
<div data-mg-alert-banner
  data-message="System maintenance tonight"
  data-variant="warning"
  data-dismissible="true">
</div>
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

### JSON arrays

```js
try {
  props.media = dataset.media ? JSON.parse(dataset.media) : [];
} catch {
  props.media = [];
}
```

### Optional props (undefined when absent)

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

## When the consumer's HTML doesn't match

The `fromElement` functions use clean attribute names (`data-media`, `data-stats`). But existing consumer HTML may use different conventions (Drupal Gutenberg blocks use `data-mg-gallery-data`, `data-mg-stats-card-data`, etc.).

In this case, the consumer wrapper provides its own `fromElement` that bridges the existing HTML contract:

```js
// Gallery-wrapper.js — Drupal's attributes differ from the generic fromElement
import createHydrator from "@mangrove/hydrate";
import { Gallery } from "@mangrove/Gallery";

function fromElement(container) {
  // Drupal outputs two JSON blobs instead of individual attributes
  const dataAttr = container.getAttribute("data-mg-gallery-data");
  const optionsAttr = container.getAttribute("data-mg-gallery-options");
  const media = dataAttr ? JSON.parse(dataAttr) : [];
  const options = optionsAttr ? JSON.parse(optionsAttr) : {};

  return {
    media,
    showThumbnails: options.showThumbnails !== false,
    showArrows: options.showArrows !== false,
    // ...
  };
}

createHydrator({ selector: "[data-mg-gallery]", component: Gallery, fromElement });
```

This is the Layer 3 pattern — the consumer takes control of prop extraction while still using `createHydrator` for mount lifecycle.

---

## Architecture

| Layer | Responsibility | Lives in |
|-------|---------------|----------|
| **Layer 1** — `createHydrator` | DOM querying, error handling, `createRoot` lifecycle, hydration markers | `src/hydrate.js` (Mangrove) |
| **Layer 2** — `fromElement` | Extract component props from a DOM element | Per-component `*.fromElement.js` (Mangrove) |
| **Layer 3** — Consumer glue | Selector choice, prop overrides, site-specific logic | Consumer repo (Drupal, Astro, etc.) |

## createHydrator API

Exported from `src/hydrate.js` and from the npm package as `createHydrator`.

```js
import createHydrator from '@undrr/undrr-mangrove/src/hydrate.js';
// or in Drupal: import createHydrator from './hydrate.js';
```

**Config:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `selector` | `string` | Yes | CSS selector for container elements |
| `component` | `Function \| object` | Yes | React component or module with `.default` |
| `fromElement` | `Function` | Yes | `(container: Element) => props` |
| `options.clearContainer` | `boolean` | No | Clear innerHTML before rendering (default: `true`) |
| `options.debugLabel` | `string` | No | Label for error messages (default: `selector`) |
| `options.onError` | `Function` | No | `(error, container) => void` callback |
| `options.identifierPrefix` | `string` | No | Prefix for React `useId()` hooks (default: derived from `selector`) |

**Returns:** `{ roots, update, unmountAll }`

| Property | Type | Description |
|----------|------|-------------|
| `roots` | `ReactRoot[]` | All React roots created (accumulates across `update()` calls) |
| `update(context?)` | `(Element?) => ReactRoot[]` | Scan for new containers, mount them. Scopes to `context` if provided, otherwise `document`. Returns newly created roots. |
| `unmountAll()` | `() => void` | Unmount all roots and clear hydration markers |

**Lifecycle:**

1. Queries all elements matching `selector`
2. Skips containers with `data-mg-hydrated="true"`
3. Saves `innerHTML` (for error recovery)
4. Calls `fromElement(container)` to extract props
5. Clears the container (if `clearContainer` is true)
6. Creates a React root with `identifierPrefix` and error callbacks, renders the component
7. Sets `data-mg-hydrated="true"` on success
8. On error: logs to console, restores saved HTML, calls `onError` if provided

**Error handling:**

Each React root is created with three error callbacks:

- **`onCaughtError`** — fires when an Error Boundary catches an error. Logs to `console.error` and calls `onError` if provided.
- **`onUncaughtError`** — fires when an error is thrown and not caught by any Error Boundary. Logs to `console.error` and calls `onError` if provided.
- **`onRecoverableError`** — fires when React automatically recovers from an error (e.g., hydration mismatch fallback). Logs to `console.warn`.

These callbacks give you structured error reporting for runtime rendering failures, complementing the try/catch that handles errors during mount (e.g., `fromElement` throwing).

**`useId()` collision prevention:**

Drupal pages often render many independent React roots. Each root receives a unique `identifierPrefix` (derived from the selector and container index) so that React's `useId()` hook never produces duplicate IDs across roots. You can override this with `options.identifierPrefix` if needed.

**Drupal integration with `update(context)`:**

```js
const hydrator = createHydrator({ selector, component, fromElement });

// Re-scan when Drupal injects new DOM
Drupal.behaviors.mangroveComponent = {
  attach(context) {
    hydrator.update(context);
  },
};
```

---

## Components with hydration support

| Component | Tier | Selector | Key attributes |
|-----------|------|----------|---------------|
| ShareButtons | Simple | `[data-mg-share-buttons]` | `data-main-label`, `data-on-copy-label`, `data-sharing-subject`, `data-sharing-body` |
| QuoteHighlight | Simple | `[data-mg-quote-highlight]` | `data-quote`, `data-attribution`, `data-variant`, `data-alignment` |
| ScrollContainer | Medium | `[data-mg-scroll-container]` | `data-height`, `data-show-arrows`, `data-step-size`, `.mg-scroll__content` children |
| Gallery | Medium | `[data-mg-gallery]` | `data-media` (JSON), `data-show-thumbnails`, `data-arrow-style` |
| IconCard | Medium | `[data-mg-icon-card]` | `data-items` (JSON), `data-centered`, `data-variant` |
| StatsCard | Medium | `[data-mg-stats-card]` | `data-stats` (JSON), `data-title`, `data-variant` |
| MegaMenu | Complex | `[data-mg-mega-menu]` | `data-delay`, `data-hover-delay`, `data-sections` (JSON, optional) |
| SyndicationSearchWidget | Complex | `[data-mg-search-widget]` | `data-search-endpoint`, `data-results-per-page`, `data-default-filters` (JSON) |
| Pager | Medium | `[data-mg-pager]` | `data-page`, `data-total-pages`, `data-show-jump-to`, `data-aria-label` |

**Tier meanings:**

- **Simple** — all props from individual data attributes, no JSON, minimal defaults
- **Medium** — mix of individual attributes and JSON blobs for arrays/objects
- **Complex** — `fromElement` extracts only DOM-available props; consumer wrapper provides the rest (API data, config modifiers, etc.)

---

## Integration examples

### Vanilla HTML (CDN)

```html
<script type="importmap">
  { "imports": {
    "react": "https://esm.sh/react@19.2.4",
    "react-dom": "https://esm.sh/react-dom@19.2.4",
    "react-dom/": "https://esm.sh/react-dom@19.2.4/"
  }}
</script>

<section data-mg-share-buttons data-main-label="Share this"></section>

<script type="module">
  import createHydrator from 'https://assets.undrr.org/static/mangrove/1.3.3/components/hydrate.js';
  import ShareButtons, { fromElement } from 'https://assets.undrr.org/static/mangrove/1.3.3/components/ShareButtons.js';
  createHydrator({ selector: '[data-mg-share-buttons]', component: ShareButtons, fromElement });
</script>
```

### Drupal

```js
// Uses @mangrove/* import map aliases (resolved by mangrove-components.js in undrr_common theme)
import createHydrator from "@mangrove/hydrate";
import Component, { fromElement } from "@mangrove/ComponentName";

const hydrator = createHydrator({
  selector: "[data-mg-component-name]",
  component: Component,
  fromElement,
});

Drupal.behaviors.mangroveComponentName = {
  attach(context) {
    hydrator.update(context);
  },
};
```

### Astro / Vite

```js
import { createHydrator } from '@undrr/undrr-mangrove';
import ScrollContainer, { fromElement } from '@undrr/undrr-mangrove/stories/Components/ScrollContainer/ScrollContainer.hydrate';

createHydrator({
  selector: '[data-mg-scroll-container]',
  component: ScrollContainer,
  fromElement,
});
```

---

## Related documentation

- [Getting started guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-a-getting-started-guide--docs) — overview of all integration approaches
- [Vanilla HTML/CSS guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-vanilla-html-and-css--docs) — CDN usage with import maps
- [React integration guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-react-integration--docs) — npm package usage
- [CDN reference](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-cdn-reference--docs) — all available CDN paths
- [Component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-contribution-guide--docs) — how to add new components
- [DEVELOPMENT.md](DEVELOPMENT.md) — development setup and component file structure
