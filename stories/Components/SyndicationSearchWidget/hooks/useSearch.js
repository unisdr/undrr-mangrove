/**
 * @file useSearch.js
 * @description React hook for executing Elasticsearch searches.
 *
 * Provides search execution with AbortController for request cancellation,
 * integrates with React 19's useTransition for non-blocking updates.
 *
 * @module SearchWidget/hooks/useSearch
 */

import { useEffect, useRef, useCallback, useTransition } from 'react';
import { useSearchConfig, useSearchState, useSearchDispatch, actions } from '../context/SearchContext';
import { buildQuery } from '../utils/queryBuilder';

/**
 * Hook for executing searches against the Elasticsearch endpoint.
 *
 * Features:
 * - AbortController for cancelling in-flight requests
 * - Automatic debouncing via useEffect dependencies
 * - useTransition for non-blocking result updates
 * - Error handling with retry support
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
  const [isPending, startTransition] = useTransition();

  const { query, facets, customFacets, sortBy, isInitialized } = state;
  const { searchEndpoint, minSearchLength, debounceDelay } = config;

  /**
   * Execute a search request.
   * @param {Object} options - Search options
   * @param {boolean} options.force - Force search even if query is short
   */
  const executeSearch = useCallback(async (options = {}) => {
    const { force = false } = options;

    // Check minimum query length (unless forced, has facets, or query is empty)
    // Empty queries are allowed - they return all results (match_all)
    // Short queries (1-2 chars) are blocked unless forced or has facets
    const hasActiveFacets = Object.keys(facets).length > 0 || Object.keys(customFacets || {}).length > 0;
    const isEmptyQuery = query.length === 0;
    const isTooShort = query.length > 0 && query.length < minSearchLength;

    if (!force && !hasActiveFacets && !isEmptyQuery && isTooShort) {
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    dispatch(actions.setLoading(true));

    try {
      const queryBody = buildQuery(
        { query, facets, customFacets, sortBy },
        config
      );

      const response = await fetch(searchEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Use transition for non-blocking result updates
      startTransition(() => {
        dispatch(actions.setResults(data));
      });
    } catch (error) {
      // Don't treat aborted requests as errors
      if (error.name === 'AbortError') {
        return;
      }

      console.error('Search error:', error);
      dispatch(actions.setError(error.message || 'Search failed'));
    }
  }, [query, facets, customFacets, sortBy, searchEndpoint, minSearchLength, config, dispatch, startTransition]);

  /**
   * Debounced search effect.
   * Triggers search when query/facets/sort changes.
   */
  useEffect(() => {
    if (!isInitialized) return;

    // Debounce the search
    const timeoutId = setTimeout(() => {
      executeSearch();
    }, debounceDelay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [query, facets, customFacets, sortBy, isInitialized, debounceDelay, executeSearch]);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
  const setFacetOptimistic = useCallback((key, value, replace = true) => {
    // Optimistically update state
    dispatch(actions.setFacet(key, value, replace));
    // Search will be triggered by the effect in useSearch
  }, [dispatch]);

  /**
   * Remove a facet with optimistic update.
   */
  const removeFacetOptimistic = useCallback((key, value) => {
    // Optimistically update state
    dispatch(actions.removeFacet(key, value));
    // Search will be triggered by the effect in useSearch
  }, [dispatch]);

  /**
   * Set sort with optimistic update.
   */
  const setSortOptimistic = useCallback((sortBy) => {
    dispatch(actions.setSort(sortBy));
  }, [dispatch]);

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
