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

import React, { useState, useEffect, useDeferredValue, Suspense, useId, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { SearchProvider, useSearchDispatch, useSearchConfig, useSearchState, actions } from './context/SearchContext';
import { useSearch } from './hooks/useSearch';
import { useHashSync } from './hooks/useHashSync';
import { resolveFacetsLayout } from './utils/constants';
import SearchForm from './components/SearchForm';
import SearchResults from './components/SearchResults';
import ActiveFilters from './components/ActiveFilters';
import FacetsSidebar from './components/FacetsSidebar';
import MobileFilterDrawer from './components/MobileFilterDrawer';

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

SyndicationSearchWidget.propTypes = {
  /** Widget configuration object merged with DEFAULT_CONFIG from utils/constants. */
  config: PropTypes.shape({
    /** Elasticsearch proxy endpoint URL. */
    searchEndpoint: PropTypes.string,
    /** Number of results per page. */
    resultsPerPage: PropTypes.number,
    /** Debounce delay in milliseconds for search input. */
    debounceDelay: PropTypes.number,
    /** Minimum characters before a search is triggered. */
    minSearchLength: PropTypes.number,
    /** Whether to synchronize search state with the URL hash. */
    enableHashSync: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(['auto'])]),
    /** Initial search query string. */
    defaultQuery: PropTypes.string,
    /** Default sort order. */
    defaultSort: PropTypes.oneOf(['relevance', 'newest', 'oldest']),
    /** Whether to display the search input box. */
    showSearchBox: PropTypes.bool,
    /** Whether to display the total results count. */
    showResultsCount: PropTypes.bool,
    /** Whether to display the search timer. */
    showSearchTimer: PropTypes.bool,
    /**
     * Facets layout — visibility and placement.
     * `false` hides facets entirely; `'sidebar'` (default) renders them in
     * the right-hand sidebar; `'horizontal'` renders them as a horizontal
     * strip above the results region.
     */
    facets: PropTypes.oneOf([false, 'sidebar', 'horizontal']),
    /** @deprecated Use `facets` instead. Boolean shorthand: false hides, true → 'sidebar'. */
    showFacets: PropTypes.bool,
    /** Whether to display active filter chips above results. */
    showActiveFilters: PropTypes.bool,
    /** Whether to display search performance metrics. */
    showSearchMetrics: PropTypes.bool,
    /** Whether to display pagination controls. */
    showPager: PropTypes.bool,
    /** Filters applied by default on initialization. */
    defaultFilters: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string,
      value: PropTypes.string,
    })),
    /** Facet keys to show; null shows all available facets. */
    visibleFilters: PropTypes.arrayOf(PropTypes.string),
    /** Content type restrictions; null allows all types. */
    allowedTypes: PropTypes.arrayOf(PropTypes.string),
    /** Additional query string appended to every search request. */
    queryAppend: PropTypes.string,
    /** Custom filter definitions. */
    customFilters: PropTypes.array,
    /** Custom facet definitions. */
    customFacets: PropTypes.array,
    /** Result display mode. */
    displayMode: PropTypes.oneOf(['list', 'card', 'card-book']),
    /** Number of grid columns for card display modes. */
    gridColumns: PropTypes.number,
    /** Controls which teaser fields are visible; null shows all. */
    visibleTeaserFields: PropTypes.object,
    /** Whether to exclude results that have no image. */
    requireImage: PropTypes.bool,
  }).isRequired,
};

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

  // Mobile filter drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  // Defer the query value for search execution
  // This keeps the input responsive while search runs in background
  const deferredQuery = useDeferredValue(inputValue);

  // Update context when deferred query changes.
  // Skip the first render: on initial mount, useHashSync may have already
  // dispatched setQuery from the URL hash (e.g. #query=news). If we ran an
  // unconditional setQuery('') here on mount we would stomp that value before
  // INITIALIZE could preserve it. Subsequent renders sync user input as normal.
  const isFirstQuerySync = useRef(true);
  useEffect(() => {
    if (isFirstQuerySync.current) {
      isFirstQuerySync.current = false;
      return;
    }
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

  const { showActiveFilters, showSearchMetrics } = config;
  const facetsLayout = resolveFacetsLayout(config);
  const facetsActive = facetsLayout !== false;
  const { isLoading } = state;

  // Count active filters for mobile button badge
  const activeFilterCount = countActiveFilters(state);

  return (
    <div
      className={`mg-search-widget ${isLoading || isPending ? 'mg-search-widget--loading' : ''}`}
      data-mg-search-widget
      data-mg-search-debug={showSearchMetrics ? 'true' : undefined}
    >
      {/* Loading progress bar — only during actual fetch or transition */}
      {(isLoading || isPending) && (
        <div className="mg-search__progress" aria-hidden="true">
          <div className="mg-search__progress-bar" />
        </div>
      )}

      {/* Search form */}
      {config.showSearchBox !== false && (
        <SearchForm
          value={inputValue}
          onChange={setInputValue}
          isStale={isPending}
          isLoading={isLoading}
          widgetId={widgetId}
        />
      )}

      {/* Horizontal facet strip — only when facets layout is 'horizontal'.
          Renders the same FacetsSidebar contents but in a row above results;
          on small viewports the strip is hidden and the mobile filter drawer
          handles the same job. */}
      {facetsLayout === 'horizontal' && (
        <div
          className="mg-search__facets-strip"
          data-vf-google-analytics-region="undrr-search-facets"
        >
          <FacetsSidebar widgetId={widgetId} />
        </div>
      )}

      {/* Active filter chips */}
      {showActiveFilters && <ActiveFilters widgetId={widgetId} />}

      {/* Main content area */}
      <div className="mg-search__content">
        {/* Results area */}
        <main
          className={`mg-search__main ${isPending ? 'mg-search__main--stale' : ''}`}
          data-vf-google-analytics-region="undrr-search-results"
          aria-busy={isLoading || isPending}
        >
          <Suspense fallback={<SearchResultsSkeleton displayMode={config.displayMode} count={config.resultsPerPage} gridColumns={config.gridColumns} />}>
            <SearchResults
              isStale={isPending}
              widgetId={widgetId}
              showMobileFilterButton={facetsActive}
              onOpenFilters={openDrawer}
              activeFilterCount={activeFilterCount}
            />
          </Suspense>
        </main>

        {/* Facets sidebar - desktop only */}
        {facetsLayout === 'sidebar' && (
          <aside
            className="mg-search__sidebar"
            data-vf-google-analytics-region="undrr-search-facets"
          >
            <FacetsSidebar widgetId={widgetId} />
          </aside>
        )}
      </div>

      {/* Mobile filter drawer — used by both sidebar and horizontal layouts
          on small viewports. */}
      {facetsActive && (
        <MobileFilterDrawer
          isOpen={isDrawerOpen}
          onClose={closeDrawer}
          widgetId={widgetId}
        />
      )}
    </div>
  );
}

/**
 * Loading skeleton for search results.
 * Renders a card grid skeleton for card/card-book modes, list skeleton otherwise.
 */
function SearchResultsSkeleton({ displayMode = 'list', count = 5, gridColumns }) {
  const isCardMode = displayMode === 'card' || displayMode === 'card-book';
  const cols = isCardMode ? Math.min(Math.max(gridColumns ?? count, 2), 6) : undefined;

  if (isCardMode) {
    return (
      <div className={`mg-search__skeleton mg-search__skeleton--card mg-grid mg-grid__col-${cols}`} aria-busy="true" aria-label="Loading results">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="mg-search__skeleton-card">
            <div className="mg-search__skeleton-card-image" />
            <div className="mg-search__skeleton-card-body">
              <div className="mg-search__skeleton-title" />
              <div className="mg-search__skeleton-meta" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mg-search__skeleton" aria-busy="true" aria-label="Loading results">
      {Array.from({ length: count }).map((_, i) => (
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

/**
 * Count total active filters (facets + custom facets).
 * @param {Object} state - Search state
 * @returns {number} Count of active filters
 */
function countActiveFilters(state) {
  let count = 0;

  if (state.facets) {
    for (const values of Object.values(state.facets)) {
      if (Array.isArray(values)) {
        count += values.length;
      }
    }
  }

  if (state.customFacets) {
    for (const values of Object.values(state.customFacets)) {
      if (Array.isArray(values)) {
        count += values.length;
      }
    }
  }

  return count;
}

export default SearchWidget;
