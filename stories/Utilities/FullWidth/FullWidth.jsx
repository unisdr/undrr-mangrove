/**
 * @file FullWidth.jsx
 * @description Full-width breakout section that escapes its parent container.
 *
 * Wraps children in a `<section>` with the `mg-container-full-width` class,
 * which uses CSS to stretch edge-to-edge regardless of the parent width.
 *
 * @module FullWidth
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * FullWidth component.
 *
 * Renders a full-width section that breaks out of its parent container.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children  Content to render at full width
 * @param {string} [props.className='']     Additional CSS classes to apply
 */
export function FullWidth({ children, className = '' }) {
  const classes = ['mg-container-full-width', className]
    .filter(Boolean)
    .join(' ');

  return <section className={classes}>{children}</section>;
}

FullWidth.propTypes = {
  /** Content to render at full width */
  children: PropTypes.node,
  /** Additional CSS classes to apply to the section element */
  className: PropTypes.string,
};

export default FullWidth;
