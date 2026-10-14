/**
 * @file SearchResults.jsx
 * @description Search results list component with accessibility.
 *
 * @module SearchWidget/components/SearchResults
 */

import React, { useMemo } from 'react';
import {
  useSearchState,
  useSearchConfig,
  useSearchLabels,
  interpolateLabel,
} from '../context/SearchContext';
import {
  analyticsRegion,
  buildHiddenFieldClasses,
  resolveFacetsLayout,
} from '../utils/constants';
import { Loader } from '../../../Utilities/Loader/Loader';
import ResultItem from './ResultItem';
import Pager from './Pager';

/**
 * SearchResults component.
 * Renders the list of search results with count and timing.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isStale - Whether results are stale (search pending)
 * @param {string} props.widgetId - Unique widget ID for accessibility
 * @param {boolean} props.showMobileFilterButton - Whether to show mobile filter button
 * @param {Function} props.onOpenFilters - Callback to open filter drawer
 * @param {number} props.activeFilterCount - Number of active filters
 */
export function SearchResults({
  isStale = false,
  widgetId = '',
  showMobileFilterButton = false,
  onOpenFilters,
  activeFilterCount = 0,
}) {
  const state = useSearchState();
  const config = useSearchConfig();
  const labels = useSearchLabels();

  const {
    results,
    totalResults,
    totalResultsRelation,
    searchTime,
    isLoading,
    error,
    query,
    page,
    isInitialized,
    facets,
    customFacets,
    resultsVersion,
  } = state;

  const {
    showResultsCount,
    showSearchTimer,
    showSearchMetrics,
    showPager,
    resultsPerPage,
    minSearchLength,
    displayMode,
    visibleTeaserFields,
    gridColumns,
  } = config;

  const isCardMode = displayMode === 'card' || displayMode === 'card-book';
  const cardGridCols = isCardMode
    ? Math.min(Math.max(gridColumns ?? resultsPerPage, 2), 6)
    : undefined;
  const hiddenFieldClasses = useMemo(
    () => buildHiddenFieldClasses(visibleTeaserFields),
    [visibleTeaserFields]
  );

  const searched = Array.isArray(results);

  const skeleton = (
    <div
      className="mg-search__results-loading"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="mg-u-sr-only">{labels.initializing}</span>
      <SearchSkeleton
        count={resultsPerPage}
        displayMode={displayMode}
        gridColumns={cardGridCols}
      />
    </div>
  );

  // Until the first search, show the skeleton rather than an empty or
  // "enter a search term" state: the widget searches on mount.
  if (!isInitialized) return skeleton;

  // Error state
  if (error) {
    return (
      <div
        className="mg-search__results-error"
        role="alert"
        aria-live="assertive"
      >
        <p>
          <strong>{labels.searchError}</strong> {error}
        </p>
        <p>{labels.searchErrorRetry}</p>
      </div>
    );
  }

  // The widget searches an empty query (everything) and any query of at
  // least minSearchLength characters, or a shorter one with filters set.
  // Only a short query without filters is a genuine wait for input.
  const hasFilters =
    Object.values(facets || {}).some(v => v?.length > 0) ||
    Object.values(customFacets || {}).some(v => v?.length > 0);
  const waitingForInput =
    Boolean(query) && query.length < minSearchLength && !hasFilters;

  if (!searched && !waitingForInput) return skeleton;

  if (!searched) {
    return (
      <div className="mg-search__results-empty">
        <p>{labels.enterSearchTerm}</p>
        {minSearchLength > 1 && (
          <p className="mg-search__results-hint">
            {interpolateLabel(labels.minimumCharacters, {
              min: minSearchLength,
            })}
          </p>
        )}
      </div>
    );
  }

  // An empty query searches everything, so nothing found is just that.
  if (!query && results.length === 0) {
    return (
      <div className="mg-search__results-empty" role="status">
        <p>{labels.srNoResults}</p>
      </div>
    );
  }

  // No results
  if (results.length === 0) {
    return (
      <div
        className="mg-search__results-empty"
        role="status"
        aria-live="polite"
      >
        <p>{interpolateLabel(labels.noResults, { query })}</p>
        <p>{labels.noResultsHint}</p>
      </div>
    );
  }

  // A new search with results on screen: keep them, dimmed, with a small
  // loader, rather than flashing the skeleton.
  const refreshing = isLoading || isStale;

  // Results
  return (
    <div
      className={`mg-search__results${refreshing ? ' mg-search__results--refreshing' : ''}`}
      data-vf-google-analytics-region={analyticsRegion(config, 'results')}
    >
      {/* Screen reader announcement for results updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mg-u-sr-only"
      >
        {/* A widget with nothing interactive (no search box, no facets) is a
            fixed list of cards: nothing the reader does changes it, so its
            total is noise to a screen reader. Every other widget announces. */}
        {!isLoading &&
          totalResults !== null &&
          (config.showSearchBox !== false ||
            resolveFacetsLayout(config) !== false) && (
            <>
              {totalResults === 0
                ? interpolateLabel(
                    query ? labels.srNoResultsForQuery : labels.srNoResults,
                    { query }
                  )
                : totalResultsRelation === 'gte'
                  ? interpolateLabel(
                      query
                        ? labels.srResultsFoundApproxForQuery
                        : labels.srResultsFoundApprox,
                      { count: totalResults.toLocaleString(), query }
                    )
                  : interpolateLabel(
                      totalResults !== 1
                        ? query
                          ? labels.srResultsFoundPluralForQuery
                          : labels.srResultsFoundPlural
                        : query
                          ? labels.srResultsFoundForQuery
                          : labels.srResultsFound,
                      { count: totalResults.toLocaleString(), query }
                    )}
            </>
          )}
      </div>

      {/* Results header */}
      <div className="mg-search__results-header">
        {showResultsCount && (
          <p
            className="mg-search__results-count"
            role="status"
            aria-live="polite"
          >
            {(() => {
              const startResult = (page - 1) * resultsPerPage + 1;
              const endResult = Math.min(
                page * resultsPerPage,
                totalResults || 0
              );
              const countLabel =
                totalResultsRelation === 'gte'
                  ? labels.showingResultsApprox
                  : labels.showingResults;
              return interpolateLabel(countLabel, {
                start: startResult.toLocaleString(),
                end: endResult.toLocaleString(),
                total: totalResults?.toLocaleString() || 0,
              });
            })()}
            {query && <> {interpolateLabel(labels.forQuery, { query })}</>}
            {showSearchTimer && searchTime !== null && (
              <span className="mg-search__results-time"> ({searchTime}ms)</span>
            )}
          </p>
        )}

        {/* Small spinner while a new search replaces the results on screen;
            the results count announces the outcome. */}
        {refreshing && (
          <Loader
            size="inline"
            decorative
            className="mg-search__results-loader"
          />
        )}
        {/* Mobile filter button - compact, inline */}
        {showMobileFilterButton && onOpenFilters && (
          <button
            type="button"
            className="mg-search__filter-btn"
            onClick={onOpenFilters}
            aria-label={
              activeFilterCount > 0
                ? interpolateLabel(labels.filtersButtonActive, {
                    count: activeFilterCount,
                  })
                : labels.filtersButton
            }
          >
            <svg
              className="mg-search__filter-btn-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>{labels.filtersButton}</span>
            {activeFilterCount > 0 && (
              <span className="mg-search__filter-btn-badge">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Results list or grid */}
      {isCardMode ? (
        <div
          key={resultsVersion}
          className={`mg-search__results-grid mg-grid mg-grid__col-${cardGridCols} ${hiddenFieldClasses}`.trim()}
          role="list"
          aria-label={labels.searchResultsLabel}
        >
          {results?.map((hit, index) => (
            <div key={hit._id || index} role="listitem">
              <ResultItem
                hit={hit}
                displayMode={displayMode}
                showMetrics={showSearchMetrics}
                visibleTeaserFields={visibleTeaserFields}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          key={resultsVersion}
          className={`mg-search__results-list ${hiddenFieldClasses}`.trim()}
          role="list"
          aria-label={labels.searchResultsLabel}
        >
          {results?.map((hit, index) => (
            <div key={hit._id || index} role="listitem">
              <ResultItem
                hit={hit}
                showMetrics={showSearchMetrics}
                visibleTeaserFields={visibleTeaserFields}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pager */}
      {showPager && <Pager widgetId={widgetId} />}
    </div>
  );
}

/**
 * Loading skeleton component.
 * Renders a card grid skeleton for card/card-book modes, list skeleton otherwise.
 * @param {Object} props - Component props
 * @param {number} props.count - Number of skeleton items
 * @param {string} props.displayMode - Display mode: 'list', 'card', or 'card-book'
 * @param {number} props.gridColumns - Grid columns for card modes
 */
function SearchSkeleton({ count = 3, displayMode = 'list', gridColumns }) {
  const isCardMode = displayMode === 'card' || displayMode === 'card-book';
  const cols = isCardMode
    ? Math.min(Math.max(gridColumns ?? count, 2), 6)
    : undefined;

  if (isCardMode) {
    return (
      <div
        className={`mg-search__skeleton mg-search__skeleton--card mg-grid mg-grid__col-${cols}`}
        aria-hidden="true"
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
    <div className="mg-search__skeleton" aria-hidden="true">
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

export default SearchResults;
