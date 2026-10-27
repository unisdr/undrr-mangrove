import React, { cloneElement, useId } from 'react';
import PropTypes from 'prop-types';

const appendClassName = (existing, added) =>
  [existing, added].filter(Boolean).join(' ');

/**
 * Joins one form control to its primary action while preserving two separate,
 * semantic and independently focusable elements.
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
};

export default FormAction;
