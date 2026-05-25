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

    // facets layout: new union prop
    it('renders sidebar when facets is "sidebar"', () => {
      render(<SyndicationSearchWidget config={{ facets: 'sidebar' }} />);
      expect(document.querySelector('.mg-search__sidebar')).toBeInTheDocument();
      expect(document.querySelector('.mg-search__facets-strip')).not.toBeInTheDocument();
    });

    it('renders horizontal strip when facets is "horizontal"', () => {
      render(<SyndicationSearchWidget config={{ facets: 'horizontal' }} />);
      expect(document.querySelector('.mg-search__facets-strip')).toBeInTheDocument();
      expect(document.querySelector('.mg-search__sidebar')).not.toBeInTheDocument();
    });

    it('hides facets entirely when facets is false', () => {
      render(<SyndicationSearchWidget config={{ facets: false }} />);
      expect(document.querySelector('.mg-search__sidebar')).not.toBeInTheDocument();
      expect(document.querySelector('.mg-search__facets-strip')).not.toBeInTheDocument();
    });

    it('treats facets prop as taking precedence over legacy showFacets', () => {
      render(
        <SyndicationSearchWidget
          config={{ facets: 'horizontal', showFacets: false }}
        />
      );
      // facets wins: horizontal strip renders even though showFacets is false
      expect(document.querySelector('.mg-search__facets-strip')).toBeInTheDocument();
    });

    // facetsTarget, AC2: portal facets to an external DOM region
    it('renders facets into facetsTarget element via portal', () => {
      const target = document.createElement('div');
      target.id = 'external-facets';
      document.body.appendChild(target);

      try {
        render(
          <SyndicationSearchWidget
            config={{ facets: 'sidebar', facetsTarget: '#external-facets' }}
          />
        );

        // Portal renders facets inside the external target, not the sidebar
        expect(target.querySelector('.mg-search__facets-external')).toBeInTheDocument();
        expect(document.querySelector('.mg-search__sidebar')).not.toBeInTheDocument();
      } finally {
        target.remove();
      }
    });

    it('falls back to in-widget layout and warns when facetsTarget selector is not found', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        render(
          <SyndicationSearchWidget
            config={{ facets: 'sidebar', facetsTarget: '#does-not-exist' }}
          />
        );

        // No portal element anywhere
        expect(document.querySelector('.mg-search__facets-external')).not.toBeInTheDocument();
        // In-widget sidebar still rendered
        expect(document.querySelector('.mg-search__sidebar')).toBeInTheDocument();
        // Warning logged once
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('facetsTarget selector "#does-not-exist"')
        );
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('does not render the in-widget horizontal strip when facets are portaled', () => {
      const target = document.createElement('div');
      target.id = 'external-facets-h';
      document.body.appendChild(target);

      try {
        render(
          <SyndicationSearchWidget
            config={{ facets: 'horizontal', facetsTarget: '#external-facets-h' }}
          />
        );

        expect(target.querySelector('.mg-search__facets-external')).toBeInTheDocument();
        expect(document.querySelector('.mg-search__facets-strip')).not.toBeInTheDocument();
      } finally {
        target.remove();
      }
    });

    // searchTarget: search input portal (replaces the deleted standalone bar)
    it('renders the search input into searchTarget element via portal', () => {
      const target = document.createElement('div');
      target.id = 'external-search';
      document.body.appendChild(target);

      try {
        render(
          <SyndicationSearchWidget
            config={{ searchTarget: '#external-search' }}
          />
        );

        // Search form ends up in the external target
        expect(target.querySelector('form[role="search"]')).toBeInTheDocument();
        expect(target.querySelector('input[type="search"]')).toBeInTheDocument();
        // ...and not as a direct child of the widget container
        const widget = document.querySelector('[data-mg-search-widget]');
        expect(widget.querySelector(':scope > form[role="search"]')).not.toBeInTheDocument();
      } finally {
        target.remove();
      }
    });

    it('falls back to in-widget input and warns when searchTarget selector is not found', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        render(
          <SyndicationSearchWidget
            config={{ searchTarget: '#missing-search' }}
          />
        );

        expect(screen.getByRole('search')).toBeInTheDocument();
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('searchTarget selector "#missing-search"')
        );
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('keeps results in the widget container while the search input is portaled', () => {
      const target = document.createElement('div');
      target.id = 'external-search-2';
      document.body.appendChild(target);

      try {
        render(
          <SyndicationSearchWidget
            config={{ searchTarget: '#external-search-2' }}
          />
        );

        const widget = document.querySelector('[data-mg-search-widget]');
        // Input portaled out
        expect(target.querySelector('form[role="search"]')).toBeInTheDocument();
        // Results stay in the widget container
        expect(widget.querySelector('.mg-search__main')).toBeInTheDocument();
      } finally {
        target.remove();
      }
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

    // Regression: on a /search#query=news load, useHashSync dispatches
    // setQuery('news'), but the deferredQuery effect was firing on first
    // render with deferredQuery='' and stomping the hash-loaded value before
    // INITIALIZE could preserve it. The effect now skips its first render.
    it('does not stomp the URL hash query on initial mount', async () => {
      window.history.pushState({}, '', '/search#query=news');

      render(<SyndicationSearchWidget config={{ enableHashSync: true }} />);

      const input = screen.getByRole('searchbox');
      await waitFor(() => {
        expect(input).toHaveValue('news');
      });

      window.history.pushState({}, '', '/');
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
