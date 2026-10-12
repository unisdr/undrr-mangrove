/**
 * @file Loader.jsx
 * @description Animated loading spinner for indicating pending operations.
 *
 * Renders a CSS-only spinning circle inside a `role="status"` live region.
 * The label is visually hidden text inside the region, so screen readers
 * announce it as the region's content. The compact `small` size sits inline
 * with text and inside buttons, and the decorative mode (`announce={false}`)
 * hides the spinner from assistive technology for pages that announce the
 * loading state through their own live region.
 *
 * @module Loader
 */

import React from 'react';
import PropTypes from 'prop-types';

const SIZE_CLASSES = {
  default: '',
  small: 'mg-loader--small',
};

/**
 * Loader component.
 *
 * Displays an accessible loading spinner. The label is rendered as visually
 * hidden text (`mg-u-sr-only`) inside a `role="status"` region, which screen
 * readers announce politely. Put `aria-busy="true"` on the region whose
 * content is loading, not on the loader.
 *
 * A status region that is inserted already filled is often not announced, so
 * a loader added to the page by script should either be decorative
 * (`announce={false}`) with the message sent to a live region that is already
 * in the page, or be inserted into such a region.
 *
 * @param {Object} props
 * @param {string} [props.label='Loading']   Text announced by screen readers, or shown next to the spinner with `showLabel`
 * @param {string} [props.size='default']    `default` for page and region overlays, `small` for a 1em spinner that sits inline with text
 * @param {string} [props.as]                Element to render: `div` or `span`. Defaults to `span` for the small size and `div` otherwise
 * @param {boolean} [props.announce=true]    Render a `role="status"` region with the label. Set to false when the page announces loading elsewhere
 * @param {boolean} [props.showLabel=false]  Show the label as visible text next to the spinner instead of visually hidden text
 * @param {string} [props.className='']      Additional CSS classes to apply to the outermost element
 */
export function Loader({
  label = 'Loading',
  size = 'default',
  as,
  announce = true,
  showLabel = false,
  className = '',
}) {
  const Tag = as || (size === 'small' ? 'span' : 'div');
  const spinnerClasses = ['mg-loader', SIZE_CLASSES[size]]
    .filter(Boolean)
    .join(' ');
  const statusProps = announce ? { role: 'status' } : { 'aria-hidden': true };

  if (showLabel) {
    const groupClasses = ['mg-loader-group', className]
      .filter(Boolean)
      .join(' ');
    return (
      <Tag className={groupClasses} {...statusProps}>
        <span className={spinnerClasses} aria-hidden="true" />{' '}
        <span className="mg-loader-group__label">{label}</span>
      </Tag>
    );
  }

  const classes = [spinnerClasses, className].filter(Boolean).join(' ');

  if (!announce) {
    return <Tag className={classes} aria-hidden="true" />;
  }

  return (
    <Tag className={classes} role="status">
      <span className="mg-u-sr-only">{label}</span>
    </Tag>
  );
}

Loader.propTypes = {
  /** Text announced by screen readers, or shown next to the spinner with `showLabel` */
  label: PropTypes.string,
  /** `default` for page and region overlays, `small` for a 1em spinner that sits inline with text */
  size: PropTypes.oneOf(['default', 'small']),
  /** Element to render. Defaults to `span` for the small size and `div` otherwise */
  as: PropTypes.oneOf(['div', 'span']),
  /** Render a `role="status"` region with the label. Set to false when the page announces loading elsewhere */
  announce: PropTypes.bool,
  /** Show the label as visible text next to the spinner instead of visually hidden text */
  showLabel: PropTypes.bool,
  /** Additional CSS classes to apply to the outermost element */
  className: PropTypes.string,
};

export default Loader;
