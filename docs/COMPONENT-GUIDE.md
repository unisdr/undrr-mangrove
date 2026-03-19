# Component guide

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/COMPONENT-GUIDE.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-build-a-component-step-by-step--docs).

A step-by-step tutorial for building a new component in Mangrove from scratch. For code standards (React patterns, BEM, PropTypes, JSDoc), see the [component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-standards--docs) in Storybook.

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

See `Pager.jsx` for a complete example and the [component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-standards--docs) for React and PropTypes standards.

## Step 2: Create the SCSS file

Create `stories/Components/{Category}/{ComponentName}/componentname.scss` using SCSS variables from `_variables.scss` and BEM naming. See the [component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-standards--docs) for styling guidelines.

**Then add the import to `stories/assets/scss/_components.scss`:**

```scss
@import "../../Components/{Category}/{ComponentName}/componentname";
```

This is required — without it, your styles won't be included in any theme's compiled CSS.

## Step 3: Write Storybook stories

Create `stories/Components/{Category}/{ComponentName}/{ComponentName}.stories.jsx` using CSF3 object syntax (not `Template.bind({})`). Set `component` in the default export for autodocs.

Use `{ args: {} }` for simple stories, `{ render: (args) => ... }` when you need custom JSX wrapping. See the [component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-standards--docs) for story format details.

### Storybook ID derivation

The Storybook path becomes a kebab-case ID used in URLs and AI manifest references:

```
title: 'Components/Cards/Vertical card'  →  components-cards-vertical-card
```

## Step 4: Write tests

Create `stories/Components/{Category}/{ComponentName}/__tests__/{ComponentName}.test.jsx` with React Testing Library and `jest-axe` for accessibility. See [TESTING.md](TESTING.md) for patterns and `Pager.test.jsx` for a complete example.

## Step 5: Write MDX documentation

Create `stories/Components/{Category}/{ComponentName}/{ComponentName}.mdx` with overview, usage examples, props table, CSS class reference, and changelog. See `Pager.mdx` for the full structure and the [component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-standards--docs) for documentation requirements.

## Step 6: Add hydration files (Drupal integration only)

If the component will render into server-generated HTML containers, create `fromElement.js`, `hydrate.js`, and `fromElement` tests. See [HYDRATION.md](HYDRATION.md) for the full API, barrel file pattern, and `Pager.fromElement.js` / `Pager.fromElement.test.js` for reference implementations.

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

- [ ] Component uses functional React with hooks
- [ ] PropTypes defined with JSDoc descriptions
- [ ] Defaults via destructuring (no `defaultProps`)
- [ ] BEM class names with `mg-` prefix
- [ ] SCSS uses variables from `_variables.scss`
- [ ] SCSS imported in `_components.scss`
- [ ] Stories use CSF3 format (no `Template.bind({})`)
- [ ] Tests include `jest-axe` a11y check
- [ ] MDX docs with props table, CSS reference, and changelog
- [ ] Sentence case for all headings and UI text
- [ ] `fromElement.js` + `hydrate.js` + tests (if Drupal-integrated)
- [ ] webpack entry + `src/index.js` export (if applicable)
- [ ] AI manifest data updated (if applicable)

## Related documentation

- [Architecture](ARCHITECTURE.md) — build system, distribution channels, and Drupal integration
- [Hydration guide](HYDRATION.md) — full `fromElement` API, `createHydrator` reference, and consumer patterns
- [Testing guide](TESTING.md) — unit, visual, and accessibility testing
- [Writing guidelines](WRITING-SHORT.md) — UX writing standards
- [Component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-standards--docs) — code standards reference (Storybook)
