/**
 * @file Pager.jsx
 * @description Props-driven pagination for React and server-rendered markup.
 *
 * @module Pager
 */

import React from 'react';
import PropTypes from 'prop-types';
import { PagerList } from './components/PagerList';
import { PagerRange } from './components/PagerRange';
import { PagerJump } from './components/PagerJump';

/**
 * Pager component.
 *
 * @param {Object} props
 * @param {number} props.page                Current page (1-based)
 * @param {number|null} [props.totalPages]   Total pages (null = unknown / mini-pager)
 * @param {Function} props.onPageChange      Called with new page number
 * @param {boolean} [props.isLoading=false]  Disables all controls
 * @param {string} [props.layout='centered'] Layout mode: 'centered' or 'bar'
 * @param {string} [props.ariaLabel]         Custom aria-label for the nav element
 * @param {{ start: number, end: number }} [props.range]  Result range for bar layout
 * @param {string} [props.rangeLabel]        Template string with {start}/{end} placeholders
 * @param {boolean} [props.showJumpTo=false] Show the jump-to-page form
 * @param {string} [props.jumpToLabel]       Label for jump-to input
 * @param {string} [props.jumpToAction]      Button text for jump-to submit
 * @param {string} [props.emptyState]        Message to show instead of pagination
 * @param {{ label: string, onClick: Function }} [props.emptyAction]  Action for the empty state
 * @param {string|Function} [props.prevLabel]       Visible text for Previous button
 * @param {string|Function} [props.nextLabel]       Visible text for Next button
 * @param {string|Function} [props.goPrevLabel]     aria-label for Previous button
 * @param {string|Function} [props.goNextLabel]     aria-label for Next button
 * @param {string|Function} [props.pageLabel]       aria-label template for numbered page buttons ({page} token)
 * @param {string|Function} [props.currentPageLabel] aria-label for the current page button ({page} token)
 * @param {string|Function} [props.pageOfLabel]     Screen-reader announcement template ({page}, {total} tokens)
 */
export function Pager({
  page,
  totalPages = null,
  onPageChange,
  isLoading = false,
  layout = 'centered',
  ariaLabel = 'Pagination',
  range,
  rangeLabel,
  showJumpTo = false,
  jumpToLabel,
  jumpToAction,
  emptyState,
  emptyAction,
  prevLabel = 'Previous',
  nextLabel = 'Next',
  goPrevLabel = 'Go to previous page',
  goNextLabel = 'Go to next page',
  pageLabel = 'Page {page}',
  currentPageLabel = 'Page {page}, current page',
  pageOfLabel = 'Page {page} of {total}',
}) {
  // Empty / notice state
  if (emptyState) {
    return (
      <nav className="mg-pager" aria-label={ariaLabel}>
        <p className="mg-pager__notice">
          {emptyState}
          {emptyAction && (
            <>
              {' '}
              <button
                type="button"
                className="mg-pager__notice-action"
                onClick={emptyAction.onClick}
              >
                {emptyAction.label}
              </button>
            </>
          )}
        </p>
      </nav>
    );
  }

  // Bar layout — three-zone
  if (layout === 'bar') {
    return (
      <nav className="mg-pager" aria-label={ariaLabel}>
        <div className="mg-pager__bar">
          {range && <PagerRange range={range} rangeLabel={rangeLabel} />}

          <PagerList
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            prevLabel={prevLabel}
            nextLabel={nextLabel}
            goPrevLabel={goPrevLabel}
            goNextLabel={goNextLabel}
            pageLabel={pageLabel}
            currentPageLabel={currentPageLabel}
          />

          {showJumpTo && (
            <PagerJump
              jumpToLabel={jumpToLabel}
              jumpToAction={jumpToAction}
              onPageChange={onPageChange}
              totalPages={totalPages}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Screen reader announcement */}
        <div className="mg-u-sr-only" aria-live="polite">
          {typeof pageOfLabel === 'function'
            ? pageOfLabel({ page, total: totalPages ?? '' })
            : String(pageOfLabel).replace(/\{page\}/g, page).replace(/\{total\}/g, totalPages ?? '')}
        </div>
      </nav>
    );
  }

  // Centered layout (default)
  return (
    <nav className="mg-pager" aria-label={ariaLabel}>
      <PagerList
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        isLoading={isLoading}
        prevLabel={prevLabel}
        nextLabel={nextLabel}
        goPrevLabel={goPrevLabel}
        goNextLabel={goNextLabel}
        pageLabel={pageLabel}
        currentPageLabel={currentPageLabel}
      />

      {/* Screen reader announcement */}
      <div className="mg-u-sr-only" aria-live="polite">
        {String(pageOfLabel).replace(/\{page\}/g, page).replace(/\{total\}/g, totalPages ?? '')}
      </div>
    </nav>
  );
}

Pager.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  layout: PropTypes.oneOf(['centered', 'bar']),
  ariaLabel: PropTypes.string,
  range: PropTypes.shape({
    start: PropTypes.number.isRequired,
    end: PropTypes.number.isRequired,
  }),
  rangeLabel: PropTypes.string,
  showJumpTo: PropTypes.bool,
  jumpToLabel: PropTypes.string,
  jumpToAction: PropTypes.string,
  emptyState: PropTypes.string,
  emptyAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
  prevLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  nextLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  goPrevLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  goNextLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  pageLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  currentPageLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  pageOfLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
};

export default Pager;
