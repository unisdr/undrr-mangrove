/**
 * @file FormGroup.jsx
 * @description Accessible fieldset/legend wrapper for grouping related form controls.
 *
 * @module FormGroup
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * FormGroup wraps related form controls (checkboxes, radios) in a `<fieldset>`
 * with a `<legend>` for accessible grouping per WAI-ARIA APG.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children     Grouped form controls
 * @param {string} props.legend                Legend text describing the group
 * @param {boolean} [props.disabled=false]     Disable all controls in the group
 * @param {boolean} [props.error=false]        Show error state
 * @param {string} [props.errorText]           Error message text
 * @param {boolean} [props.hideLegend=false]   Visually hide the legend (still accessible)
 * @param {string} [props.className]           Additional CSS class
 */
export function FormGroup({
  children,
  legend,
  disabled = false,
  error = false,
  errorText,
  hideLegend = false,
  className,
  ...rest
}) {
  const wrapperClassName = [
    'mg-form-group',
    disabled && 'mg-form-group--disabled',
    error && 'mg-form-group--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const legendClassName = [
    'mg-form-group__legend',
    hideLegend && 'mg-u-sr-only',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <fieldset className={wrapperClassName} disabled={disabled} {...rest}>
      <legend className={legendClassName}>{legend}</legend>
      {children}
      {error && errorText && (
        <p className="mg-form-error" role="alert">
          {errorText}
        </p>
      )}
    </fieldset>
  );
}

FormGroup.propTypes = {
  children: PropTypes.node.isRequired,
  legend: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  errorText: PropTypes.string,
  hideLegend: PropTypes.bool,
  className: PropTypes.string,
};

export default FormGroup;
