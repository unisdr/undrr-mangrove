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

    setupClickHandlers(container);
    setupScrollSpy(container);
  });
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
 *
 * @param {string} text - Heading text to slugify
 * @param {Set<string>} usedIds - Set of IDs already in use
 * @returns {string} A unique ID
 */
function generateId(text, usedIds) {
  let base = text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

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
  const offset = parseInt(container.dataset.mgOnThisPageNavOffset || '0', 10);
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  container.addEventListener('click', e => {
    const link = e.target.closest('.mg-on-this-page-nav__link');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (!hash || !hash.startsWith('#')) return;

    const targetId = hash.slice(1);
    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    // Calculate scroll position with offset
    const top =
      target.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });

    // Update URL hash without triggering scroll
    if (window.history && window.history.pushState) {
      window.history.pushState(null, null, `#${targetId}`);
    }

    // Move focus to target for keyboard users
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

/**
 * Set up IntersectionObserver-based scroll-spy to highlight the active link.
 *
 * @param {HTMLElement} container - The nav element
 */
function setupScrollSpy(container) {
  const links = container.querySelectorAll('.mg-on-this-page-nav__link');
  const offset = parseInt(container.dataset.mgOnThisPageNavOffset || '0', 10);

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
      if (newLink.scrollIntoView) {
        newLink.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }

  // Track intersection state per target
  const intersecting = new Map();

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        intersecting.set(entry.target, {
          isIntersecting: entry.isIntersecting,
          top: entry.boundingClientRect.top,
        });
      });

      // Find the topmost intersecting target
      let bestTarget = null;
      let bestTop = Infinity;

      intersecting.forEach((state, target) => {
        if (state.isIntersecting && state.top < bestTop) {
          bestTop = state.top;
          bestTarget = target;
        }
      });

      if (bestTarget) {
        setActive(bestTarget.id);
      }
      // If nothing is intersecting, keep the last active (don't clear)
    },
    {
      // Top margin accounts for offset (fixed header).
      // Bottom margin of -66% means heading must be in top ~33% of viewport.
      rootMargin: `-${offset}px 0px -66% 0px`,
      threshold: [0],
    }
  );

  targets.forEach(target => observer.observe(target));

  // Store observer for potential cleanup
  container._mgOnThisPageNavObserver = observer;

  // Activate first link initially if nothing else triggers
  if (targets.length > 0) {
    setActive(targets[0].id);
  }
}

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', mgOnThisPageNav, false);
