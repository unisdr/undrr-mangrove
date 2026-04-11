/**
 * @file TypographySample.jsx
 * @description Renders a text sample at a specified font, size, and weight
 * with metadata annotations. Used in brand pages to show the typography hierarchy.
 *
 * @module TypographySample
 */

import React from 'react';
import PropTypes from 'prop-types';
import './typography-sample.css';

/**
 * Typography sample with visual rendering and font metadata.
 *
 * @param {Object} props
 * @param {string} props.fontFamily      Font family name (e.g., 'Roboto Condensed')
 * @param {string} props.fontSize        CSS font-size (e.g., '42px', '2.625rem')
 * @param {string|number} props.fontWeight Font weight (e.g., 700, 'bold')
 * @param {string} props.label           Display label (e.g., 'Page title')
 * @param {string} [props.sampleText]    Custom sample text (defaults to label)
 * @param {React.ReactNode} [props.children] Mangrove component to render (overrides sampleText)
 * @param {string} [props.lineHeight='1.2'] CSS line-height
 */
export function TypographySample({
  fontFamily,
  fontSize,
  fontWeight,
  label,
  sampleText,
  children,
  lineHeight = '1.2',
}) {
  return (
    <div className="mg-typography-sample">
      <div className="mg-typography-sample__rendered">
        {children || (
          <span
            style={{
              fontFamily: `'${fontFamily}', sans-serif`,
              fontSize,
              fontWeight,
              lineHeight,
            }}
          >
            {sampleText || label}
          </span>
        )}
      </div>
      <div className="mg-typography-sample__meta">
        <span className="mg-typography-sample__font-name">
          {fontFamily} {typeof fontWeight === 'number' && fontWeight >= 600 ? 'Bold' : 'Regular'}
        </span>
        <span className="mg-typography-sample__font-spec">
          {fontSize} / {fontWeight}
        </span>
      </div>
    </div>
  );
}

TypographySample.propTypes = {
  /** Font family name. */
  fontFamily: PropTypes.string.isRequired,
  /** CSS font-size value. */
  fontSize: PropTypes.string.isRequired,
  /** Font weight (number or string). */
  fontWeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** Display label for this typography level. */
  label: PropTypes.string.isRequired,
  /** Custom sample text (defaults to label). */
  sampleText: PropTypes.string,
  /** Mangrove component to render instead of styled text. */
  children: PropTypes.node,
  /** CSS line-height value. */
  lineHeight: PropTypes.string,
};
