// mg-show-more
// https://gitlab.com/undrr/web-backlog/-/issues/1082

// Used to give an unlabelled target an id so the toggle can point
// `aria-controls` at it. The counter lives on `globalThis` rather than in
// module scope so two loaded copies of this module — a site bundle alongside
// the CDN build, say — share one sequence instead of each minting
// `mg-show-more-target-1`. Same hazard, and same fix, as the root counter in
// `src/hydrate.js` (#1178).
const TARGET_COUNTER_KEY = Symbol.for('undrr.mangrove.showMore.targetCounter');

/**
 * Mints an id that is unused in the current document.
 *
 * @returns {string} A free `mg-show-more-target-N` id.
 */
function nextTargetId() {
  for (;;) {
    const current = globalThis[TARGET_COUNTER_KEY];
    const next = Number.isSafeInteger(current) && current >= 0 ? current : 0;
    globalThis[TARGET_COUNTER_KEY] = next + 1;
    const id = `mg-show-more-target-${next}`;
    if (!document.getElementById(id)) return id;
  }
}

/**
 * Initializes "show more" toggle buttons.
 *
 * The toggle carries `aria-controls` pointing at the content it collapses.
 * It deliberately does not carry `aria-expanded`: the collapse is visual
 * only. See the accessibility section of `ShowMore.mdx` for why.
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

    // Relate the toggle to the content it acts on. A <button> already
    // announces as a button; an anchor copied from an earlier version of the
    // docs needs the role.
    if (mgShowMoreTarget.id === '') {
      mgShowMoreTarget.id = nextTargetId();
    }
    item.setAttribute('aria-controls', mgShowMoreTarget.id);
    if (item.tagName !== 'BUTTON') {
      item.setAttribute('role', 'button');

      // `role="button"` promises Space activates the control, and an anchor
      // does not honour that on its own (WCAG 4.1.2 Name, Role, Value).
      // `preventDefault` keeps Space from scrolling the page.
      item.addEventListener('keydown', event => {
        if (event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
          item.click();
        }
      });
    }

    item.addEventListener('click', event => {
      // Also neutralises the dead `href="#"` on a legacy anchor toggle.
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

    // The collapse is `max-height` + `overflow: hidden`, which clips content
    // visually but leaves it in the tab order. Without this, Tab lands on a
    // link the user cannot see, inside a box that cannot scroll to reveal it
    // (WCAG 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured). Expanding on
    // entry keeps the focused control visible.
    mgShowMoreTarget.addEventListener('focusin', event => {
      if (item === event.target || item.contains(event.target)) return;
      if (mgShowMoreTarget.classList.contains('mg-show-more--collapsed')) {
        item.click();
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
