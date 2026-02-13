/**
 * @file Pager.jsx
 * @description Thin wrapper connecting the standalone Pager to SearchContext.
 *
 * @module SearchWidget/components/Pager
 */

import React, { useCallback, useMemo } from 'react';
import { Pager } from '../../Pager/Pager';
import { useSearchState, useSearchDispatch, useSearchConfig, actions } from '../context/SearchContext';

/**
 * SearchPager — search-context-aware pagination.
 *
 * @param {Object} props
 * @param {string} [props.widgetId] Unique widget ID for accessibility
 */
export function SearchPager({ widgetId = '' }) {
  const { page, totalResults, isLoading } = useSearchState();
  const dispatch = useSearchDispatch();
  const { resultsPerPage } = useSearchConfig();

  const totalPages = useMemo(() => {
    if (!totalResults || totalResults === 0) return 0;
    return Math.ceil(totalResults / resultsPerPage);
  }, [totalResults, resultsPerPage]);

  const handlePageChange = useCallback(
    (newPage) => {
      dispatch(actions.setPage(newPage));
      const widget = document.querySelector('[data-mg-search-widget]');
      if (widget) {
        widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [dispatch],
  );

  if (totalPages <= 1) return null;

  return (
    <Pager
      page={page}
      totalPages={totalPages}
      isLoading={isLoading}
      onPageChange={handlePageChange}
      ariaLabel="Search results pagination"
    />
  );
}

// Keep the legacy named export so existing consumers work unchanged.
export { SearchPager as Pager };
export default SearchPager;
