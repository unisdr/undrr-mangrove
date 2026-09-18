/**
 * @file Pager.jsx
 * @description Thin wrapper connecting the standalone Pager to SearchContext.
 *
 * @module SearchWidget/components/Pager
 */

import React, { useCallback, useMemo } from 'react';
import { Pager } from '../../Pager/Pager';
import {
  useSearchState,
  useSearchDispatch,
  useSearchConfig,
  useSearchLabels,
  actions,
} from '../context/SearchContext';

/**
 * SearchPager: search-context-aware pagination.
 *
 * @param {Object} props
 * @param {string} [props.widgetId] Unique widget ID for accessibility
 */
export function SearchPager({ widgetId = '' }) {
  const { page, totalResults, isLoading } = useSearchState();
  const dispatch = useSearchDispatch();
  const { resultsPerPage } = useSearchConfig();
  const labels = useSearchLabels();

  const totalPages = useMemo(() => {
    if (!totalResults || totalResults === 0) return 0;
    return Math.ceil(totalResults / resultsPerPage);
  }, [totalResults, resultsPerPage]);

  const handlePageChange = useCallback(
    newPage => {
      dispatch(actions.setPage(newPage));
      // Scroll this widget back to its results, not the first widget on the
      // page: a page can carry more than one. The widget root carries
      // `widgetId` as its id. See undrr/undrr-mangrove#1205.
      //
      // `SearchResults` and this pager are public exports for custom
      // layouts, and both default `widgetId` to ''. Without the fallback the
      // scroll would silently stop happening for those consumers, so keep
      // the pre-#1205 behaviour when there is no id to resolve.
      // Only the id-less case falls back: if an id was given it is
      // authoritative, so a missed lookup must not scroll a different widget.
      const widget = widgetId
        ? document.getElementById(widgetId)
        : document.querySelector('[data-mg-search-widget]');
      if (widget) {
        widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [dispatch, widgetId]
  );

  if (totalPages <= 1) return null;

  return (
    <Pager
      page={page}
      totalPages={totalPages}
      isLoading={isLoading}
      onPageChange={handlePageChange}
      ariaLabel={labels.searchResultsPaginationLabel}
      prevLabel={labels.pagerPrevious}
      nextLabel={labels.pagerNext}
      goPrevLabel={labels.pagerGoToPrevious}
      goNextLabel={labels.pagerGoToNext}
      pageLabel={labels.pagerPage}
      currentPageLabel={labels.pagerCurrentPage}
      pageOfLabel={labels.pagerPageOf}
    />
  );
}

// Keep the legacy named export so existing consumers work unchanged.
export { SearchPager as Pager };
export default SearchPager;
