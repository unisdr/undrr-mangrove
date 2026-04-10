/**
 * @file Loader.jsx
 * @description Animated loading spinner for indicating pending operations.
 *
 * Renders a CSS-only spinning circle with `aria-busy` and `aria-live`
 * attributes so screen readers announce the loading state.
 *
 * @module Loader
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Loader component.
 *
 * Displays an accessible loading spinner. The visually hidden label is
 * announced by screen readers via `aria-label`.
 *
 * @param {Object} props
 * @param {string} [props.label='Loading']  Accessible label announced by screen readers
 * @param {string} [props.className='']     Additional CSS classes to apply
 */
export function Loader({ label = 'Loading', className = '' }) {
  const classes = ['mg-loader', className].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
      role="status"
    />
  );
}

Loader.propTypes = {
  /** Accessible label announced by screen readers */
  label: PropTypes.string,
  /** Additional CSS classes to apply */
  className: PropTypes.string,
};

export default Loader;
