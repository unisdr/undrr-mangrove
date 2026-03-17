/**
 * Layer 2: Extract Pager props from a DOM container.
 *
 * Expected HTML:
 * <nav data-mg-pager
 *   data-page="3"
 *   data-total-pages="20"
 *   data-layout="centered"
 *   data-show-jump-to="false"
 *   data-aria-label="Pagination"
 *   data-range-label="Showing {start}–{end} of 200"
 *   data-jump-to-label="Go to page"
 *   data-jump-to-action="Go">
 * </nav>
 *
 * Note: `onPageChange` is not extracted — it must be provided by the
 * consumer wrapper (e.g. a Drupal behavior that handles AJAX pagination).
 *
 * @param {Element} container - DOM element with data attributes
 * @returns {object} Props for the Pager component
 */
export default function pagerFromElement(container) {
  const { dataset } = container;
  return {
    page: dataset.page ? parseInt(dataset.page, 10) : 1,
    totalPages: dataset.totalPages ? parseInt(dataset.totalPages, 10) : null,
    layout: dataset.layout || 'centered',
    showJumpTo: dataset.showJumpTo === 'true',
    ariaLabel: dataset.ariaLabel || 'Pagination',
    rangeLabel: dataset.rangeLabel || undefined,
    jumpToLabel: dataset.jumpToLabel || undefined,
    jumpToAction: dataset.jumpToAction || undefined,
  };
}
