import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { DEFAULT_SERVICE_NOTICE_LABELS } from './_labels';

export { DEFAULT_SERVICE_NOTICE_LABELS };

const EMPTY_LABELS = {};

export const ServiceNotice = ({
  title,
  description,
  status = 'degraded',
  variant,
  isCompact = false,
  isOverlay = false,
  onRetry,
  retryLabel: customRetryLabel,
  statusUrl,
  statusUrlLabel: customStatusUrlLabel,
  countdownSeconds: initialCountdown = null,
  labels = EMPTY_LABELS,
  className,
  ...props
}) => {
  const [countdown, setCountdown] = useState(initialCountdown);

  const effectiveVariant =
    variant || (status === 'offline' ? 'negative' : 'warning');
  const retryLabel =
    customRetryLabel ||
    labels.retryLabel ||
    DEFAULT_SERVICE_NOTICE_LABELS.retryLabel;
  const statusUrlLabel =
    customStatusUrlLabel ||
    labels.statusUrlLabel ||
    DEFAULT_SERVICE_NOTICE_LABELS.statusUrlLabel;
  const statusText =
    status === 'offline'
      ? labels.statusOffline || DEFAULT_SERVICE_NOTICE_LABELS.statusOffline
      : labels.statusDegraded || DEFAULT_SERVICE_NOTICE_LABELS.statusDegraded;
  const countdownPrefix =
    labels.countdownPrefix || DEFAULT_SERVICE_NOTICE_LABELS.countdownPrefix;

  useEffect(() => {
    if (initialCountdown == null || initialCountdown <= 0) return;

    setCountdown(initialCountdown);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onRetry) {
            onRetry();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [initialCountdown, onRetry]);

  const noticeClasses = classNames(
    'mg-service-notice',
    {
      'mg-service-notice--degraded':
        status === 'degraded' || effectiveVariant === 'warning',
      'mg-service-notice--offline':
        status === 'offline' || effectiveVariant === 'negative',
      'mg-service-notice--compact': isCompact,
      'mg-service-notice--overlay': isOverlay,
    },
    className
  );

  return (
    <div className={noticeClasses} role="status" aria-live="polite" {...props}>
      <div className="mg-service-notice__header">
        <span
          className={classNames('mg-icon mg-service-notice__icon', {
            'mg-icon-exclamation-triangle':
              status === 'degraded' || effectiveVariant === 'warning',
            'mg-icon-cross-circle':
              status === 'offline' || effectiveVariant === 'negative',
          })}
          aria-hidden="true"
        />
        {title && <h3 className="mg-service-notice__title">{title}</h3>}
        {statusText && (
          <span
            className={classNames('mg-status-label', {
              'mg-status-label--warning':
                status === 'degraded' || effectiveVariant === 'warning',
              'mg-status-label--negative':
                status === 'offline' || effectiveVariant === 'negative',
            })}
          >
            <span className="mg-status-label__indicator" aria-hidden="true" />
            {statusText}
          </span>
        )}
      </div>

      {description && (
        <div className="mg-service-notice__description">
          {typeof description === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: description }} />
          ) : (
            description
          )}
        </div>
      )}

      {(onRetry || statusUrl || (countdown != null && countdown > 0)) && (
        <div className="mg-service-notice__actions">
          {onRetry && (
            <button
              type="button"
              className="mg-button mg-button-primary mg-button--small"
              onClick={onRetry}
            >
              <span
                className="mg-icon mg-icon-refresh mg-button__icon"
                aria-hidden="true"
              />
              {retryLabel}
            </button>
          )}

          {statusUrl && (
            <a
              href={statusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mg-button mg-button-secondary mg-button-outline mg-button--small"
            >
              {statusUrlLabel}
              <span
                className="mg-icon mg-icon-external-link mg-button__icon"
                aria-hidden="true"
              />
            </a>
          )}

          {countdown != null && countdown > 0 && (
            <p className="mg-service-notice__countdown" aria-hidden="true">
              {countdownPrefix} <strong>{countdown}s</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

ServiceNotice.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  status: PropTypes.oneOf(['degraded', 'offline']),
  variant: PropTypes.oneOf(['warning', 'negative']),
  isCompact: PropTypes.bool,
  isOverlay: PropTypes.bool,
  onRetry: PropTypes.func,
  retryLabel: PropTypes.string,
  statusUrl: PropTypes.string,
  statusUrlLabel: PropTypes.string,
  countdownSeconds: PropTypes.number,
  labels: PropTypes.shape({
    retryLabel: PropTypes.string,
    statusUrlLabel: PropTypes.string,
    statusDegraded: PropTypes.string,
    statusOffline: PropTypes.string,
    countdownPrefix: PropTypes.string,
  }),
  className: PropTypes.string,
};

export default ServiceNotice;
