/**
 * @file PagerList.jsx
 * @description Page number list with ellipsis logic and prev/next navigation.
 *
 * @module Pager/components/PagerList
 */

import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Calculate the visible page entries (numbers + ellipses).
 *
 * @param {number} page        Current page (1-based)
 * @param {number|null} totalPages  Total pages (null = unknown)
 * @returns {Array<{type: string, number?: number, key?: string}>}
 */
function getVisiblePages(page, totalPages) {
  // Unknown total — just show current page
  if (totalPages === null || totalPages === undefined) {
    return [{ type: 'page', number: page }];
  }

  if (totalPages <= 1) return [];

  const pages = [];
  const maxVisible = 5;
  const halfVisible = Math.floor(maxVisible / 2);

  let startPage = Math.max(1, page - halfVisible);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  // Adjust start if near the end
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // First page + ellipsis
  if (startPage > 1) {
    pages.push({ type: 'page', number: 1 });
    if (startPage > 2) {
      pages.push({ type: 'ellipsis', key: 'start' });
    }
  }

  // Visible range
  for (let i = startPage; i <= endPage; i++) {
    if (i !== 1 && i !== totalPages) {
      pages.push({ type: 'page', number: i });
    } else if (i === 1 && startPage === 1) {
      pages.push({ type: 'page', number: i });
    } else if (i === totalPages && endPage === totalPages) {
      pages.push({ type: 'page', number: i });
    }
  }

  // Last page + ellipsis
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push({ type: 'ellipsis', key: 'end' });
    }
    pages.push({ type: 'page', number: totalPages });
  }

  return pages;
}

/**
 * PagerList — renders page numbers with prev/next buttons.
 *
 * @param {Object} props
 * @param {number} props.page           Current page (1-based)
 * @param {number|null} props.totalPages  Total number of pages (null = unknown)
 * @param {Function} props.onPageChange  Called with new page number
 * @param {boolean} [props.isLoading]    Disables all controls when true
 */
export function PagerList({ page, totalPages, onPageChange, isLoading = false }) {
  const visiblePages = useMemo(
    () => getVisiblePages(page, totalPages),
    [page, totalPages],
  );

  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage < 1) return;
      if (totalPages !== null && totalPages !== undefined && newPage > totalPages) return;
      if (newPage === page) return;
      onPageChange(newPage);
    },
    [onPageChange, page, totalPages],
  );

  const handleKeyDown = useCallback(
    (event, targetPage) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handlePageChange(targetPage);
      }
    },
    [handlePageChange],
  );

  if (totalPages !== null && totalPages !== undefined && totalPages <= 1) {
    return null;
  }

  const hasPrevious = page > 1;
  const hasNext = totalPages === null || totalPages === undefined || page < totalPages;

  return (
    <ul className="mg-pager__list">
      {/* Previous */}
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
      {visiblePages.map((item) => {
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

      {/* Next */}
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
  );
}

PagerList.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default PagerList;
