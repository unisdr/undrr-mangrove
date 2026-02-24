/**
 * @file Radio.jsx
 * @description Radio button input with label support and accessible states.
 *
 * @module Radio
 */

import React, { useId } from 'react';
import PropTypes from 'prop-types';

/**
 * Radio component.
 *
 * @param {Object} props
 * @param {string} [props.id]                  Custom id for the radio button
 * @param {string} [props.name]                Name attribute (shared within a group)
 * @param {string} [props.label]               Label text
 * @param {string} [props.value]               Value attribute
 * @param {boolean} [props.checked]            Controlled checked state
 * @param {boolean} [props.defaultChecked]     Uncontrolled default checked state
 * @param {Function} [props.onChange]           Change handler
 * @param {boolean} [props.disabled=false]      Disable the radio button
 * @param {boolean} [props.error=false]        Whether the radio button is in an error state
 * @param {string} [props.errorText]           Error message displayed below the radio button
 * @param {string} [props.labelPosition='after'] Label position: 'before' or 'after'
 * @param {string} [props.className]           Additional CSS class for the wrapper
 */
export function Radio({
  id,
  name,
  label,
  value,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  error = false,
  errorText,
  labelPosition = 'after',
  className,
  ...rest
}) {
  const autoId = useId();
  const radioId = id || autoId;
  const errorId = error && errorText ? `${radioId}-error` : undefined;

  const inputClassName = [
    'mg-form-check__input',
    'mg-form-check__input--radio',
    disabled && 'mg-form-check__input--disabled',
    error && 'mg-form-check__input--error',
  ]
    .filter(Boolean)
    .join(' ');

  const labelElement = label && (
    <label className="mg-form-check__label" htmlFor={radioId}>
      {label}
    </label>
  );

  return (
    <div className={['mg-form-check', className].filter(Boolean).join(' ')}>
      {labelPosition === 'before' && labelElement}

      <input
        className={inputClassName}
        type="radio"
        id={radioId}
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={error || undefined}
        aria-describedby={errorId}
        {...(!label ? { 'aria-label': value } : {})}
        {...rest}
      />

      {labelPosition === 'after' && labelElement}

      {error && errorText && (
        <p className="mg-form-error" id={errorId} role="alert">
          {errorText}
        </p>
      )}
    </div>
  );
}

Radio.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
  checked: PropTypes.bool,
  defaultChecked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  errorText: PropTypes.string,
  labelPosition: PropTypes.oneOf(['before', 'after']),
  className: PropTypes.string,
};

export default Radio;
