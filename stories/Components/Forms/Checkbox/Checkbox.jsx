/**
 * @file Checkbox.jsx
 * @description Checkbox input with label support and accessible states.
 *
 * @module Checkbox
 */

import React, { useId } from 'react';
import PropTypes from 'prop-types';

/**
 * Checkbox component.
 *
 * @param {Object} props
 * @param {string} [props.id]                  Custom id for the checkbox
 * @param {string} [props.name]                Name attribute
 * @param {string} [props.label]               Label text
 * @param {string} [props.value]               Value attribute
 * @param {boolean} [props.checked]            Controlled checked state
 * @param {boolean} [props.defaultChecked]     Uncontrolled default checked state
 * @param {Function} [props.onChange]           Change handler
 * @param {boolean} [props.disabled=false]      Disable the checkbox
 * @param {string} [props.labelPosition='after'] Label position: 'before' or 'after'
 * @param {string} [props.className]           Additional CSS class for the wrapper
 */
export function Checkbox({
  id,
  name,
  label,
  value,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  labelPosition = 'after',
  className,
  ...rest
}) {
  const autoId = useId();
  const checkboxId = id || autoId;

  const inputClassName = [
    'mg-form-check__input',
    'mg-form-check__input--checkbox',
    disabled && 'mg-form-check__input--disabled',
  ]
    .filter(Boolean)
    .join(' ');

  const labelElement = label && (
    <label className="mg-form-check__label" htmlFor={checkboxId}>
      {label}
    </label>
  );

  return (
    <div className={['mg-form-check', className].filter(Boolean).join(' ')}>
      {labelPosition === 'before' && labelElement}

      <input
        className={inputClassName}
        type="checkbox"
        id={checkboxId}
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        {...(!label ? { 'aria-label': value } : {})}
        {...rest}
      />

      {labelPosition === 'after' && labelElement}
    </div>
  );
}

Checkbox.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
  checked: PropTypes.bool,
  defaultChecked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  labelPosition: PropTypes.oneOf(['before', 'after']),
  className: PropTypes.string,
};

export default Checkbox;
