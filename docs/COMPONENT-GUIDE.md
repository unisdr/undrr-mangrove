# Component guide

A step-by-step tutorial for building a new component in Mangrove from scratch. For reference material on code standards, see the [component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-contribution-guide--docs) in Storybook.

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
          + fromElement tests + AI manifest RENDER_SPECS (optional)
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

Create `stories/Components/{Category}/{ComponentName}/{ComponentName}.jsx`:

- Functional component with hooks (no class components)
- Destructured props with default values (not `defaultProps`)
- JSDoc comment block documenting all props
- PropTypes at the bottom of the file
- BEM class names prefixed with `mg-`

```jsx
/**
 * @param {Object} props
 * @param {string} [props.variant='default'] Variant style
 */
export function MyComponent({ variant = 'default' }) {
  return <div className={`mg-my-component mg-my-component--${variant}`}>...</div>;
}

MyComponent.propTypes = {
  variant: PropTypes.oneOf(['default', 'featured']),
};

export default MyComponent;
```

See `Pager.jsx` for a complete example with multiple props, layouts, and sub-components.

## Step 2: Create the SCSS file

Create `stories/Components/{Category}/{ComponentName}/componentname.scss`:

- BEM naming: `.mg-component-name`, `.mg-component-name__element`, `.mg-component-name--modifier`
- Use SCSS variables from `stories/assets/scss/_variables.scss` (no hardcoded colors/spacing)
- Use `devicebreak()` mixin for responsive styles
- Support RTL with CSS logical properties or `[dir="rtl"]` overrides

**Then add the import to `stories/assets/scss/_components.scss`:**

```scss
@import "../../Components/{Category}/{ComponentName}/componentname";
```

This is required — without it, your styles won't be included in any theme's compiled CSS.

## Step 3: Write Storybook stories

Create `stories/Components/{Category}/{ComponentName}/{ComponentName}.stories.jsx`:

- Use CSF3 object syntax (not `Template.bind({})`)
- Set `component` in the default export (required for autodocs)
- Create story exports for each variant, edge case, and state

```jsx
import { MyComponent } from './MyComponent';

export default {
  title: 'Components/{Category}/{ComponentName}',
  component: MyComponent,
};

export const Default = {
  args: { variant: 'default' },
};
```

Use `{ args: {} }` for simple stories, `{ render: (args) => ... }` when you need custom JSX wrapping.

### Storybook ID derivation

The Storybook path becomes a kebab-case ID used in URLs and AI manifest references:

```
title: 'Components/Cards/Vertical card'  →  components-cards-vertical-card
```

## Step 4: Write tests

Create `stories/Components/{Category}/{ComponentName}/__tests__/{ComponentName}.test.jsx`:

- React Testing Library for rendering and assertions
- `jest-axe` for accessibility (globally configured in `jest.setup.js`)
- Test: renders without crashing, responds to props, handles events, no a11y violations

```jsx
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders without crashing', () => {
    render(<MyComponent />);
    expect(screen.getByRole('...')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<MyComponent />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

Run with `yarn test __tests__/MyComponent.test.jsx`.

## Step 5: Write MDX documentation

Create `stories/Components/{Category}/{ComponentName}/{ComponentName}.mdx`:

- Import `Meta` and `Canvas` from `@storybook/addon-docs/blocks`
- Link to your stories file via `<Meta of={...} />`
- Include: overview, usage examples (React + HTML), example canvases, props table, CSS class reference, changelog
- Sentence case for all headings

See `Pager.mdx` for the full structure.

## Step 6: Add hydration files (Drupal integration only)

If the component will render into server-generated HTML containers:

### 6a. Create fromElement

Create `{ComponentName}.fromElement.js` next to the component:

```js
export default function myComponentFromElement(container) {
  const { dataset } = container;
  return {
    variant: dataset.variant || 'default',
    // ... extract each prop from data attributes
  };
}
```

Rules:
- Export a named default function (`{componentName}FromElement`)
- Use `container.dataset` for data attributes
- Provide defaults for every optional prop
- Keep it pure (no side effects, no DOM mutation)
- Do not extract callback props (`onPageChange`, `onClick`) — the consumer wrapper provides those

See `Pager.fromElement.js` and [HYDRATION.md](HYDRATION.md) for patterns (booleans, integers, JSON, optional props).

### 6b. Create the barrel file

Create `{ComponentName}.hydrate.js`:

```js
export { default } from './MyComponent.jsx';
export { default as fromElement } from './MyComponent.fromElement.js';
```

If the component uses a named export instead of default:

```js
export { MyComponent, MyComponent as default } from './MyComponent.jsx';
export { default as fromElement } from './MyComponent.fromElement.js';
```

### 6c. Write fromElement tests

Create `__tests__/{ComponentName}.fromElement.test.js`:

- Test defaults when no attributes are set
- Test extraction of all attributes
- Test type coercion (string → number, string → boolean)
- Test that callback props are not included

See `Pager.fromElement.test.js` for the complete pattern.

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

## Step 8: AI manifest (optional)

If the component should appear in the AI-friendly manifest for coding agents:

1. Add component metadata to the appropriate file in `scripts/ai-manifest/data/component-data/`
2. For auto-rendered HTML: add to `RENDER_SPECS` in `scripts/ai-manifest/render-component-html.js`
3. Run `yarn validate-manifest` to verify

See [`scripts/ai-manifest/README.md`](../scripts/ai-manifest/README.md) for details.

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
- [Component contribution guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-component-contribution-guide--docs) — code standards reference (Storybook)
