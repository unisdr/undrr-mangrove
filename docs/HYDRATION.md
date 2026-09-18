# Hydration guide

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/HYDRATION.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/getting-started-integration-hydration-guide--docs).

Mangrove hydrates React components into server-rendered containers (`data-mg-*`). Use `createHydrator` to query DOM nodes, extract props with `fromElement`, manage roots, and recover original HTML on mount errors.

Related: [GitHub issue #803](https://github.com/unisdr/undrr-mangrove/issues/803) · Component authoring guide: [Adding hydration support](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-hydration--docs).

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
    "react": "https://esm.sh/react@19.3.0",
    "react-dom": "https://esm.sh/react-dom@19.3.0",
    "react-dom/": "https://esm.sh/react-dom@19.3.0/"
  }}
</script>

<section data-mg-share-buttons data-main-label="Share this"></section>

<script type="module">
  import createHydrator from 'https://assets.undrr.org/mangrove/2.0.0-rc.2/components/hydrate.js';
  import ShareButtons, { fromElement } from 'https://assets.undrr.org/mangrove/2.0.0-rc.2/components/ShareButtons.js';
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
- Skips a match **inside** a hydrated container that the same `selector` also matches. This is what makes it safe for a component to render the same `data-mg-*` marker its hydration selector matches — `SyndicationSearchWidget` does, so its pager can find the widget root to scroll to. Without the rule, `update()` mounted a second widget inside the first ([#1227](https://github.com/unisdr/undrr-mangrove/issues/1227))
- A **different** component's hydration host nested inside a hydrated container still hydrates. The skip is deliberately not "anything below a hydrated container": `ScrollContainer` and `Drawer` read the consumer's markup in their `fromElement` and re-emit it through `dangerouslySetInnerHTML`, so a host an author nested in one reaches the DOM as React output that the component did not write. A scrolling row of hydrated cards is `ScrollContainer`'s canonical use. Hydrate the outer component first, then the inner one — the inner hosts survive the round trip and are ordinary targets ([#1234](https://github.com/unisdr/undrr-mangrove/pull/1234))
- The one arrangement that cannot work is nesting a container inside a hydrated container of the *same* kind. A marker the component rendered itself and one it re-emitted for the consumer are the same DOM node to the runtime, so the ambiguous case is resolved in favour of not duplicating
- **Appending to, or refilling, a hydrated container is a no-op for a host of that container's own kind**, for the same reason: a match that lands under a hydrated container of its own kind is skipped, and `update()` reports no new roots rather than raising. To replace a hydrated container's contents, call `unmountAll()`, write the new markup, then call `update()` again. To add a container of the same kind, put it outside every hydrated container of that kind — a host of a different kind nested inside one, such as a card inside a scroll container, hydrates normally
- Saves original `innerHTML` before rendering for rollback
- Applies React root error hooks:
  - `onCaughtError` and `onUncaughtError`: `console.error` + optional `onError`
  - `onRecoverableError`: `console.warn`
- Prevents `useId()` collisions across multiple independent roots: each root's `identifierPrefix` is the selector-based slug (override with `options.identifierPrefix`) plus a page-wide root number, so prefixes stay unique across `update()` calls, across hydrators, and when a page loads more than one copy of the runtime (all copies must include this change; an older copy does not read the shared counter)

## Supported hydrated components

| Component | Tier | Selector | Key attributes |
|-----------|------|----------|---------------|
| CopyButton | Simple | `[data-mg-copy-button]` | `data-text-to-copy`, `data-aria-label`, `data-tooltip-label`, `data-copied-label`, `data-variant`, `data-size`, `data-labels` (JSON) |
| Drawer | Simple/Medium | `[data-mg-drawer]` | `id` (required, so triggers can find it), `data-is-open`, `data-position`, `data-title`, `data-backdrop`, `data-is-floating-panel`, `data-close-label`, plus `data-mg-drawer-trigger` on the trigger button |
| Notice | Simple | `[data-mg-notice]` | `data-title`, `data-description`, `data-variant`, `data-heading-level`, `data-is-compact`, `data-is-prominent`, `data-is-overlay`, `data-is-dismissible`, `data-dismiss-label` |
| ServiceNotice | Simple | `[data-mg-service-notice]` | `data-title`, `data-description`, `data-status`, `data-retry` (dispatches `mg-service-notice:retry`), `data-countdown-seconds`, `data-max-auto-retries`, `data-status-url`, `data-labels` (JSON) |
| Tree | Medium | `[data-mg-tree]` | Nested `<ul>`/`<li>` list (`data-id`, `data-expanded` or `aria-expanded="true"`, `data-selected`, child `<a href>` with optional `aria-current`), `data-aria-label`, `data-aria-labelledby`, `data-toggle-icon`, `data-guides`, `data-selected-id`, `data-class-name` |
| TextCta | Medium | `[data-mg-text-cta]` | `data-eyebrow`, `data-headline`, `data-headline-level`, `data-headline-size`, `data-text`, `data-buttons` (JSON), `data-variant`, `data-tone`, `data-layout`, `data-centered` |
| ShareButtons | Simple | `[data-mg-share-buttons]` | `data-main-label`, `data-on-copy-label`, `data-sharing-subject`, `data-sharing-body` |
| QuoteHighlight | Simple | `[data-mg-quote-highlight]` | `data-quote`, `data-attribution`, `data-variant`, `data-alignment` |
| ScrollContainer | Medium | `[data-mg-scroll-container]` | `data-height`, `data-show-arrows`, `data-step-size`, `.mg-scroll__content` children |
| Gallery | Medium | `[data-mg-gallery]` | `data-media` (JSON), `data-show-thumbnails`, `data-arrow-style` |
| IconCard | Medium | `[data-mg-icon-card]` | `data-items` (JSON), `data-centered`, `data-variant` |
| StatsCard | Medium | `[data-mg-stats-card]` | `data-stats` (JSON), `data-title`, `data-variant` |
| UserFeedback | Simple | `[data-mg-user-feedback]` | `data-question`, `data-yes-label`, `data-no-label`, `data-report-issue-label`, `data-feedback-url`, `data-confirmation-before-link`, `data-confirmation-separator`, `data-confirmation-link`, `data-confirmation-after-link`. There is no submission endpoint: Mangrove itself records nothing |
| MegaMenu | Complex | `[data-mg-mega-menu]` | `data-delay`, `data-hover-delay`, `data-sections` (JSON, optional) |
| SyndicationSearchWidget | Complex | `[data-mg-search-widget]` | `data-search-endpoint`, `data-results-per-page`, `data-default-filters` (JSON) |
| Pager | Medium | `[data-mg-pager]` | `data-page`, `data-total-pages`, `data-show-jump-to`, `data-aria-label` |

> **Note on Micro-Interactions**: For lightweight interactions like `CopyButton`, Mangrove also provides a **zero-dependency vanilla JS script** (`js/copy-button.js` in the npm package, or `/js/copy-button.js` on the CDN) with 0 kB React runtime requirement. Use React hydration when your architecture standardizes on `createHydrator`, or use the standalone script for pure HTML/PHP/Twig sites. The `.mg-switch` pending state has no React component: use `js/switch-pending.js` (see the Checkbox docs).

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

- [Getting started guide](https://mangrove.undrr.org/?path=/docs/getting-started-getting-started-guide--docs)
- [Vanilla HTML/CSS guide](https://mangrove.undrr.org/?path=/docs/getting-started-integration-vanilla-html-and-css--docs)
- [React integration guide](https://mangrove.undrr.org/?path=/docs/getting-started-integration-react-integration--docs)
- [CDN reference](https://mangrove.undrr.org/?path=/docs/getting-started-integration-cdn-reference--docs)
- [Adding hydration support](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-hydration--docs)
