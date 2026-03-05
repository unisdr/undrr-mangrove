// mg-show-more
// https://gitlab.com/undrr/web-backlog/-/issues/1082

export function mgShowMore() {
  const mgShowMoreButtons = document.querySelectorAll('[data-mg-show-more]');

  mgShowMoreButtons.forEach(item => {
    if (item.dataset.mgShowMoreInitialized) return;
    item.dataset.mgShowMoreInitialized = 'true';

    item.dataset.dataVfGoogleAnalyticsLabel =
      'Show more: ' + item.dataset.mgShowMoreLabelCollapsed || `Show more`;

    const mgShowMoreTargetClass =
      item.dataset.mgShowMoreTarget || '.mg-show-more--container';
    const mgShowMoreTarget = document.querySelector(mgShowMoreTargetClass);

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

document.addEventListener('DOMContentLoaded', mgShowMore, false);
