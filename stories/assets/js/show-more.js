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
 * Resolves a toggle's target, nearest scope first.
 *
 * The revealed content need not be a sibling or descendant of its toggle, so
 * there is no container the lookup can be confined to. It can still be
 * *ordered*: climb the toggle's ancestors and return the first match found
 * inside one. For the canonical markup that is the adjacent wrapper, and for
 * two blocks in separate subtrees each toggle finds its own.
 *
 * For a toggle that is in the document the walk ends at `<html>`, an ancestor
 * of every other element, so its last iteration *is* the document-wide lookup:
 * a target anywhere on the page is still found, and it is the same element
 * `document.querySelector` returned whenever nothing nearer matched. The walk
 * is therefore never worse, and better whenever two toggles share a selector.
 * The explicit fallback below is only reached when the toggle is not in the
 * document tree — detached, or inside a shadow root or a `<template>` — where
 * it resolves exactly as it did before.
 *
 * Two toggles under the *same* parent still cannot be told apart: the first
 * scope containing one target contains both, and the earlier one in document
 * order wins. That is also why the React `ShowMore` wrapper mints an id per
 * item rather than relying on this walk. See #1228.
 *
 * @param {HTMLElement} toggle - The toggle whose target to resolve.
 * @param {string} selector - The CSS selector to resolve.
 * @returns {Element|null} The nearest match, or null when nothing matches.
 */
function resolveTarget(toggle, selector) {
  for (let scope = toggle.parentElement; scope; scope = scope.parentElement) {
    const match = scope.querySelector(selector);
    if (match) return match;
  }
  // `<html>` itself, and anything outside the toggle's ancestor chain (a
  // detached toggle, say), are only reachable from the document.
  return document.querySelector(selector);
}

/**
 * The height the content collapses to, read from CSS: the computed
 * max-height of the collapsed state, so `--mg-show-more-height` may be set in
 * any unit, including `lh`. Applying and removing the class in one task
 * forces a style recalculation but never paints.
 *
 * @param {HTMLElement} target - The collapsible content.
 * @returns {number} Pixels, or NaN when CSS gives no length.
 */
function collapsedHeight(target) {
  const collapsed = target.classList.contains('mg-show-more--collapsed');
  if (!collapsed) target.classList.add('mg-show-more--collapsed');
  const height = parseFloat(getComputedStyle(target).maxHeight);
  if (!collapsed) target.classList.remove('mg-show-more--collapsed');
  return height;
}

/**
 * @param {HTMLElement} target - The collapsible content.
 * @returns {number} Its line height in pixels.
 */
function lineHeight(target) {
  const style = getComputedStyle(target);
  const line = parseFloat(style.lineHeight);
  return Number.isFinite(line) ? line : parseFloat(style.fontSize) * 1.2;
}

/**
 * After a reader collapses content, bring the start of it back into view if
 * the toggle has left the viewport. Scrolls the heading just before the
 * content when there is one, honours scroll-padding (so a sticky bar such as
 * On this page is allowed for) and reduced motion.
 *
 * @param {HTMLElement} toggle - The toggle that was used.
 * @param {HTMLElement} target - The content it collapsed.
 */
function returnToContent(toggle, target) {
  const box = toggle.getBoundingClientRect();
  if (box.bottom > 0 && box.top < window.innerHeight) return;
  const previous = target.previousElementSibling;
  const anchor = previous?.matches('h1, h2, h3, h4, h5, h6')
    ? previous
    : target;
  const reduce =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  anchor.scrollIntoView?.({
    block: 'start',
    behavior: reduce ? 'auto' : 'smooth',
  });
}

// Items mode keeps a controller per toggle so a page can open or close the
// set without a synthetic click (see mgShowMoreSetOpen).
const itemControllers = new WeakMap();

/**
 * Items mode: a true disclosure. Whole elements marked
 * `data-mg-show-more-item` inside the target are hidden with
 * `hidden="until-found"` (plain `hidden` where the browser lacks it), so they
 * leave the accessibility tree and the tab order, and find-in-page can still
 * reveal them. The toggle is a disclosure button with `aria-expanded`.
 *
 * @param {HTMLElement} item - The toggle.
 * @param {HTMLElement} target - The container holding the items.
 * @param {Function} labelFor - Returns the visible label for a state.
 * @param {Object|null} stateLabels - Analytics labels per state, or null.
 * @returns {Function} Cleanup restoring the initial markup.
 */
function initItemsMode(item, target, labelFor, stateLabels) {
  const items = [...target.querySelectorAll('[data-mg-show-more-item]')];
  const labelNode = item.querySelector('[data-mg-show-more-label]') || item;
  const initial = {
    text: labelNode.textContent,
    hidden: item.hidden,
    expanded: item.getAttribute('aria-expanded'),
    controls: item.getAttribute('aria-controls'),
    analytics: item.getAttribute('data-vf-analytics-label'),
    items: items.map(element => element.getAttribute('hidden')),
  };
  // `hidden="until-found"` lets find-in-page reveal an item; browsers without
  // it treat the value as plain `hidden`, so the fallback is the same markup.
  const untilFound = 'onbeforematch' in document.documentElement;
  let open = false;

  const render = () => {
    items.forEach(element => {
      if (open) element.removeAttribute('hidden');
      else element.setAttribute('hidden', untilFound ? 'until-found' : '');
    });
    item.setAttribute('aria-expanded', String(open));
    labelNode.textContent = labelFor(!open);
    item.classList.toggle('mg-show-more--button--open', open);
    if (stateLabels) {
      item.setAttribute(
        'data-vf-analytics-label',
        open ? stateLabels.open : stateLabels.collapsed
      );
    }
  };

  const setOpen = next => {
    if (next === open) return;
    // Focus inside an item about to be hidden would be lost: move it to the
    // toggle. Opening leaves focus where it is (on the toggle).
    const active = item.ownerDocument.activeElement;
    const focusInside =
      !next && items.some(element => element.contains(active));
    const toggleFocused = active === item;
    open = next;
    render();
    if (focusInside) item.focus();
    if (!next) {
      returnToContent(item, target);
      return;
    }
    // Items revealed above a focused toggle push it down, often off-screen.
    // Bring it back into view so the focused control stays visible
    // (WCAG 2.4.7); "nearest" scrolls only as far as needed.
    if (!toggleFocused) return;
    const box = item.getBoundingClientRect();
    if (box.top >= 0 && box.bottom <= window.innerHeight) return;
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    item.scrollIntoView?.({
      block: 'nearest',
      behavior: reduce ? 'auto' : 'smooth',
    });
  };

  const onClick = event => {
    event.preventDefault();
    setOpen(!open);
  };
  // Find-in-page (or a text fragment) revealing one item opens the whole set,
  // so the label and aria-expanded stay true.
  const onBeforeMatch = () => setOpen(true);

  if (target.id === '') target.id = nextTargetId();
  item.setAttribute('aria-controls', target.id);
  item.addEventListener('click', onClick);
  target.addEventListener('beforematch', onBeforeMatch);
  itemControllers.set(item, setOpen);
  item.hidden = false;
  // Nothing to hide: leave everything open and the toggle hidden.
  if (items.length === 0) {
    item.hidden = true;
    open = true;
  }
  render();

  return () => {
    item.removeEventListener('click', onClick);
    target.removeEventListener('beforematch', onBeforeMatch);
    itemControllers.delete(item);
    items.forEach((element, index) => {
      const value = initial.items[index];
      if (value === null) element.removeAttribute('hidden');
      else element.setAttribute('hidden', value);
    });
    labelNode.textContent = initial.text;
    item.hidden = initial.hidden;
    item.classList.remove('mg-show-more--button--open');
    for (const [attribute, value] of [
      ['aria-expanded', initial.expanded],
      ['aria-controls', initial.controls],
      ['data-vf-analytics-label', initial.analytics],
    ]) {
      if (value === null) item.removeAttribute(attribute);
      else item.setAttribute(attribute, value);
    }
    delete item.dataset.mgShowMoreInitialized;
  };
}

/**
 * Opens or closes an items-mode toggle's set, as the reader's click would,
 * without dispatching a click. Visual-mode toggles are not affected.
 *
 * @param {HTMLElement} toggle - An initialised items-mode toggle.
 * @param {boolean} open - The state to set.
 * @returns {boolean} Whether the toggle was an initialised items-mode toggle.
 */
export function mgShowMoreSetOpen(toggle, open) {
  const setOpen = toggle && itemControllers.get(toggle);
  if (!setOpen) return false;
  setOpen(Boolean(open));
  return true;
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
 * @returns {Function} Removes handlers added by this call and restores each
 *   target's initial collapsed state. Useful for React effect cleanup.
 */
export function mgShowMore(scope) {
  const cleanups = [];
  const mgShowMoreButtons = scope
    ? scope instanceof HTMLElement
      ? [scope]
      : scope
    : document.querySelectorAll('[data-mg-show-more]');

  mgShowMoreButtons.forEach(item => {
    // Skip auto-init if the element opts out
    if (!scope && item.hasAttribute('data-mg-show-more-skip-auto-init')) return;
    if (item.dataset.mgShowMoreInitialized) return;
    const mgShowMoreTargetClass =
      item.dataset.mgShowMoreTarget || '.mg-show-more--container';
    const mgShowMoreTarget = resolveTarget(item, mgShowMoreTargetClass);

    if (!mgShowMoreTarget) {
      console.warn(
        `[mg-show-more] Target not found: "${mgShowMoreTargetClass}"`
      );
      return;
    }

    item.dataset.mgShowMoreInitialized = 'true';

    // Opt-in true disclosure over whole elements. The visual-only mode below
    // is unchanged.
    if (item.dataset.mgShowMoreMode === 'items') {
      const authorAnalytics = item.getAttribute('data-vf-analytics-label');
      const {
        mgShowMoreAnalyticsCollapsed: collapsedLabel,
        mgShowMoreAnalyticsOpen: openLabel,
      } = item.dataset;
      cleanups.push(
        initItemsMode(
          item,
          mgShowMoreTarget,
          collapsed =>
            collapsed
              ? item.dataset.mgShowMoreLabelCollapsed || 'Show more'
              : item.dataset.mgShowMoreLabelOpen || 'Show less',
          collapsedLabel || openLabel || !authorAnalytics
            ? {
                collapsed: collapsedLabel || 'Show more',
                open: openLabel || 'Show less',
              }
            : null
        )
      );
      return;
    }

    const wasCollapsed = mgShowMoreTarget.classList.contains(
      'mg-show-more--collapsed'
    );
    const wasOpen = item.classList.contains('mg-show-more--button--open');
    const initialControls = item.getAttribute('aria-controls');
    const initialRole = item.getAttribute('role');
    const onKeydown = event => {
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        item.click();
      }
    };

    // The click tracker reads data-vf-analytics-label. Report the action the
    // toggle is about to perform, in fixed English so reports do not split by
    // language. A label the author set by hand is kept as it is, unless
    // per-state labels are given.
    const COLLAPSED = 'mg-show-more--collapsed';
    const authorLabel = item.getAttribute('data-vf-analytics-label');
    const { mgShowMoreAnalyticsCollapsed, mgShowMoreAnalyticsOpen } =
      item.dataset;
    const stateLabels =
      mgShowMoreAnalyticsCollapsed || mgShowMoreAnalyticsOpen || !authorLabel
        ? {
            collapsed: mgShowMoreAnalyticsCollapsed || 'Show more',
            open: mgShowMoreAnalyticsOpen || 'Show less',
          }
        : null;

    // Visible text lives in a [data-mg-show-more-label] child when there is
    // one, so visually hidden context beside it survives each toggle.
    const labelNode = item.querySelector('[data-mg-show-more-label]') || item;
    const initialText = labelNode.textContent;
    const initialHidden = item.hidden;

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
      item.addEventListener('keydown', onKeydown);
    }

    // Initialisation and re-measures change state here rather than through
    // item.click(), so they reach no click listener (analytics reporting, the
    // Drupal wrapper). Focus entering, or a click on, collapsed content still
    // clicks the toggle below: those stand for a reader's action.
    const setCollapsed = collapsed => {
      mgShowMoreTarget.classList.toggle(COLLAPSED, collapsed);
      labelNode.textContent = collapsed
        ? item.dataset.mgShowMoreLabelCollapsed || 'Show more'
        : item.dataset.mgShowMoreLabelOpen || 'Show less';
      item.classList.toggle('mg-show-more--button--open', !collapsed);
      if (stateLabels) {
        item.setAttribute(
          'data-vf-analytics-label',
          collapsed ? stateLabels.collapsed : stateLabels.open
        );
      }
    };

    let readerToggled = false;
    const onClick = event => {
      // Also neutralises the dead `href="#"` on a legacy anchor toggle.
      event.preventDefault();
      readerToggled = true;
      const collapsing = !mgShowMoreTarget.classList.contains(COLLAPSED);
      setCollapsed(collapsing);
      // Collapsing a long block pulls the toggle up the page, often out of
      // view. Bring the reader back to the start of what they collapsed.
      if (collapsing) returnToContent(item, mgShowMoreTarget);
    };
    item.addEventListener('click', onClick);

    // The collapse is `max-height` + `overflow: hidden`, which clips content
    // visually but leaves it in the tab order. Without this, Tab lands on a
    // link the user cannot see, inside a box that cannot scroll to reveal it
    // (WCAG 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured). Expanding on
    // entry keeps the focused control visible.
    const onFocusin = event => {
      if (item === event.target || item.contains(event.target)) return;
      if (mgShowMoreTarget.classList.contains(COLLAPSED)) {
        item.click();
      }
    };
    mgShowMoreTarget.addEventListener('focusin', onFocusin);

    // Allow items to be shown by clicking anywhere on the collapsed item
    // https://gitlab.com/undrr/web-backlog/-/issues/1612
    const onTargetClick = () => {
      if (mgShowMoreTarget.classList.contains(COLLAPSED)) {
        item.click();
      }
    };
    mgShowMoreTarget.addEventListener('click', onTargetClick);

    // A template may ship the toggle `hidden` so it never shows without
    // JavaScript; the content is then simply open.
    item.hidden = false;
    setCollapsed(!wasCollapsed);

    // Opt-in: collapse only when enough would be hidden. Short content stays
    // open and the toggle is hidden, so a template can wrap every body field
    // in ShowMore. The value is a number of lines (empty means 1): collapse
    // when the content runs at least that many lines past the collapsed
    // height. The collapsed height is read from CSS (--mg-show-more-height),
    // so the decision does not depend on the current state and cannot flip
    // back and forth. Measured again when the content resizes, until the
    // reader uses the toggle. Content with no layout yet (inside a closed
    // tab, say) waits until it has one.
    let observer = null;
    let frame = 0;
    if (item.hasAttribute('data-mg-show-more-min-hidden-lines')) {
      const lines =
        parseFloat(item.dataset.mgShowMoreMinHiddenLines) > 0
          ? parseFloat(item.dataset.mgShowMoreMinHiddenLines)
          : 1;
      const measure = () => {
        frame = 0;
        if (readerToggled || mgShowMoreTarget.scrollHeight === 0) return;
        const limit = collapsedHeight(mgShowMoreTarget);
        const line = lineHeight(mgShowMoreTarget);
        if (!Number.isFinite(limit) || !Number.isFinite(line)) return;
        const collapse = mgShowMoreTarget.scrollHeight - limit >= lines * line;
        setCollapsed(collapse);
        item.hidden = !collapse;
      };
      measure();
      if (typeof ResizeObserver === 'function') {
        // Deferred to the next frame: changing the observed box inside the
        // callback is what raises "ResizeObserver loop" errors.
        observer = new ResizeObserver(() => {
          if (frame) cancelAnimationFrame(frame);
          frame = requestAnimationFrame(measure);
        });
        observer.observe(mgShowMoreTarget);
      }
    }

    cleanups.push(() => {
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      item.hidden = initialHidden;
      if (authorLabel === null) item.removeAttribute('data-vf-analytics-label');
      else item.setAttribute('data-vf-analytics-label', authorLabel);
      item.removeEventListener('click', onClick);
      item.removeEventListener('keydown', onKeydown);
      mgShowMoreTarget.removeEventListener('focusin', onFocusin);
      mgShowMoreTarget.removeEventListener('click', onTargetClick);
      mgShowMoreTarget.classList.toggle(
        'mg-show-more--collapsed',
        wasCollapsed
      );
      item.classList.toggle('mg-show-more--button--open', wasOpen);
      labelNode.textContent = initialText;
      for (const [attribute, value] of [
        ['aria-controls', initialControls],
        ['role', initialRole],
      ]) {
        if (value === null) item.removeAttribute(attribute);
        else item.setAttribute(attribute, value);
      }
      delete item.dataset.mgShowMoreInitialized;
    });
  });

  return () => cleanups.splice(0).forEach(cleanup => cleanup());
}

// Auto-wrap so the browser Event object is not passed as scope
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mgShowMore(), false);
} else {
  mgShowMore();
}
