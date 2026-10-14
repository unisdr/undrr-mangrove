/**
 * @file useSearch.js
 * @description React hook for executing Elasticsearch searches.
 *
 * Provides search execution with AbortController for request cancellation,
 * integrates with React 19's useTransition for non-blocking updates.
 *
 * @module SearchWidget/hooks/useSearch
 */

import {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from 'react';
import {
  useSearchConfig,
  useSearchState,
  useSearchDispatch,
  actions,
} from '../context/SearchContext';
import { buildQuery } from '../utils/queryBuilder';
import { isQueryTooShortToSearch } from '../utils/constants';

/**
 * Serialise a request so that two requests Elasticsearch would answer the
 * same way compare equal. The recency function's `now` parameter changes on
 * every build and is left out.
 * @private
 */
function requestKey(endpoint, body) {
  return JSON.stringify({ endpoint, body }, (key, value) =>
    key === 'now' ? undefined : value
  );
}

/**
 * Hook for executing searches against the Elasticsearch endpoint.
 *
 * - Searches when the request would change, not when the config object's
 *   identity changes: the request body (minus the volatile `now` parameter)
 *   is the dependency, so cosmetic options such as `displayMode` or
 *   `showResultsCount` don't cost a request.
 * - Only typing is debounced. The first search, and facet, sort, page and
 *   config changes, run at once.
 * - A superseded or unmounted search is aborted, and a response that arrives
 *   after it was superseded is ignored.
 * - useTransition for non-blocking result updates.
 *
 * @returns {Object} Search utilities
 * @returns {Function} returns.executeSearch - Manually trigger a search
 * @returns {boolean} returns.isPending - Whether a transition is pending
 * @returns {Function} returns.refresh - Re-run the current search
 */
export function useSearch() {
  const config = useSearchConfig();
  const state = useSearchState();
  const dispatch = useSearchDispatch();
  const abortControllerRef = useRef(null);
  // aggregationsKey of the last response whose aggregations are in state.
  const aggregationsKeyRef = useRef(null);
  const [isPending, startTransition] = useTransition();
  // Highlights are only displayed by the no-teaser fallback rendering, and
  // body highlighting roughly doubles Elasticsearch's time. Request them only
  // once a response has a hit without teaser HTML. Turning them on is left
  // out of the request key: it applies from the next search the reader
  // causes, rather than firing a second request for the results on screen.
  const [needsHighlight, setNeedsHighlight] = useState(false);

  const {
    query,
    facets,
    facetOperators,
    customFacets,
    sortBy,
    page,
    isInitialized,
    aggregations,
  } = state;
  const { searchEndpoint, minSearchLength, debounceDelay } = config;

  // The request as Elasticsearch would see it. Rebuilt when state or config
  // change; the effect below only runs when its serialised form changes.
  const request = useMemo(() => {
    const body = buildQuery(
      { query, facets, facetOperators, customFacets, sortBy, page },
      config,
      { highlight: needsHighlight }
    );
    return {
      body,
      key: requestKey(searchEndpoint, { ...body, highlight: undefined }),
      // Aggregations depend on the main query and the aggregation
      // definitions only: not on the page, the sort or the facet selections
      // (those are a post_filter, applied after aggregating).
      aggregationsKey: requestKey(searchEndpoint, {
        query: body.query,
        aggs: body.aggs,
      }),
    };
  }, [
    query,
    facets,
    facetOperators,
    customFacets,
    sortBy,
    page,
    config,
    needsHighlight,
    searchEndpoint,
  ]);

  // Latest values for the search function, so it can stay stable.
  const latestRef = useRef(null);
  latestRef.current = {
    request,
    query,
    facets,
    customFacets,
    searchEndpoint,
    minSearchLength,
    needsHighlight,
    aggregations,
  };

  /**
   * Execute a search request.
   * @param {Object} options - Search options
   * @param {boolean} options.force - Force search even if query is short
   */
  const executeSearch = useCallback(
    async (options = {}) => {
      const { force = false } = options;
      const latest = latestRef.current;

      // A short query without filters waits for more input (the empty query
      // searches everything). SearchResults uses the same rule to decide
      // between the skeleton and asking for input.
      if (!force && isQueryTooShortToSearch(latest, latest.minSearchLength)) {
        // An earlier search may have been aborted on the way here.
        dispatch(actions.setLoading(false));
        return;
      }

      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      dispatch(actions.setLoading(true));

      // Turning a page, sorting or picking a facet leaves the aggregations in
      // state right, so don't ask Elasticsearch to compute them again.
      let { body } = latest.request;
      const keepAggregations =
        Boolean(body.aggs) &&
        latest.aggregations !== null &&
        aggregationsKeyRef.current === latest.request.aggregationsKey;
      if (keepAggregations) {
        body = { ...body };
        delete body.aggs;
      }

      try {
        const response = await fetch(latest.searchEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Search failed: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        // Superseded while the body was read: a newer search owns the state.
        if (controller.signal.aborted) return;

        if (
          !latest.needsHighlight &&
          data?.hits?.hits?.some(hit => !hit._source?.teaser)
        ) {
          setNeedsHighlight(true);
        }

        if (body.aggs) {
          aggregationsKeyRef.current = latest.request.aggregationsKey;
        }

        // Use transition for non-blocking result updates
        startTransition(() => {
          dispatch(actions.setResults(data, { keepAggregations }));
        });
      } catch (error) {
        // Don't treat aborted requests as errors
        if (error.name === 'AbortError' || controller.signal.aborted) {
          return;
        }

        console.error('Search error:', error);
        dispatch(actions.setError(error.message || 'Search failed'));
      }
    },
    [dispatch, startTransition]
  );

  // Called through a ref so the effect below depends on the request alone,
  // not on the identity of this function.
  const executeSearchRef = useRef(executeSearch);
  executeSearchRef.current = executeSearch;

  // The query of the last scheduled search: a change to it alone is typing,
  // the only thing worth debouncing.
  const scheduledQueryRef = useRef(null);

  useEffect(() => {
    if (!isInitialized) return undefined;

    const typed =
      scheduledQueryRef.current !== null && scheduledQueryRef.current !== query;
    scheduledQueryRef.current = query;

    const timeoutId = setTimeout(
      () => {
        executeSearchRef.current();
      },
      typed ? debounceDelay : 0
    );

    return () => {
      clearTimeout(timeoutId);
      // The request this effect started is stale now; a newer one follows.
      abortControllerRef.current?.abort();
    };
    // request.key stands for everything the request depends on.
  }, [request.key, isInitialized, debounceDelay]);

  /**
   * Refresh the current search (re-execute with same parameters).
   */
  const refresh = useCallback(() => {
    executeSearch({ force: true });
  }, [executeSearch]);

  return {
    executeSearch,
    isPending,
    refresh,
  };
}

/**
 * Hook for search with optimistic updates.
 * Wraps useSearch with React 19's useOptimistic pattern.
 *
 * @returns {Object} Search utilities with optimistic state
 */
export function useOptimisticSearch() {
  const { executeSearch, isPending, refresh } = useSearch();
  const dispatch = useSearchDispatch();
  const state = useSearchState();

  /**
   * Set a facet with optimistic update.
   * The UI updates immediately, then the search executes.
   */
  const setFacetOptimistic = useCallback(
    (key, value, replace = true) => {
      // Optimistically update state
      dispatch(actions.setFacet(key, value, replace));
      // Search will be triggered by the effect in useSearch
    },
    [dispatch]
  );

  /**
   * Remove a facet with optimistic update.
   */
  const removeFacetOptimistic = useCallback(
    (key, value) => {
      // Optimistically update state
      dispatch(actions.removeFacet(key, value));
      // Search will be triggered by the effect in useSearch
    },
    [dispatch]
  );

  /**
   * Set sort with optimistic update.
   */
  const setSortOptimistic = useCallback(
    sortBy => {
      dispatch(actions.setSort(sortBy));
    },
    [dispatch]
  );

  return {
    executeSearch,
    isPending,
    refresh,
    setFacetOptimistic,
    removeFacetOptimistic,
    setSortOptimistic,
    ...state,
  };
}

export default useSearch;
