# Review checklist

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/REVIEW-CHECKLIST.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-review-checklist--docs).

Use this checklist to validate a new or existing component against Mangrove's standards. Each item links to the relevant guide for details.

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

See [Accessibility](ACCESSIBILITY.md) for the full guide and testing methodology.

## Stories and documentation

- [ ] Stories use CSF3 format (no `Template.bind({})`)
- [ ] MDX docs follow the standard structure (overview, when to use, formatting, behaviors, CSS/JS references, changelog)
- [ ] MDX includes the review checklist reference after `<Meta>` (see [component guide, step 5](COMPONENT-GUIDE.md#step-5-write-mdx-documentation))
- [ ] Changelog entry added to the component's MDX file
- [ ] Sentence case for all headings and UI text

See [Writing guidelines](WRITING-SHORT.md) for UX writing standards.

## Testing

- [ ] Component renders without errors
- [ ] Props produce expected output (including edge cases)
- [ ] Tests cover key behaviors and interactions
- [ ] jest-axe accessibility assertions pass

See [Testing](TESTING.md) for the testing setup and patterns.

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

See [Adding hydration support](HYDRATION-AUTHORING.md) for the full pattern.

## AI discoverability (optional)

- [ ] Component appears in the AI manifest after running `yarn validate-manifest`

See [AI and MCP integration](AI-MCP-INTEGRATION.md).

## Related documentation

- [Component guide](COMPONENT-GUIDE.md) — step-by-step tutorial for building a component
- [Testing guide](TESTING.md) — unit, visual, and accessibility testing
- [Hydration authoring](HYDRATION-AUTHORING.md) — adding Drupal integration
- [Component standards](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-component-standards--docs) — code standards reference (Storybook)
