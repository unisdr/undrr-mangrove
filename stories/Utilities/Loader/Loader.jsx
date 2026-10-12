/**
 * @file Loader.jsx
 * @description Animated loading spinner for indicating pending operations.
 *
 * Renders a CSS-only spinning circle inside a `role="status"` live region.
 * The label is visually hidden text inside the region, so screen readers
 * announce it as the region's content. The `inline` size is a 1em spinner
 * that sits in a line of text or inside a button, and `decorative` hides the
 * spinner from assistive technology for pages that announce the loading state
 * through their own live region.
 *
 * @module Loader
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * How long the status region stays empty after it is inserted. A live region
 * that arrives already filled is often not announced, so the label is added
 * once the empty region has had time to register with assistive technology.
 */
export const LOADER_LABEL_DELAY_MS = 100;

/**
 * Loader component.
 *
 * Displays an accessible loading spinner. The status region is rendered
 * empty and the label, visually hidden text (`mg-u-sr-only`), is added
 * shortly after mount, so a loader inserted while the page is in use is
 * announced. Put `aria-busy="true"` on the region whose content is loading,
 * not on the loader.
 *
 * The inline size renders a `span`, so it is valid inside a paragraph, a
 * label or a button. Set `decorative` when the loading state is announced
 * elsewhere or a visible label sits next to the spinner.
 *
 * @param {Object} props
 * @param {string} [props.label='Loading']     Visually hidden text announced by screen readers
 * @param {string} [props.size='default']      `default` for pages and regions, `inline` for a 1em spinner in text and buttons
 * @param {boolean} [props.decorative=false]   Hide the spinner from assistive technology, with no role and no label
 * @param {string} [props.className='']        Additional CSS classes to apply
 */
export function Loader({
  label = 'Loading',
  size = 'default',
  decorative = false,
  className = '',
}) {
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    if (decorative) return undefined;
    const timer = setTimeout(() => setShowLabel(true), LOADER_LABEL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [decorative]);

  const Tag = size === 'inline' ? 'span' : 'div';
  const classes = [
    'mg-loader',
    size === 'inline' && 'mg-loader--inline',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (decorative) {
    return <Tag className={classes} aria-hidden="true" />;
  }

  return (
    <Tag className={classes} role="status">
      {showLabel && <span className="mg-u-sr-only">{label}</span>}
    </Tag>
  );
}

Loader.propTypes = {
  /** Visually hidden text announced by screen readers */
  label: PropTypes.string,
  /** `default` for pages and regions, `inline` for a 1em spinner in text and buttons */
  size: PropTypes.oneOf(['default', 'inline']),
  /** Hide the spinner from assistive technology, with no role and no label */
  decorative: PropTypes.bool,
  /** Additional CSS classes to apply */
  className: PropTypes.string,
};

export default Loader;
