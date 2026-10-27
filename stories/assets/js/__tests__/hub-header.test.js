import { mgHubHeader, hubHeaderPath } from '../hub-header';

const DEFAULT_SECTIONS = [
  '/monitor',
  '/monitor/about',
  '/monitor/reporting',
  '/monitor/data',
];

function render({
  detect = true,
  current = '',
  sections = DEFAULT_SECTIONS,
  home = '/monitor',
} = {}) {
  const items = sections
    .map(
      href =>
        `<li><a href="${href}"${
          current === href ? ' aria-current="page"' : ''
        }>${href}</a></li>`
    )
    .join('');
  document.body.innerHTML = `
    <div class="mg-hub-header" data-mg-js-hub-header ${
      detect ? 'data-mg-hub-header-detect-current' : ''
    }>
      <div class="mg-hub-header__bar">
        <div class="mg-hub-header__identity">
          <a class="mg-hub-header__name" href="${home}">Monitor</a>
          <nav class="mg-hub-header__nav" aria-label="Monitor sections">
            <ul>${items}</ul>
          </nav>
        </div>
      </div>
    </div>`;
  return document.querySelector('.mg-hub-header');
}

const at = path => window.history.pushState({}, '', path);
const link = href =>
  document.querySelector(`.mg-hub-header__nav a[href="${href}"]`);
const hubName = () => document.querySelector('.mg-hub-header__name');

let cleanup = () => {};

afterEach(() => {
  cleanup();
  cleanup = () => {};
  document.body.innerHTML = '';
  at('/');
});

describe('hubHeaderPath', () => {
  it.each([
    ['/monitor/', '/monitor'],
    ['/monitor?x=1#top', '/monitor'],
    ['http://localhost/monitor', '/monitor'],
    ['/monitor/index.html', '/monitor'],
    ['/fr/monitor/', '/fr/monitor'],
    ['/', '/'],
  ])('reduces %s to %s', (href, expected) => {
    expect(hubHeaderPath(href)).toBe(expected);
  });

  it('returns null for another origin', () => {
    expect(hubHeaderPath('https://example.org/monitor')).toBeNull();
  });
});

describe('mgHubHeader current detection', () => {
  it('marks the exact match as the current page', () => {
    at('/monitor/reporting/');
    cleanup = mgHubHeader(render());
    expect(link('/monitor/reporting').getAttribute('aria-current')).toBe(
      'page'
    );
    expect(link('/monitor/reporting').hasAttribute('data-hub-current')).toBe(
      true
    );
  });

  it('marks the longest containing section as ancestor, unannounced', () => {
    at('/monitor/reporting/how-to');
    cleanup = mgHubHeader(render());
    const reporting = link('/monitor/reporting');
    expect(reporting.hasAttribute('aria-current')).toBe(false);
    expect(reporting.hasAttribute('data-hub-current')).toBe(true);
    expect(
      reporting.parentElement.classList.contains(
        'mg-hub-header__nav-item--ancestor'
      )
    ).toBe(true);
  });

  it('never makes a section that is the hub home an ancestor', () => {
    at('/monitor/about/team');
    cleanup = mgHubHeader(render());
    expect(link('/monitor').hasAttribute('data-hub-current')).toBe(false);
    expect(link('/monitor/about').hasAttribute('data-hub-current')).toBe(true);
  });

  it('never makes a root link an ancestor', () => {
    at('/monitor/data');
    cleanup = mgHubHeader(render({ sections: ['/', '/elsewhere'] }));
    expect(document.querySelector('[data-hub-current]')).toBeNull();
  });

  it('matches whole path segments only', () => {
    at('/monitor/database');
    cleanup = mgHubHeader(render());
    expect(document.querySelector('[data-hub-current]')).toBeNull();
  });

  it('ignores links that do not point at a page', () => {
    at('/monitor/reporting/how-to');
    cleanup = mgHubHeader(
      render({
        home: '',
        sections: ['#top', '?q=1', '/monitor/reporting'],
      })
    );
    expect(hubName().hasAttribute('aria-current')).toBe(false);
    expect(link('#top').hasAttribute('data-hub-current')).toBe(false);
    expect(link('?q=1').hasAttribute('data-hub-current')).toBe(false);
    expect(link('/monitor/reporting').hasAttribute('data-hub-current')).toBe(
      true
    );
  });

  it('marks the hub name on the hub home when no section matches', () => {
    at('/monitor');
    cleanup = mgHubHeader(render({ sections: ['/monitor/about'] }));
    expect(hubName().getAttribute('aria-current')).toBe('page');
  });

  it('prefers an exact section match over the hub name', () => {
    at('/monitor');
    cleanup = mgHubHeader(render());
    expect(link('/monitor').getAttribute('aria-current')).toBe('page');
    expect(hubName().hasAttribute('aria-current')).toBe(false);
  });

  it('leaves markup that already carries state alone', () => {
    at('/monitor/data');
    cleanup = mgHubHeader(render({ current: '/monitor/about' }));
    expect(link('/monitor/data').hasAttribute('aria-current')).toBe(false);
    expect(link('/monitor/about').getAttribute('aria-current')).toBe('page');
  });

  it('does not detect without the opt-in attribute', () => {
    at('/monitor/data');
    cleanup = mgHubHeader(render({ detect: false }));
    expect(document.querySelector('[aria-current]')).toBeNull();
  });
});

describe('mgHubHeader lifecycle', () => {
  it('initializes every header in the document when called without scope', () => {
    const root = render();
    cleanup = mgHubHeader();
    expect(root.dataset.mgJsHubHeaderInitialized).toBe('true');
  });

  it('skips initialized headers, and its cleanup allows another run', () => {
    const root = render();
    const first = mgHubHeader(root);
    expect(root.dataset.mgJsHubHeaderInitialized).toBe('true');
    const second = mgHubHeader(root);
    second();
    expect(root.dataset.mgJsHubHeaderInitialized).toBe('true');
    first();
    expect(root.dataset.mgJsHubHeaderInitialized).toBeUndefined();
    cleanup = mgHubHeader(root);
    expect(root.dataset.mgJsHubHeaderInitialized).toBe('true');
  });

  it('leaves skip-auto-init headers to an explicit call', () => {
    const root = render();
    root.setAttribute('data-mg-hub-header-skip-auto-init', '');
    cleanup = mgHubHeader();
    expect(root.dataset.mgJsHubHeaderInitialized).toBeUndefined();
    cleanup = mgHubHeader(root);
    expect(root.dataset.mgJsHubHeaderInitialized).toBe('true');
  });

  it('ignores elements without the marker', () => {
    const root = render();
    root.removeAttribute('data-mg-js-hub-header');
    cleanup = mgHubHeader(root);
    expect(root.dataset.mgJsHubHeaderInitialized).toBeUndefined();
  });

  it('marks overflow at the end of a rail that is scrolled to the start', () => {
    const root = render();
    const rail = root.querySelector('ul');
    Object.defineProperties(rail, {
      scrollWidth: { value: 600, configurable: true },
      clientWidth: { value: 200, configurable: true },
    });
    cleanup = mgHubHeader(root);
    const nav = root.querySelector('nav');
    expect(nav.hasAttribute('data-overflow-end')).toBe(true);
    expect(nav.hasAttribute('data-overflow-start')).toBe(false);
  });

  it('watches the marked link, whose label can widen when fonts load', () => {
    const originalObserver = global.ResizeObserver;
    const observed = [];
    global.ResizeObserver = class {
      observe(element) {
        observed.push(element);
      }

      disconnect() {}
    };
    try {
      at('/monitor/data');
      cleanup = mgHubHeader(render());
      expect(observed).toContain(link('/monitor/data'));
    } finally {
      global.ResizeObserver = originalObserver;
    }
  });

  it('checks again once web fonts have loaded', async () => {
    let fontsLoaded;
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        ready: new Promise(resolve => {
          fontsLoaded = resolve;
        }),
      },
    });
    try {
      const root = render();
      const rail = root.querySelector('ul');
      cleanup = mgHubHeader(root);
      const nav = root.querySelector('nav');
      expect(nav.hasAttribute('data-overflow-end')).toBe(false);
      Object.defineProperties(rail, {
        scrollWidth: { value: 600, configurable: true },
        clientWidth: { value: 200, configurable: true },
      });
      fontsLoaded();
      await document.fonts.ready;
      expect(nav.hasAttribute('data-overflow-end')).toBe(true);
    } finally {
      delete document.fonts;
    }
  });

  it('removes the marks it added on cleanup, so a new URL can be marked', () => {
    at('/monitor/reporting/how-to');
    const root = render();
    mgHubHeader(root)();
    expect(root.querySelector('[data-hub-current], [aria-current]')).toBeNull();
    expect(root.querySelector('.mg-hub-header__nav-item--ancestor')).toBeNull();
    at('/monitor/data');
    cleanup = mgHubHeader(root);
    expect(link('/monitor/data').getAttribute('aria-current')).toBe('page');
  });

  it('keeps marks it did not add on cleanup', () => {
    at('/monitor/data');
    const root = render({ current: '/monitor/about' });
    mgHubHeader(root)();
    expect(link('/monitor/about').getAttribute('aria-current')).toBe('page');
  });

  it('leaves the reader where they scrolled when the window resizes', () => {
    at('/monitor/data');
    const root = render();
    const rail = root.querySelector('ul');
    rail.scrollBy = jest.fn();
    const bounds = jest
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function mockGetBoundingClientRect() {
        return this.hasAttribute('data-hub-current')
          ? { left: 350, right: 440 }
          : { left: 0, right: 320 };
      });
    try {
      cleanup = mgHubHeader(root);
      expect(rail.scrollBy).toHaveBeenCalledTimes(1);
      Object.defineProperties(rail, {
        scrollWidth: { value: 600, configurable: true },
        clientWidth: { value: 200, configurable: true },
      });
      // iOS Safari fires resize when its toolbar collapses mid-scroll.
      window.dispatchEvent(new Event('resize'));
      expect(rail.scrollBy).toHaveBeenCalledTimes(1);
      expect(root.querySelector('nav').hasAttribute('data-overflow-end')).toBe(
        true
      );
    } finally {
      bounds.mockRestore();
    }
  });

  it('removes the overflow markers on cleanup', () => {
    const root = render();
    const rail = root.querySelector('ul');
    Object.defineProperties(rail, {
      scrollWidth: { value: 600, configurable: true },
      clientWidth: { value: 200, configurable: true },
    });
    mgHubHeader(root)();
    expect(root.querySelector('nav').hasAttribute('data-overflow-end')).toBe(
      false
    );
  });
});
