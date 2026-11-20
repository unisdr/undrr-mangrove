import React, { cloneElement, useId } from 'react';
import PropTypes from 'prop-types';

const appendClassName = (existing, added) =>
  [existing, added].filter(Boolean).join(' ');

/**
 * Joins one form control to its primary action while preserving two separate,
 * semantic and independently focusable elements.
 *
 * @param {Object} props
 * @param {React.ReactElement} props.control       A single input, select, or equivalent form control
 * @param {React.ReactElement} props.action        The button responsible for the control's primary action
 * @param {string} [props.label]                   Label text for the control
 * @param {boolean} [props.hideLabel=false]        Keep the label for screen readers only
 * @param {string} [props.helpText]                Help text below the field, linked with `aria-describedby`
 * @param {string} [props.errorText]               Error message below the field; also marks the control invalid
 * @param {boolean} [props.stackOnMobile=false]    Stack the control and action on small screens
 * @param {string} [props.className]               Additional CSS class for the field wrapper
 * @param {string} [props.analyticsLabel]          Fixed `data-vf-analytics-label` for the label and the control, unless the control sets its own
 */
export function FormAction({
  control,
  action,
  label,
  hideLabel = false,
  helpText,
  errorText,
  stackOnMobile = false,
  className,
  analyticsLabel,
}) {
  const generatedId = useId();
  const controlId = control.props.id || generatedId;
  const helpId = helpText ? `${controlId}-help` : undefined;
  const errorId = errorText ? `${controlId}-error` : undefined;
  const describedBy =
    [control.props['aria-describedby'], helpId, errorId]
      .filter(Boolean)
      .join(' ') || undefined;

  const controlElement = cloneElement(control, {
    key: control.key || 'control',
    id: controlId,
    className: appendClassName(
      control.props.className,
      'mg-form-action__control'
    ),
    'aria-describedby': describedBy,
    'aria-invalid': errorText ? 'true' : control.props['aria-invalid'],
    ...(control.props['data-vf-analytics-label'] === undefined &&
      analyticsLabel !== undefined && {
        'data-vf-analytics-label': analyticsLabel,
      }),
  });
  const actionElement = cloneElement(action, {
    key: action.key || 'action',
    className: appendClassName(
      action.props.className,
      'mg-form-action__action'
    ),
  });

  return (
    <div className={['mg-form-field', className].filter(Boolean).join(' ')}>
      {label && (
        <label
          className={hideLabel ? 'mg-u-sr-only' : 'mg-form-label'}
          htmlFor={controlId}
          data-vf-analytics-label={analyticsLabel}
        >
          {label}
        </label>
      )}
      <div
        className={[
          'mg-form-action',
          stackOnMobile && 'mg-form-action--stack-mobile',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {controlElement}
        {actionElement}
      </div>
      {helpText && (
        <p className="mg-form-help" id={helpId}>
          {helpText}
        </p>
      )}
      {errorText && (
        <p className="mg-form-error" id={errorId} role="alert">
          {errorText}
        </p>
      )}
    </div>
  );
}

FormAction.propTypes = {
  /** A single input, select, or equivalent form control. */
  control: PropTypes.element.isRequired,
  /** The button responsible for the control's primary action. */
  action: PropTypes.element.isRequired,
  label: PropTypes.string,
  hideLabel: PropTypes.bool,
  helpText: PropTypes.string,
  errorText: PropTypes.string,
  stackOnMobile: PropTypes.bool,
  className: PropTypes.string,
  /** Fixed `data-vf-analytics-label` for the label and the control, unless the control sets its own. */
  analyticsLabel: PropTypes.string,
};

export default FormAction;
