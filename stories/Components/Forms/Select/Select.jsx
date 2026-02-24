/**
 * @file Select.jsx
 * @description Native select dropdown with label, help text, and error states.
 *
 * @module Select
 */

import React, { useId } from 'react';
import PropTypes from 'prop-types';

/**
 * Select component.
 *
 * @param {Object} props
 * @param {string} [props.id]              Custom id for the select element
 * @param {string} [props.name]            Name attribute
 * @param {string} [props.label]           Visible label text
 * @param {boolean} [props.hideLabel=false] Visually hide the label (still accessible)
 * @param {Array<{value: string, label: string, disabled?: boolean}>} [props.options=[]] Dropdown options
 * @param {string} [props.placeholder]     Placeholder text for the empty first option
 * @param {string} [props.value]           Controlled value
 * @param {string} [props.defaultValue]    Uncontrolled default value
 * @param {Function} [props.onChange]       Change handler
 * @param {boolean} [props.disabled=false]  Disable the select
 * @param {boolean} [props.required=false]  Mark as required
 * @param {string} [props.helpText]        Help text displayed below the select
 * @param {boolean} [props.error=false]    Whether the select is in an error state
 * @param {string} [props.errorText]       Error message displayed below the select
 * @param {string} [props.className]       Additional CSS class for the wrapper
 */
export function Select({
  id,
  name,
  label,
  hideLabel = false,
  options = [],
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
  const selectId = id || autoId;
  const helpId = helpText ? `${selectId}-help` : undefined;
  const errorId = error && errorText ? `${selectId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  const selectClassName = [
    'mg-form-select',
    disabled && 'mg-form-select--disabled',
    error && 'mg-form-select--error',
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
        <label className={labelClassName} htmlFor={selectId}>
          {label}
        </label>
      )}

      <select
        className={selectClassName}
        id={selectId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={error || undefined}
        {...(!label ? { 'aria-label': placeholder || 'Select' } : {})}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

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

Select.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string,
  hideLabel: PropTypes.bool,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
    }),
  ),
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

export default Select;
