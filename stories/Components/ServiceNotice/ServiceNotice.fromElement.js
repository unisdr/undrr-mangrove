/**
 * Layer 2: Extract ServiceNotice props from a DOM container.
 *
 * Expected HTML:
 * <aside data-mg-service-notice
 *   data-title="MapX layer service unreachable"
 *   data-description="The geospatial tile service is temporarily offline."
 *   data-status="offline"
 *   data-status-url="https://status.example.org"
 *   data-countdown-seconds="30">
 * </aside>
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
    container.querySelector('.mg-service-notice__title')?.textContent?.trim() ||
    null;

  const descEl = container.querySelector('.mg-service-notice__description');
  const description =
    dataset.description ||
    (descEl ? descEl.innerHTML.trim() : null) ||
    (!title && container.innerHTML.trim() ? container.innerHTML.trim() : null);

  const status =
    dataset.status || (dataset.variant === 'negative' ? 'offline' : 'degraded');
  const isCompact =
    dataset.isCompact === 'true' ||
    container.classList.contains('mg-service-notice--compact');
  const isOverlay =
    dataset.isOverlay === 'true' ||
    container.classList.contains('mg-service-notice--overlay');

  const countdownSeconds = dataset.countdownSeconds
    ? parseInt(dataset.countdownSeconds, 10)
    : null;

  return {
    title,
    description,
    status,
    variant: dataset.variant || undefined,
    isCompact,
    isOverlay,
    retryLabel: dataset.retryLabel || undefined,
    statusUrl: dataset.statusUrl || undefined,
    statusUrlLabel: dataset.statusUrlLabel || undefined,
    countdownSeconds: Number.isNaN(countdownSeconds) ? null : countdownSeconds,
    labels: Object.keys(parsedLabels).length > 0 ? parsedLabels : undefined,
  };
}

export { serviceNoticeFromElement as fromElement };
