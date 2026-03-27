// mg-show-more
// https://gitlab.com/undrr/web-backlog/-/issues/1082

/**
 * Initializes "show more" toggle buttons.
 *
 * @param {NodeList|HTMLElement[]} [scope] - Elements to init.
 *   Defaults to all [data-mg-show-more] in the document.
 */
export function mgShowMore(scope) {
  const mgShowMoreButtons =
    scope || document.querySelectorAll('[data-mg-show-more]');

  mgShowMoreButtons.forEach(item => {
    // Defer: skip during auto-init if the element opts out
    if (!scope && item.hasAttribute('data-mg-show-more-defer')) return;
    if (item.dataset.mgShowMoreInitialized) return;
    item.dataset.mgShowMoreInitialized = 'true';

    item.dataset.dataVfGoogleAnalyticsLabel =
      'Show more: ' + item.dataset.mgShowMoreLabelCollapsed || `Show more`;

    const mgShowMoreTargetClass =
      item.dataset.mgShowMoreTarget || '.mg-show-more--container';
    const mgShowMoreTarget = document.querySelector(mgShowMoreTargetClass);

    if (!mgShowMoreTarget) return;

    item.addEventListener('click', event => {
      event.preventDefault();
      mgShowMoreTarget.classList.toggle('mg-show-more--collapsed');

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
