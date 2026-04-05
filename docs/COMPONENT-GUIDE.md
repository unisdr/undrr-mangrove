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

Import Storybook doc blocks from `@storybook/addon-docs/blocks` (not `@storybook/blocks`, which was removed in Storybook 9):

```mdx
import { Meta, Canvas } from '@storybook/addon-docs/blocks';
```

### Write for two audiences

Component MDX docs serve two very different readers. Structure content so each can get what they need without wading through what they don't.

**Consumers** (people integrating the component) scan, not read. Lead with a one-sentence description, a working `<Canvas>` example, and a props table. One sentence of context is enough — they don't need to know how it works internally.

**Maintainers** (contributors, reviewers, on-call debuggers) need the "why": design decisions, edge cases, known limitations, and historical context. This belongs at the end of the document, or in a clearly labelled section.

Structure your MDX in this order:
1. What it does (one sentence)
2. Live examples (`<Canvas>`)
3. How to use it (usage snippet + props table)
4. Behaviors and constraints
5. Accessibility
6. Implementation notes / known limitations (maintainer depth)
7. Server-rendered / CDN usage (if applicable)
8. Changelog

Avoid explaining implementation internals in the usage or props sections. If you find yourself writing "internally, this component does X because Y", that belongs at the bottom or in a code comment — not in the consumer-facing usage guide.

See [Writing guidelines — Write for two audiences](WRITING.md) for the full principle.


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

## Related documentation

- [Review checklist](REVIEW-CHECKLIST.md) — pre-submission component checklist
- [Architecture](ARCHITECTURE.md) — build system, distribution channels, and Drupal integration
- [Adding hydration support](HYDRATION-AUTHORING.md) — `fromElement` patterns, barrel files, and tests
- [Hydration guide](HYDRATION.md) — consumer-facing `createHydrator` API and integration examples
- [Testing guide](TESTING.md) — unit, visual, and accessibility testing
- [Writing guidelines](WRITING-SHORT.md) — UX writing standards
- [Component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs) — code standards reference (Storybook)
