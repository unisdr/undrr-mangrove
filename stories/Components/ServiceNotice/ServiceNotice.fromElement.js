export const RETRY_EVENT = 'mg-service-notice:retry';

/**
 * Layer 2: Extract ServiceNotice props from a DOM container.
 *
 * Expected HTML:
 * <div data-mg-service-notice
 *   data-title="MapX layer service unreachable"
 *   data-description="The geospatial tile service is temporarily offline."
 *   data-status="offline"
 *   data-retry
 *   data-status-url="https://status.example.org"
 *   data-countdown-seconds="30"
 *   data-max-auto-retries="3">
 * </div>
 *
 * Retry: when `data-retry` is present the retry button (and each automatic
 * retry) dispatches a bubbling `mg-service-notice:retry` CustomEvent on the
 * container, so page scripts can reload the embed:
 *
 *   container.addEventListener('mg-service-notice:retry', () => {
 *     // Re-fetch your data here
 *   });
 *
 * Without `data-retry` no retry button or countdown is rendered.
 * Prefer `data-is-compact` and `data-is-overlay`. The `mg-notice--compact` and
 * `mg-notice--overlay` classes on the container are also read, then removed
 * so the container is not styled as a second notice.
 * Title and description are read as plain text; markup is not re-injected.
 * A data-status-url that is not http or https is ignored by the component.
 *
 * @param {Element} container - DOM element with data attributes
 * @returns {object} Props for the ServiceNotice component
 */
export default function serviceNoticeFromElement(container) {
  const { dataset } = container;

  let parsedLabels = {};
  if (dataset.labels) {
    try {
      parsedLabels = JSON.parse(dataset.labels);
    } catch {
      // Ignore malformed JSON
    }
  }

  const title =
    dataset.title ||
    container.querySelector('.mg-notice__title')?.textContent?.trim() ||
    null;

  const description =
    dataset.description ||
    container.querySelector('.mg-notice__description')?.textContent?.trim() ||
    null;

  const toInt = value => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  // The rendered Notice carries its own modifier classes. Left on the
  // container, the fallback classes would style it as a second notice (extra
  // padding for compact, a second absolute layer for overlay), so they are
  // removed once read.
  const isCompactClass = container.classList.contains('mg-notice--compact');
  const isOverlayClass = container.classList.contains('mg-notice--overlay');
  container.classList.remove('mg-notice--compact', 'mg-notice--overlay');

  const onRetry =
    'retry' in dataset
      ? () =>
          container.dispatchEvent(
            new CustomEvent(RETRY_EVENT, { bubbles: true })
          )
      : undefined;

  return {
    title,
    description,
    status: dataset.status === 'offline' ? 'offline' : 'degraded',
    headingLevel: dataset.headingLevel || undefined,
    isCompact: dataset.isCompact === 'true' || isCompactClass,
    isOverlay: dataset.isOverlay === 'true' || isOverlayClass,
    onRetry,
    retryLabel: dataset.retryLabel || undefined,
    statusUrl: dataset.statusUrl || undefined,
    statusUrlLabel: dataset.statusUrlLabel || undefined,
    countdownSeconds: toInt(dataset.countdownSeconds) ?? null,
    maxAutoRetries: toInt(dataset.maxAutoRetries),
    labels: Object.keys(parsedLabels).length > 0 ? parsedLabels : undefined,
  };
}

export { serviceNoticeFromElement as fromElement };
