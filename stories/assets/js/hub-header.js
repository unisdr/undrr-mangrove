// mg-hub-header
// Enhances static HubHeader markup: marks the current section from the URL
// (opt in), keeps the marked section in view and drives the edge fades.
// See stories/Patterns/ContentHub/ContentHub.mdx.

const ROOT_SELECTOR = '[data-mg-js-hub-header]';
const ANCESTOR_CLASS = 'mg-hub-header__nav-item--ancestor';

/**
 * Reduces a link to a path that can be compared with the current page: same
 * origin only, with no query, fragment, trailing slash or `index.html`.
 *
 * @param {string} href - Link href, relative or absolute.
 * @param {string} [base] - Base URL. Defaults to the current location.
 * @returns {string|null} The path, or null for another origin or a bad URL.
 */
export function hubHeaderPath(href, base = window.location.href) {
  let url;
  try {
    url = new URL(href, base);
  } catch {
    return null;
  }
  if (url.origin !== new URL(base).origin) return null;
  const path = url.pathname.replace(/\/index\.html?$/i, '/');
  return path.length > 1 ? path.replace(/\/+$/, '') || '/' : path;
}

/**
 * Whether the markup already says which section is current. A server or a
 * React consumer that knows better than the URL always wins.
 *
 * @param {HTMLElement} root - The hub header.
 * @returns {boolean} True when any section is already marked.
 */
function hasExplicitState(root) {
  return Boolean(
    root.querySelector(
      `.mg-hub-header__nav [aria-current], .mg-hub-header__nav [data-hub-current], .${ANCESTOR_CLASS}`
    )
  );
}

/**
 * The path a link points at, or null when it does not point at a page: an
 * empty href, a fragment or a bare query resolves to the current page, so it
 * would match wherever the markup is copied.
 *
 * @param {Element} link - The link.
 * @returns {string|null} The link's path.
 */
function linkPath(link) {
  const href = (link.getAttribute('href') || '').trim();
  if (!href || href.startsWith('#') || href.startsWith('?')) return null;
  return hubHeaderPath(href);
}

/**
 * Marks the section for the current page. An exact match is the page itself
 * and is announced; otherwise the longest section containing the page is
 * marked as its ancestor, styled the same but not announced.
 *
 * @param {HTMLElement} root - The hub header.
 * @returns {Function} Removes the marks this call added.
 */
function markCurrent(root) {
  const none = () => {};
  if (hasExplicitState(root)) return none;
  const here = hubHeaderPath(window.location.href);
  const name = root.querySelector('.mg-hub-header__name[href]');
  const home = name ? linkPath(name) : null;
  const links = [...root.querySelectorAll('.mg-hub-header__nav a[href]')];
  const paths = links.map(linkPath);

  const exact = links.find((link, index) => paths[index] === here);
  if (exact) {
    exact.setAttribute('aria-current', 'page');
    exact.setAttribute('data-hub-current', '');
    return () => {
      exact.removeAttribute('aria-current');
      exact.removeAttribute('data-hub-current');
    };
  }
  if (home && home === here && !name.hasAttribute('aria-current')) {
    name.setAttribute('aria-current', 'page');
    return () => name.removeAttribute('aria-current');
  }

  // A section that is the hub home, or the site root, contains every page of
  // the hub. As an ancestor it would be marked everywhere, so it can only ever
  // match exactly.
  let best = null;
  links.forEach((link, index) => {
    const path = paths[index];
    if (!path || path === '/' || path === home) return;
    if (!here.startsWith(`${path}/`)) return;
    if (!best || path.length > best.path.length) best = { link, path };
  });
  if (!best) return none;
  const item = best.link.closest('li');
  item?.classList.add(ANCESTOR_CLASS);
  best.link.setAttribute('data-hub-current', '');
  return () => {
    item?.classList.remove(ANCESTOR_CLASS);
    best.link.removeAttribute('data-hub-current');
  };
}

/**
 * Keeps the marked section in view and drives the edge fades, which CSS
 * cannot do on its own because it cannot detect overflow.
 *
 * @param {HTMLElement} root - The hub header.
 * @returns {Function} Removes the listeners and markers this added.
 */
function enhanceRail(root) {
  const nav = root.querySelector('.mg-hub-header__nav');
  const rail = nav?.querySelector('ul');
  if (!nav || !rail) return () => {};

  const reveal = () => {
    const selected = rail.querySelector('[data-hub-current]');
    if (!selected || typeof rail.scrollBy !== 'function') return;
    const viewport = rail.getBoundingClientRect();
    const item = selected.getBoundingClientRect();
    let offset = 0;
    if (item.left < viewport.left) offset = item.left - viewport.left;
    else if (item.right > viewport.right) offset = item.right - viewport.right;
    if (offset) rail.scrollBy({ left: offset, behavior: 'instant' });
  };
  const markOverflow = () => {
    const scrolled = Math.abs(rail.scrollLeft);
    nav.toggleAttribute('data-overflow-start', scrolled > 1);
    nav.toggleAttribute(
      'data-overflow-end',
      scrolled + rail.clientWidth < rail.scrollWidth - 1
    );
  };
  const update = () => {
    reveal();
    markOverflow();
  };

  update();
  // Only a change to the marked label, such as a web font arriving after first
  // paint, moves the rail back to it. Everything else only recomputes the
  // fades: a resize must not undo the reader's own scrolling, and iOS Safari
  // fires one whenever its toolbar collapses.
  const Observer =
    typeof ResizeObserver === 'undefined' ? null : ResizeObserver;
  const railObserver = Observer ? new Observer(markOverflow) : null;
  railObserver?.observe(nav);
  railObserver?.observe(rail);
  const labelObserver = Observer ? new Observer(update) : null;
  const selected = rail.querySelector('[data-hub-current]');
  if (selected) labelObserver?.observe(selected);
  let active = true;
  document.fonts?.ready.then(() => {
    if (active) update();
  });
  rail.addEventListener('scroll', markOverflow, { passive: true });
  window.addEventListener('resize', markOverflow);

  return () => {
    active = false;
    railObserver?.disconnect();
    labelObserver?.disconnect();
    rail.removeEventListener('scroll', markOverflow);
    window.removeEventListener('resize', markOverflow);
    nav.removeAttribute('data-overflow-start');
    nav.removeAttribute('data-overflow-end');
  };
}

/**
 * Initializes hub headers. Headers already initialized are skipped, so this
 * can be called again after inserting markup.
 *
 * @param {NodeList|HTMLElement[]|HTMLElement} [scope] - Headers to enhance.
 *   Defaults to every [data-mg-js-hub-header] in the document, less any
 *   carrying data-mg-hub-header-skip-auto-init.
 * @returns {Function} Removes what this call added, so a header can be
 *   initialized again. Useful for React effect cleanup.
 */
export function mgHubHeader(scope) {
  let roots;
  if (!scope) roots = document.querySelectorAll(ROOT_SELECTOR);
  else if (scope instanceof HTMLElement) roots = [scope];
  else roots = scope;

  const cleanups = [];
  Array.from(roots).forEach(root => {
    if (!(root instanceof HTMLElement) || !root.matches(ROOT_SELECTOR)) return;
    if (!scope && root.hasAttribute('data-mg-hub-header-skip-auto-init')) {
      return;
    }
    if (root.dataset.mgJsHubHeaderInitialized === 'true') return;
    root.dataset.mgJsHubHeaderInitialized = 'true';
    const unmark = root.hasAttribute('data-mg-hub-header-detect-current')
      ? markCurrent(root)
      : () => {};
    const teardown = enhanceRail(root);
    cleanups.push(() => {
      teardown();
      unmark();
      delete root.dataset.mgJsHubHeaderInitialized;
    });
  });
  return () => cleanups.forEach(cleanup => cleanup());
}

// Auto-wrap so the browser Event object is not passed as scope.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mgHubHeader(), false);
} else {
  mgHubHeader();
}
