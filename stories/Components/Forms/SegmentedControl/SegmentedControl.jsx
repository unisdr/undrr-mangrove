/**
 * @file SegmentedControl.jsx
 * @description Segmented presentation of a radio group for a small, mutually
 * exclusive choice that changes what a single view shows.
 *
 * @module SegmentedControl
 */

import React, { useId } from 'react';
import PropTypes from 'prop-types';

/**
 * SegmentedControl renders a native radio group — a `<fieldset>`, a
 * `<legend>` and one `<input type="radio">` per option — drawn as one row of
 * adjoining segments.
 *
 * The semantics are the radio group's, deliberately. Arrow-key navigation,
 * the "N of M" announcement, form submission and RTL traversal all come from
 * the browser, so there is no roving tabindex and no ARIA to maintain here.
 * Reach for Tabs instead when each choice reveals its own panel.
 *
 * @param {Object} props
 * @param {string} props.legend                 Legend naming the whole group
 * @param {string} props.name                   Shared name for the radio inputs
 * @param {Array} props.options                 [{ label, value, disabled }]
 * @param {string} [props.value]                Controlled selected value
 * @param {string} [props.defaultValue]         Uncontrolled initial value
 * @param {Function} [props.onChange]           Change handler, receives the event
 * @param {boolean} [props.hideLegend=false]    Visually hide the legend (still announced)
 * @param {boolean} [props.fullWidth=false]     Stretch segments to share the full width
 * @param {string} [props.size='default']       'default' (44px) or 'small' (36px)
 * @param {string} [props.className]            Additional CSS class for the fieldset
 */
export function SegmentedControl({
  legend,
  name,
  options,
  value,
  defaultValue,
  onChange,
  hideLegend = false,
  fullWidth = false,
  size = 'default',
  className,
  ...rest
}) {
  const autoId = useId();
  const isControlled = value !== undefined;

  const fieldsetClassName = [
    'mg-segmented-control',
    fullWidth && 'mg-segmented-control--full-width',
    size === 'small' && 'mg-segmented-control--small',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const legendClassName = [
    'mg-segmented-control__legend',
    hideLegend && 'mg-u-sr-only',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <fieldset className={fieldsetClassName} {...rest}>
      <legend className={legendClassName}>{legend}</legend>
      <div className="mg-segmented-control__group">
        {options.map(option => {
          const optionId = `${autoId}-${option.value}`;
          const selection = isControlled
            ? { checked: value === option.value }
            : { defaultChecked: defaultValue === option.value };

          return (
            // The label must stay the input's next sibling: the whole
            // presentation hangs off the `+` combinator.
            <React.Fragment key={option.value}>
              <input
                className="mg-segmented-control__input"
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                disabled={option.disabled}
                onChange={onChange}
                {...selection}
              />
              <label className="mg-segmented-control__label" htmlFor={optionId}>
                {option.label}
              </label>
            </React.Fragment>
          );
        })}
      </div>
    </fieldset>
  );
}

SegmentedControl.propTypes = {
  legend: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  value: PropTypes.string,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  hideLegend: PropTypes.bool,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(['default', 'small']),
  className: PropTypes.string,
};

export default SegmentedControl;
