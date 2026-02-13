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
          Page {page}
          {totalPages !== null && totalPages !== undefined && ` of ${totalPages}`}
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
      />

      {/* Screen reader announcement */}
      <div className="mg-u-sr-only" aria-live="polite">
        Page {page}
        {totalPages !== null && totalPages !== undefined && ` of ${totalPages}`}
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
};

export default Pager;
