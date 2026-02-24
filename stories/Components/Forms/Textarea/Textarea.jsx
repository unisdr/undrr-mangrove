/**
 * @file Textarea.jsx
 * @description Multi-line text input with label, help text, and error states.
 *
 * @module Textarea
 */

import React, { useId } from 'react';
import PropTypes from 'prop-types';

/**
 * Textarea component.
 *
 * @param {Object} props
 * @param {string} [props.id]              Custom id for the textarea element
 * @param {string} [props.name]            Name attribute
 * @param {string} [props.label]           Visible label text
 * @param {boolean} [props.hideLabel=false] Visually hide the label (still accessible)
 * @param {string} [props.placeholder]     Placeholder text
 * @param {string} [props.value]           Controlled value
 * @param {string} [props.defaultValue]    Uncontrolled default value
 * @param {Function} [props.onChange]       Change handler
 * @param {number} [props.rows=4]          Number of visible text rows
 * @param {number} [props.cols]            Number of visible text columns
 * @param {boolean} [props.disabled=false]  Disable the textarea
 * @param {boolean} [props.required=false]  Mark as required
 * @param {string} [props.helpText]        Help text displayed below the textarea
 * @param {boolean} [props.error=false]    Whether the textarea is in an error state
 * @param {string} [props.errorText]       Error message displayed below the textarea
 * @param {string} [props.className]       Additional CSS class for the wrapper
 */
export function Textarea({
  id,
  name,
  label,
  hideLabel = false,
  placeholder,
  value,
  defaultValue,
  onChange,
  rows = 4,
  cols,
  disabled = false,
  required = false,
  helpText,
  error = false,
  errorText,
  className,
  ...rest
}) {
  const autoId = useId();
  const textareaId = id || autoId;
  const helpId = helpText ? `${textareaId}-help` : undefined;
  const errorId = error && errorText ? `${textareaId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  const textareaClassName = [
    'mg-form-textarea',
    disabled && 'mg-form-textarea--disabled',
    error && 'mg-form-textarea--error',
  ]
    .filter(Boolean)
    .join(' ');

  const labelClassName = [
    'mg-form-label',
    hideLabel && 'mg-u-sr-only',
    disabled && 'mg-form-label--disabled',
    required && 'mg-form-label--required',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={['mg-form-field', className].filter(Boolean).join(' ')}>
      {label && (
        <label className={labelClassName} htmlFor={textareaId}>
          {label}
        </label>
      )}

      <textarea
        className={textareaClassName}
        id={textareaId}
        name={name}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        rows={rows}
        cols={cols}
        disabled={disabled}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={error || undefined}
        {...(!label ? { 'aria-label': placeholder } : {})}
        {...rest}
      />

      {helpText && (
        <p className="mg-form-help" id={helpId}>
          {helpText}
        </p>
      )}

      {error && errorText && (
        <p className="mg-form-error" id={errorId} role="alert">
          {errorText}
        </p>
      )}
    </div>
  );
}

Textarea.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string,
  hideLabel: PropTypes.bool,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  rows: PropTypes.number,
  cols: PropTypes.number,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  helpText: PropTypes.string,
  error: PropTypes.bool,
  errorText: PropTypes.string,
  className: PropTypes.string,
};

export default Textarea;
