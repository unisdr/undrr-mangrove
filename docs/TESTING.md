# Testing guide

> Edits to this file show up on both [GitHub](https://github.com/PreventionWeb/undrr-mangrove/blob/main/docs/TESTING.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-testing--docs).

Choose checks for the behaviour you changed. Complete [development setup](DEVELOPMENT.md)
first; [Contributing](../CONTRIBUTING.md#submitting-changes) lists the submission
checks.

## Testing strategy

| Change or question | Check | What it establishes |
|---|---|---|
| Component logic, props or DOM output | `yarn test path/to/file` | Jest assertions in jsdom |
| Story interactions, focus or layout | `yarn scss`, then `yarn test-storybook` | Render and play assertions in Chromium |
| Published assets or iframe integration | [Production-build gates](#checks-against-the-production-build) | Behaviour of the built Storybook |
| Visual appearance | [Chromatic](#visual-testing-with-chromatic) | Screenshots for review |
| Accessibility | [Automated and manual checks](#accessibility-testing) | Automated findings plus keyboard and assistive-technology review |

Jest does not load external SCSS. Passing unit tests cannot establish spacing,
contrast, overflow or visible focus; use a real browser for those checks.

## Unit testing with Jest

### Writing tests

Place tests in a component's `__tests__` directory. For example:

```text
stories/Components/Buttons/CtaButton/
├── CtaButton.jsx
├── CtaButton.stories.jsx
└── __tests__/
    └── CtaButton.test.jsx
```

### Basic test structure

This example uses the existing `CtaButton` API. Save it in that component's
`__tests__` directory so the relative import resolves:

```jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CtaButton } from '../CtaButton';

it('uses the supplied destination when enabled', () => {
  render(<CtaButton label="Read the report" href="/report" />);

  expect(screen.getByRole('link', { name: 'Read the report' })).toHaveAttribute(
    'href',
    '/report'
  );
});
```

The [maintained CtaButton suite](https://github.com/PreventionWeb/undrr-mangrove/blob/main/stories/Components/Buttons/CtaButton/__tests__/CtaButton.test.jsx)
also covers disabled links, class composition and automated accessibility.

### Running tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests for a specific file
yarn test stories/Components/Buttons/CtaButton/__tests__/CtaButton.test.jsx

# Generate coverage report
yarn test:coverage

# Run tests with verbose output
yarn test --verbose
```

### Testing best practices

1. **Test behavior, not implementation.** Focus on visible output and user interactions.
2. **Prefer semantic queries.** Use `getByRole`, `getByLabelText`, then `getByText`; use `getByTestId` only when needed.
3. **Keep tests isolated.** Each test should run independently.
4. **Cover edge cases.** Include empty, error, loading, and boundary states.

### Common testing patterns

#### Testing props

Assert a consumer-visible result of the prop. The
[CtaButton suite](https://github.com/PreventionWeb/undrr-mangrove/blob/main/stories/Components/Buttons/CtaButton/__tests__/CtaButton.test.jsx)
checks that a supplied `href` becomes the link destination and that a disabled
link has no destination.

#### Testing state changes

Exercise the control and assert the resulting output. The
[Tab suite](https://github.com/PreventionWeb/undrr-mangrove/blob/main/stories/Components/Tab/__tests__/Tab.test.jsx) shows the runtime
initialization needed before asserting panel changes. Use browser play functions
when the outcome depends on geometry or focus visibility.

#### Testing async behavior

Await the visible outcome rather than adding a fixed delay. The
[ShareButtons dialog suite](https://github.com/PreventionWeb/undrr-mangrove/blob/main/stories/Components/Buttons/ShareButtons/__tests__/ShareButtons.dialog.test.jsx)
uses `findByRole` and `waitFor` for dialog and asynchronous sharing behaviour.
Keep service responses deterministic unless the purpose is a live integration
check, such as the consent-banner story described below.

## Play functions with Vitest Browser Mode

`yarn test-storybook` runs each story's render check and existing `play`
assertions in real headless Chromium through `@storybook/addon-vitest` and
Vitest's Playwright provider. Computed styles, box geometry, overflow and
keyboard focus are tested in the browser. Jest unit tests remain a separate
`yarn test` command using jsdom.

```sh
# Generate the Sass tokens once in a fresh checkout
yarn scss
# Install Chromium once per machine (CI also installs its system libraries)
yarn playwright install --with-deps chromium
# Run all stories, without building or serving Storybook
yarn test-storybook
# Filter by file or test name
yarn test-storybook Table.stories
yarn test-storybook -t 'Rendering check'
# Keep a browser test session watching for changes
yarn test-storybook:watch
```

Arguments go directly after the Yarn script name. The Storybook testing widget
uses the same Vitest project. Storybook 10.6 applies preview/addon annotations
automatically; do not add a second `setProjectAnnotations` setup file.

Storybook's global loader awaits the selected theme's lazy Sass chunk before
rendering and assertions. Theme toolbar changes also update docs-only pages.

### Checks against the production build

Vitest tests source modules, so the standalone browser gates still exercise
the built site, its asset delivery and iframe integration:

```sh
yarn build
yarn serve-storybook                       # port 6099, in another terminal
yarn test:search-selection-browser
yarn test:motion-browser
yarn test:rich-content-browser
```

Port 6006 belongs to `yarn storybook`. The built-site server fails on
`EADDRINUSE` so these gates cannot silently test a development server.

CI runs both the Vitest story suite and the production-build gates. A failed
assertion fails the build.

### What cannot be asserted this way

Play functions that depend on the network are only as reliable as the service
they call, and one here does.

`CookieConsentBanner`'s "Rendering check" loads three assets from the live
`assets.undrr.org` and asserts on the third-party bundle's internals —
`window.initializeCookieBanner`, `#cc-main .cm`, `#cc-main [data-role="all"]`
and `getComputedStyle('#cc-main').position`. That is a deliberate trade: it is
the only check in the repository that can tell a working consent bar from a
broken one, and measured over three full runs it took about 978ms with no
flakes behind Cloudflare. Vitest's story test and hook timeouts are 60 seconds to preserve this live
integration check.

**Know what it costs before you debug a mystery red build.** `storybook.yml`
has no `paths:` filter on its pull-request trigger, so this story gates *every*
pull request in the repository; and the `deploy` job has `needs: build`, so
while `assets.undrr.org` is down, mangrove.undrr.org cannot be deployed either.
UNDRR ops can also change the markup or the option names under the same `/v1/`
path without touching this repository, and the check would go red here with
nothing in the diff to explain it. If that is what you are looking at, the fix
is in the CDN bundle or in this story's selectors, not in the component.

If a story genuinely cannot run headlessly, give it the `!test` tag and record
the reason in the story rather than leaving a silent failure.

## Storybook builder migration

The [Vite migration report](STORYBOOK-VITE-SPIKE.md) records the #1355 spike,
the 3.0 cutover and verification evidence. Storybook uses Vite; the published
library bundles continue to use Webpack.

## Visual testing with Chromatic

Visual testing is handled automatically through our CI/CD pipeline.

### Quick overview

- Open visual-change PRs as drafts. Chromatic runs when a draft is marked ready for review, and on matching main/develop pushes. Routine PR pushes and reopening do not request snapshots.
- After a material visual revision, run **Chromatic Visual Testing** from the Actions tab and select the PR branch, or use `gh workflow run chromatic.yml --ref <branch>`. Manual dispatch becomes available once this workflow change is on the default branch; select a branch that contains the updated workflow. Review the selected commit and the run's Chromatic link; a manual run does not add a PR comment.
- Visual changes are highlighted for review
- Changes on main are auto-accepted as baseline
- Automatic builds honour `[skip chromatic]` in a push commit message or a ready-for-review PR title. Deliberate manual dispatch does not read those markers.
- Review builds check out the exact PR head commit; manual builds use the selected branch commit. Both pass explicit branch and commit metadata to Chromatic for baseline selection.
- Matching paths include story/theme sources, design tokens, token generation and the dependency lockfile.

## Accessibility testing

### Automated testing

We use jest-axe for automated accessibility testing. The `toHaveNoViolations` matcher is globally configured in `jest.setup.js`, so add `axe` to the imports in the CtaButton example above:

```javascript
import { axe } from 'jest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(
    <CtaButton label="Read the report" href="/report" />
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual testing

1. **Keyboard navigation:** tab through interactive elements and verify visible focus.
2. **Screen reader testing:** check announcements and form labelling in NVDA or VoiceOver.
3. **Colour contrast:** verify WCAG AA using browser tooling.

## Testing components with external dependencies

### Mocking modules

Mock the boundary the test does not exercise. The
[Tab suite](https://github.com/PreventionWeb/undrr-mangrove/blob/main/stories/Components/Tab/__tests__/Tab.test.jsx)
mocks automatic initialization, then calls the real runtime to control when it
runs. Preserve real behaviour when it is the subject of the assertion.

### Mocking API calls

Use Jest fetch mocks for isolated unit tests. Start with the [ShareButtons dialog suite](https://github.com/PreventionWeb/undrr-mangrove/blob/main/stories/Components/Buttons/ShareButtons/__tests__/ShareButtons.dialog.test.jsx)
for a scoped mock that restores the original `global.fetch`, or the
[search sorting suite](https://github.com/PreventionWeb/undrr-mangrove/blob/main/stories/Components/SyndicationSearchWidget/__tests__/sorting.test.jsx)
for deterministic responses and request assertions. Cover failure and empty
responses as well as success, and restore global replacements after the test.

## Coverage requirements

`jest.config.js` enforces a global floor of 10% for statements, branches,
functions and lines. That floor is a regression gate, not a component-quality
target. For new and changed code, aim for:

- 80% statement coverage
- 70% branch coverage
- 100% coverage for utility functions
- Focus on critical paths

View coverage reports:
```bash
yarn test:coverage
open coverage/lcov-report/index.html
```

## Debugging tests

### Common issues

1. **Component not rendering:** verify imports and props, then inspect output with `screen.debug()`.
2. **Element not found:** check query choice and confirm the element is actually rendered.
3. **Async failures:** use `waitFor`, ensure promises resolve, and adjust timeout only when needed.

### Debugging tools

```javascript
// Print current DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));

// Use testing playground
screen.logTestingPlaygroundURL();
```

## Continuous integration

Tests run automatically on:

- Every push to a PR
- Before merging to main
- During release builds

Failed tests will block merging and deployment.

## Test organization

### Naming conventions

- Test files: `ComponentName.test.jsx`
- Test suites: Use `describe` blocks
- Test cases: Start with "it" or "test"
- Be descriptive but concise

### Test structure

Group tests by behaviour when the suite needs it. Keep setup close to the tests
that depend on it; use the
[CtaButton suite](https://github.com/PreventionWeb/undrr-mangrove/blob/main/stories/Components/Buttons/CtaButton/__tests__/CtaButton.test.jsx)
as a small example and the
[Tab suite](https://github.com/PreventionWeb/undrr-mangrove/blob/main/stories/Components/Tab/__tests__/Tab.test.jsx)
for a larger suite with runtime setup.

## Performance testing

Reproduce the slow interaction in a browser and record the component, fixture,
viewport and measurement method. Profile the render or interaction before and
after the change using the same conditions. A jsdom render time is not evidence
of browser layout or interaction performance.

For an automated performance gate, define the measured operation, environment
and threshold explicitly. Keep the measurement repeatable enough to distinguish
a regression from run-to-run variation.

## Related documentation

- [Component guide](COMPONENT-GUIDE.md) — step-by-step tutorial for building a component
- [Review checklist](REVIEW-CHECKLIST.md) — pre-submission component checklist
- [Hydration authoring](HYDRATION-AUTHORING.md) — adding Drupal integration (next step after testing)

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)


## Motion and forced-colour browser gate

After `yarn build`, serve the built Storybook with `yarn serve-storybook`, then run `yarn test:motion-browser`. For a development server, set `MOTION_STORYBOOK_URL=http://127.0.0.1:6006`. The gate uses the Chromium installed for the Storybook test runner and stops after six minutes.

Deterministic `Quality/Motion` fixtures cover Loader, ProgressBar, Gallery, MegaMenu, SyndicationSearchWidget, Drawer and Details. The gate emulates reduced motion, forced colours and both together **before mounting** each fixture, across all five brand themes at desktop LTR and 375px RTL. It checks loading shapes, normal-motion rotation, static labelled Loaders under reduced motion, static dashed indeterminate progress, explicit instant Gallery scrolling even with consumer smooth-scroll CSS, keyboard access and focus return, and visible menu destinations. Search states use local context fixtures with explicit complete/fail controls; media requests are local and external network requests are blocked.

`artifacts/motion/` contains screenshots and a JSON result log; override its location with `MOTION_ARTIFACT_DIR`. CI uploads these artifacts even when the gate fails. The existing Storybook workflow runs the gate on every pull-request update. Chromatic runs when a draft PR is marked ready for review; request a manual run on its branch after material visual revisions. Screenshots support review; computed-style and interaction assertions decide pass/fail.

Stylelint's `mangrove/no-unapproved-motion-timing` rule rejects new literal transition/animation times, including longhands, vendor prefixes, variable fallbacks and transition mixins. `scripts/motion-timing-baseline.json` permits only the recorded legacy declaration counts. Prune removed timings with `node scripts/prune-motion-baseline.mjs --write` when migrating them; baseline changes require reviewed justification. The prune command can only remove exemptions and cannot grow the baseline. Zero lifecycle delays, the exact foundational reduced-motion reset and component properties for repeating progress cycles are intentional exceptions. Run `yarn test scripts/__tests__/stylelint-motion.test.js` for adversarial examples.

## Search filter selection browser gate

With the built Storybook running, `yarn test:search-selection-browser` checks single-select, searchable multi-select, deselection, outside dismissal without click-through, and keyboard selection in the actual mobile filter drawer and desktop sidebar. It uses a deterministic local taxonomy fixture and runs all five themes with normal and reduced motion. Mobile cases send touch events at 390×844; desktop cases use mouse input at 1280×900. It also checks docs scrolling at narrow and desktop widths, and search book-card row heights with and without covers across all five themes, preserving 3:4 covers, standalone content height and mobile containment. These layout and stacking checks require a real browser.

Set `SEARCH_STORYBOOK_URL` to test another server. CI runs Chromium; use `SEARCH_BROWSER=webkit yarn test:search-selection-browser` locally after installing WebKit with `node node_modules/playwright-core/cli.js install webkit`. WebKit device emulation supplements testing on a physical iPhone; it does not replace it.
