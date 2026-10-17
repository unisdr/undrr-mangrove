# Testing guide

> Edits to this file show up on both [GitHub](https://github.com/PreventionWeb/undrr-mangrove/blob/main/docs/TESTING.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-testing--docs).

This guide covers testing practices for the Mangrove component library. For development setup and commands, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Testing strategy

We use multiple testing approaches to ensure component quality:

1. **Unit tests** - Jest for component logic and behavior
2. **Visual tests** - Chromatic for visual regression testing
3. **Accessibility tests** - Built into our test suite
4. **Manual testing** - Storybook for interactive testing

## Unit testing with Jest

### Writing tests

Test files should be placed in `__tests__` directories within component folders:

```
stories/Components/Button/
  ├── Button.jsx
  ├── Button.stories.jsx
  └── __tests__/
      └── Button.test.jsx
```

### Basic test structure

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Running tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests for a specific file
yarn test Button.test.jsx

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

```javascript
it('applies custom className', () => {
  render(<Button className="custom-class">Test</Button>);
  expect(screen.getByRole('button')).toHaveClass('custom-class');
});
```

#### Testing state changes

```javascript
it('shows tab content when clicked', () => {
  render(<Tab tabdata={tabdata} />);
  const tab = screen.getByText('Tab title 2');

  fireEvent.click(tab);
  expect(screen.getByText(/Sendai Framework/)).toBeInTheDocument();
});
```

#### Testing async behavior

```javascript
it('loads data on mount', async () => {
  render(<DataComponent />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

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

- Chromatic runs on PRs and main branch pushes
- Visual changes are highlighted for review
- Changes on main are auto-accepted as baseline
- Skip with `[skip chromatic]` in commit message

## Accessibility testing

### Automated testing

We use jest-axe for automated accessibility testing. The `toHaveNoViolations` matcher is globally configured in `jest.setup.js`, so you only need to import `axe`:

```javascript
import { axe } from 'jest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual testing

1. **Keyboard navigation:** tab through interactive elements and verify visible focus.
2. **Screen reader testing:** check announcements and form labeling in NVDA or VoiceOver.
3. **Color contrast:** verify WCAG AA using browser tooling.

## Testing components with external dependencies

### Mocking modules

```javascript
// Mock an external library
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => <div>Tile Layer</div>,
}));
```

### Mocking API calls

```javascript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/data', (req, res, ctx) => {
    return res(ctx.json({ data: 'test' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Coverage requirements

While we don't enforce strict coverage thresholds, aim for:

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

```javascript
describe('ComponentName', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {});
    it('displays correct content', () => {});
  });

  describe('interactions', () => {
    it('handles user input', () => {});
    it('responds to events', () => {});
  });

  describe('edge cases', () => {
    it('handles empty data', () => {});
    it('shows error state', () => {});
  });
});
```

## Performance testing

For performance-sensitive components:

```javascript
import { render } from '@testing-library/react';
import { measureRender } from './test-utils';

it('renders efficiently', () => {
  const renderTime = measureRender(() => {
    render(<LargeList items={manyItems} />);
  });

  expect(renderTime).toBeLessThan(100); // ms
});
```

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

`artifacts/motion/` contains screenshots and a JSON result log; override its location with `MOTION_ARTIFACT_DIR`. CI uploads these artifacts even when the gate fails. The existing Storybook workflow runs the gate on every pull-request update, and Chromatic also reruns on synchronisation and reopening. Screenshots support review; computed-style and interaction assertions decide pass/fail.

Stylelint's `mangrove/no-unapproved-motion-timing` rule rejects new literal transition/animation times, including longhands, vendor prefixes, variable fallbacks and transition mixins. `scripts/motion-timing-baseline.json` permits only the recorded legacy declaration counts. Prune removed timings with `node scripts/prune-motion-baseline.mjs --write` when migrating them; baseline changes require reviewed justification. The prune command can only remove exemptions and cannot grow the baseline. Zero lifecycle delays, the exact foundational reduced-motion reset and component properties for repeating progress cycles are intentional exceptions. Run `yarn test scripts/__tests__/stylelint-motion.test.js` for adversarial examples.

## Search filter selection browser gate

With the built Storybook running, `yarn test:search-selection-browser` checks single-select, searchable multi-select, deselection, outside dismissal without click-through, and keyboard selection in the actual mobile filter drawer and desktop sidebar. It uses a deterministic local taxonomy fixture and runs all five themes with normal and reduced motion. Mobile cases send touch events at 390×844; desktop cases use mouse input at 1280×900. It also checks docs scrolling at narrow and desktop widths, and search book-card row heights with and without covers across all five themes, preserving 3:4 covers, standalone content height and mobile containment. These layout and stacking checks require a real browser.

Set `SEARCH_STORYBOOK_URL` to test another server. CI runs Chromium; use `SEARCH_BROWSER=webkit yarn test:search-selection-browser` locally after installing WebKit with `node node_modules/playwright-core/cli.js install webkit`. WebKit device emulation supplements testing on a physical iPhone; it does not replace it.
