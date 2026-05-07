/**
 * @file HighlightBox.jsx
 * @description Highlighted content container with tone and layout variants.
 *
 * Wraps children in a styled box with optional color variants (primary,
 * secondary) and layout modifiers (centered, float-start, float-end).
 * All variants use logical CSS properties for RTL support.
 *
 * @module HighlightBox
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * HighlightBox component.
 *
 * Renders a styled container for emphasizing content. Supports tone
 * variants for color treatment and layout variants for positioning.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children                   Content to display inside the box
 * @param {string} [props.variant='default']                 Tone variant: 'default', 'primary', or 'secondary'
 * @param {boolean} [props.centered=false]                   Whether to center the box at 80% width
 * @param {string|null} [props.float=null]                   Float direction: 'start', 'end', or null
 * @param {string} [props.className='']                      Additional CSS classes to apply
 */
export function HighlightBox({
  children,
  variant = 'default',
  centered = false,
  float = null,
  className = '',
}) {
  const classes = [
    'mg-highlight-box',
    variant !== 'default' && `mg-highlight-box--${variant}`,
    centered && 'mg-highlight-box--centered',
    float && `mg-highlight-box--float-${float}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
}

HighlightBox.propTypes = {
  /** Content to display inside the highlight box */
  children: PropTypes.node,
  /** Tone variant controlling the background and text color */
  variant: PropTypes.oneOf(['default', 'primary', 'secondary']),
  /** Whether to center the box at 80% width */
  centered: PropTypes.bool,
  /** Float direction on medium+ screens ('start' or 'end'), null for no float */
  float: PropTypes.oneOf(['start', 'end']),
  /** Additional CSS classes to apply */
  className: PropTypes.string,
};

export default HighlightBox;
