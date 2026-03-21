# Review checklist

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/REVIEW-CHECKLIST.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-review-checklist--docs).

Use this checklist when building or reviewing a component. Each item links to the relevant guide.

## Structure and naming

- [ ] Component follows BEM naming with `mg-` prefix
- [ ] Files follow the standard layout: `ComponentName.jsx`, `component-name.scss`, `ComponentName.stories.jsx`, `ComponentName.mdx`
- [ ] SCSS uses variables from `_variables.scss` (no hardcoded colors or spacing values)
- [ ] SCSS imported in `stories/assets/scss/_components.scss`
- [ ] No `defaultProps` (use destructured default parameters instead)

See [Component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs) for the full conventions.

## Accessibility

- [ ] Semantic HTML elements used where appropriate
- [ ] ARIA attributes included (labels, roles, live regions)
- [ ] Keyboard navigation works (Tab, Enter, Escape, arrow keys as relevant)
- [ ] Focus states are visible
- [ ] Color contrast meets WCAG 2.2 AA (4.5:1 for text, 3:1 for UI elements)
- [ ] jest-axe test included in the test file
- [ ] Heading hierarchy is logical (no skipped levels)
- [ ] Images and icons have appropriate alt text (empty `alt=""` for decorative images)
- [ ] Touch/click targets meet minimum size (24x24px, 44x44px recommended)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Error states are announced to assistive technology (`aria-describedby`, `aria-live`)
- [ ] Component works across all five themes without contrast failures

See [Accessibility](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-accessibility--docs) for the full guide and testing methodology.
  - Source: [`ACCESSIBILITY.md`](ACCESSIBILITY.md)

## Stories and documentation

- [ ] Stories use CSF3 format (no `Template.bind({})`)
- [ ] MDX docs follow the standard structure (overview, when to use, formatting, behaviors, CSS/JS references, changelog)
- [ ] MDX includes the review checklist reference after `<Meta>` (see [component guide, step 5](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-step-by-step--docs))
- [ ] Changelog entry added to the component's MDX file (see [changelog format](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs))
- [ ] Sentence case for all headings and UI text

See [Writing guidelines](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-writing-guidelines--docs) for UX writing standards.
  - Source: [`WRITING.md`](WRITING.md), [`WRITING-SHORT.md`](WRITING-SHORT.md)

## Testing

- [ ] Component renders without errors
- [ ] Props produce expected output (including edge cases)
- [ ] Tests cover key behaviors and interactions
- [ ] jest-axe accessibility assertions pass

See [Testing](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-testing--docs) for the testing setup and patterns.
  - Source: [`TESTING.md`](TESTING.md)

## Internationalization

- [ ] Text comes from props, not hardcoded
- [ ] RTL layout works (check with the locale toolbar)
- [ ] CSS uses logical properties where possible (`margin-inline-start` instead of `margin-left`)

See the RTL support section in [Component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs).

## Drupal integration (if applicable)

- [ ] `ComponentName.fromElement.js` exports a function that extracts props from `data-mg-*` attributes
- [ ] `ComponentName.hydrate.js` barrel file uses `createHydrator`
- [ ] `ComponentName.fromElement.test.js` verifies prop extraction
- [ ] Webpack entry added in `webpack.config.js`
- [ ] Export added in `src/index.js`

See [Adding hydration support](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-hydration--docs) for the full pattern.
  - Source: [`HYDRATION-AUTHORING.md`](HYDRATION-AUTHORING.md)

## AI discoverability (optional)

- [ ] Component appears in the AI manifest after running `yarn validate-manifest`

See [AI and MCP integration](https://unisdr.github.io/undrr-mangrove/?path=/docs/getting-started-ai-and-mcp-integration--docs).
  - Source: [`AI-MCP-INTEGRATION.md`](AI-MCP-INTEGRATION.md)

## Related documentation

- [Component guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-step-by-step--docs) — step-by-step tutorial for building a component
  - Source: [`COMPONENT-GUIDE.md`](COMPONENT-GUIDE.md)
- [Testing guide](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-testing--docs) — unit, visual, and accessibility testing
  - Source: [`TESTING.md`](TESTING.md)
- [Hydration authoring](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-hydration--docs) — adding Drupal integration
  - Source: [`HYDRATION-AUTHORING.md`](HYDRATION-AUTHORING.md)
- [Component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs) — code standards reference
