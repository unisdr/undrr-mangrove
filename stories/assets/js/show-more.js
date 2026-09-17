// mg-show-more
// https://gitlab.com/undrr/web-backlog/-/issues/1082

// Used to give an unlabelled target an id so the toggle can point
// `aria-controls` at it.
let mgShowMoreTargetId = 0;

/**
 * Initializes "show more" toggle buttons.
 *
 * The toggle is a disclosure control: it carries `aria-expanded` reflecting
 * the collapsed state and `aria-controls` pointing at the content it reveals.
 *
 * @param {NodeList|HTMLElement[]|HTMLElement} [scope] - Elements to init.
 *   Accepts a NodeList, array, or a single HTMLElement.
 *   Defaults to all [data-mg-show-more] in the document.
 */
export function mgShowMore(scope) {
  const mgShowMoreButtons = scope
    ? scope instanceof HTMLElement
      ? [scope]
      : scope
    : document.querySelectorAll('[data-mg-show-more]');

  mgShowMoreButtons.forEach(item => {
    // Skip auto-init if the element opts out
    if (!scope && item.hasAttribute('data-mg-show-more-skip-auto-init')) return;
    if (item.dataset.mgShowMoreInitialized) return;
    item.dataset.mgShowMoreInitialized = 'true';

    item.dataset.dataVfGoogleAnalyticsLabel =
      'Show more: ' + item.dataset.mgShowMoreLabelCollapsed || `Show more`;

    const mgShowMoreTargetClass =
      item.dataset.mgShowMoreTarget || '.mg-show-more--container';
    const mgShowMoreTarget = document.querySelector(mgShowMoreTargetClass);

    if (!mgShowMoreTarget) {
      console.warn(
        `[mg-show-more] Target not found: "${mgShowMoreTargetClass}"`
      );
      return;
    }

    // Disclosure semantics. A <button> already announces as a button; an
    // anchor copied from an earlier version of the docs needs the role.
    if (mgShowMoreTarget.id === '') {
      mgShowMoreTargetId += 1;
      mgShowMoreTarget.id = `mg-show-more-target-${mgShowMoreTargetId}`;
    }
    item.setAttribute('aria-controls', mgShowMoreTarget.id);
    if (item.tagName !== 'BUTTON') {
      item.setAttribute('role', 'button');
    }

    const syncExpandedState = () => {
      item.setAttribute(
        'aria-expanded',
        mgShowMoreTarget.classList.contains('mg-show-more--collapsed')
          ? 'false'
          : 'true'
      );
    };

    syncExpandedState();

    item.addEventListener('click', event => {
      event.preventDefault();
      mgShowMoreTarget.classList.toggle('mg-show-more--collapsed');
      syncExpandedState();

      // Which label to show?
      item.textContent = mgShowMoreTarget.classList.contains(
        'mg-show-more--collapsed'
      )
        ? item.dataset.mgShowMoreLabelCollapsed || 'Show more'
        : item.dataset.mgShowMoreLabelOpen || 'Show less';

      if (mgShowMoreTarget.classList.contains('mg-show-more--collapsed')) {
        item.classList.remove('mg-show-more--button--open');
      } else {
        item.classList.add('mg-show-more--button--open');
      }
    });

    // Allow items to be shown by clicking anywhere on the collapsed item
    // https://gitlab.com/undrr/web-backlog/-/issues/1612
    mgShowMoreTarget.addEventListener('click', () => {
      if (mgShowMoreTarget.classList.contains('mg-show-more--collapsed')) {
        item.click();
      }
    });

    item.click();
  });
}

// Auto-wrap so the browser Event object is not passed as scope
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mgShowMore(), false);
} else {
  mgShowMore();
}
