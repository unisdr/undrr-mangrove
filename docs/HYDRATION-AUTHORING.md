# Adding hydration support

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/HYDRATION-AUTHORING.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-hydration--docs).

How to add layered hydration support to a Mangrove component so it can be rendered into server-generated HTML containers. For how consumers use hydrated components, see the [Hydration guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-hydration-guide--docs).

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

## Related documentation

- [Component guide](COMPONENT-GUIDE.md) — step-by-step tutorial for building a component
- [Review checklist](REVIEW-CHECKLIST.md) — pre-submission component checklist
- [Hydration guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-integration-hydration-guide--docs) — consumer-facing guide for using hydrated components
- [Architecture](ARCHITECTURE.md) — build system and distribution channels
- [Component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs) — code standards reference
