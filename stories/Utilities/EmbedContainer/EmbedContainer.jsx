/**
 * @file EmbedContainer.jsx
 * @description Responsive aspect-ratio wrapper for embedded media.
 *
 * Provides a fluid container that maintains a fixed aspect ratio for
 * iframes, videos, and other embedded content. Uses CSS `aspect-ratio`
 * with a `padding-bottom` fallback for older browsers.
 *
 * @module EmbedContainer
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * EmbedContainer component.
 *
 * Wraps embedded media (iframes, videos) in a responsive container that
 * preserves the chosen aspect ratio at any width.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children                  Embedded content (iframe, video, etc.)
 * @param {string} [props.aspectRatio='16x9']               Aspect ratio: '16x9', '4x3', '1x1', or '21x9'
 * @param {string} [props.className='']                     Additional CSS classes to apply
 * @param {string} [props.as='div']                         HTML element to render as
 */
export function EmbedContainer({
  children,
  aspectRatio = '16x9',
  className = '',
  as: Element = 'div',
}) {
  const classes = [
    'mg-embed-container',
    aspectRatio !== '16x9' && `mg-embed-container--${aspectRatio}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <Element className={classes}>{children}</Element>;
}

EmbedContainer.propTypes = {
  /** Embedded content such as an iframe or video element */
  children: PropTypes.node,
  /** Aspect ratio of the container */
  aspectRatio: PropTypes.oneOf(['16x9', '4x3', '1x1', '21x9']),
  /** Additional CSS classes to apply */
  className: PropTypes.string,
  /** HTML element to render as (e.g. 'div', 'article', 'section') */
  as: PropTypes.string,
};

export default EmbedContainer;
