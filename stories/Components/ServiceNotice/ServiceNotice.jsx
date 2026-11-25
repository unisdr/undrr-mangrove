import { getLanguageProps } from '../../../src/i18n';
import { getServiceNoticeLabels } from './_labels';
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Notice } from '../Notice/Notice';

export { getServiceNoticeLabels } from './_labels';
export { DEFAULT_SERVICE_NOTICE_LABELS } from './_labels';

// Only http(s) status links render, so a javascript: or data: URL from CMS
// or hydration data can never become a clickable href. The base falls back
// outside the browser so server rendering keeps the link instead of dropping it.
const isSafeUrl = url => {
  try {
    const base =
      typeof window !== 'undefined'
        ? window.location.href
        : 'https://localhost/';
    const { protocol } = new URL(url, base);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};
const HEADING_LEVELS = ['h2', 'h3', 'h4', 'h5', 'h6'];

/**
 * Service status with an optional retry action and countdown.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.title] Notice heading.
 * @param {React.ReactNode} [props.description] Explanation. Strings render as plain text.
 * @param {'degraded'|'offline'} [props.status='degraded'] Service state.
 * @param {'h2'|'h3'|'h4'|'h5'|'h6'} [props.headingLevel='h3'] Heading level in the containing page.
 * @param {boolean} [props.isCompact=false] Use compact padding and typography.
 * @param {boolean} [props.isOverlay=false] Centre the notice over its container.
 * @param {(event?: React.MouseEvent<HTMLElement>) => void} [props.onRetry] Called for manual and automatic retries.
 * @param {string} [props.retryLabel] Override the retry button text.
 * @param {string} [props.statusUrl] External status page URL using HTTP or HTTPS.
 * @param {string} [props.statusUrlLabel] Override the status link text.
 * @param {number|null} [props.countdownSeconds=null] Seconds to the first automatic retry. The delay doubles after each attempt. Requires onRetry.
 * @param {number} [props.maxAutoRetries=3] Automatic retry limit before the visitor can only retry manually.
 * @param {string} [props.lang] UI language tag. Unsupported languages fall back to English.
 * @param {'ltr'|'rtl'|'auto'} [props.dir] Explicit text direction. Otherwise the language determines it.
 * @param {{retryLabel?: string, statusUrlLabel?: string, opensInNewTab?: string, statusDegraded?: string, statusOffline?: string, countdownPrefix?: string, countdownAnnouncement?: string, autoRetryStopped?: string}} [props.labels] UI label overrides. Keep the `{seconds}` placeholder in countdownAnnouncement.
 * @param {string} [props.className] Additional CSS classes.
 */
export const ServiceNotice = ({
  title,
  description,
  status = 'degraded',
  headingLevel = 'h3',
  isCompact = false,
  isOverlay = false,
  onRetry,
  retryLabel: customRetryLabel,
  statusUrl,
  statusUrlLabel: customStatusUrlLabel,
  countdownSeconds = null,
  maxAutoRetries = 3,
  lang,
  dir,
  labels,
  className,
  ...props
}) => {
  const isOffline = status === 'offline';
  const t = getServiceNoticeLabels(lang, labels);
  const retryLabel =
    customRetryLabel || t.retryLabel || getServiceNoticeLabels(lang).retryLabel;
  const statusUrlLabel =
    customStatusUrlLabel ||
    t.statusUrlLabel ||
    getServiceNoticeLabels(lang).statusUrlLabel;
  const statusText = isOffline ? t.statusOffline : t.statusDegraded;
  const safeStatusUrl = statusUrl && isSafeUrl(statusUrl) ? statusUrl : null;

  const onRetryRef = useRef(onRetry);
  onRetryRef.current = onRetry;

  const autoRetryEnabled =
    typeof onRetry === 'function' && countdownSeconds > 0;
  const [attempt, setAttempt] = useState(0);
  // Reset the cycle during render, not in an effect, so the countdown effect
  // never starts with the previous cycle's attempt count.
  const [cycleSeconds, setCycleSeconds] = useState(countdownSeconds);
  if (cycleSeconds !== countdownSeconds) {
    setCycleSeconds(countdownSeconds);
    setAttempt(0);
  }
  const [countdown, setCountdown] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);
  const autoRetriesExhausted = autoRetryEnabled && attempt >= maxAutoRetries;
  // Each automatic attempt doubles the wait so a hard outage is not hammered.
  const currentDelay = autoRetryEnabled
    ? countdownSeconds * 2 ** attempt
    : null;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!autoRetryEnabled || attempt >= maxAutoRetries) {
      setCountdown(null);
      return undefined;
    }

    let remaining = countdownSeconds * 2 ** attempt;
    setCountdown(remaining);
    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setCountdown(remaining);
        return;
      }
      clearInterval(interval);
      setCountdown(null);
      if (onRetryRef.current) onRetryRef.current();
      setAttempt(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRetryEnabled, countdownSeconds, attempt, maxAutoRetries]);

  // The visible countdown ticks every second, which is too noisy for a live
  // region. Instead a hidden region announces the notice once after mount
  // (so it is heard even when rendered already populated) and again whenever
  // an automatic retry is scheduled or retries stop.
  let announcement = '';
  if (hasMounted) {
    const parts = [statusText];
    if (typeof title === 'string') parts.push(title);
    if (autoRetriesExhausted) {
      parts.push(t.autoRetryStopped);
    } else if (autoRetryEnabled) {
      parts.push(
        t.countdownAnnouncement.replace('{seconds}', String(currentDelay))
      );
    }
    announcement = parts.join('. ');
  }

  const showCountdown = countdown != null && countdown > 0;

  const actions =
    onRetry || safeStatusUrl ? (
      <>
        {onRetry && (
          <button
            type="button"
            className="mg-button mg-button-primary"
            onClick={onRetry}
          >
            <span
              className="mg-icon mg-icon-refresh mg-button__icon"
              aria-hidden="true"
            />
            {retryLabel}
          </button>
        )}

        {safeStatusUrl && (
          <a
            href={safeStatusUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mg-button mg-button-secondary mg-button-outline"
          >
            {statusUrlLabel}{' '}
            <span className="mg-u-sr-only">{t.opensInNewTab}</span>
            <span
              className="mg-icon mg-icon-external-link mg-button__icon"
              aria-hidden="true"
            />
          </a>
        )}

        {showCountdown && (
          <p className="mg-notice__meta" aria-hidden="true">
            {t.countdownPrefix} <strong>{countdown}s</strong>
          </p>
        )}
      </>
    ) : null;

  return (
    <Notice
      {...getLanguageProps(lang, dir)}
      {...props}
      role={null}
      variant={isOffline ? 'negative' : 'warning'}
      icon={isOffline ? 'mg-icon-power-off' : 'mg-icon-exclamation-triangle'}
      title={title}
      headingLevel={headingLevel}
      description={description}
      isCompact={isCompact}
      isOverlay={isOverlay}
      actions={actions}
      className={className}
      headerContent={
        <>
          <span
            className={classNames(
              'mg-status-label',
              isOffline
                ? 'mg-status-label--negative'
                : 'mg-status-label--warning'
            )}
          >
            <span className="mg-status-label__indicator" aria-hidden="true" />
            {statusText}
          </span>
          <span className="mg-u-sr-only" role="status">
            {announcement}
          </span>
        </>
      }
    />
  );
};

ServiceNotice.propTypes = {
  /** Heading text */
  title: PropTypes.node,
  /** Explanation. Strings render as plain text; pass nodes for rich content. */
  description: PropTypes.node,
  /** Service state */
  status: PropTypes.oneOf(['degraded', 'offline']),
  /** Heading element for the title, to fit the surrounding document outline */
  headingLevel: PropTypes.oneOf(HEADING_LEVELS),
  /** Compact padding and typography */
  isCompact: PropTypes.bool,
  /** Centered absolute overlay for map, chart or embed containers */
  isOverlay: PropTypes.bool,
  /** Called by the retry button and by each automatic retry */
  onRetry: PropTypes.func,
  /** Retry button text (overrides labels.retryLabel) */
  retryLabel: PropTypes.string,
  /** External status page URL (http or https only; other schemes are not rendered) */
  statusUrl: PropTypes.string,
  /** Status link text (overrides labels.statusUrlLabel) */
  statusUrlLabel: PropTypes.string,
  /** Seconds before the first automatic retry; doubles after each attempt. Requires onRetry. */
  countdownSeconds: PropTypes.number,
  /** Automatic retries before the countdown stops and only manual retry remains */
  maxAutoRetries: PropTypes.number,
  /** UI language tag; selects the built-in catalogue, with English fallback. */
  lang: PropTypes.string,
  /** Explicit text direction; otherwise known catalogue languages select their direction. */
  dir: PropTypes.oneOf(['ltr', 'rtl', 'auto']),
  /** Explicit UI label overrides; omitted keys use the selected catalogue, then English. */
  labels: PropTypes.shape({
    retryLabel: PropTypes.string,
    statusUrlLabel: PropTypes.string,
    opensInNewTab: PropTypes.string,
    statusDegraded: PropTypes.string,
    statusOffline: PropTypes.string,
    countdownPrefix: PropTypes.string,
    countdownAnnouncement: PropTypes.string,
    autoRetryStopped: PropTypes.string,
  }),
  /** Additional CSS class names */
  className: PropTypes.string,
};

export default ServiceNotice;
