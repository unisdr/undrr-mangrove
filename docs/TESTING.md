# Testing Guide

This guide covers testing practices for the UNDRR Mangrove component library.

## Testing Strategy

We use multiple testing approaches to ensure component quality:

1. **Unit Tests** - Jest for component logic and behavior
2. **Visual Tests** - Chromatic for visual regression testing
3. **Accessibility Tests** - Built into our test suite
4. **Manual Testing** - Storybook for interactive testing

## Unit Testing with Jest

### Writing Tests

Test files should be placed in `__tests__` directories within component folders:

```
stories/Components/Button/
  ├── Button.jsx
  ├── Button.stories.jsx
  └── __tests__/
      └── Button.test.jsx
```

### Basic Test Structure

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

### Running Tests

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

### Testing Best Practices

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

### Common Testing Patterns

#### Testing Props

```javascript
it('applies custom className', () => {
  render(<Button className="custom-class">Test</Button>);
  expect(screen.getByRole('button')).toHaveClass('custom-class');
});
```

#### Testing State Changes

```javascript
it('toggles expanded state', () => {
  render(<Accordion title="Test" />);
  const button = screen.getByRole('button');

  expect(screen.queryByText('Content')).not.toBeInTheDocument();

  fireEvent.click(button);
  expect(screen.getByText('Content')).toBeInTheDocument();
});
```

#### Testing Async Behavior

```javascript
it('loads data on mount', async () => {
  render(<DataComponent />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

## Visual Testing with Chromatic

Visual testing is handled automatically through our CI/CD pipeline. See [CHROMATIC_VISUAL_TESTING.md](./CHROMATIC_VISUAL_TESTING.md) for detailed information.

### Quick Overview

- Chromatic runs on PRs and main branch pushes
- Visual changes are highlighted for review
- Changes on main are auto-accepted as baseline
- Skip with `[skip chromatic]` in commit message

## Accessibility Testing

### Automated Testing

We use jest-axe for automated accessibility testing:

```javascript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Ensure focus indicators are visible
   - Test keyboard shortcuts

2. **Screen Reader Testing**
   - Use NVDA (Windows) or VoiceOver (Mac)
   - Verify announcements make sense
   - Check form labels and descriptions

3. **Color Contrast**
   - Use browser DevTools
   - Verify WCAG AA compliance
   - Test with different color blindness simulations

## Testing Components with External Dependencies

### Mocking Modules

```javascript
// Mock an external library
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => <div>Tile Layer</div>,
}));
```

### Mocking API Calls

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

## Coverage Requirements

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

## Debugging Tests

### Common Issues

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

### Debugging Tools

```javascript
// Print current DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));

// Use testing playground
screen.logTestingPlaygroundURL();
```

## Continuous Integration

Tests run automatically on:

- Every push to a PR
- Before merging to main
- During release builds

Failed tests will block merging and deployment.

## Test Organization

### Naming Conventions

- Test files: `ComponentName.test.jsx`
- Test suites: Use `describe` blocks
- Test cases: Start with "it" or "test"
- Be descriptive but concise

### Test Structure

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

## Performance Testing

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

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)