import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { mgOnThisPageNav, mgOnThisPageNavDestroy } from '../../../assets/js/on-this-page-nav';

// Track observer callbacks so we can fire mock entries in tests
let observerCallbacks = [];

beforeAll(() => {
  global.IntersectionObserver = class {
    constructor(cb) {
      this.cb = cb;
      observerCallbacks.push(cb);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
});

beforeEach(() => {
  observerCallbacks = [];
});

// Helper: render a page with headings and a nav container, then initialize
function setupAutoDetect({ depth, excludeClass, headings, ctaHtml } = {}) {
  document.body.innerHTML = `
    <nav
      data-mg-on-this-page-nav
      ${depth ? `data-mg-on-this-page-nav-depth="${depth}"` : ''}
      data-mg-on-this-page-nav-content=".content"
      class="mg-on-this-page-nav"
    >${ctaHtml || ''}</nav>
    <main class="content">
      ${(headings || [
        { tag: 'h2', id: 'sec-1', text: 'Section one' },
        { tag: 'h2', id: 'sec-2', text: 'Section two' },
        { tag: 'h2', id: 'sec-3', text: 'Section three' },
      ])
        .map(
          h =>
            `<${h.tag} id="${h.id}"${excludeClass && h.exclude ? ` class="${excludeClass}"` : ''}>${h.text}</${h.tag}>`
        )
        .join('\n')}
    </main>
  `;

  const nav = document.querySelector('[data-mg-on-this-page-nav]');
  mgOnThisPageNav([nav]);
  return nav;
}

// Helper: render an explicit nav and initialize
function setupExplicit(links) {
  document.body.innerHTML = `
    <nav data-mg-on-this-page-nav class="mg-on-this-page-nav">
      <ul class="mg-on-this-page-nav__list">
        ${links
          .map(
            l =>
              `<li class="mg-on-this-page-nav__item"><a href="#${l.id}" class="mg-on-this-page-nav__link">${l.text}</a></li>`
          )
          .join('\n')}
      </ul>
    </nav>
    <main>
    ${links.map(l => `<h2 id="${l.id}">${l.text}</h2>`).join('\n')}
    </main>
  `;

  const nav = document.querySelector('[data-mg-on-this-page-nav]');
  mgOnThisPageNav([nav]);
  return nav;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('OnThisPageNav', () => {
  describe('auto-detect mode', () => {
    it('generates links from h2 headings', () => {
      const nav = setupAutoDetect();
      const links = nav.querySelectorAll('.mg-on-this-page-nav__link');
      expect(links).toHaveLength(3);
      expect(links[0].textContent).toBe('Section one');
      expect(links[0].getAttribute('href')).toBe('#sec-1');
      expect(links[2].textContent).toBe('Section three');
    });

    it('includes h3 headings when depth is 3', () => {
      const nav = setupAutoDetect({
        depth: '3',
        headings: [
          { tag: 'h2', id: 'intro', text: 'Introduction' },
          { tag: 'h3', id: 'bg', text: 'Background' },
          { tag: 'h2', id: 'methods', text: 'Methods' },
        ],
      });
      const links = nav.querySelectorAll('.mg-on-this-page-nav__link');
      expect(links).toHaveLength(3);
      expect(links[1].textContent).toBe('Background');
    });

    it('skips headings with the exclude class', () => {
      const nav = setupAutoDetect({
        excludeClass: 'mg-on-this-page-nav--exclude',
        headings: [
          { tag: 'h2', id: 'a', text: 'Visible' },
          { tag: 'h2', id: 'b', text: 'Hidden', exclude: true },
          { tag: 'h2', id: 'c', text: 'Also visible' },
        ],
      });
      const links = nav.querySelectorAll('.mg-on-this-page-nav__link');
      expect(links).toHaveLength(2);
      expect(links[0].textContent).toBe('Visible');
      expect(links[1].textContent).toBe('Also visible');
    });

    it('adds --hidden class when no headings are found', () => {
      const nav = setupAutoDetect({ headings: [] });
      expect(nav.classList.contains('mg-on-this-page-nav--hidden')).toBe(true);
    });

    it('generates IDs for headings without them', () => {
      document.body.innerHTML = `
        <nav data-mg-on-this-page-nav
             data-mg-on-this-page-nav-content=".content"
             class="mg-on-this-page-nav"></nav>
        <main class="content">
          <h2>My heading</h2>
        </main>
      `;
      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      mgOnThisPageNav([nav]);

      const heading = document.querySelector('h2');
      expect(heading.id).toBe('my-heading');

      const link = nav.querySelector('.mg-on-this-page-nav__link');
      expect(link.getAttribute('href')).toBe('#my-heading');
    });

    it('generates unique IDs for duplicate heading text', () => {
      document.body.innerHTML = `
        <nav data-mg-on-this-page-nav
             data-mg-on-this-page-nav-content=".content"
             class="mg-on-this-page-nav"></nav>
        <main class="content">
          <h2>Overview</h2>
          <h2>Overview</h2>
        </main>
      `;
      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      mgOnThisPageNav([nav]);

      const headings = document.querySelectorAll('h2');
      expect(headings[0].id).toBe('overview');
      expect(headings[1].id).toBe('overview-2');
    });

    it('preserves CTA element', () => {
      const nav = setupAutoDetect({
        ctaHtml:
          '<a href="/sub" class="mg-on-this-page-nav__cta">Subscribe</a>',
      });
      const cta = nav.querySelector('.mg-on-this-page-nav__cta');
      expect(cta).not.toBeNull();
      expect(cta.textContent).toBe('Subscribe');
    });

    it('adds role="list" to the generated ul', () => {
      const nav = setupAutoDetect();
      const list = nav.querySelector('.mg-on-this-page-nav__list');
      expect(list.getAttribute('role')).toBe('list');
    });
  });

  describe('explicit mode', () => {
    it('preserves existing links without scanning headings', () => {
      const nav = setupExplicit([
        { id: 'a', text: 'Link A' },
        { id: 'b', text: 'Link B' },
      ]);
      const links = nav.querySelectorAll('.mg-on-this-page-nav__link');
      expect(links).toHaveLength(2);
      expect(links[0].textContent).toBe('Link A');
    });
  });

  describe('idempotency', () => {
    it('does not double-initialize', () => {
      const nav = setupAutoDetect();
      const linksBefore = nav.querySelectorAll('.mg-on-this-page-nav__link')
        .length;

      // Try to init again without clearing the flag
      mgOnThisPageNav([nav]);

      const linksAfter = nav.querySelectorAll('.mg-on-this-page-nav__link')
        .length;
      expect(linksAfter).toBe(linksBefore);
    });
  });

  describe('aria-label', () => {
    it('sets aria-label from data attribute', () => {
      document.body.innerHTML = `
        <nav data-mg-on-this-page-nav
             data-mg-on-this-page-nav-label="Page sections"
             class="mg-on-this-page-nav">
          <ul class="mg-on-this-page-nav__list">
            <li class="mg-on-this-page-nav__item">
              <a href="#x" class="mg-on-this-page-nav__link">X</a>
            </li>
          </ul>
        </nav>
        <main><h2 id="x">X</h2></main>
      `;
      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      mgOnThisPageNav([nav]);
      expect(nav.getAttribute('aria-label')).toBe('Page sections');
    });

    it('defaults aria-label to "On this page"', () => {
      const nav = setupAutoDetect();
      expect(nav.getAttribute('aria-label')).toBe('On this page');
    });
  });

  describe('scroll-spy active state', () => {
    it('sets aria-current="true" on the first link at init', () => {
      const nav = setupAutoDetect();
      const firstLink = nav.querySelector('.mg-on-this-page-nav__link');
      expect(firstLink.getAttribute('aria-current')).toBe('true');
      expect(
        firstLink.classList.contains('mg-on-this-page-nav__link--active')
      ).toBe(true);
    });

    it('only has one active link at a time', () => {
      const nav = setupAutoDetect();
      const activeLinks = nav.querySelectorAll('[aria-current="true"]');
      expect(activeLinks).toHaveLength(1);
    });

    it('updates active link when observer fires', () => {
      const nav = setupAutoDetect();
      const cb = observerCallbacks[observerCallbacks.length - 1];

      // Simulate sec-2 becoming visible
      const sec1 = document.getElementById('sec-1');
      const sec2 = document.getElementById('sec-2');
      cb([
        {
          target: sec1,
          isIntersecting: false,
          boundingClientRect: { top: -100 },
        },
        {
          target: sec2,
          isIntersecting: true,
          boundingClientRect: { top: 50 },
        },
      ]);

      const activeLink = nav.querySelector('[aria-current="true"]');
      expect(activeLink.getAttribute('href')).toBe('#sec-2');

      const firstLink = nav.querySelector('[href="#sec-1"]');
      expect(firstLink.hasAttribute('aria-current')).toBe(false);
    });
  });

  describe('click handling', () => {
    it('calls scrollTo and pushState on click', () => {
      const scrollToSpy = jest
        .spyOn(window, 'scrollTo')
        .mockImplementation(() => {});
      const pushStateSpy = jest
        .spyOn(window.history, 'pushState')
        .mockImplementation(() => {});

      const nav = setupExplicit([
        { id: 'a', text: 'Link A' },
        { id: 'b', text: 'Link B' },
      ]);
      const link = nav.querySelector('.mg-on-this-page-nav__link');
      link.click();

      expect(scrollToSpy).toHaveBeenCalled();
      expect(pushStateSpy).toHaveBeenCalledWith(null, null, '#a');

      scrollToSpy.mockRestore();
      pushStateSpy.mockRestore();
    });

    it('sets tabindex on the target heading', () => {
      jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

      const nav = setupExplicit([{ id: 'a', text: 'Link A' }]);
      const link = nav.querySelector('.mg-on-this-page-nav__link');
      link.click();

      const heading = document.getElementById('a');
      expect(heading.getAttribute('tabindex')).toBe('-1');

      window.scrollTo.mockRestore();
    });
  });

  describe('hidden nav', () => {
    it('does not create an observer when hidden', () => {
      const nav = setupAutoDetect({ headings: [] });
      expect(nav.classList.contains('mg-on-this-page-nav--hidden')).toBe(true);
      expect(nav._mgOnThisPageNavObserver).toBeUndefined();
    });
  });

  describe('manual init attribute', () => {
    it('skips elements with data-mg-on-this-page-nav-skip-auto-init during auto-init', () => {
      document.body.innerHTML = `
        <nav data-mg-on-this-page-nav data-mg-on-this-page-nav-skip-auto-init
             class="mg-on-this-page-nav"></nav>
      `;
      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      mgOnThisPageNav(); // no scope = auto-init
      expect(nav.dataset.mgOnThisPageNavInitialized).toBeUndefined();
    });

    it('processes elements with data-mg-on-this-page-nav-skip-auto-init when scope is passed', () => {
      document.body.innerHTML = `
        <nav data-mg-on-this-page-nav data-mg-on-this-page-nav-skip-auto-init
             data-mg-on-this-page-nav-content=".content"
             class="mg-on-this-page-nav"></nav>
        <main class="content">
          <h2 id="sec-1">Section one</h2>
        </main>
      `;
      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      // Explicit scope bypasses the skip-auto-init check
      mgOnThisPageNav([nav]);
      expect(nav.dataset.mgOnThisPageNavInitialized).toBe('true');
    });

    it('accepts a single HTMLElement as scope without throwing', () => {
      document.body.innerHTML = `
        <nav data-mg-on-this-page-nav
             data-mg-on-this-page-nav-content=".content"
             class="mg-on-this-page-nav"></nav>
        <main class="content">
          <h2 id="sec-1">Section one</h2>
        </main>
      `;
      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      // Pass a single element (not wrapped in an array)
      expect(() => mgOnThisPageNav(nav)).not.toThrow();
      expect(nav.dataset.mgOnThisPageNavInitialized).toBe('true');
    });
  });

  describe('scroll buttons', () => {
    it('injects prev and next buttons after init', () => {
      const nav = setupAutoDetect();
      expect(nav.querySelector('.mg-on-this-page-nav__scroll-btn--prev')).not.toBeNull();
      expect(nav.querySelector('.mg-on-this-page-nav__scroll-btn--next')).not.toBeNull();
    });

    it('buttons are hidden when no overflow (jsdom has no layout)', () => {
      const nav = setupAutoDetect();
      const prevBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--prev');
      const nextBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--next');
      // jsdom reports scrollWidth === clientWidth === 0, so no overflow
      expect(prevBtn.hidden).toBe(true);
      expect(nextBtn.hidden).toBe(true);
    });

    it('prev button has direction-neutral default aria-label', () => {
      const nav = setupAutoDetect();
      const prevBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--prev');
      expect(prevBtn.getAttribute('aria-label')).toBe('Previous navigation items');
    });

    it('next button has direction-neutral default aria-label', () => {
      const nav = setupAutoDetect();
      const nextBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--next');
      expect(nextBtn.getAttribute('aria-label')).toBe('Next navigation items');
    });

    it('aria-label is overridden by data attribute', () => {
      document.body.innerHTML = `
        <nav
          data-mg-on-this-page-nav
          data-mg-on-this-page-nav-content=".content"
          data-mg-on-this-page-nav-scroll-prev-label="عناصر التنقل السابقة"
          data-mg-on-this-page-nav-scroll-next-label="عناصر التنقل التالية"
          class="mg-on-this-page-nav"
        ></nav>
        <main class="content">
          <h2 id="s1">Section one</h2>
          <h2 id="s2">Section two</h2>
        </main>
      `;
      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      mgOnThisPageNav([nav]);
      expect(nav.querySelector('.mg-on-this-page-nav__scroll-btn--prev').getAttribute('aria-label')).toBe('عناصر التنقل السابقة');
      expect(nav.querySelector('.mg-on-this-page-nav__scroll-btn--next').getAttribute('aria-label')).toBe('عناصر التنقل التالية');
    });

    it('next button appears when list has right overflow', () => {
      const nav = setupAutoDetect();
      const list = nav.querySelector('.mg-on-this-page-nav__list');
      const nextBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--next');

      // Simulate overflow: make scrollWidth larger than clientWidth
      Object.defineProperty(list, 'scrollWidth', { value: 500, configurable: true });
      Object.defineProperty(list, 'clientWidth', { value: 200, configurable: true });
      Object.defineProperty(list, 'scrollLeft', { value: 0, configurable: true });

      // Trigger the update
      list.dispatchEvent(new Event('scroll'));

      expect(nextBtn.hidden).toBe(false);
    });

    it('prev button appears when list is scrolled right', () => {
      const nav = setupAutoDetect();
      const list = nav.querySelector('.mg-on-this-page-nav__list');
      const prevBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--prev');

      Object.defineProperty(list, 'scrollWidth', { value: 500, configurable: true });
      Object.defineProperty(list, 'clientWidth', { value: 200, configurable: true });
      Object.defineProperty(list, 'scrollLeft', { value: 200, configurable: true });

      list.dispatchEvent(new Event('scroll'));

      expect(prevBtn.hidden).toBe(false);
    });

    it('adds has-left-overflow class when prev button is visible', () => {
      const nav = setupAutoDetect();
      const list = nav.querySelector('.mg-on-this-page-nav__list');

      Object.defineProperty(list, 'scrollWidth', { value: 500, configurable: true });
      Object.defineProperty(list, 'clientWidth', { value: 200, configurable: true });
      Object.defineProperty(list, 'scrollLeft', { value: 200, configurable: true });

      list.dispatchEvent(new Event('scroll'));

      expect(nav.classList.contains('mg-on-this-page-nav--has-left-overflow')).toBe(true);
    });

    it('next button (LTR) calls scrollBy with positive left', () => {
      const nav = setupAutoDetect();
      const list = nav.querySelector('.mg-on-this-page-nav__list');
      list.scrollBy = jest.fn();
      // jsdom has no layout — give the list a width so scrollBy gets a non-zero left
      Object.defineProperty(list, 'offsetWidth', { value: 400, configurable: true });

      const nextBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--next');
      nextBtn.hidden = false;
      nextBtn.click();

      expect(list.scrollBy).toHaveBeenCalled();
      expect(list.scrollBy.mock.calls[0][0].left).toBeGreaterThan(0);
    });

    it('prev button (LTR) calls scrollBy with negative left', () => {
      const nav = setupAutoDetect();
      const list = nav.querySelector('.mg-on-this-page-nav__list');
      list.scrollBy = jest.fn();
      Object.defineProperty(list, 'offsetWidth', { value: 400, configurable: true });

      const prevBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--prev');
      prevBtn.hidden = false;
      prevBtn.click();

      expect(list.scrollBy).toHaveBeenCalled();
      expect(list.scrollBy.mock.calls[0][0].left).toBeLessThan(0);
    });

    describe('RTL', () => {
      let originalGetComputedStyle;

      beforeEach(() => {
        originalGetComputedStyle = window.getComputedStyle;
        // Use a Proxy so getPropertyValue and other CSSStyleDeclaration methods
        // remain functional while overriding only the `direction` property.
        window.getComputedStyle = (el, pseudo) => {
          const original = originalGetComputedStyle(el, pseudo);
          return new Proxy(original, {
            get(target, prop) {
              if (prop === 'direction') return 'rtl';
              const value = target[prop];
              return typeof value === 'function' ? value.bind(target) : value;
            },
          });
        };
      });

      afterEach(() => {
        window.getComputedStyle = originalGetComputedStyle;
      });

      it('next button (RTL) calls scrollBy with negative left', () => {
        const nav = setupAutoDetect();
        const list = nav.querySelector('.mg-on-this-page-nav__list');
        list.scrollBy = jest.fn();
        Object.defineProperty(list, 'offsetWidth', { value: 400, configurable: true });

        const nextBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--next');
        nextBtn.hidden = false;
        nextBtn.click();

        expect(list.scrollBy).toHaveBeenCalled();
        expect(list.scrollBy.mock.calls[0][0].left).toBeLessThan(0);
      });

      it('prev button (RTL) calls scrollBy with positive left', () => {
        const nav = setupAutoDetect();
        const list = nav.querySelector('.mg-on-this-page-nav__list');
        list.scrollBy = jest.fn();
        Object.defineProperty(list, 'offsetWidth', { value: 400, configurable: true });

        const prevBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--prev');
        prevBtn.hidden = false;
        prevBtn.click();

        expect(list.scrollBy).toHaveBeenCalled();
        expect(list.scrollBy.mock.calls[0][0].left).toBeGreaterThan(0);
      });

      it('nextBtn shown at RTL initial position (canScrollFurther = true)', () => {
        const nav = setupAutoDetect();
        const list = nav.querySelector('.mg-on-this-page-nav__list');
        const nextBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--next');

        // RTL initial: scrollLeft = 0 (at visual start / right edge)
        Object.defineProperty(list, 'scrollWidth', { value: 500, configurable: true });
        Object.defineProperty(list, 'clientWidth', { value: 200, configurable: true });
        Object.defineProperty(list, 'scrollLeft', { value: 0, configurable: true });

        list.dispatchEvent(new Event('scroll'));

        expect(nextBtn.hidden).toBe(false);
      });

      it('prevBtn shown in RTL after scrolling left (scrolledFromStart = true)', () => {
        const nav = setupAutoDetect();
        const list = nav.querySelector('.mg-on-this-page-nav__list');
        const prevBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--prev');

        // RTL: negative scrollLeft means scrolled away from visual start
        Object.defineProperty(list, 'scrollWidth', { value: 500, configurable: true });
        Object.defineProperty(list, 'clientWidth', { value: 200, configurable: true });
        Object.defineProperty(list, 'scrollLeft', { value: -200, configurable: true });

        list.dispatchEvent(new Event('scroll'));

        expect(prevBtn.hidden).toBe(false);
      });

      it('has-left-overflow added in RTL when canScrollFurther (not scrolledFromStart)', () => {
        const nav = setupAutoDetect();
        const list = nav.querySelector('.mg-on-this-page-nav__list');

        // RTL initial state: distFromStart = 0, canScrollFurther = true
        Object.defineProperty(list, 'scrollWidth', { value: 500, configurable: true });
        Object.defineProperty(list, 'clientWidth', { value: 200, configurable: true });
        Object.defineProperty(list, 'scrollLeft', { value: 0, configurable: true });

        list.dispatchEvent(new Event('scroll'));

        // In RTL, has-left-overflow reflects canScrollFurther (items to the left)
        expect(nav.classList.contains('mg-on-this-page-nav--has-left-overflow')).toBe(true);
      });
    });

    it('destroy removes injected scroll buttons', () => {
      const nav = setupAutoDetect();
      expect(nav.querySelectorAll('.mg-on-this-page-nav__scroll-btn')).toHaveLength(2);

      mgOnThisPageNavDestroy(nav);

      expect(nav.querySelectorAll('.mg-on-this-page-nav__scroll-btn')).toHaveLength(0);
    });

    it('does not duplicate buttons on re-init after destroy', () => {
      const nav = setupExplicit([
        { id: 'a', text: 'Link A' },
        { id: 'b', text: 'Link B' },
      ]);
      mgOnThisPageNavDestroy(nav);
      mgOnThisPageNav([nav]);

      expect(nav.querySelectorAll('.mg-on-this-page-nav__scroll-btn')).toHaveLength(2);
    });

    it('focus moves to CTA (not last link) when next button hides while focused', () => {
      const nav = setupAutoDetect({
        ctaHtml: '<a href="#download" class="mg-on-this-page-nav__cta">Download</a>',
      });
      const list = nav.querySelector('.mg-on-this-page-nav__list');
      const nextBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--next');

      // Simulate overflow so nextBtn is visible
      Object.defineProperty(list, 'scrollWidth', { value: 500, configurable: true });
      Object.defineProperty(list, 'clientWidth', { value: 200, configurable: true });
      Object.defineProperty(list, 'scrollLeft', { value: 0, configurable: true });
      list.dispatchEvent(new Event('scroll'));

      // Focus nextBtn then scroll to the end so it should hide
      nextBtn.hidden = false;
      nextBtn.focus();
      Object.defineProperty(list, 'scrollLeft', { value: 300, configurable: true });
      list.dispatchEvent(new Event('scroll'));

      const cta = nav.querySelector('.mg-on-this-page-nav__cta');
      expect(document.activeElement).toBe(cta);
    });

    it('focus moves to last link when next button hides while focused and no CTA', () => {
      const nav = setupAutoDetect();
      const list = nav.querySelector('.mg-on-this-page-nav__list');
      const nextBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--next');

      Object.defineProperty(list, 'scrollWidth', { value: 500, configurable: true });
      Object.defineProperty(list, 'clientWidth', { value: 200, configurable: true });
      Object.defineProperty(list, 'scrollLeft', { value: 0, configurable: true });
      list.dispatchEvent(new Event('scroll'));

      nextBtn.hidden = false;
      nextBtn.focus();
      Object.defineProperty(list, 'scrollLeft', { value: 300, configurable: true });
      list.dispatchEvent(new Event('scroll'));

      const links = nav.querySelectorAll('.mg-on-this-page-nav__link');
      expect(document.activeElement).toBe(links[links.length - 1]);
    });

    it('focus moves to first link when prev button hides while focused', () => {
      const nav = setupAutoDetect();
      const list = nav.querySelector('.mg-on-this-page-nav__list');
      const prevBtn = nav.querySelector('.mg-on-this-page-nav__scroll-btn--prev');

      // Simulate being scrolled so prevBtn is visible
      Object.defineProperty(list, 'scrollWidth', { value: 500, configurable: true });
      Object.defineProperty(list, 'clientWidth', { value: 200, configurable: true });
      Object.defineProperty(list, 'scrollLeft', { value: 200, configurable: true });
      list.dispatchEvent(new Event('scroll'));

      // Focus prevBtn then scroll back to the start so it should hide
      prevBtn.hidden = false;
      prevBtn.focus();
      Object.defineProperty(list, 'scrollLeft', { value: 0, configurable: true });
      list.dispatchEvent(new Event('scroll'));

      const links = nav.querySelectorAll('.mg-on-this-page-nav__link');
      expect(document.activeElement).toBe(links[0]);
    });
  });

  describe('tabs integration', () => {
    it('clicks the tab trigger when heading is inside a hidden horizontal tab panel', () => {
      jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

      document.body.innerHTML = `
        <nav data-mg-on-this-page-nav
             data-mg-on-this-page-nav-content=".content"
             class="mg-on-this-page-nav"></nav>
        <main class="content">
          <article data-mg-js-tabs>
            <ul class="mg-tabs__list">
              <li class="mg-tabs__item">
                <a class="mg-tabs__link"
                   href="#mg-tabs__section-tab1"
                   data-tabs__item="mg-tabs__section-tab1"
                   id="mg-tabs__section-tab1--trigger">Tab 1</a>
              </li>
              <li class="mg-tabs-content">
                <section class="mg-tabs__section" id="mg-tabs__section-tab1" hidden>
                  <h2 id="inside-tab">Section inside tab</h2>
                </section>
              </li>
            </ul>
          </article>
        </main>
      `;

      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      mgOnThisPageNav([nav]);

      const trigger = document.getElementById('mg-tabs__section-tab1--trigger');
      const triggerClickSpy = jest.fn();
      trigger.addEventListener('click', triggerClickSpy);

      const link = nav.querySelector('[href="#inside-tab"]');
      expect(link).not.toBeNull();
      link.click();

      expect(triggerClickSpy).toHaveBeenCalledTimes(1);

      window.scrollTo.mockRestore();
    });

    it('clicks the tab trigger when heading is inside a stacked panel (hidden="until-found")', () => {
      jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

      document.body.innerHTML = `
        <nav data-mg-on-this-page-nav
             data-mg-on-this-page-nav-content=".content"
             class="mg-on-this-page-nav"></nav>
        <main class="content">
          <article data-mg-js-tabs>
            <ul class="mg-tabs__list">
              <li class="mg-tabs__item">
                <a class="mg-tabs__link"
                   href="#mg-tabs__section-stacked1"
                   data-tabs__item="mg-tabs__section-stacked1"
                   id="mg-tabs__section-stacked1--trigger">Stacked 1</a>
              </li>
              <li class="mg-tabs-content">
                <section class="mg-tabs__section" id="mg-tabs__section-stacked1" hidden="until-found">
                  <h2 id="stacked-heading">Stacked heading</h2>
                </section>
              </li>
            </ul>
          </article>
        </main>
      `;

      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      mgOnThisPageNav([nav]);

      const trigger = document.getElementById('mg-tabs__section-stacked1--trigger');
      const triggerClickSpy = jest.fn();
      trigger.addEventListener('click', triggerClickSpy);

      const link = nav.querySelector('[href="#stacked-heading"]');
      expect(link).not.toBeNull();
      link.click();

      expect(triggerClickSpy).toHaveBeenCalledTimes(1);

      window.scrollTo.mockRestore();
    });

    it('does not click any trigger when heading is not inside a tab panel', () => {
      jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

      const nav = setupExplicit([{ id: 'regular', text: 'Regular' }]);

      // No tab triggers exist; clicking should not throw
      const link = nav.querySelector('[href="#regular"]');
      expect(() => link.click()).not.toThrow();

      window.scrollTo.mockRestore();
    });

    it('does not click the trigger when the panel is already visible', () => {
      jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

      document.body.innerHTML = `
        <nav data-mg-on-this-page-nav
             data-mg-on-this-page-nav-content=".content"
             class="mg-on-this-page-nav"></nav>
        <main class="content">
          <article data-mg-js-tabs>
            <ul class="mg-tabs__list">
              <li class="mg-tabs__item">
                <a class="mg-tabs__link"
                   href="#mg-tabs__section-open"
                   data-tabs__item="mg-tabs__section-open"
                   id="mg-tabs__section-open--trigger">Open tab</a>
              </li>
              <li class="mg-tabs-content">
                <!-- Panel is NOT hidden — already visible -->
                <section class="mg-tabs__section" id="mg-tabs__section-open">
                  <h2 id="visible-heading">Visible heading</h2>
                </section>
              </li>
            </ul>
          </article>
        </main>
      `;

      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      mgOnThisPageNav([nav]);

      const trigger = document.getElementById('mg-tabs__section-open--trigger');
      const triggerClickSpy = jest.fn();
      trigger.addEventListener('click', triggerClickSpy);

      const link = nav.querySelector('[href="#visible-heading"]');
      link.click();

      expect(triggerClickSpy).not.toHaveBeenCalled();

      window.scrollTo.mockRestore();
    });

    it('opens outer panel before inner panel for nested tabs', () => {
      jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

      document.body.innerHTML = `
        <nav data-mg-on-this-page-nav
             data-mg-on-this-page-nav-content=".content"
             class="mg-on-this-page-nav"></nav>
        <main class="content">
          <!-- outer tabs -->
          <article data-mg-js-tabs id="outer-tabs">
            <ul class="mg-tabs__list">
              <li class="mg-tabs__item">
                <a class="mg-tabs__link"
                   href="#mg-tabs__section-outer"
                   data-tabs__item="mg-tabs__section-outer"
                   id="mg-tabs__section-outer--trigger">Outer tab</a>
              </li>
              <li class="mg-tabs-content">
                <section class="mg-tabs__section" id="mg-tabs__section-outer" hidden>
                  <!-- inner tabs nested inside the outer panel -->
                  <article data-mg-js-tabs id="inner-tabs">
                    <ul class="mg-tabs__list">
                      <li class="mg-tabs__item">
                        <a class="mg-tabs__link"
                           href="#mg-tabs__section-inner"
                           data-tabs__item="mg-tabs__section-inner"
                           id="mg-tabs__section-inner--trigger">Inner tab</a>
                      </li>
                      <li class="mg-tabs-content">
                        <section class="mg-tabs__section" id="mg-tabs__section-inner" hidden>
                          <h2 id="deep-heading">Deep heading</h2>
                        </section>
                      </li>
                    </ul>
                  </article>
                </section>
              </li>
            </ul>
          </article>
        </main>
      `;

      const nav = document.querySelector('[data-mg-on-this-page-nav]');
      mgOnThisPageNav([nav]);

      const callOrder = [];
      document.getElementById('mg-tabs__section-outer--trigger')
        .addEventListener('click', () => callOrder.push('outer'));
      document.getElementById('mg-tabs__section-inner--trigger')
        .addEventListener('click', () => callOrder.push('inner'));

      const link = nav.querySelector('[href="#deep-heading"]');
      expect(link).not.toBeNull();
      link.click();

      expect(callOrder).toEqual(['outer', 'inner']);

      window.scrollTo.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in auto-detect mode', async () => {
      setupAutoDetect();
      const results = await axe(document.body);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations in explicit mode', async () => {
      setupExplicit([
        { id: 'a', text: 'Link A' },
        { id: 'b', text: 'Link B' },
      ]);
      const results = await axe(document.body);
      expect(results).toHaveNoViolations();
    });
  });
});
