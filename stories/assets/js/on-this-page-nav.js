// mg-on-this-page-nav
// https://gitlab.com/undrr/web-backlog/-/issues/337
//
// Sticky horizontal "On this page" navigation with scroll-spy.
// Two modes:
//   Auto-detect: scans headings from the page and generates nav links
//   Explicit: uses author-provided <ul> with <a> elements
//
// Scroll-spy uses IntersectionObserver. CSS-only scroll-spy
// (scroll-target-group + :target-current) is emerging in CSS Overflow L5
// but lacks aria-current support and cross-browser coverage — revisit when
// browsers ship native accessibility semantics for :target-current.

/**
 * Read the offset CSS custom property from the nav element.
 * Returns the pixel value (number). Falls back to 0.
 *
 * @param {HTMLElement} container - The nav element
 * @returns {number} Offset in pixels
 */
function getOffset(container) {
  const raw = getComputedStyle(container)
    .getPropertyValue('--mg-on-this-page-nav-offset')
    .trim();
  return parseFloat(raw) || 0;
}

/**
 * Check if the user prefers reduced motion at the current moment.
 * Read at point-of-use so toggling the OS preference takes effect immediately.
 *
 * @returns {boolean}
 */
function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Initializes "On this page" sticky navigation bars.
 *
 * @param {NodeList|HTMLElement[]} [scope] - Elements to init.
 *   Defaults to all [data-mg-on-this-page-nav] in the document.
 */
export function mgOnThisPageNav(scope) {
  const containers =
    scope || document.querySelectorAll('[data-mg-on-this-page-nav]');

  containers.forEach(container => {
    if (container.dataset.mgOnThisPageNavInitialized) return;
    container.dataset.mgOnThisPageNavInitialized = 'true';

    // Ensure the nav has an aria-label
    if (!container.getAttribute('aria-label')) {
      container.setAttribute(
        'aria-label',
        container.dataset.mgOnThisPageNavLabel || 'On this page'
      );
    }

    // Detect mode: explicit if the container already has a <ul>, otherwise auto-detect
    const existingList = container.querySelector('ul');
    if (!existingList) {
      buildNavFromHeadings(container);
    }

    // Skip setup if no headings were found and nav is hidden
    if (container.classList.contains('mg-on-this-page-nav--hidden')) return;

    // Add role="list" to guard against VoiceOver + list-style:none bug
    const list = container.querySelector('.mg-on-this-page-nav__list');
    if (list && !list.getAttribute('role')) {
      list.setAttribute('role', 'list');
    }

    setupClickHandlers(container);
    setupScrollSpy(container);
    setupFocusScrolling(container);
  });
}

/**
 * Disconnects the observer and removes the initialized flag so the
 * component can be re-initialized or garbage-collected.
 *
 * @param {HTMLElement} container - The nav element to tear down
 */
export function mgOnThisPageNavDestroy(container) {
  if (container._mgOnThisPageNavObserver) {
    container._mgOnThisPageNavObserver.disconnect();
    delete container._mgOnThisPageNavObserver;
  }
  delete container.dataset.mgOnThisPageNavInitialized;
}

/**
 * Auto-detect mode: scan headings from the page and generate nav links.
 * Preserves any existing CTA element in the container.
 *
 * @param {HTMLElement} container - The nav element with [data-mg-on-this-page-nav]
 */
function buildNavFromHeadings(container) {
  const depth = parseInt(container.dataset.mgOnThisPageNavDepth || '2', 10);
  const contentSelector = container.dataset.mgOnThisPageNavContent;
  const contentScope = contentSelector
    ? document.querySelector(contentSelector)
    : document.body;

  if (!contentScope) {
    container.classList.add('mg-on-this-page-nav--hidden');
    return;
  }

  // Build heading selector based on depth (h2, or h2+h3, or h2+h3+h4)
  const levels = [];
  for (let i = 2; i <= Math.min(depth, 6); i++) {
    levels.push(`h${i}`);
  }
  const headingSelector = levels.join(', ');

  const headings = contentScope.querySelectorAll(headingSelector);

  // Filter out excluded headings
  const filteredHeadings = Array.from(headings).filter(heading => {
    if (heading.classList.contains('mg-on-this-page-nav--exclude')) return false;
    if (heading.classList.contains('mg-u-sr-only')) return false;
    // Skip the "On this page" header from TableOfContents if present
    if (heading.id === 'on-this-page') return false;
    return true;
  });

  if (filteredHeadings.length === 0) {
    container.classList.add('mg-on-this-page-nav--hidden');
    return;
  }

  // Preserve any existing CTA element before rebuilding
  const cta = container.querySelector('.mg-on-this-page-nav__cta');
  const ctaClone = cta ? cta.cloneNode(true) : null;

  // Build the list
  const ul = document.createElement('ul');
  ul.className = 'mg-on-this-page-nav__list';
  ul.setAttribute('role', 'list');

  const usedIds = new Set();

  filteredHeadings.forEach(heading => {
    // Ensure the heading has an ID
    if (!heading.id) {
      heading.id = generateId(heading.textContent, usedIds);
    }
    usedIds.add(heading.id);

    const li = document.createElement('li');
    li.className = 'mg-on-this-page-nav__item';

    const a = document.createElement('a');
    a.className = 'mg-on-this-page-nav__link';
    a.href = `#${heading.id}`;
    a.textContent = heading.textContent.trim();

    li.appendChild(a);
    ul.appendChild(li);
  });

  // Clear container and rebuild
  container.innerHTML = '';
  container.appendChild(ul);

  // Re-append CTA if one existed
  if (ctaClone) {
    container.appendChild(ctaClone);
  }
}

/**
 * Generate a URL-safe ID from text, ensuring uniqueness.
 * Uses Unicode-aware regex so Arabic, Japanese, and other non-Latin
 * heading text produces meaningful IDs instead of falling back to "section".
 *
 * @param {string} text - Heading text to slugify
 * @param {Set<string>} usedIds - Set of IDs already in use
 * @returns {string} A unique ID
 */
function generateId(text, usedIds) {
  let base = text
    .trim()
    .toLowerCase()
    // Remove punctuation and symbols but keep letters, numbers, spaces, hyphens
    .replace(/[\p{P}\p{S}]/gu, '')
    .replace(/\s+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // Ensure we have something
  if (!base) base = 'section';

  let id = base;
  let counter = 2;
  while (usedIds.has(id) || document.getElementById(id)) {
    id = `${base}-${counter}`;
    counter++;
  }

  return id;
}

/**
 * Set up click handlers for smooth scrolling and hash updates.
 *
 * @param {HTMLElement} container - The nav element
 */
function setupClickHandlers(container) {
  const offset = getOffset(container);

  container.addEventListener('click', e => {
    const link = e.target.closest('.mg-on-this-page-nav__link');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (!hash || !hash.startsWith('#')) return;

    const targetId = hash.slice(1);
    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    // Calculate scroll position with offset + the nav bar's own height
    const navHeight = container.offsetHeight || 0;
    const top =
      target.getBoundingClientRect().top + window.scrollY - offset - navHeight;

    window.scrollTo({
      top,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });

    // Update URL hash without triggering scroll
    if (window.history && window.history.pushState) {
      window.history.pushState(null, null, `#${targetId}`);
    }

    // Move focus to target for keyboard users; remove tabindex on blur
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.addEventListener(
      'blur',
      () => target.removeAttribute('tabindex'),
      { once: true }
    );
  });
}

/**
 * Ensure keyboard users can scroll overflowing nav links into view.
 * Browsers may not auto-scroll a hidden-scrollbar container on focus.
 *
 * @param {HTMLElement} container - The nav element
 */
function setupFocusScrolling(container) {
  const list = container.querySelector('.mg-on-this-page-nav__list');
  if (!list) return;

  list.addEventListener('focusin', e => {
    const link = e.target.closest('.mg-on-this-page-nav__link');
    if (!link || !list.scrollTo) return;

    const linkLeft = link.offsetLeft;
    const linkWidth = link.offsetWidth;
    const listWidth = list.offsetWidth;
    const scrollTarget = linkLeft - listWidth / 2 + linkWidth / 2;
    list.scrollTo({
      left: scrollTarget,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  });
}

/**
 * Set up IntersectionObserver-based scroll-spy to highlight the active link.
 *
 * @param {HTMLElement} container - The nav element
 */
function setupScrollSpy(container) {
  const links = container.querySelectorAll('.mg-on-this-page-nav__link');
  const offset = getOffset(container);

  // Map heading IDs to their corresponding link elements
  const linkMap = new Map();
  const targets = [];

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    linkMap.set(id, link);
    targets.push(target);
  });

  if (targets.length === 0) return;

  let activeId = null;

  /**
   * Update which link is marked active.
   * @param {string|null} id - The heading ID to activate
   */
  function setActive(id) {
    if (id === activeId) return;

    // Remove old active state
    if (activeId && linkMap.has(activeId)) {
      const oldLink = linkMap.get(activeId);
      oldLink.classList.remove('mg-on-this-page-nav__link--active');
      oldLink.removeAttribute('aria-current');
    }

    activeId = id;

    // Set new active state
    if (id && linkMap.has(id)) {
      const newLink = linkMap.get(id);
      newLink.classList.add('mg-on-this-page-nav__link--active');
      newLink.setAttribute('aria-current', 'true');

      // Scroll the nav list horizontally to keep active link visible.
      // The scrollbar is hidden (CSS) — the user doesn't manually scroll
      // the nav. ONS user research found independently-scrolling ToC lists
      // confused users; auto-scrolling to the active link avoids that.
      // We use scrollLeft on the list (not scrollIntoView on the link)
      // to avoid vertical page scrolling side-effects.
      const list = newLink.closest('.mg-on-this-page-nav__list');
      if (list && list.scrollTo) {
        const linkLeft = newLink.offsetLeft;
        const linkWidth = newLink.offsetWidth;
        const listWidth = list.offsetWidth;
        const scrollTarget = linkLeft - listWidth / 2 + linkWidth / 2;
        list.scrollTo({
          left: scrollTarget,
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        });
      }
    }
  }

  const observer = new IntersectionObserver(
    entries => {
      // Update intersection state from this callback
      entries.forEach(entry => {
        entry.target._mgIsIntersecting = entry.isIntersecting;
      });

      // Pick the first intersecting target in DOM order (stable, no stale .top values)
      const firstIntersecting = targets.find(t => t._mgIsIntersecting);
      if (firstIntersecting) {
        setActive(firstIntersecting.id);
      }
      // If nothing is intersecting, keep the last active (don't clear)
    },
    {
      // Top margin accounts for offset (fixed header) + the nav bar's own height.
      // Bottom margin of -66% means heading must be in top ~33% of viewport.
      rootMargin: `-${offset + (container.offsetHeight || 0)}px 0px -66% 0px`,
      threshold: [0],
    }
  );

  targets.forEach(target => observer.observe(target));

  // Store observer for cleanup via mgOnThisPageNavDestroy()
  container._mgOnThisPageNavObserver = observer;

  // Activate from URL hash if it matches a target, otherwise first link
  const hashId = window.location.hash ? window.location.hash.slice(1) : null;
  if (hashId && linkMap.has(hashId)) {
    setActive(hashId);
  } else if (targets.length > 0) {
    setActive(targets[0].id);
  }
}

// Auto-initialize on DOMContentLoaded (or immediately if already loaded,
// e.g. when script is deferred or loaded as an ES module)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mgOnThisPageNav, false);
} else {
  mgOnThisPageNav();
}
