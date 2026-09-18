/**
 * @file SearchPager.test.jsx
 * @description Pager tests for two search widgets on one page.
 *
 * Paging scrolls the reader back to the top of the results they are paging
 * through. With two widgets on a page, the second widget must scroll to
 * itself, not to the first. See undrr/undrr-mangrove#1205.
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { SyndicationSearchWidget } from '../SyndicationSearchWidget';
import {
  SearchProvider,
  useSearchDispatch,
  actions,
} from '../context/SearchContext';
import { SearchPager } from '../components/Pager';

const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      args[0]?.includes?.('not wrapped in act') ||
      args[0]?.includes?.('Search error') ||
      args[0]?.includes?.('Failed to fetch taxonomies')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

// Mock useTransition to avoid React 19 concurrent rendering issues in tests
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useTransition: () => [false, fn => fn()],
  useDeferredValue: value => value,
}));

function mockFetchWithResults() {
  return jest.fn().mockImplementation(url => {
    if (url && url.includes('preventionweb.net/api')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          hits: {
            hits: [
              {
                _id: '1',
                _source: {
                  title: 'Test Result',
                  teaser: 'Test teaser content',
                  url: '/test-url',
                  type: 'news',
                },
              },
            ],
            total: { value: 40 },
          },
          aggregations: {},
          took: 15,
        }),
    });
  });
}

describe('SearchPager on a page with two widgets', () => {
  let scrolled;

  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = mockFetchWithResults();
    scrolled = [];
    Element.prototype.scrollIntoView = function scrollIntoView() {
      scrolled.push(this);
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('scrolls to its own widget, not the first one on the page', async () => {
    render(
      <React.Fragment>
        <SyndicationSearchWidget
          config={{ debounceDelay: 100, resultsPerPage: 10 }}
        />
        <SyndicationSearchWidget
          config={{ debounceDelay: 100, resultsPerPage: 10 }}
        />
      </React.Fragment>
    );

    const widgets = document.querySelectorAll('[data-mg-search-widget]');
    expect(widgets).toHaveLength(2);

    // Search in the second widget only, so only it has a pager.
    const inputs = screen.getAllByRole('searchbox');
    fireEvent.change(inputs[1], { target: { value: 'test' } });

    act(() => {
      jest.advanceTimersByTime(200);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(
      () => {
        expect(widgets[1].querySelector('.mg-pager')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const nextButton = widgets[1].querySelector(
      '.mg-pager button[aria-label="Go to next page"]'
    );
    expect(nextButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(nextButton);
    });

    expect(scrolled).toHaveLength(1);
    expect(scrolled[0]).toBe(widgets[1]);
    expect(scrolled[0]).not.toBe(widgets[0]);
  });
});

describe('SearchPager used standalone, without a widgetId', () => {
  let scrolled;

  beforeEach(() => {
    scrolled = [];
    Element.prototype.scrollIntoView = function scrollIntoView() {
      scrolled.push(this);
    };
  });

  // `SearchResults` and `Pager` are public exports for custom layouts and
  // both default `widgetId` to ''. Scrolling must not silently stop for them.
  it('still scrolls to the widget root on the page', () => {
    const Seed = () => {
      const dispatch = useSearchDispatch();
      React.useEffect(() => {
        dispatch(
          actions.setResults({ hits: { hits: [], total: { value: 40 } } })
        );
      }, [dispatch]);
      return null;
    };

    render(
      <div data-mg-search-widget>
        <SearchProvider config={{ resultsPerPage: 10 }}>
          <Seed />
          <SearchPager />
        </SearchProvider>
      </div>
    );

    const root = document.querySelector('[data-mg-search-widget]');
    const nextButton = document.querySelector(
      '.mg-pager button[aria-label="Go to next page"]'
    );
    expect(nextButton).toBeInTheDocument();

    fireEvent.click(nextButton);

    expect(scrolled).toEqual([root]);
  });
});
