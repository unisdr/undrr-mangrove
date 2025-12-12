/**
 * @file SearchResults.jsx
 * @description Search results list component with accessibility.
 *
 * @module SearchWidget/components/SearchResults
 */

import React from 'react';
import { useSearchState, useSearchConfig } from '../context/SearchContext';
import ResultItem from './ResultItem';

/**
 * SearchResults component.
 * Renders the list of search results with count and timing.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isStale - Whether results are stale (search pending)
 */
export function SearchResults({ isStale = false }) {
  const state = useSearchState();
  const config = useSearchConfig();

  const {
    results,
    totalResults,
    searchTime,
    isLoading,
    error,
    query,
    isInitialized,
  } = state;

  const { showResultsCount, showSearchTimer, showSearchMetrics, minSearchLength } = config;

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
      {/* Results header */}
      <div className="mg-search__results-header">
        {showResultsCount && (
          <p className="mg-search__results-count" role="status" aria-live="polite">
            Showing <strong>{results?.length || 0}</strong> of{' '}
            <strong>{totalResults?.toLocaleString() || 0}</strong> results
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

      {/* More results indicator */}
      {results?.length < totalResults && (
        <p className="mg-search__results-more">
          Showing {results.length} of {totalResults.toLocaleString()} results.
          Refine your search to see more specific results.
        </p>
      )}
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
