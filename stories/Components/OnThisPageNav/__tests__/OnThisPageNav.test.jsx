import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { mgOnThisPageNav } from '../../../assets/js/on-this-page-nav';

// Mock IntersectionObserver for jsdom
beforeAll(() => {
  global.IntersectionObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock matchMedia for jsdom
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

    it('preserves CTA element', () => {
      const nav = setupAutoDetect({
        ctaHtml:
          '<a href="/sub" class="mg-on-this-page-nav__cta">Subscribe</a>',
      });
      const cta = nav.querySelector('.mg-on-this-page-nav__cta');
      expect(cta).not.toBeNull();
      expect(cta.textContent).toBe('Subscribe');
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

  describe('accessibility', () => {
    it('has no axe violations in auto-detect mode', async () => {
      const nav = setupAutoDetect();
      const results = await axe(document.body);
      expect(results).toHaveNoViolations();
    });

    it('has no axe violations in explicit mode', async () => {
      const nav = setupExplicit([
        { id: 'a', text: 'Link A' },
        { id: 'b', text: 'Link B' },
      ]);
      const results = await axe(document.body);
      expect(results).toHaveNoViolations();
    });
  });
});
