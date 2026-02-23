/**
 * @file FormErrorSummary.jsx
 * @description Form-level error summary that lists all validation errors with
 * links to the corresponding fields. Follows the GOV.UK error summary pattern
 * for WCAG 3.3.1 and 3.3.3 compliance.
 *
 * @module FormErrorSummary
 */

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * FormErrorSummary displays a persistent, accessible error summary at the top
 * of a form. Each error links to the corresponding field so users can jump
 * directly to the problem.
 *
 * @param {Object} props
 * @param {string} [props.title='There is a problem'] Heading text for the summary
 * @param {Array<{id: string, message: string}>} props.errors List of field errors
 * @param {string} [props.className] Additional CSS class
 */
export function FormErrorSummary({
  title = 'There is a problem',
  errors,
  className,
  ...rest
}) {
  const containerRef = useRef(null);
  const hasFocusedRef = useRef(false);

  useEffect(() => {
    if (errors?.length > 0 && containerRef.current && !hasFocusedRef.current) {
      containerRef.current.focus();
      hasFocusedRef.current = true;
    }
  }, [errors]);

  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div
      className={['mg-form-error-summary', className].filter(Boolean).join(' ')}
      role="alert"
      tabIndex={-1}
      ref={containerRef}
      {...rest}
    >
      <h2 className="mg-form-error-summary__title">{title}</h2>
      <ul className="mg-form-error-summary__list">
        {errors.map(error => (
          <li key={error.id}>
            <a href={`#${error.id}`}>{error.message}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

FormErrorSummary.propTypes = {
  title: PropTypes.string,
  errors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
    }),
  ).isRequired,
  className: PropTypes.string,
};

export default FormErrorSummary;
