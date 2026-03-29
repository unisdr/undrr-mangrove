# Component guide

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/COMPONENT-GUIDE.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-step-by-step--docs).

A step-by-step tutorial for building a new component in Mangrove from scratch. For code standards (React patterns, BEM, PropTypes, JSDoc), see the [component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs) in Storybook.

## Decision tree: what files do I need?

```
Does the component need React?
│
├─ No (CSS/HTML only)
│   → JSX + SCSS + stories + tests + MDX + AI manifest entry
│
└─ Yes
    │
    ├─ npm only (consumed via `import { X } from '@undrr/undrr-mangrove'`)
    │   → All of the above + add export to src/index.js
    │
    └─ Drupal integration (rendered into server HTML via data attributes)
        → All of the above + fromElement.js + hydrate.js + webpack entry
          + fromElement tests + AI manifest SAMPLE_PROPS (optional)
```

## Reference component: Pager

The Pager component (`stories/Components/Pager/`) demonstrates every file a Drupal-integrated component needs:

```
stories/Components/Pager/
├── Pager.jsx                       # React component
├── Pager.stories.jsx               # Storybook stories (CSF3)
├── Pager.mdx                       # Documentation
├── pager.scss                      # Styles
├── Pager.fromElement.js            # Layer 2: DOM → props extraction
├── Pager.hydrate.js                # Barrel re-exporting component + fromElement
├── components/                     # Sub-components (PagerList, PagerRange, PagerJump)
└── __tests__/
    ├── Pager.test.jsx              # Component tests (jest-axe, RTL)
    └── Pager.fromElement.test.js   # Prop extraction tests
```

Refer to these files as you follow each step below.

## Step 1: Create the React component

Create `stories/Components/{Category}/{ComponentName}/{ComponentName}.jsx` as a functional component with hooks, destructured props with defaults, JSDoc, PropTypes, and BEM class names prefixed with `mg-`.

> **Accessibility first**: Before writing JSX, review the [accessibility requirements](ACCESSIBILITY.md) for semantic HTML, keyboard interaction patterns, and ARIA attributes. It's much easier to build in accessibility from the start than to add it later.

See `Pager.jsx` for a complete example and the [component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs) for React and PropTypes standards.

## Step 2: Create the SCSS file

Create `stories/Components/{Category}/{ComponentName}/component-name.scss` using SCSS variables from `_variables.scss` and BEM naming. For z-index: use `$mg-z-index-*` tokens for global stacking (fixed, sticky, portaled elements) and derive backdrops with `$token - 1` arithmetic; use raw values with comments for local stacking inside a component's own stacking context — see [Design decisions/Z-index layers](https://unisdr.github.io/undrr-mangrove/?path=/docs/design-decisions-z-index-layers--docs). See the [component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs) for styling guidelines.

**Then add the import to `stories/assets/scss/_components.scss`:**

```scss
@import "../../Components/{Category}/{ComponentName}/component-name";
```

This is required — without it, your styles won't be included in any theme's compiled CSS.

## Step 3: Write Storybook stories

Create `stories/Components/{Category}/{ComponentName}/{ComponentName}.stories.jsx` using CSF3 object syntax (not `Template.bind({})`). Set `component` in the default export for autodocs.

Use `{ args: {} }` for simple stories, `{ render: (args) => ... }` when you need custom JSX wrapping. See the [component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs) for story format details.

### Storybook ID derivation

The Storybook path becomes a kebab-case ID used in URLs and AI manifest references:

```
title: 'Components/Cards/Vertical card'  →  components-cards-vertical-card
```

## Step 4: Write tests

Create `stories/Components/{Category}/{ComponentName}/__tests__/{ComponentName}.test.jsx` with React Testing Library and `jest-axe` for accessibility. See [TESTING.md](TESTING.md) for patterns and `Pager.test.jsx` for a complete example.

## Step 5: Write MDX documentation

Create `stories/Components/{Category}/{ComponentName}/{ComponentName}.mdx` with overview, usage examples, props table, CSS class reference, and changelog. See `Pager.mdx` for the full structure and the [component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs) for documentation requirements.

**Add a review checklist reference** right after the `<Meta>` block. Adjust the relative path based on file depth (`../../../` for depth-3 components like `Pager/`, `../../../../` for depth-4 like `Cards/Card/`):

```mdx
<Meta of={ComponentNameStories} />

> If you are creating or modifying this component, see [docs/REVIEW-CHECKLIST.md](../../../../docs/REVIEW-CHECKLIST.md) for Mangrove's component standards.

# Component name
```

## Step 6: Add hydration files (Drupal integration only)

If the component will render into server-generated HTML containers, create `fromElement.js`, `hydrate.js`, and `fromElement` tests. See [Adding hydration support](HYDRATION-AUTHORING.md) for the step-by-step walkthrough, `fromElement` patterns, barrel file format, and `Pager.fromElement.js` / `Pager.fromElement.test.js` for reference implementations.

## Step 7: Register for build

### webpack entry (Drupal-integrated components)

In `webpack.config.js`, add to the second config block's `entry` object:

```js
entry: {
  // ... existing entries
  MyComponent: './stories/Components/{Category}/MyComponent/MyComponent.hydrate.js',
},
```

Point to `.hydrate.js` if the component has hydration files, otherwise `.jsx`.

### npm export

In `src/index.js`, add the export:

```js
export { default as MyComponent } from '../stories/Components/{Category}/MyComponent/MyComponent';
```

See the [distribution channels table](ARCHITECTURE.md#component-distribution-channels) for how registration affects where a component is available.

## Step 8: AI manifest (optional)

The AI manifest provides machine-readable component metadata for coding agents. How much you need to do depends on your component:

**Vanilla HTML component (auto-rendered):**
If your component renders cleanly in Node.js (no `window`/`document` APIs):
1. Add an entry to `scripts/ai-manifest/component-data.js` with at least `{ description: '...' }`
2. Add a `COMPONENT_IDS` entry in `scripts/ai-manifest/generate-ai-manifest.js`
3. Add a `buildSampleProps()` entry if the component needs props to render meaningful HTML
4. The build will auto-generate HTML examples from your component

**Vanilla HTML component (curated HTML):**
If your component uses browser APIs or the example is a multi-component composition:
1. Add an entry to `scripts/ai-manifest/component-data.js` with `description`, `cssClasses`, and `examples`

**React-only component:**
1. Add an entry to `REQUIRES_REACT` in `scripts/ai-manifest/component-data.js` with a note explaining why React is needed

Run `yarn validate-manifest` to verify your entries.

## Step 9: Verify

Run through this checklist before submitting:

```bash
# Tests pass (including new fromElement tests)
yarn test

# Build succeeds (component appears in dist/components/ if registered)
yarn build

# Linting passes
yarn lint

# AI manifest valid (if you updated manifest data)
yarn validate-manifest
```

### Final checklist

Run through the [review checklist](REVIEW-CHECKLIST.md) before submitting.

## Schema-first development workflow

If your component maps to one of the content archetypes in `schemas/` (card, statistic, quote, share-action, gallery, text-cta, navigation), follow this workflow so the component stays aligned with the canonical data contract.

### 1. Author the schema

Create or update the relevant `schemas/*.schema.js` using field helpers from `schemas/helpers.js`. Define canonical field names and types. Document any variations between archetypes in the `meta` object.

```js
// schemas/my-content.schema.js
import { schemaDocument, textField, imageObject } from './helpers.js';

export default schemaDocument({
  id: 'my-content',
  title: 'My content',
  description: 'Brief description of this content archetype.',
  schema: {
    type: 'object',
    properties: {
      title: textField('Heading text'),
      image: imageObject(),
    },
    required: ['title'],
  },
  meta: {
    implementors: ['MyComponent'],
  },
});
```

Run `yarn build:schemas --validate` to compile and validate the schema.

### 2. Implement the component

Use the exact field names from the schema as React props. Do not invent alternative names or abbreviations. If the schema says `image.src`, the prop is `image.src` — not `imgSrc`, `imageSrc`, or `img`.

### 3. Write stories

Use schema-valid data fixtures in story `args`. This documents the expected shape and ensures Storybook renders from real-world-compatible data.

```jsx
export const Default = {
  args: {
    title: 'Card title',
    image: { src: '/img.jpg', alt: 'Description' },
  },
};
```

### 4. Write contract tests

Create `ComponentName.contract.test.jsx` in `__tests__/`. A contract test validates the fixture against the schema with AJV, then renders and asserts that key content appears.

```jsx
// __tests__/MyComponent.contract.test.jsx
import { render, screen } from '@testing-library/react';
import { createAjv } from '../../../../schemas/ajv-setup.js';
import schema from '../../../../schemas/dist/my-content.schema.json';
import { MyComponent } from '../MyComponent';

const validate = createAjv().compile(schema);

const fixture = {
  title: 'Card title',
  image: { src: '/img.jpg', alt: 'Description' },
};

describe('MyComponent contract', () => {
  it('fixture is schema-valid', () => {
    expect(validate(fixture)).toBe(true);
  });

  it('renders schema-valid fixture', () => {
    render(<MyComponent {...fixture} />);
    expect(screen.getByText('Card title')).toBeInTheDocument();
  });
});
```

### 5. Run validation

```bash
yarn build:schemas && yarn test
```

The build step is required first because contract tests import from `schemas/dist/`, which is gitignored and generated at build time.

## Related documentation

- [Review checklist](REVIEW-CHECKLIST.md) — pre-submission component checklist
- [Architecture](ARCHITECTURE.md) — build system, distribution channels, and Drupal integration
- [Adding hydration support](HYDRATION-AUTHORING.md) — `fromElement` patterns, barrel files, and tests
- [Hydration guide](HYDRATION.md) — consumer-facing `createHydrator` API and integration examples
- [Testing guide](TESTING.md) — unit, visual, and accessibility testing
- [Writing guidelines](WRITING-SHORT.md) — UX writing standards
- [Migration guide: schema-aligned props (v2)](MIGRATION-SCHEMA-V2.md) — breaking prop changes and upgrade path
- [Component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs) — code standards reference (Storybook)
