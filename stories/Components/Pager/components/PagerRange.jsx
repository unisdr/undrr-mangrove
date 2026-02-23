/**
 * @file PagerRange.jsx
 * @description Displays a result range string (e.g. "Showing 1–10 of 200").
 *
 * @module Pager/components/PagerRange
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * PagerRange — result range display.
 *
 * @param {Object} props
 * @param {{ start: number, end: number }} props.range  Start and end of the visible range
 * @param {string} [props.rangeLabel]  Template string with `{start}` and `{end}` placeholders
 */
export function PagerRange({ range, rangeLabel = 'Showing {start}–{end}' }) {
  if (!range) return null;

  const text = rangeLabel
    .replace('{start}', range.start)
    .replace('{end}', range.end);

  return (
    <p className="mg-pager__range" aria-live="polite">
      {text}
    </p>
  );
}

PagerRange.propTypes = {
  range: PropTypes.shape({
    start: PropTypes.number.isRequired,
    end: PropTypes.number.isRequired,
  }),
  rangeLabel: PropTypes.string,
};

export default PagerRange;
