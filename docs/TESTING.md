# Testing guide

> Edits to this file show up on both [GitHub](https://github.com/unisdr/undrr-mangrove/blob/main/docs/TESTING.md) and in [Storybook](https://unisdr.github.io/undrr-mangrove/?path=/docs/contributing-build-a-component-testing--docs).

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

1. **Test behavior, not implementation**
   - Focus on what users see and do
   - Avoid testing internal state or methods

2. **Use Testing Library queries appropriately**
   - Prefer `getByRole`, `getByLabelText`, `getByText`
   - Avoid `getByTestId` unless necessary

3. **Keep tests isolated**
   - Each test should be independent
   - Use `beforeEach` for common setup

4. **Test edge cases**
   - Empty states
   - Error conditions
   - Loading states
   - Boundary values

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

1. **Keyboard navigation**
   - Tab through all interactive elements
   - Ensure focus indicators are visible
   - Test keyboard shortcuts

2. **Screen reader testing**
   - Use NVDA (Windows) or VoiceOver (Mac)
   - Verify announcements make sense
   - Check form labels and descriptions

3. **Color contrast**
   - Use browser DevTools
   - Verify WCAG AA compliance
   - Test with different color blindness simulations

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

1. **Component not rendering**
   - Check import paths
   - Verify props are correct
   - Use `screen.debug()` to see output

2. **Element not found**
   - Use `screen.debug()` to see current DOM
   - Check query method is appropriate
   - Verify element is actually rendered

3. **Async issues**
   - Use `waitFor` for async updates
   - Increase timeout if needed
   - Check promises are properly handled

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
- [Review checklist](REVIEW-CHECKLIST.md) — validate your component against all Mangrove standards
- [Hydration authoring](HYDRATION-AUTHORING.md) — adding Drupal integration (next step after testing)

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
