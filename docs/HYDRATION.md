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

**Returns:** `{ roots: ReactRoot[], unmountAll: () => void }`

**Behavior:**

1. Queries all elements matching `selector`
2. For each container, saves the current `innerHTML`
3. Calls `fromElement(container)` to extract props
4. Clears the container (if `clearContainer` is true)
5. Creates a React root and renders the component with extracted props
6. On error: logs to console, restores saved HTML, calls `onError` if provided

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

## Consumer integration

### Drupal (import map)

Drupal uses an import map to resolve bare specifiers. The built `dist/components/hydrate.js` is copied alongside other component bundles. The import map in `mangrove-components.js` needs one addition:

```json
{
  "imports": {
    "react": "https://esm.sh/react@19",
    "react-dom/client": "https://esm.sh/react-dom@19/client",
    "./hydrate.js": "./hydrate.js"
  }
}
```

### Astro / Vite

Import directly from the npm package:

```js
import { createHydrator } from '@undrr/undrr-mangrove';
import ScrollContainer from '@undrr/undrr-mangrove/stories/Components/ScrollContainer/ScrollContainer';
import { fromElement } from '@undrr/undrr-mangrove/stories/Components/ScrollContainer/ScrollContainer.fromElement';

createHydrator({
  selector: '[data-mg-scroll-container]',
  component: ScrollContainer,
  fromElement,
});
```
