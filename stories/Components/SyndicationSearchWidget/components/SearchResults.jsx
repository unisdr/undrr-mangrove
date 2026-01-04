/**
 * @file SearchResults.jsx
 * @description Search results list component with accessibility.
 *
 * @module SearchWidget/components/SearchResults
 */

import React from 'react';
import { useSearchState, useSearchConfig } from '../context/SearchContext';
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

  const {
    results,
    totalResults,
    searchTime,
    isLoading,
    error,
    query,
    page,
    isInitialized,
  } = state;

  const { showResultsCount, showSearchTimer, showSearchMetrics, showPager, resultsPerPage, minSearchLength } = config;

  // Don't render anything until initialized
  if (!isInitialized) {
    return (
      <div className="mg-search__results-placeholder">
        <p>Initializing search...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="mg-search__results-error"
        role="alert"
        aria-live="assertive"
      >
        <p>
          <strong>Search error:</strong> {error}
        </p>
        <p>Please try again or refine your search terms.</p>
      </div>
    );
  }

  // Loading state (only show if no stale results)
  if (isLoading && !results) {
    return (
      <div
        className="mg-search__results-loading"
        aria-busy="true"
        aria-live="polite"
      >
        <SearchSkeleton count={5} />
      </div>
    );
  }

  // No query yet
  if (!query && (!results || results.length === 0)) {
    return (
      <div className="mg-search__results-empty">
        <p>Enter a search term to find content.</p>
        {minSearchLength > 1 && (
          <p className="mg-search__results-hint">
            Minimum {minSearchLength} characters required.
          </p>
        )}
      </div>
    );
  }

  // No results
  if (results && results.length === 0) {
    return (
      <div
        className="mg-search__results-empty"
        role="status"
        aria-live="polite"
      >
        <p>
          No results found for <strong>"{query}"</strong>.
        </p>
        <p>Try different search terms or adjust your filters.</p>
      </div>
    );
  }

  // Results
  return (
    <div
      className="mg-search__results"
      data-vf-google-analytics-region="undrr-search-results"
      style={{ opacity: isStale ? 0.7 : 1, transition: 'opacity 0.2s' }}
    >
      {/* Screen reader announcement for results updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mg-u-sr-only"
      >
        {!isLoading && totalResults !== null && (
          <>
            {totalResults === 0
              ? `No results found${query ? ` for "${query}"` : ''}`
              : `${totalResults.toLocaleString()} result${totalResults !== 1 ? 's' : ''} found${query ? ` for "${query}"` : ''}`}
          </>
        )}
      </div>

      {/* Results header */}
      <div className="mg-search__results-header">
        {showResultsCount && (
          <p className="mg-search__results-count" role="status" aria-live="polite">
            {(() => {
              const startResult = (page - 1) * resultsPerPage + 1;
              const endResult = Math.min(page * resultsPerPage, totalResults || 0);
              return (
                <>
                  Showing <strong>{startResult.toLocaleString()}</strong>-<strong>{endResult.toLocaleString()}</strong> of{' '}
                  <strong>{totalResults?.toLocaleString() || 0}</strong> results
                </>
              );
            })()}
            {query && (
              <>
                {' '}for <strong>"{query}"</strong>
              </>
            )}
            {showSearchTimer && searchTime !== null && (
              <span className="mg-search__results-time">
                {' '}({searchTime}ms)
              </span>
            )}
          </p>
        )}

        {/* Mobile filter button - compact, inline */}
        {showMobileFilterButton && onOpenFilters && (
          <button
            type="button"
            className="mg-search__filter-btn"
            onClick={onOpenFilters}
            aria-label={activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : 'Filters'}
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
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="mg-search__filter-btn-badge">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Results list */}
      <div
        className="mg-search__results-list"
        role="list"
        aria-label="Search results"
      >
        {results?.map((hit, index) => (
          <div key={hit._id || index} role="listitem">
            <ResultItem hit={hit} showMetrics={showSearchMetrics} />
          </div>
        ))}
      </div>

      {/* Pager */}
      {showPager && <Pager widgetId={widgetId} />}
    </div>
  );
}

/**
 * Loading skeleton component.
 * @param {Object} props - Component props
 * @param {number} props.count - Number of skeleton items
 */
function SearchSkeleton({ count = 3 }) {
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
