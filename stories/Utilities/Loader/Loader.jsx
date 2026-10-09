/**
 * @file Loader.jsx
 * @description Animated loading spinner for indicating pending operations.
 *
 * Renders a CSS-only spinning circle inside a `role="status"` live region.
 * The label is visually hidden text inside the region, so screen readers
 * announce it as the region's content.
 *
 * @module Loader
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Loader component.
 *
 * Displays an accessible loading spinner. The label is rendered as visually
 * hidden text (`mg-u-sr-only`) inside a `role="status"` region, which screen
 * readers announce politely. Put `aria-busy="true"` on the region whose
 * content is loading, not on the loader.
 *
 * @param {Object} props
 * @param {string} [props.label='Loading']  Visually hidden text announced by screen readers
 * @param {string} [props.className='']     Additional CSS classes to apply
 */
export function Loader({ label = 'Loading', className = '' }) {
  const classes = ['mg-loader', className].filter(Boolean).join(' ');

  return (
    <div className={classes} role="status">
      <span className="mg-u-sr-only">{label}</span>
    </div>
  );
}

Loader.propTypes = {
  /** Visually hidden text announced by screen readers */
  label: PropTypes.string,
  /** Additional CSS classes to apply */
  className: PropTypes.string,
};

export default Loader;
