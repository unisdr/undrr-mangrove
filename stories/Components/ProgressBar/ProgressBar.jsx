/**
 * @file ProgressBar.jsx
 * @description Determinate and indeterminate progress bar on the native
 * `<progress>` element.
 *
 * The native element carries the `progressbar` role and exposes `value` and
 * `max` to assistive technology, so no role or ARIA value attributes are
 * added. Leaving out `value` gives the indeterminate state, drawn as a thin
 * scanner segment that sweeps across the track.
 *
 * @module ProgressBar
 */

import React, { useId } from 'react';
import PropTypes from 'prop-types';

/**
 * Warns unless the bar has an accessible name: a `label`, or an
 * `aria-label` or `aria-labelledby` passed through to `<progress>`. ARIA
 * requires a name on `progressbar`, and text inside `<progress>` is not one.
 *
 * @param {Object} props Component props
 * @param {string} propName Name of the prop being validated
 * @param {string} componentName Component display name
 * @returns {Error|null} An error when the bar would have no accessible name
 */
function accessibleNameRequired(props, propName, componentName) {
  const value = props[propName];
  if (value != null && typeof value !== 'string') {
    return new Error(
      `Invalid prop \`${propName}\` supplied to \`${componentName}\`: expected a string.`
    );
  }
  if (!value && !props['aria-label'] && !props['aria-labelledby']) {
    return new Error(
      `\`${componentName}\` needs an accessible name: pass \`label\`, \`aria-label\` or \`aria-labelledby\`.`
    );
  }
  return null;
}

/**
 * ProgressBar component.
 *
 * Shows how far a task has got (determinate, with `value`) or that work is in
 * progress with no known end (indeterminate, without `value`). With a visible
 * label the bar is named by it through `aria-labelledby`; with `hideLabel` or
 * the flush variant the label becomes its `aria-label`.
 *
 * Value changes are not reliably announced by screen readers. Announce the
 * start, notable milestones and completion through a live region that is
 * already in the page.
 *
 * @param {Object} props
 * @param {number} [props.value]              Current progress, from 0 to `max`. Leave out (or pass null) for an indeterminate bar
 * @param {number} [props.max=100]            Value at which the task is complete
 * @param {string} props.label                Accessible name, shown above the bar unless hidden. Required unless `aria-label` or `aria-labelledby` is passed
 * @param {boolean} [props.hideLabel=false]   Keep the label as the accessible name without showing it
 * @param {string} [props.helpText]           Text under the bar, linked to it with `aria-describedby`
 * @param {boolean} [props.showValue=false]   Show the value next to the label (determinate only)
 * @param {string} [props.valueText]          Text for the value, such as "3 of 12 files", used as `aria-valuetext` and as the visible value
 * @param {string} [props.variant='default']  `flush` for a thin bar with no visible text, for the top edge of a region or the viewport
 * @param {string} [props.className='']       Additional CSS classes for the wrapper
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  hideLabel = false,
  helpText,
  showValue = false,
  valueText,
  variant = 'default',
  className = '',
  ...rest
}) {
  PropTypes.checkPropTypes(
    ProgressBar.propTypes,
    {
      value,
      max,
      label,
      hideLabel,
      helpText,
      showValue,
      valueText,
      variant,
      className,
      ...rest,
    },
    'prop',
    'ProgressBar'
  );

  const id = useId();
  const labelId = `${id}-label`;
  const helpId = `${id}-help`;
  const flush = variant === 'flush';
  const safeMax = typeof max === 'number' && max > 0 ? max : 100;
  const isDeterminate = typeof value === 'number' && Number.isFinite(value);
  const clamped = isDeterminate ? Math.min(Math.max(value, 0), safeMax) : null;
  const percent = isDeterminate ? Math.round((clamped / safeMax) * 100) : null;
  const displayValue = valueText || `${percent}%`;

  const showLabel = Boolean(label) && !hideLabel && !flush;
  const showHelp = Boolean(helpText) && !flush;

  const nativeProps = {};
  if (!rest['aria-label'] && !rest['aria-labelledby']) {
    if (showLabel) nativeProps['aria-labelledby'] = labelId;
    else if (label) nativeProps['aria-label'] = label;
  }
  const describedBy = [rest['aria-describedby'], showHelp && helpId]
    .filter(Boolean)
    .join(' ');
  if (describedBy) nativeProps['aria-describedby'] = describedBy;
  if (isDeterminate && valueText) nativeProps['aria-valuetext'] = valueText;

  const classes = [
    'mg-progress-bar',
    flush && 'mg-progress-bar--flush',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {showLabel && (
        <div className="mg-progress-bar__label" id={labelId}>
          {label}
        </div>
      )}
      <div className="mg-progress-bar__track">
        <progress
          className="mg-progress-bar__native"
          max={safeMax}
          value={isDeterminate ? clamped : undefined}
          {...rest}
          {...nativeProps}
        >
          {isDeterminate ? displayValue : null}
        </progress>
      </div>
      {showValue && isDeterminate && !flush && (
        <div className="mg-progress-bar__value" aria-hidden="true">
          {displayValue}
        </div>
      )}
      {showHelp && (
        <div className="mg-progress-bar__help" id={helpId}>
          {helpText}
        </div>
      )}
    </div>
  );
}

ProgressBar.propTypes = {
  /** Current progress, from 0 to `max`. Leave out (or pass null) for an indeterminate bar */
  value: PropTypes.number,
  /** Value at which the task is complete */
  max: PropTypes.number,
  /** Accessible name, shown above the bar unless hidden. Required unless `aria-label` or `aria-labelledby` is passed */
  label: accessibleNameRequired,
  /** Keep the label as the accessible name without showing it */
  hideLabel: PropTypes.bool,
  /** Text under the bar, linked to it with `aria-describedby` */
  helpText: PropTypes.string,
  /** Show the value next to the label (determinate only) */
  showValue: PropTypes.bool,
  /** Text for the value, such as "3 of 12 files", used as `aria-valuetext` and as the visible value */
  valueText: PropTypes.string,
  /** `flush` for a thin bar with no visible text, for the top edge of a region or the viewport */
  variant: PropTypes.oneOf(['default', 'flush']),
  /** Additional CSS classes for the wrapper */
  className: PropTypes.string,
};

export default ProgressBar;
