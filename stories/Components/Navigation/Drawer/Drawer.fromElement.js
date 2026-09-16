/**
 * Layer 2: Extract Drawer props from a DOM container.
 *
 * Expected HTML:
 * <div data-mg-drawer
 *   data-position="start"
 *   data-title="Navigation"
 *   data-backdrop="true"
 *   data-is-floating-panel="false"
 *   data-is-open="false">
 *   <div class="mg-drawer__body">
 *     <p>Drawer content</p>
 *   </div>
 *   <div class="mg-drawer__footer">
 *     <button>Action</button>
 *   </div>
 * </div>
 *
 * @param {Element} container - DOM element with data attributes and optional server-rendered content
 * @returns {object} Props for the Drawer component
 */
export default function drawerFromElement(container) {
  const { dataset } = container;

  const isFloatingPanel =
    dataset.isFloatingPanel === 'true' ||
    container.classList.contains('mg-floating-panel');

  const baseClass = isFloatingPanel ? 'mg-floating-panel' : 'mg-drawer';

  // Extract body, footer, and title elements if pre-rendered in HTML
  const bodyEl = container.querySelector(`.${baseClass}__body`);
  const footerEl = container.querySelector(`.${baseClass}__footer`);
  const titleEl = container.querySelector(`.${baseClass}__title`);

  const title =
    dataset.title || (titleEl ? titleEl.textContent.trim() : undefined);

  let children = '';
  if (bodyEl) {
    children = bodyEl.innerHTML;
  } else if (container.innerHTML && !titleEl && !footerEl) {
    children = container.innerHTML;
  }

  const footer = footerEl ? footerEl.innerHTML : dataset.footer || undefined;

  return {
    isOpen:
      dataset.isOpen === 'true' || container.classList.contains('is-open'),
    position: dataset.position || 'start',
    title: title || undefined,
    backdrop: dataset.backdrop !== 'false',
    isFloatingPanel,
    children: children || dataset.content || '',
    footer,
    className: dataset.className || undefined,
  };
}
