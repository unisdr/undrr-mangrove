/**
 * Layer 2: Extract Notice props from a DOM container.
 *
 * Expected HTML:
 * <div data-mg-notice
 *   data-title="Scheduled maintenance"
 *   data-description="Services will be briefly unavailable tonight."
 *   data-variant="warning"
 *   data-heading-level="h2"
 *   data-is-dismissible="true">
 * </div>
 *
 * Description is read as plain text; markup inside the container is not
 * re-injected as HTML.
 *
 * @param {Element} container - DOM element with data attributes
 * @returns {object} Props for the Notice component
 */
export default function noticeFromElement(container) {
  const { dataset } = container;

  const title =
    dataset.title ||
    container.querySelector('.mg-notice__title')?.textContent?.trim() ||
    null;

  const description =
    dataset.description ||
    container.querySelector('.mg-notice__description')?.textContent?.trim() ||
    null;

  return {
    title,
    description,
    variant: dataset.variant || undefined,
    headingLevel: dataset.headingLevel || undefined,
    isCompact: dataset.isCompact === 'true',
    isProminent: dataset.isProminent === 'true',
    isOverlay: dataset.isOverlay === 'true',
    isDismissible: dataset.isDismissible === 'true',
    dismissLabel: dataset.dismissLabel || undefined,
  };
}

export { noticeFromElement as fromElement };
