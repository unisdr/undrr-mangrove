/**
 * @file PagerJump.jsx
 * @description Jump-to-page form with number input.
 *
 * @module Pager/components/PagerJump
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * PagerJump — form that lets users jump to a specific page.
 *
 * @param {Object} props
 * @param {string} [props.jumpToLabel]   Label text for the input
 * @param {string} [props.jumpToAction]  Button text
 * @param {Function} props.onPageChange  Called with the target page number
 * @param {number|null} [props.totalPages]  Total pages (null = unknown)
 * @param {boolean} [props.isLoading]    Disables the form when true
 */
export function PagerJump({
  jumpToLabel = 'Go to page',
  jumpToAction = 'Go',
  onPageChange,
  totalPages,
  isLoading = false,
}) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const parsed = parseInt(inputValue, 10);
      if (Number.isNaN(parsed) || parsed < 1) return;

      let target = parsed;
      if (totalPages !== null && totalPages !== undefined) {
        target = Math.min(target, totalPages);
      }
      target = Math.max(1, target);

      onPageChange(target);
      setInputValue('');
    },
    [inputValue, onPageChange, totalPages],
  );

  const inputId = 'mg-pager-jump-input';

  return (
    <form className="mg-pager__jump" onSubmit={handleSubmit}>
      <label className="mg-pager__jump-label" htmlFor={inputId}>
        {jumpToLabel}
      </label>
      <input
        id={inputId}
        className="mg-pager__jump-input"
        type="number"
        min={1}
        max={totalPages !== null && totalPages !== undefined ? totalPages : undefined}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={isLoading}
        aria-label={jumpToLabel}
      />
      <button
        type="submit"
        className="mg-pager__jump-btn"
        disabled={isLoading || !inputValue}
      >
        {jumpToAction}
      </button>
    </form>
  );
}

PagerJump.propTypes = {
  jumpToLabel: PropTypes.string,
  jumpToAction: PropTypes.string,
  onPageChange: PropTypes.func.isRequired,
  totalPages: PropTypes.number,
  isLoading: PropTypes.bool,
};

export default PagerJump;
