# Layered hydration

Mangrove React components are rendered into server-generated HTML containers via hydration wrappers. This document describes the layered approach that replaces hand-written per-component boilerplate with a shared runtime.

Related: [GitHub issue #803](https://github.com/unisdr/undrr-mangrove/issues/803)

## Overview

Each consumer (Drupal, Astro, static sites) previously maintained its own wrapper script per component. These wrappers were ~75% identical boilerplate — querying the DOM, parsing props, handling errors, calling `createRoot()`. The layered approach splits this into three concerns:

| Layer | Responsibility | Lives in |
|-------|---------------|----------|
| **Layer 1** — `createHydrator` | DOM querying, error handling, `createRoot` lifecycle | `src/hydrate.js` (Mangrove) |
| **Layer 2** — `fromElement` | Extract component props from a DOM element | Per-component `*.fromElement.js` (Mangrove) |
| **Layer 3** — Consumer glue | Selector choice, prop overrides, site-specific logic | Consumer repo (Drupal, Astro, etc.) |

## API reference

### `createHydrator(config)`

Exported from `src/hydrate.js` and from the npm package as `createHydrator`.

```js
import createHydrator from '@undrr/undrr-mangrove/src/hydrate.js';
// or in Drupal: import createHydrator from './hydrate.js';
```

**Parameters:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `selector` | `string` | Yes | CSS selector for container elements |
| `component` | `Function \| object` | Yes | React component or module with `.default` |
| `fromElement` | `Function` | Yes | `(container: Element) => props` |
| `options.clearContainer` | `boolean` | No | Clear innerHTML before rendering (default: `true`) |
| `options.debugLabel` | `string` | No | Label for error messages (default: `selector`) |
| `options.onError` | `Function` | No | `(error, container) => void` callback |

**Returns:** `{ roots: ReactRoot[], update: Function, unmountAll: () => void }`

| Return property | Type | Description |
|----------------|------|-------------|
| `roots` | `ReactRoot[]` | All React roots created (accumulates across `update()` calls) |
| `update(context?)` | `(Element \| Document) => ReactRoot[]` | Scan a DOM subtree for new containers and mount them. Defaults to `document`. Returns only the newly created roots. |
| `unmountAll()` | `() => void` | Unmount all roots created by this hydrator |

**Behavior:**

1. Queries all elements matching `selector` within the context (defaults to `document`)
2. Skips containers already marked with `data-mg-hydrated="true"`
3. For each new container, saves the current `innerHTML`
4. Calls `fromElement(container)` to extract props
5. Clears the container (if `clearContainer` is true)
6. Creates a React root and renders the component with extracted props
7. Sets `data-mg-hydrated="true"` on the container to prevent double-mounting
8. On error: logs to console, restores saved HTML, calls `onError` if provided

### `update(context)` — re-scanning for new DOM

After the initial mount, call `update(context)` to hydrate containers added dynamically (AJAX, Gutenberg blocks, BigPipe chunks, modals). Only unhydrated containers within `context` are processed:

```js
const hydrator = createHydrator({ selector, component, fromElement });

// Later, when new DOM arrives:
hydrator.update(newDomSubtree);
```

This integrates directly with Drupal's `behaviors.attach` pattern:

```js
Drupal.behaviors.mangroveScrollContainer = {
  attach(context) {
    hydrator.update(context);
  },
};
```

### `fromElement(container)`

Each component exports a `fromElement` function from its `*.fromElement.js` file. This is a pure function that takes a DOM element and returns a props object.

```js
// stories/Components/Buttons/ShareButtons/ShareButtons.fromElement.js
export default function shareButtonsFromElement(container) {
  const { dataset } = container;
  return {
    labels: {
      mainLabel: dataset.mainLabel || 'Share this',
      onCopy: dataset.onCopyLabel || 'Link copied',
    },
    SharingSubject: dataset.sharingSubject || 'Sharing Link',
    SharingTextBody: dataset.sharingBody || '',
  };
}
```

## Before and after

### ShareButtons wrapper (Drupal)

**Before** (~39 lines):
```js
import React from "react";
import { createRoot } from "react-dom/client";
import ShareButtonsModule from "./ShareButtons.js";

const ShareButtons = ShareButtonsModule?.default ?? ShareButtonsModule;

document.querySelectorAll("[data-mg-share-buttons]").forEach((container) => {
  try {
    const labels = {
      mainLabel: "Share this",
      onCopy: "Link copied",
    };
    const props = {
      labels,
      SharingSubject: "Sharing Link",
      SharingTextBody: "",
    };
    const root = createRoot(container);
    root.render(React.createElement(ShareButtons, props));
  } catch (error) {
    console.error("ShareButtons hydration error:", error);
  }
});
```

**After** (3 lines):
```js
import createHydrator from "./hydrate.js";
import ShareButtons, { fromElement } from "./ShareButtons.js";
createHydrator({ selector: "[data-mg-share-buttons]", component: ShareButtons, fromElement });
```

### ScrollContainer wrapper (Drupal)

**Before** (~190 lines): Complex wrapper with DOMParser-based HTML extraction, error recovery, debug logging, and `window.UNDRR` configuration.

**After** (3 lines):
```js
import createHydrator from "./hydrate.js";
import ScrollContainer, { fromElement } from "./ScrollContainer.js";
createHydrator({ selector: "[data-mg-scroll-container]", component: ScrollContainer, fromElement });
```

### With consumer-specific overrides (Layer 3)

```js
import createHydrator from "./hydrate.js";
import ScrollContainer, { fromElement } from "./ScrollContainer.js";

createHydrator({
  selector: "[data-mg-scroll-container]",
  component: ScrollContainer,
  fromElement(el) {
    const props = fromElement(el);
    props.showArrows = true; // always show arrows on this site
    return props;
  },
});
```

## Adding hydration to a new component

1. **Create `ComponentName.fromElement.js`** next to the component:
   - Export a default function that takes a DOM element and returns a props object
   - Use `container.dataset` for data attributes
   - Use `container.innerHTML` or `container.querySelector()` for content extraction
   - Provide sensible defaults for all optional props

2. **Create `ComponentName.hydrate.js`** barrel file:
   ```js
   export { default } from './ComponentName.jsx';
   export { default as fromElement } from './ComponentName.fromElement.js';
   ```

3. **Update `webpack.config.js`** — point the component entry to the barrel:
   ```js
   ComponentName: './stories/Components/ComponentName/ComponentName.hydrate.js',
   ```

4. **Write tests** in `__tests__/ComponentName.fromElement.test.js`:
   - Test default prop values
   - Test extraction from data attributes
   - Test edge cases (missing attributes, empty content)

5. **Update consumer wrapper** to use `createHydrator`:
   ```js
   import createHydrator from "./hydrate.js";
   import Component, { fromElement } from "./ComponentName.js";
   createHydrator({ selector: "[data-mg-component]", component: Component, fromElement });
   ```

## Data attribute naming

HTML data attributes map to `dataset` properties via standard camelCase conversion:

| HTML attribute | `dataset` property |
|---------------|-------------------|
| `data-main-label` | `dataset.mainLabel` |
| `data-show-arrows` | `dataset.showArrows` |
| `data-step-size` | `dataset.stepSize` |
| `data-sharing-subject` | `dataset.sharingSubject` |

Use kebab-case in HTML, access as camelCase in JavaScript.

## Integration examples

### Vanilla HTML (CDN)

A standalone HTML page can use hydration with no build process. Include the React import map, then load `hydrate.js` and the component from the CDN:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/1.3.1/css/style.css">

  <!-- Import map for React 19 (must be before any module scripts) -->
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19.2.0",
        "react/jsx-runtime": "https://esm.sh/react@19.2.0/jsx-runtime",
        "react-dom": "https://esm.sh/react-dom@19.2.0",
        "react-dom/": "https://esm.sh/react-dom@19.2.0/"
      }
    }
  </script>
</head>
<body>
  <!-- Server-rendered container with data attributes -->
  <section data-mg-share-buttons
    data-main-label="Share this"
    data-on-copy-label="Link copied"
    data-sharing-subject="Sharing Link">
  </section>

  <!-- Hydrate in three lines -->
  <script type="module">
    import createHydrator from 'https://assets.undrr.org/static/mangrove/1.3.1/components/hydrate.js';
    import ShareButtons, { fromElement } from 'https://assets.undrr.org/static/mangrove/1.3.1/components/ShareButtons.js';
    createHydrator({ selector: '[data-mg-share-buttons]', component: ShareButtons, fromElement });
  </script>
</body>
</html>
```

This replaces the 30+ lines of manual `createRoot()` boilerplate shown in the [Vanilla HTML/CSS guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-vanilla-html-and-css--docs).

### Drupal theme integration

In the Drupal `undrr_common` theme, Mangrove components are loaded as ES modules via an import map injected by `mangrove-components.js`. The built component bundles and `hydrate.js` are copied to `undrr_common/js/mangrove-components/` by the watch script.

**Current approach (legacy wrappers):**

Each component has a hand-written `*-wrapper.js` in `undrr_common/js/mangrove-components/` that duplicates DOM querying, error handling, and `createRoot()` logic. ShareButtons-wrapper.js is ~39 lines; ScrollContainer-wrapper.js is ~190 lines.

**New approach (layered hydration):**

Replace each wrapper with a small file that handles both initial load and dynamic content (AJAX, BigPipe, Views infinite scroll):

```js
// undrr_common/js/mangrove-components/ShareButtons-wrapper.js
import createHydrator from "./hydrate.js";
import ShareButtons, { fromElement } from "./ShareButtons.js";

const hydrator = createHydrator({
  selector: "[data-mg-share-buttons]",
  component: ShareButtons,
  fromElement,
});

// Re-scan when Drupal adds new DOM (AJAX, BigPipe, modals)
Drupal.behaviors.mangroveShareButtons = {
  attach(context) {
    hydrator.update(context);
  },
};
```

```js
// undrr_common/js/mangrove-components/ScrollContainer-wrapper.js
import createHydrator from "./hydrate.js";
import ScrollContainer, { fromElement } from "./ScrollContainer.js";

const hydrator = createHydrator({
  selector: "[data-mg-scroll-container]",
  component: ScrollContainer,
  fromElement,
});

Drupal.behaviors.mangroveScrollContainer = {
  attach(context) {
    hydrator.update(context);
  },
};
```

The `data-mg-hydrated` marker prevents double-mounting — `update(context)` only processes containers that haven't been hydrated yet, so it's safe to call on every `behaviors.attach`.

**Steps to migrate a Drupal wrapper:**

1. Ensure `hydrate.js` is in `undrr_common/js/mangrove-components/` (copied by `yarn watch --copy` or `yarn build`)
2. Replace the wrapper file contents with the pattern above
3. No changes needed to `undrr_common.libraries.yml` — the wrapper filename stays the same
4. No Drupal cache clear needed — JS modules are not aggregated

**Twig template side:**

The Twig template renders the container with data attributes. No change needed — the `data-mg-*` selectors are the same:

```twig
{# ShareButtons — templates/field/share-buttons.html.twig #}
<section data-mg-share-buttons
  data-main-label="{{ 'Share this'|t }}"
  data-on-copy-label="{{ 'Link copied'|t }}"
  data-sharing-subject="{{ node.label }}"
  data-sharing-body="{{ 'Check out this link: '|t }}">
</section>
```

Labels are localized server-side via Drupal's `|t` filter and passed to the React component via data attributes — something the old hardcoded wrappers couldn't do.

### Drupal Gutenberg blocks

Gutenberg blocks that consume Mangrove components benefit from the same pattern. A block's `save()` function renders the container HTML with data attributes; the hydration runtime mounts the React component on the frontend.

**Block save output (server-rendered HTML stored in content):**

```html
<!-- wp:undrr/scroll-container {"height":"300px","showArrows":true} -->
<div data-mg-scroll-container
  data-height="300px"
  data-show-arrows="true"
  class="wp-block-undrr-scroll-container">
  <div class="mg-scroll__content">
    <!-- InnerBlocks content rendered by Gutenberg -->
  </div>
</div>
<!-- /wp:undrr/scroll-container -->
```

**Frontend hydration (loaded via libraries.yml):**

```js
import createHydrator from "./hydrate.js";
import ScrollContainer, { fromElement } from "./ScrollContainer.js";
createHydrator({ selector: "[data-mg-scroll-container]", component: ScrollContainer, fromElement });
```

This means Gutenberg blocks and Twig templates share the same hydration code — no separate wrapper per integration point.

**Block edit function (editor):**

In the Gutenberg editor, the component is rendered directly as React (since the editor is already a React app). The `fromElement` function is not used in the editor — it's only for frontend hydration.

```jsx
// blocks/scroll-container/edit.js
import ScrollContainer from '@undrr/undrr-mangrove/stories/Components/ScrollContainer/ScrollContainer';

export default function Edit({ attributes, setAttributes }) {
  return (
    <ScrollContainer
      height={attributes.height}
      showArrows={attributes.showArrows}
    >
      <InnerBlocks />
    </ScrollContainer>
  );
}
```

### Astro / Vite

Import directly from the npm package:

```js
import { createHydrator } from '@undrr/undrr-mangrove';
import ScrollContainer, { fromElement } from '@undrr/undrr-mangrove/stories/Components/ScrollContainer/ScrollContainer.hydrate';

createHydrator({
  selector: '[data-mg-scroll-container]',
  component: ScrollContainer,
  fromElement,
});
```

## Components with hydration support

| Component | Selector | Data attributes |
|-----------|----------|----------------|
| ShareButtons | `[data-mg-share-buttons]` | `data-main-label`, `data-on-copy-label`, `data-sharing-subject`, `data-sharing-body` |
| ScrollContainer | `[data-mg-scroll-container]` | `data-height`, `data-min-width`, `data-item-width`, `data-padding`, `data-show-arrows`, `data-step-size` |
| QuoteHighlight | `[data-mg-quote-highlight]` | `data-quote`, `data-attribution`, `data-attribution-title`, `data-image-src`, `data-image-alt`, `data-background-color`, `data-variant`, `data-alignment` |
| Gallery | `[data-mg-gallery]` | `data-media` (JSON), `data-initial-index`, `data-show-thumbnails`, `data-thumbnail-position`, `data-show-arrows`, `data-arrow-style`, `data-show-description`, `data-enable-keyboard`, `data-loop` |
| IconCard | `[data-mg-icon-card]` | `data-items` (JSON), `data-centered`, `data-variant` |
| StatsCard | `[data-mg-stats-card]` | `data-stats` (JSON), `data-title`, `data-variant`, `data-class-name` |
| MegaMenu | `[data-mg-mega-menu]` | `data-delay`, `data-hover-delay`, `data-sections` (JSON, optional — most consumers provide sections via API) |
| SyndicationSearchWidget | `[data-mg-search-widget]` | `data-search-endpoint`, `data-results-per-page`, `data-default-query`, `data-default-sort`, `data-display-mode`, `data-show-*` booleans, `data-default-filters` (JSON), `data-allowed-types` (JSON) |

## Related documentation

- [Getting started guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-a-getting-started-guide--docs) — overview of all integration approaches
- [Vanilla HTML/CSS guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-vanilla-html-and-css--docs) — CDN usage with import maps
- [React integration guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-react-integration--docs) — npm package usage
- [CDN reference](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-cdn-reference--docs) — all available CDN paths
- [Component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-contribution-guide--docs) — how to add new components
- [DEVELOPMENT.md](DEVELOPMENT.md) — development setup and component file structure
