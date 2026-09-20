# Testing guide

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/TESTING.md) and in [Storybook](https://mangrove.undrr.org/?path=/docs/contributing-build-a-component-testing--docs).

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

## Play functions with the Storybook test runner

A story's `play` function runs in a real browser, so it can assert the things
jsdom cannot represent: computed style, box geometry, scroll overflow, focus
order after a real click. Most of the play functions in this library exist for
exactly that reason — a jsdom copy of them would pass on a completely unstyled
component.

The test runner drives a headless Chromium over a served Storybook. It runs
every story twice over: a smoke test that the story renders without error, and,
where one exists, the `play` function with its assertions.

```bash
# Build the Storybook the runner will drive
yarn build

# Serve it, then run the play functions against it
yarn serve-storybook &
yarn test-storybook

# One story or one file
yarn test-storybook Table.stories

# Stop the server when you are done
kill %1
```

Arguments go straight after the script name. Yarn 4 does not need `npm`'s `--`
separator and passes one through literally, so `yarn test-storybook -- Table`
hands the runner a bare `--` and does not filter anything.

`yarn test-storybook` needs a Storybook already running; it will not start one.
`yarn serve-storybook` serves the built Storybook on port **6099** and
`yarn test-storybook` points there, so the two pair up with no arguments. 6006
is deliberately left to `yarn storybook`: sharing the port would make the server
fail on `EADDRINUSE` while the runner quietly tested the dev server instead of
the build. To run the play functions against a dev server on purpose:

```bash
yarn storybook           # in one shell
yarn test-storybook --url http://127.0.0.1:6006
```

The runner needs its browser once per machine:

```bash
yarn run playwright install --with-deps chromium
```

CI runs the same commands in the `Build and Deploy` workflow, on every push to a
pull request. A failing assertion fails the build.

### What cannot be asserted this way

Play functions that depend on the network are only as reliable as the service
they call, and one here does.

`CookieConsentBanner`'s "Rendering check" loads three assets from the live
`assets.undrr.org` and asserts on the third-party bundle's internals —
`window.initializeCookieBanner`, `#cc-main .cm`, `#cc-main [data-role="all"]`
and `getComputedStyle('#cc-main').position`. That is a deliberate trade: it is
the only check in the repository that can tell a working consent bar from a
broken one, and measured over three full runs it took about 978ms with no
flakes behind Cloudflare. It is also the reason the runner's test timeout is
raised to 60 seconds.

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
