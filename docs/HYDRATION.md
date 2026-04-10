# Hydration guide

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/HYDRATION.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-hydration-guide--docs).

Mangrove React components can be rendered into server-generated HTML containers. The server renders HTML with `data-mg-*` attributes; a wrapper script imports the component and `createHydrator`, which handles DOM querying, prop extraction, and React root lifecycle -- with automatic fallback to the original HTML on error.

Related: [GitHub issue #803](https://github.com/unisdr/undrr-mangrove/issues/803) · **Building a component?** See [Adding hydration support](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-hydration--docs) for the `fromElement` patterns, barrel files, and tests.

## How it works

1. Server renders an HTML container with data attributes (e.g., `<div data-mg-share-buttons data-main-label="Share">`)
2. A wrapper script imports `createHydrator`, the component, and its `fromElement` function
3. `createHydrator` finds matching containers, calls `fromElement` to extract props, and mounts the React component
4. On error, the original HTML is restored automatically

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
  import createHydrator from 'https://assets.undrr.org/static/mangrove/1.5.0/components/hydrate.js';
  import ShareButtons, { fromElement } from 'https://assets.undrr.org/static/mangrove/1.5.0/components/ShareButtons.js';
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

This is the Layer 3 pattern -- the consumer takes control of prop extraction while still using `createHydrator` for mount lifecycle.

---

## Architecture

| Layer | Responsibility | Lives in |
|-------|---------------|----------|
| **Layer 1** — `createHydrator` | DOM querying, error handling, `createRoot` lifecycle, hydration markers | `src/hydrate.js` (Mangrove) |
| **Layer 2** — `fromElement` | Extract component props from a DOM element | Per-component `*.fromElement.js` (Mangrove) |
| **Layer 3** — Consumer glue | Selector choice, prop overrides, site-specific logic | Consumer repo (Drupal, Astro, etc.) |

**Adding hydration support to a new component?** See the [Adding hydration support](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-hydration--docs) guide for the step-by-step walkthrough, `fromElement` patterns, barrel files, and tests.

## Related documentation

- [Getting started guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-getting-started-guide--docs) — overview of all integration approaches
- [Vanilla HTML/CSS guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-vanilla-html-and-css--docs) — CDN usage with import maps
- [React integration guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-react-integration--docs) — npm package usage
- [CDN reference](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-cdn-reference--docs) — all available CDN paths
- [Adding hydration support](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-hydration--docs) — contributor guide for adding `fromElement` and barrel files
