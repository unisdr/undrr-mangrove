# Hydration guide

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/HYDRATION.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-hydration-guide--docs).

Mangrove hydrates React components into server-rendered containers (`data-mg-*`). Use `createHydrator` to query DOM nodes, extract props with `fromElement`, manage roots, and recover original HTML on mount errors.

Related: [GitHub issue #803](https://github.com/unisdr/undrr-mangrove/issues/803) · Component authoring guide: [Adding hydration support](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-hydration--docs).

## Hydration flow

1. Server renders container HTML (for example: `<div data-mg-share-buttons data-main-label="Share">`)
2. Wrapper imports `createHydrator`, component, and `fromElement`
3. `createHydrator` finds matching containers, builds props via `fromElement`, mounts React
4. If rendering fails, previous HTML is restored automatically

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
  import createHydrator from 'https://assets.undrr.org/mangrove/2.0.0-beta.1/components/hydrate.js';
  import ShareButtons, { fromElement } from 'https://assets.undrr.org/mangrove/2.0.0-beta.1/components/ShareButtons.js';
  createHydrator({ selector: '[data-mg-share-buttons]', component: ShareButtons, fromElement });
</script>
```

### Drupal

```js
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

## `createHydrator` API

Exported from `src/hydrate.js` and package root.

```js
import createHydrator from '@undrr/undrr-mangrove/src/hydrate.js';
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `selector` | `string` | Yes | CSS selector for containers |
| `component` | `Function \| object` | Yes | React component or module with `.default` |
| `fromElement` | `Function` | Yes | `(container: Element) => props` |
| `options.clearContainer` | `boolean` | No | Clear `innerHTML` before render (default: `true`) |
| `options.debugLabel` | `string` | No | Error label (default: `selector`) |
| `options.onError` | `Function` | No | `(error, container) => void` callback |
| `options.identifierPrefix` | `string` | No | `useId()` prefix override |

Returns: `{ roots, update, unmountAll }`

| Property | Type | Description |
|----------|------|-------------|
| `roots` | `ReactRoot[]` | Roots created across calls |
| `update(context?)` | `(Element?) => ReactRoot[]` | Mounts new matches in `context` or `document` |
| `unmountAll()` | `() => void` | Unmounts roots and clears hydration markers |

## Runtime behavior and caveats

- Skips already hydrated containers via `data-mg-hydrated="true"`
- Saves original `innerHTML` before rendering for rollback
- Applies React root error hooks:
  - `onCaughtError` and `onUncaughtError`: `console.error` + optional `onError`
  - `onRecoverableError`: `console.warn`
- Prevents `useId()` collisions across multiple independent roots by deriving unique `identifierPrefix` values (override with `options.identifierPrefix`)

## Supported hydrated components

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

Tier definitions:
- **Simple**: scalar attributes
- **Medium**: scalar + JSON blobs
- **Complex**: wrapper supplies non-DOM props (API/config)

## Bridging consumer-specific HTML contracts

If consumer markup differs from component `fromElement` expectations (for example Drupal Gutenberg attributes like `data-mg-gallery-data`), keep `createHydrator` and replace only prop extraction in the consumer wrapper.

```js
import createHydrator from "@mangrove/hydrate";
import { Gallery } from "@mangrove/Gallery";

function fromElement(container) {
  const dataAttr = container.getAttribute("data-mg-gallery-data");
  const optionsAttr = container.getAttribute("data-mg-gallery-options");
  const media = dataAttr ? JSON.parse(dataAttr) : [];
  const options = optionsAttr ? JSON.parse(optionsAttr) : {};

  return {
    media,
    showThumbnails: options.showThumbnails !== false,
    showArrows: options.showArrows !== false,
  };
}

createHydrator({ selector: "[data-mg-gallery]", component: Gallery, fromElement });
```

This is Layer 3: consumer-owned mapping logic on top of shared hydration lifecycle.

## Architecture layers

| Layer | Responsibility | Lives in |
|-------|---------------|----------|
| Layer 1 — `createHydrator` | DOM query, root lifecycle, error recovery, hydration markers | `src/hydrate.js` |
| Layer 2 — `fromElement` | DOM-to-props extraction | Component `*.fromElement.js` |
| Layer 3 — Consumer glue | Selectors, prop overrides, site-specific mapping | Consumer repo |

## Related docs

- [Getting started guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-getting-started-guide--docs)
- [Vanilla HTML/CSS guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-vanilla-html-and-css--docs)
- [React integration guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-react-integration--docs)
- [CDN reference](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-cdn-reference--docs)
- [Adding hydration support](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-hydration--docs)
