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
// but lacks aria-current support and cross-browser coverage - revisit when
// browsers ship native accessibility semantics for :target-current.

const CHEVRON_LEFT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"><path d="M11 4L6 8l5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEVRON_RIGHT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"><path d="M5 4l5 4-5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

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
 * @returns {boolean} Whether the user currently prefers reduced motion.
 */
function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Horizontally scroll a link to the center of its list container.
 *
 * @param {HTMLElement} link - The link element to center
 * @param {HTMLElement} list - The scrollable list container
 */
function scrollLinkToCenter(link, list) {
  if (!list.scrollTo) return;
  const scrollTarget =
    link.offsetLeft - list.offsetWidth / 2 + link.offsetWidth / 2;
  list.scrollTo({
    left: scrollTarget,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

/**
 * Initializes "On this page" sticky navigation bars.
 *
 * @param {NodeList|HTMLElement[]|HTMLElement} [scope] - Elements to init.
 *   Accepts a NodeList, array, or a single HTMLElement.
 *   Defaults to all [data-mg-on-this-page-nav] in the document.
 */
export function mgOnThisPageNav(scope) {
  const containers = scope
    ? (scope instanceof HTMLElement ? [scope] : scope)
    : document.querySelectorAll('[data-mg-on-this-page-nav]');

  containers.forEach(container => {
    // Skip auto-init if the element opts out
    if (!scope && container.hasAttribute('data-mg-on-this-page-nav-skip-auto-init')) return;
    if (container.dataset.mgOnThisPageNavInitialized) return;
    container.dataset.mgOnThisPageNavInitialized = 'true';

    // Ensure the nav has an aria-label
    if (!container.getAttribute('aria-label')) {
      container.setAttribute(
        'aria-label',
        container.dataset.mgOnThisPageNavLabel || 'On this page'
      );
    }

    // Detect mode: explicit if container already has a <ul>, otherwise auto-detect
    const existingList = container.querySelector('ul');
    if (!existingList) {
      buildNavFromHeadings(container);
    }

    // Skip setup if no headings were found and nav is hidden
    if (container.classList.contains('mg-on-this-page-nav--hidden')) return;

    // Guard against VoiceOver + list-style:none bug
    const list = container.querySelector('.mg-on-this-page-nav__list');
    if (list && !list.getAttribute('role')) {
      list.setAttribute('role', 'list');
    }

    const ac = new AbortController();
    container._mgOnThisPageNavAbort = ac;

    setupClickHandlers(container, ac.signal);
    setupScrollSpy(container);
    setupFocusScrolling(container, ac.signal);
    setupScrollButtons(container, ac.signal);
  });
}

/**
 * Disconnects the observer, removes event listeners, and clears the
 * initialized flag so the component can be re-initialized or garbage-collected.
 *
 * @param {HTMLElement} container - The nav element to tear down
 */
export function mgOnThisPageNavDestroy(container) {
  if (container._mgOnThisPageNavAbort) {
    container._mgOnThisPageNavAbort.abort();
    delete container._mgOnThisPageNavAbort;
  }
  if (container._mgOnThisPageNavObserver) {
    container._mgOnThisPageNavObserver.disconnect();
    delete container._mgOnThisPageNavObserver;
  }
  if (container._mgOnThisPageNavResizeObserver) {
    container._mgOnThisPageNavResizeObserver.disconnect();
    delete container._mgOnThisPageNavResizeObserver;
  }
  container.querySelectorAll('.mg-on-this-page-nav__scroll-btn').forEach(btn => btn.remove());
  container.classList.remove('mg-on-this-page-nav--has-left-overflow');
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

  const levels = [];
  for (let i = 2; i <= Math.min(depth, 6); i++) {
    levels.push(`h${i}`);
  }

  const headings = contentScope.querySelectorAll(levels.join(', '));

  // Filter out excluded headings and the TableOfContents "On this page" header
  const filteredHeadings = Array.from(headings).filter(heading => {
    if (heading.classList.contains('mg-on-this-page-nav--exclude')) return false;
    if (heading.classList.contains('mg-u-sr-only')) return false;
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

  const ul = document.createElement('ul');
  ul.className = 'mg-on-this-page-nav__list';
  ul.setAttribute('role', 'list');

  const usedIds = new Set();

  filteredHeadings.forEach(heading => {
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

  container.innerHTML = '';
  container.appendChild(ul);

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
    .replace(/[\p{P}\p{S}]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');

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
 * @param {AbortSignal} signal - Signal to remove listener on destroy
 */
function setupClickHandlers(container, signal) {
  container.addEventListener('click', e => {
    const link = e.target.closest('.mg-on-this-page-nav__link');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (!hash || !hash.startsWith('#')) return;

    const targetId = hash.slice(1);
    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    // Read offset per click — the custom property may change at breakpoints
    const offset = getOffset(container);
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
  }, { signal });
}

/**
 * Update scroll button visibility based on the current scroll position of
 * the list. Also manages keyboard focus if a button is hidden while focused,
 * and toggles the left-overflow modifier class so the SCSS can add a
 * left-side gradient mask when content is off-screen to the left.
 *
 * RTL: browsers report scrollLeft as 0 at the right edge (visual start) and
 * decreasing (negative) as the user scrolls left. Math.abs(scrollLeft)
 * normalises "distance from visual start" across both directions.
 *
 * Accepts pre-resolved element references so callers on the scroll/resize hot
 * path avoid repeated querySelector lookups on every event.
 *
 * @param {HTMLElement} container - The nav element
 * @param {HTMLElement} list - The scrollable list element
 * @param {HTMLButtonElement} prevBtn - The previous/start scroll button
 * @param {HTMLButtonElement} nextBtn - The next/end scroll button
 */
function updateScrollButtons(container, list, prevBtn, nextBtn) {
  const sl = list.scrollLeft;
  const maxScroll = list.scrollWidth - list.clientWidth;
  const rtl = getComputedStyle(list).direction === 'rtl';

  // distFromStart: absolute distance scrolled from the visual start edge.
  // The asymmetric thresholds (> 1 vs < maxScroll - 1) absorb sub-pixel
  // rounding that can prevent scrollLeft from reaching exactly 0 or maxScroll.
  const distFromStart = Math.abs(sl);
  const scrolledFromStart = distFromStart > 1;
  const canScrollFurther = maxScroll > 1 && distFromStart < maxScroll - 1;

  // prevBtn lives at the visual-start edge (left in LTR, right in RTL via flex).
  // It is shown whenever the user can scroll back toward that edge.
  if (!scrolledFromStart && prevBtn === document.activeElement) {
    const firstLink = list.querySelector('.mg-on-this-page-nav__link');
    if (firstLink) firstLink.focus();
  }
  prevBtn.hidden = !scrolledFromStart;

  // nextBtn lives at the visual-end edge (right in LTR, left in RTL via flex).
  // It is shown whenever more content exists in the scroll-forward direction.
  // When it hides while focused, prefer the CTA (the DOM-adjacent element after
  // nextBtn) over the last list link, so focus follows natural tab order.
  if (!canScrollFurther && nextBtn === document.activeElement) {
    const cta = container.querySelector('.mg-on-this-page-nav__cta');
    const links = list.querySelectorAll('.mg-on-this-page-nav__link');
    const lastLink = links.length ? links[links.length - 1] : null;
    const fallback = cta || lastLink;
    if (fallback) fallback.focus();
  }
  nextBtn.hidden = !canScrollFurther;

  // has-left-overflow drives the left-edge gradient in SCSS.
  // Content is physically off-screen to the left when:
  //   LTR: the user has scrolled right past the start (scrolledFromStart)
  //   RTL: more visual-end content sits to the left (canScrollFurther)
  container.classList.toggle(
    'mg-on-this-page-nav--has-left-overflow',
    rtl ? canScrollFurther : scrolledFromStart
  );
}

/**
 * Inject prev/next scroll buttons and wire scroll and resize listeners.
 * Buttons start hidden and become visible only when the list overflows in
 * the corresponding direction.
 *
 * @param {HTMLElement} container - The nav element
 * @param {AbortSignal} signal - Signal to remove listeners on destroy
 */
function setupScrollButtons(container, signal) {
  const list = container.querySelector('.mg-on-this-page-nav__list');
  if (!list) return;

  // Disconnect any pre-existing observer before creating a new one (defensive
  // guard in case setupScrollButtons is ever called twice on the same container).
  if (container._mgOnThisPageNavResizeObserver) {
    container._mgOnThisPageNavResizeObserver.disconnect();
    delete container._mgOnThisPageNavResizeObserver;
  }

  // Remove any previously injected buttons so re-init never duplicates them
  container.querySelectorAll('.mg-on-this-page-nav__scroll-btn').forEach(btn => btn.remove());

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'mg-on-this-page-nav__scroll-btn mg-on-this-page-nav__scroll-btn--prev';
  // Direction-neutral labels avoid confusion for RTL screen reader users
  // ("left"/"right" are ambiguous when the reading direction is reversed).
  // Override via data-mg-on-this-page-nav-scroll-prev-label for translated text.
  prevBtn.setAttribute(
    'aria-label',
    container.dataset.mgOnThisPageNavScrollPrevLabel || 'Previous navigation items'
  );
  prevBtn.hidden = true;
  prevBtn.innerHTML = CHEVRON_LEFT_SVG;

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'mg-on-this-page-nav__scroll-btn mg-on-this-page-nav__scroll-btn--next';
  // Override via data-mg-on-this-page-nav-scroll-next-label for translated text.
  nextBtn.setAttribute(
    'aria-label',
    container.dataset.mgOnThisPageNavScrollNextLabel || 'Next navigation items'
  );
  nextBtn.hidden = true;
  nextBtn.innerHTML = CHEVRON_RIGHT_SVG;

  list.insertAdjacentElement('beforebegin', prevBtn);
  list.insertAdjacentElement('afterend', nextBtn);

  // prevBtn scrolls toward the visual start: left in LTR (-), right in RTL (+).
  prevBtn.addEventListener('click', () => {
    const isRTL = getComputedStyle(list).direction === 'rtl';
    list.scrollBy({
      left: (isRTL ? 1 : -1) * (list.offsetWidth * 0.5),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, { signal });

  // nextBtn scrolls toward the visual end: right in LTR (+), left in RTL (-).
  nextBtn.addEventListener('click', () => {
    const isRTL = getComputedStyle(list).direction === 'rtl';
    list.scrollBy({
      left: (isRTL ? -1 : 1) * (list.offsetWidth * 0.5),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, { signal });

  list.addEventListener('scroll', () => updateScrollButtons(container, list, prevBtn, nextBtn), { signal, passive: true });

  const ro = new ResizeObserver(() => updateScrollButtons(container, list, prevBtn, nextBtn));
  ro.observe(list);
  container._mgOnThisPageNavResizeObserver = ro;

  updateScrollButtons(container, list, prevBtn, nextBtn);
}

/**
 * Ensure keyboard users can scroll overflowing nav links into view.
 * Browsers may not auto-scroll a hidden-scrollbar container on focus.
 *
 * @param {HTMLElement} container - The nav element
 * @param {AbortSignal} signal - Signal to remove listener on destroy
 */
function setupFocusScrolling(container, signal) {
  const list = container.querySelector('.mg-on-this-page-nav__list');
  if (!list) return;

  list.addEventListener('focusin', e => {
    const link = e.target.closest('.mg-on-this-page-nav__link');
    if (link) scrollLinkToCenter(link, list);
  }, { signal });
}

/**
 * Set up IntersectionObserver-based scroll-spy to highlight the active link.
 *
 * @param {HTMLElement} container - The nav element
 */
function setupScrollSpy(container) {
  const links = container.querySelectorAll('.mg-on-this-page-nav__link');
  const list = container.querySelector('.mg-on-this-page-nav__list');

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
  // Track which targets are currently intersecting (avoids DOM expando properties)
  const intersecting = new Set();

  function setActive(id) {
    if (id === activeId) return;

    if (activeId && linkMap.has(activeId)) {
      const oldLink = linkMap.get(activeId);
      oldLink.classList.remove('mg-on-this-page-nav__link--active');
      oldLink.removeAttribute('aria-current');
    }

    activeId = id;

    if (id && linkMap.has(id)) {
      const newLink = linkMap.get(id);
      newLink.classList.add('mg-on-this-page-nav__link--active');
      newLink.setAttribute('aria-current', 'true');

      // Scroll the nav list horizontally to keep active link visible.
      // ONS user research found independently-scrolling ToC lists confused users;
      // auto-scrolling to the active link avoids that. We use scrollTo on the
      // list (not scrollIntoView on the link) to avoid vertical page scrolling.
      if (list) scrollLinkToCenter(newLink, list);
    }
  }

  // rootMargin is static after construction — if the offset custom property
  // changes at a breakpoint, the observer will use the value from init time.
  // The click handler re-reads offset per click to stay responsive.
  const offset = getOffset(container);
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          intersecting.add(entry.target);
        } else {
          intersecting.delete(entry.target);
        }
      });

      // Pick the first intersecting target in DOM order
      const firstVisible = targets.find(t => intersecting.has(t));
      if (firstVisible) {
        setActive(firstVisible.id);
      }
    },
    {
      rootMargin: `-${offset + (container.offsetHeight || 0)}px 0px -66% 0px`,
      threshold: [0],
    }
  );

  targets.forEach(target => observer.observe(target));
  container._mgOnThisPageNavObserver = observer;

  const hashId = window.location.hash ? window.location.hash.slice(1) : null;
  if (hashId && linkMap.has(hashId)) {
    setActive(hashId);
  } else if (targets.length > 0) {
    setActive(targets[0].id);
  }
}

// Auto-wrap so the browser Event object is not passed as scope
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mgOnThisPageNav(), false);
} else {
  mgOnThisPageNav();
}
