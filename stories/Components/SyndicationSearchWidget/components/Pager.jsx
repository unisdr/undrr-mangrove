/**
 * @file Pager.jsx
 * @description Pagination component for search results.
 *
 * Provides navigation between pages of search results with
 * accessible keyboard navigation and screen reader support.
 *
 * @module SearchWidget/components/Pager
 */

import React, { useCallback, useMemo } from 'react';
import { useSearchState, useSearchDispatch, useSearchConfig, actions } from '../context/SearchContext';

/**
 * Pager component.
 * Renders pagination controls for navigating search results.
 *
 * @param {Object} props - Component props
 * @param {string} props.widgetId - Unique widget ID for accessibility
 */
export function Pager({ widgetId = '' }) {
  const state = useSearchState();
  const dispatch = useSearchDispatch();
  const config = useSearchConfig();

  const { page, totalResults, isLoading } = state;
  const { resultsPerPage } = config;

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (!totalResults || totalResults === 0) return 0;
    return Math.ceil(totalResults / resultsPerPage);
  }, [totalResults, resultsPerPage]);

  // Calculate visible page numbers
  const visiblePages = useMemo(() => {
    if (totalPages <= 1) return [];

    const pages = [];
    const maxVisible = 5; // Show up to 5 page numbers
    const halfVisible = Math.floor(maxVisible / 2);

    let startPage = Math.max(1, page - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push({ type: 'page', number: 1 });
      if (startPage > 2) {
        pages.push({ type: 'ellipsis', key: 'start' });
      }
    }

    // Add visible page numbers
    for (let i = startPage; i <= endPage; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push({ type: 'page', number: i });
      } else if (i === 1 && startPage === 1) {
        pages.push({ type: 'page', number: i });
      } else if (i === totalPages && endPage === totalPages) {
        pages.push({ type: 'page', number: i });
      }
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push({ type: 'ellipsis', key: 'end' });
      }
      pages.push({ type: 'page', number: totalPages });
    }

    return pages;
  }, [page, totalPages]);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    dispatch(actions.setPage(newPage));

    // Scroll to top of results
    const widget = document.querySelector('[data-mg-search-widget]');
    if (widget) {
      widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [dispatch, page, totalPages]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event, targetPage) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePageChange(targetPage);
    }
  }, [handlePageChange]);

  // Don't render if only one page or no results
  if (totalPages <= 1) {
    return null;
  }

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      className="mg-pager"
      aria-label="Search results pagination"
      role="navigation"
    >
      <ul className="mg-pager__list">
        {/* Previous button */}
        <li className="mg-pager__item mg-pager__item--prev">
          <button
            type="button"
            className={`mg-pager__link mg-pager__link--prev ${!hasPrevious ? 'mg-pager__link--disabled' : ''}`}
            onClick={() => handlePageChange(page - 1)}
            onKeyDown={(e) => handleKeyDown(e, page - 1)}
            disabled={!hasPrevious || isLoading}
            aria-label="Go to previous page"
            aria-disabled={!hasPrevious}
          >
            <svg
              className="mg-pager__icon"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="mg-pager__text">Previous</span>
          </button>
        </li>

        {/* Page numbers */}
        {visiblePages.map((item, index) => {
          if (item.type === 'ellipsis') {
            return (
              <li
                key={item.key}
                className="mg-pager__item mg-pager__item--ellipsis"
                aria-hidden="true"
              >
                <span className="mg-pager__ellipsis">&hellip;</span>
              </li>
            );
          }

          const isCurrentPage = item.number === page;
          return (
            <li key={item.number} className="mg-pager__item">
              <button
                type="button"
                className={`mg-pager__link mg-pager__link--number ${isCurrentPage ? 'mg-pager__link--current' : ''}`}
                onClick={() => handlePageChange(item.number)}
                onKeyDown={(e) => handleKeyDown(e, item.number)}
                disabled={isLoading}
                aria-label={`Page ${item.number}${isCurrentPage ? ', current page' : ''}`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {item.number}
              </button>
            </li>
          );
        })}

        {/* Next button */}
        <li className="mg-pager__item mg-pager__item--next">
          <button
            type="button"
            className={`mg-pager__link mg-pager__link--next ${!hasNext ? 'mg-pager__link--disabled' : ''}`}
            onClick={() => handlePageChange(page + 1)}
            onKeyDown={(e) => handleKeyDown(e, page + 1)}
            disabled={!hasNext || isLoading}
            aria-label="Go to next page"
            aria-disabled={!hasNext}
          >
            <span className="mg-pager__text">Next</span>
            <svg
              className="mg-pager__icon"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </li>
      </ul>

      {/* Page info for screen readers */}
      <div className="mg-u-sr-only" aria-live="polite">
        Page {page} of {totalPages}
      </div>
    </nav>
  );
}

export default Pager;
