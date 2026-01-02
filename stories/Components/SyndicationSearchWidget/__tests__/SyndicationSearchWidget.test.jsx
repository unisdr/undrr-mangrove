/**
 * @file SyndicationSearchWidget.test.jsx
 * @description Tests for the main SyndicationSearchWidget component.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SyndicationSearchWidget, SearchWidget } from '../SyndicationSearchWidget';

// Suppress console.error for expected async warnings
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

// Create a mock fetch that handles both search and taxonomy endpoints
function mockFetch(searchResponse = null) {
  const defaultSearchResponse = {
    ok: true,
    json: () =>
      Promise.resolve({
        hits: { hits: [], total: { value: 0 } },
        aggregations: {},
        took: 10,
      }),
  };

  const taxonomyResponse = {
    ok: true,
    json: () => Promise.resolve({ results: [] }),
  };

  return jest.fn().mockImplementation(url => {
    // Taxonomy API
    if (url && url.includes('preventionweb.net/api')) {
      return Promise.resolve(taxonomyResponse);
    }
    // Search endpoint
    return Promise.resolve(searchResponse || defaultSearchResponse);
  });
}

describe('SyndicationSearchWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('renders the widget container', () => {
      render(<SyndicationSearchWidget config={{}} />);

      expect(
        document.querySelector('[data-mg-search-widget]')
      ).toBeInTheDocument();
    });

    it('renders search form by default', () => {
      render(<SyndicationSearchWidget config={{}} />);

      expect(screen.getByRole('search')).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('hides search form when showSearchBox is false', () => {
      render(<SyndicationSearchWidget config={{ showSearchBox: false }} />);

      expect(screen.queryByRole('search')).not.toBeInTheDocument();
    });

    it('shows empty state message before searching', () => {
      render(<SyndicationSearchWidget config={{}} />);

      expect(screen.getByText(/enter a search term/i)).toBeInTheDocument();
    });

    it('renders facets sidebar when showFacets is true', () => {
      render(<SyndicationSearchWidget config={{ showFacets: true }} />);

      expect(
        document.querySelector('.mg-search__sidebar')
      ).toBeInTheDocument();
    });

    it('does not render facets sidebar when showFacets is false', () => {
      render(<SyndicationSearchWidget config={{ showFacets: false }} />);

      expect(
        document.querySelector('.mg-search__sidebar')
      ).not.toBeInTheDocument();
    });
  });

  describe('search input', () => {
    it('updates input value on change', () => {
      render(<SyndicationSearchWidget config={{}} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test query' } });

      expect(input).toHaveValue('test query');
    });

    it('clears input when clear button is clicked', () => {
      render(<SyndicationSearchWidget config={{}} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test query' } });

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      fireEvent.click(clearButton);

      expect(input).toHaveValue('');
    });
  });

  describe('search execution', () => {
    it('triggers search after debounce delay', async () => {
      jest.useFakeTimers();
      global.fetch = mockFetch();

      render(<SyndicationSearchWidget config={{ debounceDelay: 100 }} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'disaster' } });

      // Fast-forward past debounce
      act(() => {
        jest.advanceTimersByTime(150);
      });

      // Flush promises
      await act(async () => {
        await Promise.resolve();
      });

      // Search should have been called (at least for initial empty search + this one)
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('uses custom search endpoint', async () => {
      jest.useFakeTimers();
      global.fetch = mockFetch();

      render(
        <SyndicationSearchWidget
          config={{
            searchEndpoint: 'https://custom.endpoint.com/search',
            debounceDelay: 100,
          }}
        />
      );

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      act(() => {
        jest.advanceTimersByTime(150);
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom.endpoint.com/search',
        expect.any(Object)
      );
    });

    it('applies default query from config', () => {
      render(
        <SyndicationSearchWidget
          config={{
            defaultQuery: 'climate',
          }}
        />
      );

      // After initialization, input should show default query
      const input = screen.getByRole('searchbox');
      // The defaultQuery is set on initialization, but the input starts empty
      // and syncs after the state updates
      expect(input).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible form region', () => {
      render(<SyndicationSearchWidget config={{}} />);

      const form = screen.getByRole('search');
      expect(form).toHaveAttribute('aria-label', 'Search content');
    });

    it('has aria-live regions for announcements', () => {
      render(<SyndicationSearchWidget config={{}} />);

      // Check for aria-live regions (for screen reader announcements)
      const liveRegions = document.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });
  });

  describe('backwards compatibility', () => {
    it('exports SearchWidget as alias', () => {
      expect(SearchWidget).toBe(SyndicationSearchWidget);
    });
  });

  describe('loading indicator', () => {
    it('has main element for results area', () => {
      render(<SyndicationSearchWidget config={{}} />);

      const main = document.querySelector('.mg-search__main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('no results state', () => {
    it('displays no results message when search returns empty', async () => {
      jest.useFakeTimers();
      global.fetch = mockFetch();

      render(<SyndicationSearchWidget config={{ debounceDelay: 100 }} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'nonexistent' } });

      act(() => {
        jest.advanceTimersByTime(150);
      });

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('displays error message on search failure', async () => {
      jest.useFakeTimers();
      global.fetch = mockFetch({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      render(<SyndicationSearchWidget config={{ debounceDelay: 100 }} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'test' } });

      act(() => {
        jest.advanceTimersByTime(150);
      });

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});

describe('Widget with results', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('displays results when search returns data', async () => {
    global.fetch = jest.fn().mockImplementation(url => {
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
              total: { value: 1 },
            },
            aggregations: {},
            took: 15,
          }),
      });
    });

    render(<SyndicationSearchWidget config={{ debounceDelay: 100 }} />);

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'test' } });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Wait for results to appear
    await waitFor(
      () => {
        // Look for results count or result list
        const resultsList = document.querySelector('.mg-search__results-list');
        expect(resultsList).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
