import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

export const DEFAULT_USER_FEEDBACK_LABELS = {
  question: 'Is this page useful?',
  yes: 'Yes',
  no: 'No',
  reportIssue: 'Report an issue on this page',
  confirmationBeforeLink:
    'Thank you for your feedback. If you would like, you can also',
  confirmationSeparator: ' ',
  confirmationLink: 'tell us more',
  confirmationAfterLink: '.',
};

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

/**
 * A compact pre-footer prompt for page-level feedback.
 *
 * Keep the response callback separate from the report link: products can send
 * the binary response to their own analytics service without Mangrove owning
 * storage or consent decisions.
 */
const UserFeedback = ({
  feedbackUrl = 'https://www.undrr.org/contact/website-feedback',
  labels = {},
  onResponse,
  className,
  ...args
}) => {
  const [response, setResponse] = useState(null);
  const confirmationRef = useRef(null);
  const resolvedLabels = { ...DEFAULT_USER_FEEDBACK_LABELS, ...labels };

  useEffect(() => {
    if (response) confirmationRef.current?.focus();
  }, [response]);

  const handleResponse = value => {
    setResponse(value);
    onResponse?.(value);
  };

  return (
    <section
      className={joinClasses(
        'mg-user-feedback',
        'mg-container',
        'mg-grid',
        'mg-grid__col-2',
        className
      )}
      aria-label={resolvedLabels.question}
      data-vf-google-analytics-region="undrr-feedback-container"
      {...args}
    >
      {!response ? (
        <>
          <div className="mg-user-feedback__prompt">
            <h2 className="mg-user-feedback__question">
              {resolvedLabels.question}
            </h2>
            <div className="mg-user-feedback__actions">
              {['yes', 'no'].map(value => (
                <button
                  className="mg-button mg-button-secondary"
                  data-mg-user-feedback-prompt
                  data-mg-user-feedback-type={value}
                  key={value}
                  onClick={() => handleResponse(value)}
                  type="button"
                >
                  {resolvedLabels[value]}
                </button>
              ))}
            </div>
          </div>
          <a
            className="mg-user-feedback__issue"
            data-mg-user-feedback-form
            data-mg-user-feedback-prompt
            data-mg-user-feedback-type="report-issue"
            href={feedbackUrl}
          >
            {resolvedLabels.reportIssue}
          </a>
        </>
      ) : (
        <p
          aria-live="polite"
          className="mg-user-feedback__confirmation"
          data-mg-user-feedback-message
          ref={confirmationRef}
          tabIndex="-1"
        >
          {resolvedLabels.confirmationBeforeLink}
          {resolvedLabels.confirmationSeparator}
          <a
            data-mg-user-feedback-form
            href={feedbackUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {resolvedLabels.confirmationLink}
          </a>
          {resolvedLabels.confirmationAfterLink}
        </p>
      )}
    </section>
  );
};

UserFeedback.propTypes = {
  /** Destination for both detailed-feedback links. */
  feedbackUrl: PropTypes.string,
  /** Localised visible copy. Missing keys fall back to English. */
  labels: PropTypes.shape({
    question: PropTypes.string,
    yes: PropTypes.string,
    no: PropTypes.string,
    reportIssue: PropTypes.string,
    confirmationBeforeLink: PropTypes.string,
    confirmationSeparator: PropTypes.string,
    confirmationLink: PropTypes.string,
    confirmationAfterLink: PropTypes.string,
  }),
  /** Called with "yes" or "no" after a response. */
  onResponse: PropTypes.func,
  /** Additional class names for the root section. */
  className: PropTypes.string,
};

export default UserFeedback;
