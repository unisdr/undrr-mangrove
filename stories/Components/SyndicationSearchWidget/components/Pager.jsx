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
import { useWidgetRootRef } from '../context/WidgetRootContext';
import { getOwnerDocument } from '../utils/ownerDocument';

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
  const rootRef = useWidgetRootRef();

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
      // `SearchResults` and this pager both default `widgetId` to '', and
      // the fallback keeps the pre-#1205 behaviour when there is no id to
      // resolve. Inside this widget it is dead code: `widgetId` is never
      // empty. Nor are these two public exports — `src/index.js` exports only
      // `SyndicationSearchWidget`, `DEFAULT_LABELS` and `interpolateLabel`,
      // and the `exports` map in `package.json` makes the deep path
      // unreachable. It stays as cheap insurance for an in-repo caller that
      // renders the pager on its own, not as a supported entry point.
      // Only the id-less case falls back: if an id was given it is
      // authoritative, so a missed lookup must not scroll a different widget.
      // Look in the document the widget is mounted in, which differs from
      // the global one inside an iframe.
      const doc = getOwnerDocument(rootRef.current);
      if (!doc) return;
      const widget = widgetId
        ? doc.getElementById(widgetId)
        : doc.querySelector('[data-mg-search-widget]');
      if (widget) {
        const reduce = doc.defaultView?.matchMedia?.(
          '(prefers-reduced-motion: reduce)'
        ).matches;
        // scrollIntoView honours scroll-padding-top, so a sticky bar above
        // the list (On this page) does not cover the top of it.
        widget.scrollIntoView({
          behavior: reduce ? 'instant' : 'smooth',
          block: 'start',
        });
        // The pager button the reader pressed is about to be replaced, which
        // would drop focus to the body. Move it to the results count, which
        // announces the new range, or to the results area.
        const target =
          widget.querySelector('.mg-search__results-count') ||
          widget.querySelector('.mg-search__main');
        if (target) {
          if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
          target.focus({ preventScroll: true });
        }
      }
    },
    [dispatch, widgetId, rootRef]
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
