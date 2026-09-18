# Review checklist

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/REVIEW-CHECKLIST.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-review-checklist--docs).

Use this checklist when building or reviewing a component. Each item links to the relevant guide.

## Structure and naming

- [ ] Component follows BEM naming with `mg-` prefix
- [ ] Files follow the standard layout: `ComponentName.jsx`, `component-name.scss`, `ComponentName.stories.jsx`, `ComponentName.mdx`
- [ ] SCSS file begins with a docblock comment describing the component and linking to its full MDX documentation file on GitHub
- [ ] SCSS uses `var(--mg-color-*)`, `var(--mg-spacing-*)`, `var(--mg-font-size-*)`, `var(--mg-font-line-height-*)` and `var(--mg-font-family-*)` for colors, spacing and type (no hardcoded values); SCSS variables from `_variables.scss` are used only where a runtime value cannot work (breakpoints in `@media`, `@if`, `@font-face`); a themeable component font size is a component token named `--mg-{component}-{element}-font-size` that resolves to a scale step; use `--mg-z-index-*` CSS custom properties for global stacking contexts — fixed, sticky, or portaled elements (derive backdrops with `calc(var(--mg-z-index-*) - 1)`); local stacking contexts within a component use raw integer values with an explanatory comment
- [ ] Color tokens using sRGB channel triples are wrapped in `rgb(...)`, e.g. `color: rgb(var(--mg-color-interactive));` (check `tokens.json` for the 22 non-wrapped exception tokens like `--mg-border-color-button`)
- [ ] Every `var(--mg-*)` the component reads is defined, or is a documented input hook listed in `stories/assets/scss/__tests__/custom-properties-defined.test.js` (an undefined custom property is silently dropped, so the test is the only thing that catches it)
- [ ] SCSS imported in `stories/assets/scss/_components.scss`
- [ ] `font-family` names a role custom property and nothing else — `var(--mg-font-family-text)`, `-heading`, `-display`, `-ui` or `-code`. Never a face variable (`$mg-font-face-*`), never a literal family name. Component title, label, value, tag and compact navigation-chrome classes (`__title`, `__label`, `__value`, `__link`) take `ui`. Buttons take `text`, every one of them. The hero title is the only `display` user. Do not declare a family on `h1`–`h6`, `p`, `th`, `td` or a bare `header`: h4–h6 and the rest inherit `text` from `body`, and h1–h3 get `heading` from `_foundational.scss` in Arabic only. That rule is deliberately scoped to `:lang(ar)` — an unconditional `h1, h2, h3` declaration is a matched declaration that ties with a consuming theme's own heading rule and wins on source order, which costs sites like MCR and ARISE their licensed brand face.
- [ ] No `:lang(ar)` font rule anywhere in the component stylesheet. Script routing lives in `_fonts.scss` and nowhere else: it re-points the five roles for Arabic, so a component that names a role gets correct Arabic typography for free. A component-level `:lang(ar)` override now takes the component *out* of that routing.
- [ ] No `defaultProps` (use destructured default parameters instead)

See [Component standards](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs) for the full conventions.

## Accessibility

- [ ] Semantic HTML elements used where appropriate
- [ ] ARIA attributes included (labels, roles, live regions)
- [ ] Keyboard navigation works (Tab, Enter, Escape, arrow keys as relevant)
- [ ] Focus states use `@include mg-focus-ring;` or `@include mg-focus-ring-inset;` to ensure dual-band contrast and forced-colors mode visibility
- [ ] Icon-only buttons include an accessible `aria-label` attribute (WCAG 4.1.2) and meet touch target minimums (24x24px WCAG 2.5.8 minimum, 36x36px standard)
- [ ] Color contrast meets WCAG 2.2 AA (4.5:1 for text, 3:1 for UI elements). A pair that cannot meet it is not waived silently: record it, with its measured value and the reason, in `WCAG_EXCEPTIONS`/`PERCEPTUAL_EXCEPTIONS` in `stories/assets/scss/__tests__/tokens-contract.test.js`, and describe the decision in [`docs/COLOUR-CONTRAST-METHODOLOGY.md`](COLOUR-CONTRAST-METHODOLOGY.md#recorded-exceptions-components-that-still-put-text-on-the-orange) if it affects a brand colour
- [ ] No text sits on the orange accent surfaces (`orange-800`, `orange-900`, and `secondary`, `tag-accent`, `tag-accent--hover`, `hero--secondary`, which resolve to them). The orange is a non-text accent: borders, rules, icon fills and blocks with no copy over them. No text colour clears AA on it — see [the orange accent carries no text](COLOUR-CONTRAST-METHODOLOGY.md#the-orange-accent-carries-no-text)
- [ ] List semantics: a `<ul>` or `<ol>` whose markers are hidden uses `@include mg-list-unmarked;` (which emits `list-style: none` then `list-style-type: ""`), never a bare `list-style: none`. The same applies to any `<li>` rule that hides its own marker: `list-style-type` is inherited, but an item setting `none` wins over the list's empty string, and it is the item's marker Safari inspects. Safari drops the implicit `list` role from a markerless list, so the count stops being announced. Do not add `role="list"` to the markup instead: consumers hand-write these lists, so only a fix on the class reaches all of them, and once the mixin has kept the implicit role the attribute is redundant — it restates a role the element already has, and it would have to be repeated on every hand-written list forever to do the job the stylesheet already does once. A list that carries a different ARIA role on purpose (`tree`, `group`, `menu`, `listbox`, `tablist`) is exempt — that role already replaces list semantics
- [ ] jest-axe test included in the test file
- [ ] Heading hierarchy is logical (no skipped levels)
- [ ] Images and icons have appropriate alt text (empty `alt=""` for decorative images)
- [ ] Touch/click targets meet minimum size (24x24px, 44x44px recommended)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Error states are announced to assistive technology (`aria-describedby`, `aria-live`)
- [ ] Component works across all five themes without contrast failures

See [Accessibility](https://mangrove.undrr.org/?path=/docs/getting-started-accessibility--docs) for the full guide and testing methodology.
  - Source: [`ACCESSIBILITY.md`](ACCESSIBILITY.md)

## Stories and documentation

- [ ] Stories use CSF3 format (no `Template.bind({})`)
- [ ] MDX docs follow the standard structure (overview, when to use, formatting, behaviors, CSS/JS references, changelog)
- [ ] MDX includes the review checklist reference after `<Meta>` (see [component guide, step 5](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-step-by-step--docs))
- [ ] One changelog version entry added to the component's MDX file for the PR (see [changelog format](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs)). Extend that entry with nested bullets when the same PR adds more work; do not bump the component version more than once within one PR.
- [ ] Sentence case for all headings and UI text

See [Writing guidelines](https://mangrove.undrr.org/?path=/docs/contributing-writing-guidelines--docs) for UX writing standards.
  - Source: [`WRITING.md`](WRITING.md), [`WRITING-SHORT.md`](WRITING-SHORT.md)

## Testing

- [ ] Component renders without errors
- [ ] Props produce expected output (including edge cases)
- [ ] Tests cover key behaviors and interactions
- [ ] jest-axe accessibility assertions pass

See [Testing](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-testing--docs) for the testing setup and patterns.
  - Source: [`TESTING.md`](TESTING.md)

## Component quality

- [ ] `npx -y react-doctor@latest .` shows no new errors and the score is equal or higher than where you found it. See the [`react-doctor` guidance](AI-CODING-AGENTS.md#component-quality-checks-with-react-doctor) for house conventions and known false positives.

## Visual refinements

- [ ] Change follows the [experience principles](https://mangrove.undrr.org/?path=/docs/design-decisions-experience-principles--docs), including the boundary between shared behaviour and theme-owned expression
- [ ] PR states the user or system problem and why the change belongs to the component, a shared token, or a specific theme
- [ ] Before and after evidence covers representative viewport sizes and relevant interaction or validation states
- [ ] Affected themes, keyboard and touch interaction, zoom or reflow, RTL, text expansion, forced colours, and reduced motion have been checked as applicable
- [ ] Changed defaults are additive where possible and document compatibility, changelog, and migration impact

## Internationalization

- [ ] Text comes from props, not hardcoded
- [ ] RTL layout works (check with the locale toolbar)
- [ ] CSS uses logical properties where possible (`margin-inline-start` instead of `margin-left`)

See the RTL support section in [Component standards](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs).

## Drupal integration (if applicable)

- [ ] `ComponentName.fromElement.js` exports a function that extracts props from `data-mg-*` attributes
- [ ] `ComponentName.hydrate.js` barrel file uses `createHydrator`
- [ ] `ComponentName.fromElement.test.js` verifies prop extraction
- [ ] Webpack entry added in `webpack.config.js`
- [ ] Export added in `src/index.js`

See [Adding hydration support](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-hydration--docs) for the full pattern.
  - Source: [`HYDRATION-AUTHORING.md`](HYDRATION-AUTHORING.md)

## AI discoverability and manifests

- [ ] If component HTML markup or CSS classes changed, updated `scripts/ai-manifest/component-data.js`
- [ ] The curated `description` in `component-data.js` still matches what the component does — it is published ahead of the component's docblock, so it is what an agent grepping `index.json` reads. A description over 200 characters carries a one-sentence `summary` for the index listing
- [ ] If new utility classes were created, indexed in `scripts/ai-manifest/css-utilities.js`
- [ ] If the component gained or renamed a CSS custom property, described it in `scripts/ai-manifest/custom-properties.js`
- [ ] If a CSS custom property left the public API, `MIN_PROPERTIES` came down with it and the CHANGELOG says so
- [ ] Component `## Changelog` in MDX follows standard format and is automatically indexed in `ai-components/{id}.json` and `releases.json`
- [ ] `yarn validate-manifest` passes with 0 errors

See [AI and MCP integration](https://mangrove.undrr.org/?path=/docs/getting-started-ai-and-mcp-integration--docs).
  - Source: [`AI-MCP-INTEGRATION.md`](AI-MCP-INTEGRATION.md)

## Related documentation

- [Component guide](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-step-by-step--docs) — step-by-step tutorial for building a component
  - Source: [`COMPONENT-GUIDE.md`](COMPONENT-GUIDE.md)
- [Testing guide](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-testing--docs) — unit, visual, and accessibility testing
  - Source: [`TESTING.md`](TESTING.md)
- [Hydration authoring](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-hydration--docs) — adding Drupal integration
  - Source: [`HYDRATION-AUTHORING.md`](HYDRATION-AUTHORING.md)
- [Component standards](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs) — code standards reference
