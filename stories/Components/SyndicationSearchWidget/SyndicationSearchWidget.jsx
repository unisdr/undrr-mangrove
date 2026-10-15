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

import React, {
  useState,
  useEffect,
  useDeferredValue,
  Suspense,
  useId,
  useCallback,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import {
  SearchProvider,
  useSearchDispatch,
  useSearchConfig,
  useSearchState,
  actions,
} from './context/SearchContext';
import { useSearch } from './hooks/useSearch';
import { useHashSync } from './hooks/useHashSync';
import { useExternalTarget } from './hooks/useExternalTarget';
import { analyticsRegion, resolveFacetsLayout } from './utils/constants';
import {
  WidgetRootContext,
  useWidgetRootRef,
} from './context/WidgetRootContext';
import SearchForm from './components/SearchForm';
import SearchResults from './components/SearchResults';
import SearchProgress from './components/SearchProgress';
import ActiveFilters from './components/ActiveFilters';
import FacetsSidebar from './components/FacetsSidebar';
import MobileFilterDrawer from './components/MobileFilterDrawer';

/**
 * SyndicationSearchWidget component.
 * Main entry point for the UNDRR Syndication Search Widget.
 *
 * @param {Object} props - Component props
 * @param {Object} props.config - Widget configuration
 * @param {Object} [props.labels] - UI label overrides; merged with DEFAULT_LABELS
 */
export function SyndicationSearchWidget({ config, labels }) {
  // The widget root, attached by the inner component. Target selectors and
  // other document lookups resolve against its ownerDocument, so a widget
  // mounted inside an iframe (a block editor canvas) finds elements in that
  // iframe rather than in the window its script runs in.
  const rootRef = useRef(null);
  return (
    <SearchProvider config={config} labels={labels}>
      <WidgetRootContext value={rootRef}>
        <SyndicationSearchWidgetInner />
      </WidgetRootContext>
    </SearchProvider>
  );
}

SyndicationSearchWidget.propTypes = {
  /** Widget configuration object merged with DEFAULT_CONFIG from utils/constants. */
  config: PropTypes.shape({
    /**
     * Elasticsearch proxy endpoint URL. Results are rendered as unsanitised
     * HTML, so this endpoint is trusted; see "Endpoint trust contract" in the
     * MDX documentation.
     */
    searchEndpoint: PropTypes.string,
    /**
     * Taxonomy API URL used to label the country, hazard and theme facets.
     * Defaults to the PreventionWeb v1 taxonomy endpoint. The response must
     * be JSON with a `results` array of `{ id, name }` terms.
     */
    taxonomyEndpoint: PropTypes.string,
    /** Number of results per page. */
    resultsPerPage: PropTypes.number,
    /** Debounce delay in milliseconds for search input. */
    debounceDelay: PropTypes.number,
    /** Minimum characters before a search is triggered. */
    minSearchLength: PropTypes.number,
    /** Whether to synchronize search state with the URL hash. */
    enableHashSync: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.oneOf(['auto']),
    ]),
    /** Initial search query string. */
    defaultQuery: PropTypes.string,
    /**
     * Default sort order. `eventDateAsc` / `eventDateDesc` sort by
     * `event_start`, results without one last, and add both event sorts to
     * the sort dropdown.
     */
    defaultSort: PropTypes.oneOf([
      'relevance',
      'newest',
      'oldest',
      'eventDateAsc',
      'eventDateDesc',
    ]),
    /** Whether to display the search input box. */
    showSearchBox: PropTypes.bool,
    /** Whether to display the total results count. */
    showResultsCount: PropTypes.bool,
    /** Whether to display the search timer. */
    showSearchTimer: PropTypes.bool,
    /**
     * Facets layout: visibility and placement.
     * `false` hides facets entirely; `'sidebar'` (default) renders them in
     * the right-hand sidebar; `'horizontal'` renders them as a horizontal
     * strip above the results region.
     */
    facets: PropTypes.oneOf([false, 'sidebar', 'horizontal']),
    /** @deprecated Use `facets` instead. Boolean shorthand: false hides, true → 'sidebar'. */
    showFacets: PropTypes.bool,
    /**
     * CSS selector for a DOM element outside the widget where the facets
     * UI should be rendered (via React portal). Useful when a consuming
     * page wants to place facets in a left rail or other region that is
     * not a child of the widget container. When set and the element is
     * found, the in-widget sidebar / strip is suppressed and the facets
     * are rendered into the target instead. The widget's React tree spans
     * the portal so search context still flows. If the target element is
     * not present at mount time, the widget falls back to the in-widget
     * layout chosen by `facets` and a warning is logged. The selector is
     * matched in the document the widget is mounted in, which is not the
     * global `document` when the widget renders inside an iframe (such as
     * a block editor canvas).
     */
    facetsTarget: PropTypes.string,
    /**
     * CSS selector for a DOM element outside the widget where the search
     * input should be rendered (via React portal). Lets a consuming page
     * place a "hero" search input in a banner region while results render
     * where the widget is mounted. The same React tree spans the portal,
     * so the input, facets, and results all share `SearchContext`, with no
     * separate component, no URL-hash bridge needed for the same-page
     * case. If the target element is not present at mount time the
     * widget falls back to rendering the input in-place and logs a
     * console warning. For cross-page hero patterns (input on landing,
     * results on `/search`), use a plain HTML form posting to the
     * results page with a `#query=...` fragment instead. Like
     * `facetsTarget`, the selector is matched in the document the widget
     * is mounted in.
     */
    searchTarget: PropTypes.string,
    /** Whether to display active filter chips above results. */
    showActiveFilters: PropTypes.bool,
    /** Whether to display search performance metrics. */
    showSearchMetrics: PropTypes.bool,
    /** Whether to display pagination controls. */
    showPager: PropTypes.bool,
    /** Filters applied by default on initialization. */
    defaultFilters: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string,
        value: PropTypes.string,
      })
    ),
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
    /**
     * `_source` fields to request for each hit. Defaults to `SOURCE_FIELDS`
     * in utils/constants.js, the fields the widget renders. Set it only for
     * an endpoint whose hits need other fields.
     */
    sourceFields: PropTypes.arrayOf(PropTypes.string),
    /**
     * Server-rendered results to keep on screen until the first client
     * results (or an error) commit. An Element captured before mounting
     * (not a selector); each widget needs its own. It is moved into the
     * results region and removed when the client results replace it. `fromElement` sets it from
     * a `[data-mg-search-ssr]` child of the container. See "Server-rendered
     * results" in the MDX.
     */
    ssrResults: PropTypes.object,
    /** Whether to exclude results that have no image. */
    requireImage: PropTypes.bool,
    /**
     * Called after each completed search with `{ total, query, page }`. The
     * widget also dispatches an `mg-search-widget:results` event with the same
     * detail, bubbling from its root, for hosts without React.
     */
    onResults: PropTypes.func,
    /**
     * Stem for the widget's analytics regions: `<prefix>-form`,
     * `<prefix>-results` and `<prefix>-facets`. Defaults to `undrr-search`.
     * Give each widget its own prefix when a page has more than one.
     */
    analyticsRegionPrefix: PropTypes.string,
  }).isRequired,
  /**
   * UI label overrides merged with DEFAULT_LABELS.
   * Pass any subset to translate or customise individual strings.
   * Dynamic strings use `{placeholder}` tokens — see `interpolateLabel`.
   */
  labels: PropTypes.object,
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
  const { isPending, flushSearch } = useSearch();

  // Generate unique ID for this widget instance
  const widgetId = useId().replace(/:/g, '');

  const rootRef = useWidgetRootRef();

  // Enable URL hash synchronization
  // initialHashState is read once, on the first render, and stays stable.
  const { initialHashState } = useHashSync({
    enabled: config.enableHashSync !== false,
  });

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
  // The query this input last sent to the state. The state echoing it back
  // is not news, and must not overwrite what the reader has typed since.
  const sentQueryRef = useRef(null);
  useEffect(() => {
    if (isFirstQuerySync.current) {
      isFirstQuerySync.current = false;
      return;
    }
    sentQueryRef.current = deferredQuery;
    dispatch(actions.setQuery(deferredQuery));
  }, [deferredQuery, dispatch]);

  // Hash state applies to the first INITIALIZE only. A ref (not state in
  // the deps) so a re-initialise after a config change uses the defaults,
  // while React StrictMode's double effect run, which happens before any
  // re-render, still sees the widget as uninitialised.
  const isInitializedRef = useRef(state.isInitialized);
  isInitializedRef.current = state.isInitialized;

  // Initialize widget on mount. Facets and sort from the URL hash, if any,
  // take precedence over the configured defaults.
  useEffect(() => {
    const fromHash = isInitializedRef.current ? null : initialHashState;
    dispatch(
      actions.initialize({
        defaultFilters: config.defaultFilters,
        defaultQuery: config.defaultQuery,
        initialQuery: fromHash?.initialQuery ?? null,
        defaultSort: config.defaultSort,
        initialFacets: fromHash?.facets || null,
        initialFacetOperators: fromHash?.facetOperators || null,
        initialSort: fromHash?.sort || null,
      })
    );
  }, [
    dispatch,
    initialHashState,
    config.defaultFilters,
    config.defaultQuery,
    config.defaultSort,
  ]);

  // Sync the input with query changes from elsewhere (URL hash, INITIALIZE,
  // back/forward). useDeferredValue lags the input, so the state briefly
  // holds an older query than the input; copying that back dropped
  // keystrokes ("earthquake" became "earthuake").
  useEffect(() => {
    if (!state.isInitialized) return;
    if (state.query === sentQueryRef.current) return;
    sentQueryRef.current = state.query;
    if (state.query !== inputValue) {
      setInputValue(state.query);
    }
  }, [state.query, state.isInitialized]);

  // Enter, the search button and Clear search at once rather than after the
  // typing debounce. A query already waiting for the debounce runs now.
  const submitQuery = useCallback(
    value => {
      sentQueryRef.current = value;
      if (value === state.query) {
        flushSearch();
      } else {
        dispatch(actions.setQuery(value, { immediate: true }));
      }
    },
    [state.query, flushSearch, dispatch]
  );

  // Tell the page what came back, once per completed search: config.onResults
  // for React hosts, and an `mg-search-widget:results` event that bubbles from
  // the widget for everything else. A host can hide a section around a widget
  // that found nothing, or show the total elsewhere.
  const { results, totalResults, error } = state;
  const onResults = config.onResults;
  useEffect(() => {
    if (results === null || error) return;
    const detail = {
      total: totalResults,
      query: state.query,
      page: state.page,
    };
    onResults?.(detail);
    // Dispatch from the root itself: a global getElementById misses a widget
    // mounted in an iframe (a block editor canvas).
    rootRef.current?.dispatchEvent(
      new CustomEvent('mg-search-widget:results', { bubbles: true, detail })
    );
    // Only a new result set is news; query and page arrive with it.
  }, [results, totalResults, error]);

  const { showActiveFilters, showSearchMetrics, facetsTarget, searchTarget } =
    config;
  const facetsLayout = resolveFacetsLayout(config);
  const facetsActive = facetsLayout !== false;
  const showSearchBox = config.showSearchBox !== false;
  const { isLoading } = state;

  // Resolve the external facets target (facets in a separate DOM region)
  // and the external search-input target (typically a hero or banner region
  // while results render lower on the page), in the document the widget is
  // mounted in (an iframe in block editor canvases). Both are re-resolved when the
  // target appears, moves or is replaced after mount, as happens in block
  // editors. Until a target matches, the in-widget layout is used, with one
  // console warning per selector so editors and developers can see why the
  // portal didn't take effect.
  const facetsTargetEl = useExternalTarget(
    facetsTarget,
    facetsActive,
    rootRef,
    warnFacetsTargetMissing
  );
  const facetsPortaled = facetsActive && facetsTargetEl !== null;

  const searchTargetEl = useExternalTarget(
    searchTarget,
    showSearchBox,
    rootRef,
    warnSearchTargetMissing
  );
  const searchPortaled = showSearchBox && searchTargetEl !== null;

  // With the facets sidebar, the search box and filter chips belong to the
  // results column rather than spanning the sidebar too.
  const inColumn = facetsLayout === 'sidebar' && !facetsPortaled;
  const searchForm = showSearchBox && !searchPortaled && (
    <SearchForm
      value={inputValue}
      onChange={setInputValue}
      onSubmit={submitQuery}
      isStale={isPending}
      isLoading={isLoading}
      widgetId={widgetId}
    />
  );
  const activeFilters = showActiveFilters && (
    <ActiveFilters widgetId={widgetId} />
  );

  // Count active filters for mobile button badge
  const activeFilterCount = countActiveFilters(state);

  return (
    <div
      ref={rootRef}
      id={widgetId}
      className={`mg-search-widget ${isLoading || isPending ? 'mg-search-widget--loading' : ''}`}
      data-mg-search-widget
      data-mg-search-debug={showSearchMetrics ? 'true' : undefined}
    >
      {/* Search form: rendered in-widget unless searchTarget is portaling
          it elsewhere on the page. With the facets sidebar it sits in the
          results column instead (below). */}
      {!inColumn && searchForm}

      {/* Horizontal facet strip: only when facets layout is 'horizontal'
          AND no external target is taking the facets via portal. Renders
          the same FacetsSidebar contents but in a row above results; on
          small viewports the strip is hidden and the mobile filter drawer
          handles the same job. */}
      {facetsLayout === 'horizontal' && !facetsPortaled && (
        <div
          className="mg-search__facets-strip"
          data-vf-google-analytics-region={analyticsRegion(config, 'facets')}
        >
          <FacetsSidebar widgetId={widgetId} />
        </div>
      )}

      {/* Active filter chips */}
      {!inColumn && activeFilters}

      {/* Main content area */}
      <div className="mg-search__content">
        <div className="mg-search__column">
          {inColumn && searchForm}
          {inColumn && activeFilters}

          {/* Results area. A div, not <main>: the widget always sits inside
            the page's own main landmark, and a page has only one. */}
          <div
            className={`mg-search__main ${isPending ? 'mg-search__main--stale' : ''}`}
            data-vf-google-analytics-region={analyticsRegion(config, 'results')}
            aria-busy={isLoading || isPending}
          >
            {(isLoading || isPending) && <SearchProgress />}
            <Suspense
              fallback={
                <SearchResultsSkeleton
                  displayMode={config.displayMode}
                  count={config.resultsPerPage}
                  gridColumns={config.gridColumns}
                />
              }
            >
              <SearchResults
                isStale={isPending}
                widgetId={widgetId}
                showMobileFilterButton={facetsActive && !facetsPortaled}
                onOpenFilters={openDrawer}
                activeFilterCount={activeFilterCount}
              />
            </Suspense>
          </div>
        </div>

        {/* Facets sidebar: desktop only, and only when not portaled out. */}
        {facetsLayout === 'sidebar' && !facetsPortaled && (
          <aside
            className="mg-search__sidebar"
            data-vf-google-analytics-region={analyticsRegion(config, 'facets')}
          >
            <FacetsSidebar widgetId={widgetId} />
          </aside>
        )}
      </div>

      {/* External search-input portal: when searchTarget resolves to a
          DOM node, render the SearchForm there instead of inside the
          widget. The React tree spans the portal so SearchContext (and
          therefore live input state) still flows. */}
      {searchPortaled &&
        createPortal(
          <div className="mg-search__form-external">
            <SearchForm
              value={inputValue}
              onChange={setInputValue}
              onSubmit={submitQuery}
              isStale={isPending}
              isLoading={isLoading}
              widgetId={widgetId}
            />
          </div>,
          searchTargetEl
        )}

      {/* External facets portal: when facetsTarget resolves to a DOM node,
          render the facets there instead of inside the widget. The React
          tree spans the portal so SearchContext still flows. */}
      {facetsPortaled &&
        createPortal(
          <div
            className="mg-search__facets-external"
            data-vf-google-analytics-region={analyticsRegion(config, 'facets')}
          >
            <FacetsSidebar widgetId={widgetId} />
          </div>,
          facetsTargetEl
        )}

      {/* Mobile filter drawer: used by sidebar and horizontal layouts on
          small viewports. Suppressed when facets are portaled to an
          external region (the host page controls placement there). */}
      {facetsActive && !facetsPortaled && (
        <MobileFilterDrawer
          isOpen={isDrawerOpen}
          onClose={closeDrawer}
          widgetId={widgetId}
        />
      )}
    </div>
  );
}

const warnFacetsTargetMissing = selector =>
  console.warn(
    `[SyndicationSearchWidget] facetsTarget selector "${selector}" did not match any element; falling back to in-widget facets layout until it appears.`
  );

const warnSearchTargetMissing = selector =>
  console.warn(
    `[SyndicationSearchWidget] searchTarget selector "${selector}" did not match any element; falling back to in-widget search input until it appears.`
  );

/**
 * Loading skeleton for search results.
 * Renders a card grid skeleton for card/card-book modes, list skeleton otherwise.
 */
function SearchResultsSkeleton({
  displayMode = 'list',
  count = 5,
  gridColumns,
}) {
  const isCardMode = displayMode === 'card' || displayMode === 'card-book';
  const cols = isCardMode
    ? Math.min(Math.max(gridColumns ?? count, 2), 6)
    : undefined;

  if (isCardMode) {
    return (
      <div
        className={`mg-search__skeleton mg-search__skeleton--card mg-grid mg-grid__col-${cols}`}
        aria-busy="true"
        aria-label="Loading results"
      >
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
    <div
      className="mg-search__skeleton"
      aria-busy="true"
      aria-label="Loading results"
    >
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
