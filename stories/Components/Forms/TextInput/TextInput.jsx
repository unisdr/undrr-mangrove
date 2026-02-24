/**
 * @file TextInput.jsx
 * @description Single-line text input with label, help text, and error states.
 *
 * @module TextInput
 */

import React, { useId } from 'react';
import PropTypes from 'prop-types';

/**
 * TextInput component.
 *
 * @param {Object} props
 * @param {string} [props.id]              Custom id for the input element
 * @param {string} [props.name]            Name attribute
 * @param {string} [props.type='text']     Input type: text, email, password, number, tel, search, date, url
 * @param {string} [props.label]           Visible label text
 * @param {boolean} [props.hideLabel=false] Visually hide the label (still accessible)
 * @param {string} [props.placeholder]     Placeholder text
 * @param {string} [props.value]           Controlled value
 * @param {string} [props.defaultValue]    Uncontrolled default value
 * @param {Function} [props.onChange]       Change handler
 * @param {boolean} [props.disabled=false]  Disable the input
 * @param {boolean} [props.required=false]  Mark as required
 * @param {string} [props.helpText]        Help text displayed below the input
 * @param {boolean} [props.error=false]    Whether the input is in an error state
 * @param {string} [props.errorText]       Error message displayed below the input
 * @param {string} [props.className]       Additional CSS class for the wrapper
 */
export function TextInput({
  id,
  name,
  type = 'text',
  label,
  hideLabel = false,
  placeholder,
  value,
  defaultValue,
  onChange,
  disabled = false,
  required = false,
  helpText,
  error = false,
  errorText,
  className,
  ...rest
}) {
  const autoId = useId();
  const inputId = id || autoId;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = error && errorText ? `${inputId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  const inputClassName = [
    'mg-form-input',
    disabled && 'mg-form-input--disabled',
    error && 'mg-form-input--error',
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
        <label className={labelClassName} htmlFor={inputId}>
          {label}
        </label>
      )}

      <input
        className={inputClassName}
        type={type}
        id={inputId}
        name={name}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
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

TextInput.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.oneOf([
    'text',
    'email',
    'password',
    'number',
    'tel',
    'search',
    'date',
    'url',
  ]),
  label: PropTypes.string,
  hideLabel: PropTypes.bool,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  helpText: PropTypes.string,
  error: PropTypes.bool,
  errorText: PropTypes.string,
  className: PropTypes.string,
};

export default TextInput;
