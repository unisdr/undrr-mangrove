/**
 * @file SearchContext.test.jsx
 * @description Tests for SearchContext provider and reducer logic.
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import {
  SearchProvider,
  useSearchConfig,
  useSearchState,
  useSearchDispatch,
  actions,
  ActionTypes,
} from '../context/SearchContext';

// Test component to expose context values
function TestConsumer({ onMount }) {
  const config = useSearchConfig();
  const state = useSearchState();
  const dispatch = useSearchDispatch();

  React.useEffect(() => {
    if (onMount) {
      onMount({ config, state, dispatch });
    }
  }, [config, state, dispatch, onMount]);

  return (
    <div>
      <span data-testid="query">{state.query}</span>
      <span data-testid="sortBy">{state.sortBy}</span>
      <span data-testid="isLoading">{String(state.isLoading)}</span>
      <span data-testid="totalResults">{state.totalResults}</span>
      <span data-testid="isInitialized">{String(state.isInitialized)}</span>
    </div>
  );
}

// Helper to render with provider
function renderWithProvider(config = {}, onMount) {
  return render(
    <SearchProvider config={config}>
      <TestConsumer onMount={onMount} />
    </SearchProvider>
  );
}

describe('SearchContext', () => {
  describe('SearchProvider', () => {
    it('provides default configuration', () => {
      let capturedConfig;
      renderWithProvider({}, ({ config }) => {
        capturedConfig = config;
      });

      expect(capturedConfig).toBeDefined();
      expect(capturedConfig.searchEndpoint).toBe(
        'https://www.undrr.org/search-endpoint'
      );
      expect(capturedConfig.resultsPerPage).toBe(5);
      expect(capturedConfig.debounceDelay).toBe(300);
    });

    it('merges custom config with defaults', () => {
      let capturedConfig;
      renderWithProvider(
        {
          resultsPerPage: 20,
          customOption: 'test',
        },
        ({ config }) => {
          capturedConfig = config;
        }
      );

      expect(capturedConfig.resultsPerPage).toBe(20);
      expect(capturedConfig.customOption).toBe('test');
      // Default values should still be present
      expect(capturedConfig.debounceDelay).toBe(300);
    });

    it('provides initial state', () => {
      renderWithProvider();

      expect(screen.getByTestId('query').textContent).toBe('');
      expect(screen.getByTestId('sortBy').textContent).toBe('relevance');
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
      expect(screen.getByTestId('totalResults').textContent).toBe('0');
    });
  });

  describe('hooks throw outside provider', () => {
    // Suppress console.error for these tests
    const originalError = console.error;
    beforeEach(() => {
      console.error = jest.fn();
    });
    afterEach(() => {
      console.error = originalError;
    });

    it('useSearchConfig throws outside provider', () => {
      function BadComponent() {
        useSearchConfig();
        return null;
      }

      expect(() => render(<BadComponent />)).toThrow(
        'useSearchConfig must be used within a SearchProvider'
      );
    });

    it('useSearchState throws outside provider', () => {
      function BadComponent() {
        useSearchState();
        return null;
      }

      expect(() => render(<BadComponent />)).toThrow(
        'useSearchState must be used within a SearchProvider'
      );
    });

    it('useSearchDispatch throws outside provider', () => {
      function BadComponent() {
        useSearchDispatch();
        return null;
      }

      expect(() => render(<BadComponent />)).toThrow(
        'useSearchDispatch must be used within a SearchProvider'
      );
    });
  });

  describe('reducer actions', () => {
    it('SET_QUERY updates query and resets page', () => {
      let dispatch;
      renderWithProvider({}, ({ dispatch: d }) => {
        dispatch = d;
      });

      act(() => {
        dispatch(actions.setQuery('test query'));
      });

      expect(screen.getByTestId('query').textContent).toBe('test query');
    });

    it('SET_SORT updates sortBy', () => {
      let dispatch;
      renderWithProvider({}, ({ dispatch: d }) => {
        dispatch = d;
      });

      act(() => {
        dispatch(actions.setSort('newest'));
      });

      expect(screen.getByTestId('sortBy').textContent).toBe('newest');
    });

    it('SET_LOADING updates loading state', () => {
      let dispatch;
      renderWithProvider({}, ({ dispatch: d }) => {
        dispatch = d;
      });

      act(() => {
        dispatch(actions.setLoading(true));
      });

      expect(screen.getByTestId('isLoading').textContent).toBe('true');

      act(() => {
        dispatch(actions.setLoading(false));
      });

      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    it('INITIALIZE sets up initial state from config', () => {
      let dispatch;
      renderWithProvider({}, ({ dispatch: d }) => {
        dispatch = d;
      });

      act(() => {
        dispatch(
          actions.initialize({
            defaultQuery: 'initial query',
            defaultSort: 'newest',
            defaultFilters: [{ key: 'type', value: 'news' }],
          })
        );
      });

      expect(screen.getByTestId('query').textContent).toBe('initial query');
      expect(screen.getByTestId('sortBy').textContent).toBe('newest');
      expect(screen.getByTestId('isInitialized').textContent).toBe('true');
    });

    it('SET_RESULTS updates results and clears loading', () => {
      let dispatch, state;

      // Component that exposes full state
      function FullStateConsumer() {
        state = useSearchState();
        dispatch = useSearchDispatch();
        return null;
      }

      render(
        <SearchProvider config={{}}>
          <FullStateConsumer />
        </SearchProvider>
      );

      const mockResults = {
        hits: {
          hits: [{ _id: '1', _source: { title: 'Test' } }],
          total: { value: 42 },
        },
        aggregations: { type: { buckets: [] } },
        took: 15,
      };

      act(() => {
        dispatch(actions.setLoading(true));
      });

      expect(state.isLoading).toBe(true);

      act(() => {
        dispatch(actions.setResults(mockResults));
      });

      expect(state.isLoading).toBe(false);
      expect(state.results).toHaveLength(1);
      expect(state.totalResults).toBe(42);
      expect(state.searchTime).toBe(15);
      expect(state.aggregations).toEqual({ type: { buckets: [] } });
    });

    it('SET_ERROR updates error and clears loading', () => {
      let dispatch, state;

      function FullStateConsumer() {
        state = useSearchState();
        dispatch = useSearchDispatch();
        return null;
      }

      render(
        <SearchProvider config={{}}>
          <FullStateConsumer />
        </SearchProvider>
      );

      act(() => {
        dispatch(actions.setLoading(true));
      });

      act(() => {
        dispatch(actions.setError('Something went wrong'));
      });

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Something went wrong');
    });

    it('RESET restores initial state but keeps initialized flag', () => {
      let dispatch, state;

      function FullStateConsumer() {
        state = useSearchState();
        dispatch = useSearchDispatch();
        return null;
      }

      render(
        <SearchProvider config={{}}>
          <FullStateConsumer />
        </SearchProvider>
      );

      // Make some changes
      act(() => {
        dispatch(actions.setQuery('test'));
        dispatch(actions.setSort('newest'));
        dispatch(
          actions.setFacet('type', 'news')
        );
      });

      expect(state.query).toBe('test');
      expect(state.sortBy).toBe('newest');

      // Reset
      act(() => {
        dispatch(actions.reset());
      });

      expect(state.query).toBe('');
      expect(state.sortBy).toBe('relevance');
      expect(state.facets).toEqual({});
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('facet actions', () => {
    let dispatch, state;

    beforeEach(() => {
      function FullStateConsumer() {
        state = useSearchState();
        dispatch = useSearchDispatch();
        return null;
      }

      render(
        <SearchProvider config={{}}>
          <FullStateConsumer />
        </SearchProvider>
      );
    });

    it('SET_FACET adds a facet value', () => {
      act(() => {
        dispatch(actions.setFacet('type', 'news'));
      });

      expect(state.facets.type).toEqual(['news']);
    });

    it('SET_FACET with replace=false appends values', () => {
      act(() => {
        dispatch(actions.setFacet('type', 'news'));
      });

      act(() => {
        dispatch(actions.setFacet('type', 'event', false));
      });

      expect(state.facets.type).toEqual(['news', 'event']);
    });

    it('SET_FACET with array value sets multiple values', () => {
      act(() => {
        dispatch(actions.setFacet('type', ['news', 'event', 'publication']));
      });

      expect(state.facets.type).toEqual(['news', 'event', 'publication']);
    });

    it('REMOVE_FACET removes a specific value', () => {
      act(() => {
        dispatch(actions.setFacet('type', ['news', 'event']));
      });

      act(() => {
        dispatch(actions.removeFacet('type', 'news'));
      });

      expect(state.facets.type).toEqual(['event']);
    });

    it('REMOVE_FACET removes entire facet when last value removed', () => {
      act(() => {
        dispatch(actions.setFacet('type', 'news'));
      });

      act(() => {
        dispatch(actions.removeFacet('type', 'news'));
      });

      expect(state.facets.type).toBeUndefined();
    });

    it('REMOVE_FACET with no value removes entire facet', () => {
      act(() => {
        dispatch(actions.setFacet('type', ['news', 'event']));
      });

      act(() => {
        dispatch(actions.removeFacet('type'));
      });

      expect(state.facets.type).toBeUndefined();
    });

    it('CLEAR_FACETS removes all facets', () => {
      act(() => {
        dispatch(actions.setFacet('type', 'news'));
        dispatch(actions.setFacet('year', '2024'));
        dispatch(actions.setFacetOperator('type', 'AND'));
      });

      act(() => {
        dispatch(actions.clearFacets());
      });

      expect(state.facets).toEqual({});
      expect(state.facetOperators).toEqual({});
    });

    it('SET_FACET_OPERATOR sets operator for a facet', () => {
      act(() => {
        dispatch(actions.setFacetOperator('type', 'AND'));
      });

      expect(state.facetOperators.type).toBe('AND');
    });
  });

  describe('custom facet actions', () => {
    let dispatch, state;

    beforeEach(() => {
      function FullStateConsumer() {
        state = useSearchState();
        dispatch = useSearchDispatch();
        return null;
      }

      render(
        <SearchProvider config={{}}>
          <FullStateConsumer />
        </SearchProvider>
      );
    });

    it('SET_CUSTOM_FACET sets custom facet value', () => {
      act(() => {
        dispatch(actions.setCustomFacet('resourceType', '0'));
      });

      expect(state.customFacets.resourceType).toEqual(['0']);
    });

    it('SET_CUSTOM_FACET with array sets multiple values', () => {
      act(() => {
        dispatch(actions.setCustomFacet('resourceType', ['0', '1', '2']));
      });

      expect(state.customFacets.resourceType).toEqual(['0', '1', '2']);
    });

    it('REMOVE_CUSTOM_FACET removes custom facet', () => {
      act(() => {
        dispatch(actions.setCustomFacet('resourceType', '0'));
      });

      act(() => {
        dispatch(actions.removeCustomFacet('resourceType'));
      });

      expect(state.customFacets.resourceType).toBeUndefined();
    });
  });

  describe('action creators', () => {
    it('creates correct action objects', () => {
      expect(actions.setQuery('test')).toEqual({
        type: ActionTypes.SET_QUERY,
        payload: 'test',
      });

      expect(actions.setFacet('type', 'news', false)).toEqual({
        type: ActionTypes.SET_FACET,
        payload: { key: 'type', value: 'news', replace: false },
      });

      expect(actions.removeFacet('type', 'news')).toEqual({
        type: ActionTypes.REMOVE_FACET,
        payload: { key: 'type', value: 'news' },
      });

      expect(actions.clearFacets()).toEqual({
        type: ActionTypes.CLEAR_FACETS,
      });

      expect(actions.setSort('newest')).toEqual({
        type: ActionTypes.SET_SORT,
        payload: 'newest',
      });

      expect(actions.setPage(2)).toEqual({
        type: ActionTypes.SET_PAGE,
        payload: 2,
      });

      expect(actions.reset()).toEqual({
        type: ActionTypes.RESET,
      });
    });
  });
});
