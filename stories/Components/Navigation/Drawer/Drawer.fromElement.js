/**
 * Layer 2: Extract Drawer props from a DOM container.
 *
 * Expected HTML:
 * <button type="button" data-mg-drawer-trigger="filters">Filters</button>
 *
 * <div id="filters" data-mg-drawer
 *   data-position="start"
 *   data-title="Filter options"
 *   data-backdrop="true"
 *   data-is-open="false"
 *   data-close-label="Close">
 *   <div class="mg-drawer__body"><p>Drawer content</p></div>
 *   <div class="mg-drawer__footer"><button>Apply</button></div>
 * </div>
 *
 * The container needs an id for triggers to find it. Body and footer markup
 * is passed as bodyHtml / footerHtml and sanitised by the component; the
 * title is read as text.
 *
 * @param {Element} container - DOM element with data attributes and optional server-rendered content
 * @returns {object} Props for the hydrated Drawer
 */
export default function drawerFromElement(container) {
  const { dataset } = container;

  const isFloatingPanel =
    dataset.isFloatingPanel === 'true' ||
    container.classList.contains('mg-floating-panel');

  const baseClass = isFloatingPanel ? 'mg-floating-panel' : 'mg-drawer';

  const bodyEl = container.querySelector(`.${baseClass}__body`);
  const footerEl = container.querySelector(`.${baseClass}__footer`);
  const titleEl = container.querySelector(`.${baseClass}__title`);

  const title =
    dataset.title || (titleEl ? titleEl.textContent.trim() : undefined);

  let bodyHtml = bodyEl ? bodyEl.innerHTML.trim() : '';
  if (!bodyHtml && !titleEl && !footerEl) {
    bodyHtml = container.innerHTML.trim();
  }

  return {
    isOpen:
      dataset.isOpen === 'true' || container.classList.contains('is-open'),
    position: dataset.position || 'start',
    title: title || undefined,
    backdrop: dataset.backdrop !== 'false',
    isFloatingPanel,
    bodyHtml: bodyHtml || undefined,
    footerHtml: footerEl ? footerEl.innerHTML.trim() : undefined,
    labels: dataset.closeLabel ? { closeLabel: dataset.closeLabel } : undefined,
    controlsId: container.id || undefined,
    className: dataset.className || undefined,
  };
}

export { drawerFromElement as fromElement };
