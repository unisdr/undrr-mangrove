/**
 * @file SyndicationSearchWidget.jsx
 * @description UNDRR Syndication Search Widget - React 19 component.
 *
 * A feature-rich search widget tightly coupled with the UNDRR web platform.
 * Integrates with Elasticsearch via the UNDRR /search-endpoint proxy.
 * Uses React 19's concurrent features for optimal user experience.
 *
 * Features:
 * - useDeferredValue for responsive input
 * - useTransition for non-blocking result updates
 * - Suspense boundaries for loading states
 * - Full accessibility (ARIA, keyboard navigation)
 * - Faceted search with active filter chips
 * - URL hash synchronization
 * - Pre-rendered teaser HTML support
 *
 * @module SyndicationSearchWidget
 */

import React, { useState, useEffect, useDeferredValue, Suspense, useId } from 'react';
import { SearchProvider, useSearchDispatch, useSearchConfig, useSearchState, actions } from './context/SearchContext';
import { useSearch } from './hooks/useSearch';
import { useHashSync } from './hooks/useHashSync';
import SearchForm from './components/SearchForm';
import SearchResults from './components/SearchResults';
import ActiveFilters from './components/ActiveFilters';
import FacetsSidebar from './components/FacetsSidebar';

/**
 * SyndicationSearchWidget component.
 * Main entry point for the UNDRR Syndication Search Widget.
 *
 * @param {Object} props - Component props
 * @param {Object} props.config - Widget configuration
 */
export function SyndicationSearchWidget({ config }) {
  return (
    <SearchProvider config={config}>
      <SyndicationSearchWidgetInner />
    </SearchProvider>
  );
}

// Alias for backwards compatibility
export const SearchWidget = SyndicationSearchWidget;

/**
 * Inner component that has access to search context.
 * Implements the React 19 patterns for concurrent rendering.
 */
function SyndicationSearchWidgetInner() {
  const config = useSearchConfig();
  const state = useSearchState();
  const dispatch = useSearchDispatch();
  const { isPending } = useSearch();

  // Generate unique ID for this widget instance
  const widgetId = useId().replace(/:/g, '');

  // Enable URL hash synchronization
  useHashSync({ enabled: config.enableHashSync !== false });

  // Local state for immediate input feedback
  const [inputValue, setInputValue] = useState(config.defaultQuery || '');

  // Defer the query value for search execution
  // This keeps the input responsive while search runs in background
  const deferredQuery = useDeferredValue(inputValue);
  const isStale = inputValue !== deferredQuery;

  // Update context when deferred query changes
  useEffect(() => {
    dispatch(actions.setQuery(deferredQuery));
  }, [deferredQuery, dispatch]);

  // Initialize widget on mount
  useEffect(() => {
    dispatch(actions.initialize({
      defaultFilters: config.defaultFilters,
      defaultQuery: config.defaultQuery,
      defaultSort: config.defaultSort,
    }));
  }, [dispatch, config.defaultFilters, config.defaultQuery, config.defaultSort]);

  // Sync input with state (e.g., from URL hash)
  useEffect(() => {
    if (state.query !== inputValue && state.isInitialized) {
      setInputValue(state.query);
    }
  }, [state.query, state.isInitialized]);

  const { showFacets, showActiveFilters, showSearchMetrics } = config;
  const { isLoading } = state;

  return (
    <div
      className="mg-search-widget"
      data-mg-search-widget
      data-mg-search-debug={showSearchMetrics ? 'true' : undefined}
    >
      {/* Search form */}
      {config.showSearchBox !== false && (
        <SearchForm
          value={inputValue}
          onChange={setInputValue}
          isStale={isStale || isPending}
          isLoading={isLoading}
          widgetId={widgetId}
        />
      )}

      {/* Active filter chips */}
      {showActiveFilters && <ActiveFilters widgetId={widgetId} />}

      {/* Main content area */}
      <div className="mg-search__content">
        {/* Results area */}
        <main
          className="mg-search__main"
          data-vf-google-analytics-region="undrr-search-results"
        >
          <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResults
              isStale={isStale || isPending}
              widgetId={widgetId}
            />
          </Suspense>
        </main>

        {/* Facets sidebar */}
        {showFacets && (
          <aside
            className="mg-search__sidebar"
            data-vf-google-analytics-region="undrr-search-facets"
          >
            <FacetsSidebar widgetId={widgetId} />
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for search results.
 */
function SearchResultsSkeleton() {
  return (
    <div className="mg-search__skeleton" aria-busy="true" aria-label="Loading results">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="mg-search__skeleton-item">
          <div className="mg-search__skeleton-title" />
          <div className="mg-search__skeleton-meta" />
          <div className="mg-search__skeleton-text" />
          <div className="mg-search__skeleton-text mg-search__skeleton-text--short" />
        </div>
      ))}
    </div>
  );
}

export default SearchWidget;
