import { mgShowMore, mgShowMoreSetOpen } from '../show-more';

afterEach(() => {
  document.body.innerHTML = '';
});

function setupButton({ manual = false, targetSelector = null } = {}) {
  document.body.innerHTML = `
    <button
      data-mg-show-more
      ${manual ? 'data-mg-show-more-skip-auto-init' : ''}
      ${targetSelector ? `data-mg-show-more-target="${targetSelector}"` : ''}
    >Show more</button>
    <div class="mg-show-more--container mg-show-more--collapsed"></div>
  `;
  return document.querySelector('[data-mg-show-more]');
}

describe('mgShowMore', () => {
  describe('data-mg-show-more-skip-auto-init', () => {
    it('skips elements with the attribute during auto-init (no scope)', () => {
      const btn = setupButton({ manual: true });
      mgShowMore(); // no scope = auto-init path
      expect(btn.dataset.mgShowMoreInitialized).toBeUndefined();
    });

    it('processes elements with the attribute when scope is passed explicitly', () => {
      const btn = setupButton({ manual: true });
      mgShowMore([btn]);
      expect(btn.dataset.mgShowMoreInitialized).toBe('true');
    });
  });

  describe('idempotency', () => {
    it('cleanup only removes handlers owned by its call and can be repeated', () => {
      const btn = setupButton();
      const target = document.querySelector('.mg-show-more--container');
      const cleanup = mgShowMore(btn);
      const cleanupNoop = mgShowMore(btn);
      cleanupNoop();
      btn.click();
      expect(target).toHaveClass('mg-show-more--collapsed');
      cleanup();
      cleanup();
      expect(btn).not.toHaveAttribute('data-mg-show-more-initialized');
      expect(btn).not.toHaveAttribute('aria-controls');
      btn.click();
      expect(target).toHaveClass('mg-show-more--collapsed');
      mgShowMore(btn);
      expect(target).not.toHaveClass('mg-show-more--collapsed');
    });

    it('does not double-initialize when called twice', () => {
      const btn = setupButton();
      mgShowMore();
      // After first call, flag is set and button has been clicked once (collapsed → expanded)
      const target = document.querySelector('.mg-show-more--container');
      const classAfterFirst = target.classList.contains(
        'mg-show-more--collapsed'
      );

      mgShowMore();
      // Second call should be a no-op — collapsed state must not change
      expect(target.classList.contains('mg-show-more--collapsed')).toBe(
        classAfterFirst
      );
      expect(btn.dataset.mgShowMoreInitialized).toBe('true');
    });
  });

  describe('missing target guard', () => {
    it('can retry when the target arrives later', () => {
      document.body.innerHTML = '<button data-mg-show-more>Show more</button>';
      const button = document.querySelector('button');
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mgShowMore(button);
      expect(button).not.toHaveAttribute('data-mg-show-more-initialized');
      const target = document.createElement('div');
      target.className = 'mg-show-more--container';
      document.body.append(target);
      mgShowMore(button);
      expect(target).toHaveClass('mg-show-more--collapsed');
      expect(button.getAttribute('aria-controls')).toBe(target.id);
      warn.mockRestore();
    });

    it('does not throw and warns when target element is missing', () => {
      document.body.innerHTML = `
        <button data-mg-show-more data-mg-show-more-target=".nonexistent">Show more</button>
      `;
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      expect(() => mgShowMore()).not.toThrow();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('.nonexistent')
      );
      warn.mockRestore();
    });
  });

  describe('control semantics', () => {
    it('points aria-controls at the target and assigns it an id when needed', () => {
      const btn = setupButton();
      mgShowMore();

      const target = document.querySelector('.mg-show-more--container');
      expect(target.id).toMatch(/^mg-show-more-target-\d+$/);
      expect(btn.getAttribute('aria-controls')).toBe(target.id);
    });

    it('keeps an id the consumer already set', () => {
      document.body.innerHTML = `
        <button data-mg-show-more data-mg-show-more-target="#my-content">Show more</button>
        <div id="my-content" class="mg-show-more--collapsed"></div>
      `;
      const btn = document.querySelector('[data-mg-show-more]');
      mgShowMore();

      expect(btn.getAttribute('aria-controls')).toBe('my-content');
    });

    // The collapse is `max-height` + `overflow: hidden` + a mask. All three
    // clip paint only: the content stays in the accessibility tree and in the
    // tab order. `aria-expanded="false"` over that is a false claim, so the
    // toggle must not carry it in either state.
    it('never claims a disclosure state the CSS does not deliver', () => {
      const btn = setupButton();
      const target = document.querySelector('.mg-show-more--container');
      mgShowMore();

      // Init clicks once, so the content starts expanded.
      expect(target.classList.contains('mg-show-more--collapsed')).toBe(false);
      expect(btn.hasAttribute('aria-expanded')).toBe(false);

      btn.click();
      expect(target.classList.contains('mg-show-more--collapsed')).toBe(true);
      expect(btn.hasAttribute('aria-expanded')).toBe(false);
    });

    it('does not add role="button" to a real button', () => {
      const btn = setupButton();
      mgShowMore();
      expect(btn.hasAttribute('role')).toBe(false);
    });

    it('gives a legacy anchor toggle button semantics', () => {
      document.body.innerHTML = `
        <a href="#" data-mg-show-more>Show more</a>
        <div class="mg-show-more--container mg-show-more--collapsed"></div>
      `;
      const link = document.querySelector('[data-mg-show-more]');
      mgShowMore();

      expect(link.getAttribute('role')).toBe('button');
      expect(link.hasAttribute('aria-controls')).toBe(true);
    });

    // role="button" promises Space activates the control. An anchor does not
    // honour that on its own, so the script has to supply the handler.
    it('activates a legacy anchor toggle with Space, without scrolling', () => {
      document.body.innerHTML = `
        <a href="#" data-mg-show-more>Show more</a>
        <div class="mg-show-more--container mg-show-more--collapsed"></div>
      `;
      const link = document.querySelector('[data-mg-show-more]');
      const target = document.querySelector('.mg-show-more--container');
      mgShowMore();

      // Init clicks once, so the content starts expanded.
      expect(target.classList.contains('mg-show-more--collapsed')).toBe(false);

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      link.dispatchEvent(event);

      expect(target.classList.contains('mg-show-more--collapsed')).toBe(true);
      expect(event.defaultPrevented).toBe(true);
    });

    it('suppresses the dead href="#" jump on a legacy anchor toggle', () => {
      document.body.innerHTML = `
        <a href="#" data-mg-show-more>Show more</a>
        <div class="mg-show-more--container mg-show-more--collapsed"></div>
      `;
      const link = document.querySelector('[data-mg-show-more]');
      mgShowMore();

      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      link.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('focus inside a clipped container', () => {
    // `overflow: hidden` clips paint but leaves the content tabbable, so focus
    // can land on a control the user cannot see in a box that cannot scroll to
    // reveal it (WCAG 2.4.7, 2.4.11). Expanding on entry keeps it visible.
    it('expands when keyboard focus enters a collapsed target', () => {
      document.body.innerHTML = `
        <button data-mg-show-more data-mg-show-more-target="#content">Show more</button>
        <div id="content"><a href="https://example.org" id="clipped">Clipped link</a></div>
      `;
      const target = document.querySelector('#content');
      mgShowMore();

      // Init clicks once, so the content starts collapsed.
      expect(target.classList.contains('mg-show-more--collapsed')).toBe(true);

      document.querySelector('#clipped').focus();

      expect(target.classList.contains('mg-show-more--collapsed')).toBe(false);
    });

    it('does not re-expand a target the user has just collapsed', () => {
      document.body.innerHTML = `
        <button data-mg-show-more data-mg-show-more-target="#content">Show more</button>
        <div id="content"><a href="https://example.org" id="clipped">Clipped link</a></div>
      `;
      const btn = document.querySelector('[data-mg-show-more]');
      const target = document.querySelector('#content');
      mgShowMore();

      btn.click(); // expand
      expect(target.classList.contains('mg-show-more--collapsed')).toBe(false);

      document.querySelector('#clipped').focus();
      expect(target.classList.contains('mg-show-more--collapsed')).toBe(false);
    });
  });

  describe('generated target ids', () => {
    // Two loaded copies of this module must not mint the same id, so the
    // counter lives on globalThis rather than in module scope (#1178).
    it('keeps the counter on a shared globalThis symbol', () => {
      setupButton();
      mgShowMore();

      const key = Symbol.for('undrr.mangrove.showMore.targetCounter');
      expect(Number.isSafeInteger(globalThis[key])).toBe(true);
      expect(globalThis[key]).toBeGreaterThan(0);
    });

    it('skips an id already present in the document', () => {
      const key = Symbol.for('undrr.mangrove.showMore.targetCounter');
      // Occupy exactly the id the counter is about to hand out, so a mint
      // that ignored the document would collide.
      const taken = `mg-show-more-target-${globalThis[key] ?? 0}`;
      document.body.innerHTML = `
        <div id="${taken}">An element that got there first</div>
        <button data-mg-show-more data-mg-show-more-target=".target">Show more</button>
        <div class="target"></div>
      `;
      const btn = document.querySelector('[data-mg-show-more]');
      mgShowMore();

      const target = document.querySelector('.target');
      expect(target.id).not.toBe(taken);
      expect(target.id).toMatch(/^mg-show-more-target-\d+$/);
      expect(document.querySelectorAll(`#${target.id}`)).toHaveLength(1);
      expect(btn.getAttribute('aria-controls')).toBe(target.id);
    });
  });

  // The revealed content need not be a sibling or descendant of its toggle,
  // so the lookup cannot be confined to a container. It can be ordered:
  // nearest ancestor that contains a match wins, falling back to the document.
  // See #1228.
  describe('two instances on one page', () => {
    it('gives each default-target toggle its own container', () => {
      document.body.innerHTML = `
        <section id="one">
          <div class="mg-show-more--container"><p>First block</p></div>
          <button data-mg-show-more>Show more</button>
        </section>
        <section id="two">
          <div class="mg-show-more--container"><p>Second block</p></div>
          <button data-mg-show-more>Show more</button>
        </section>
      `;
      const [first, second] = document.querySelectorAll('[data-mg-show-more]');
      const [firstTarget, secondTarget] = document.querySelectorAll(
        '.mg-show-more--container'
      );
      mgShowMore();

      expect(first.getAttribute('aria-controls')).toBe(firstTarget.id);
      expect(second.getAttribute('aria-controls')).toBe(secondTarget.id);
      expect(firstTarget.id).not.toBe(secondTarget.id);

      // Init clicks each toggle once, so both start collapsed.
      expect(firstTarget.classList.contains('mg-show-more--collapsed')).toBe(
        true
      );
      expect(secondTarget.classList.contains('mg-show-more--collapsed')).toBe(
        true
      );

      second.click();

      expect(secondTarget.classList.contains('mg-show-more--collapsed')).toBe(
        false
      );
      expect(firstTarget.classList.contains('mg-show-more--collapsed')).toBe(
        true
      );
    });

    it('still resolves a target that is not a sibling of the toggle', () => {
      document.body.innerHTML = `
        <div class="detached-content"><p>Content</p></div>
        <section id="elsewhere">
          <button data-mg-show-more data-mg-show-more-target=".detached-content">Show more</button>
        </section>
      `;
      const btn = document.querySelector('[data-mg-show-more]');
      const target = document.querySelector('.detached-content');
      mgShowMore();

      expect(btn.getAttribute('aria-controls')).toBe(target.id);

      btn.click();
      expect(target.classList.contains('mg-show-more--collapsed')).toBe(false);
    });

    // A toggle with no parent has no ancestors to walk, so the lookup has to
    // fall through to the document exactly as it did before.
    it('falls back to the document for a toggle outside it', () => {
      document.body.innerHTML = `<div class="detached-content"><p>Content</p></div>`;
      const btn = document.createElement('button');
      btn.setAttribute('data-mg-show-more', '');
      btn.dataset.mgShowMoreTarget = '.detached-content';
      expect(btn.parentElement).toBeNull();

      mgShowMore(btn);

      const target = document.querySelector('.detached-content');
      expect(btn.getAttribute('aria-controls')).toBe(target.id);
    });
  });

  describe('single-element scope', () => {
    it('accepts a single HTMLElement without throwing', () => {
      const btn = setupButton();
      expect(() => mgShowMore(btn)).not.toThrow();
      expect(btn.dataset.mgShowMoreInitialized).toBe('true');
    });

    it('does not apply skip-auto-init check when a single element is passed as scope', () => {
      const btn = setupButton({ manual: true });
      mgShowMore(btn); // single element, not an array
      expect(btn.dataset.mgShowMoreInitialized).toBe('true');
    });
  });

  describe('data-mg-show-more-min-hidden-lines', () => {
    // jsdom has no layout, so give the target what a browser would compute:
    // a 20px line, a collapsed max-height of 6 lines (120px), and content
    // `full` px tall.
    function setup({ full, lines = '4', attrs = '' }) {
      document.body.innerHTML = `
        <section>
          <h2 id="heading">About</h2>
          <div id="body"><p>Content</p></div>
          <button type="button" data-mg-show-more data-mg-show-more-target="#body"
            data-mg-show-more-min-hidden-lines="${lines}" ${attrs}>Show more</button>
        </section>
      `;
      const target = document.getElementById('body');
      const height = { full };
      Object.defineProperty(target, 'scrollHeight', {
        configurable: true,
        get: () => height.full,
      });
      return { target, button: document.querySelector('button'), height };
    }

    let observers;
    let frames;
    let styleSpy;
    beforeEach(() => {
      observers = [];
      frames = [];
      global.ResizeObserver = class {
        constructor(callback) {
          this.callback = callback;
          this.disconnected = false;
          observers.push(this);
        }
        observe() {}
        disconnect() {
          this.disconnected = true;
        }
      };
      global.requestAnimationFrame = callback => frames.push(callback);
      global.cancelAnimationFrame = () => {};
      const real = window.getComputedStyle;
      styleSpy = jest
        .spyOn(window, 'getComputedStyle')
        .mockImplementation(element => {
          const style = real(element);
          if (element.id !== 'body') return style;
          return {
            ...style,
            lineHeight: '20px',
            fontSize: '16px',
            maxHeight: element.classList.contains('mg-show-more--collapsed')
              ? '120px'
              : 'none',
          };
        });
    });
    afterEach(() => {
      styleSpy.mockRestore();
      delete global.ResizeObserver;
    });
    const resize = () => {
      observers[0].callback();
      frames.splice(0).forEach(callback => callback());
    };

    it('leaves content open when fewer lines would be hidden', () => {
      // 120px collapsed + 3 lines = 180px: hiding three lines is not worth it.
      const { target, button } = setup({ full: 180 });
      mgShowMore(button);
      expect(target).not.toHaveClass('mg-show-more--collapsed');
      expect(button.hidden).toBe(true);
    });

    it('collapses when at least that many lines would be hidden', () => {
      const { target, button } = setup({ full: 200 });
      mgShowMore(button);
      expect(target).toHaveClass('mg-show-more--collapsed');
      expect(button.hidden).toBe(false);
      expect(button).toHaveTextContent('Show more');
    });

    it('does not depend on the current state, so it cannot flip on resize', () => {
      const { target, button } = setup({ full: 150 });
      mgShowMore(button);
      for (let i = 0; i < 3; i++) resize();
      expect(target).not.toHaveClass('mg-show-more--collapsed');
      expect(button.hidden).toBe(true);
    });

    it('collapses when content grows past the rule, and opens when it shrinks', () => {
      const { target, button, height } = setup({ full: 150 });
      mgShowMore(button);
      height.full = 400;
      resize();
      expect(target).toHaveClass('mg-show-more--collapsed');
      expect(button.hidden).toBe(false);
      height.full = 130;
      resize();
      expect(target).not.toHaveClass('mg-show-more--collapsed');
      expect(button.hidden).toBe(true);
    });

    it('applies resize decisions in an animation frame', () => {
      const { target, button, height } = setup({ full: 150 });
      mgShowMore(button);
      height.full = 400;
      observers[0].callback();
      expect(target).not.toHaveClass('mg-show-more--collapsed');
      frames.splice(0).forEach(callback => callback());
      expect(target).toHaveClass('mg-show-more--collapsed');
    });

    it('never clicks the toggle to change state', () => {
      const { button, height } = setup({ full: 400 });
      const clicks = jest.fn();
      button.addEventListener('click', clicks);
      mgShowMore(button);
      height.full = 100;
      resize();
      height.full = 400;
      resize();
      expect(clicks).not.toHaveBeenCalled();
    });

    it('stops measuring once the reader uses the toggle', () => {
      const { target, button, height } = setup({ full: 600 });
      mgShowMore(button);
      button.click();
      expect(target).not.toHaveClass('mg-show-more--collapsed');
      height.full = 100;
      resize();
      expect(button.hidden).toBe(false);
      expect(button).toHaveTextContent('Show less');
    });

    it('waits for layout before deciding', () => {
      const { target, button } = setup({ full: 0 });
      mgShowMore(button);
      expect(target).toHaveClass('mg-show-more--collapsed');
      expect(button.hidden).toBe(false);
    });

    it('shows a toggle the template shipped hidden when it collapses', () => {
      const { button } = setup({ full: 400, attrs: 'hidden' });
      mgShowMore(button);
      expect(button.hidden).toBe(false);
    });

    it('cleanup disconnects the observer and restores the toggle', () => {
      const { button } = setup({ full: 150, attrs: 'hidden' });
      const cleanup = mgShowMore(button);
      cleanup();
      expect(observers[0].disconnected).toBe(true);
      expect(button.hidden).toBe(true);
    });

    it('leaves toggles without the attribute alone', () => {
      document.body.innerHTML = `
        <div id="body"><p>Content</p></div>
        <button type="button" data-mg-show-more data-mg-show-more-target="#body">Show more</button>
      `;
      const button = document.querySelector('button');
      mgShowMore(button);
      expect(document.getElementById('body')).toHaveClass(
        'mg-show-more--collapsed'
      );
      expect(button.hidden).toBe(false);
      expect(observers).toHaveLength(0);
    });
  });

  describe('analytics label', () => {
    it('reports the action in data-vf-analytics-label, which the tracker reads', () => {
      // setupButton ships the content collapsed, so init opens it.
      const button = setupButton();
      mgShowMore(button);
      expect(button).toHaveAttribute('data-vf-analytics-label', 'Show less');
      button.click();
      expect(button).toHaveAttribute('data-vf-analytics-label', 'Show more');
      expect(button).not.toHaveAttribute('data-data-vf-google-analytics-label');
    });

    it('uses per-state labels when given', () => {
      document.body.innerHTML = `
        <div id="body"></div>
        <button data-mg-show-more data-mg-show-more-target="#body"
          data-mg-show-more-analytics-collapsed="Collection: show more"
          data-mg-show-more-analytics-open="Collection: show less">Show more</button>`;
      const button = document.querySelector('button');
      const cleanup = mgShowMore(button);
      expect(button).toHaveAttribute(
        'data-vf-analytics-label',
        'Collection: show more'
      );
      button.click();
      expect(button).toHaveAttribute(
        'data-vf-analytics-label',
        'Collection: show less'
      );
      cleanup();
      expect(button).not.toHaveAttribute('data-vf-analytics-label');
    });

    it('keeps a fixed label the author set', () => {
      document.body.innerHTML = `
        <div id="body"></div>
        <button data-mg-show-more data-mg-show-more-target="#body"
          data-vf-analytics-label="Report: summary toggle">Show more</button>`;
      const button = document.querySelector('button');
      mgShowMore(button);
      button.click();
      expect(button).toHaveAttribute(
        'data-vf-analytics-label',
        'Report: summary toggle'
      );
    });
  });

  describe('label with hidden context', () => {
    it('updates only the [data-mg-show-more-label] text', () => {
      document.body.innerHTML = `
        <div id="body"></div>
        <button data-mg-show-more data-mg-show-more-target="#body">
          <span data-mg-show-more-label>Show more</span><span class="mg-u-sr-only"> about this collection</span>
        </button>`;
      const button = document.querySelector('button');
      mgShowMore(button);
      button.click();
      expect(button).toHaveTextContent('Show less about this collection');
      expect(button.querySelector('.mg-u-sr-only')).toBeInTheDocument();
    });
  });

  describe('Show less', () => {
    it('brings the heading back into view when the toggle has left it', () => {
      document.body.innerHTML = `
        <h2 id="heading">About</h2>
        <div id="body"></div>
        <button data-mg-show-more data-mg-show-more-target="#body">Show more</button>`;
      const heading = document.getElementById('heading');
      heading.scrollIntoView = jest.fn();
      const button = document.querySelector('button');
      mgShowMore(button);
      button.click(); // open
      button.getBoundingClientRect = () => ({ top: -300, bottom: -260 });
      button.click(); // collapse; the toggle is above the viewport
      expect(heading.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ block: 'start' })
      );
    });

    it('does not scroll when the toggle is still in view', () => {
      document.body.innerHTML = `
        <h2 id="heading">About</h2>
        <div id="body"></div>
        <button data-mg-show-more data-mg-show-more-target="#body">Show more</button>`;
      const heading = document.getElementById('heading');
      heading.scrollIntoView = jest.fn();
      const button = document.querySelector('button');
      mgShowMore(button);
      button.click();
      button.getBoundingClientRect = () => ({ top: 200, bottom: 240 });
      button.click();
      expect(heading.scrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe('items mode (true disclosure)', () => {
    const setupItems = ({ extra = '' } = {}) => {
      document.body.innerHTML = `
        <h2>Files</h2>
        <ul id="files">
          <li><a href="/1">One</a></li>
          <li><a href="/2">Two</a></li>
          <li data-mg-show-more-item><a href="/3">Three</a></li>
          <li data-mg-show-more-item><a href="/4">Four</a></li>
        </ul>
        <button type="button" hidden data-mg-show-more data-mg-show-more-mode="items"
          data-mg-show-more-target="#files"
          data-mg-show-more-label-collapsed="Show all 4"
          data-mg-show-more-label-open="Show fewer" ${extra}>
          <span data-mg-show-more-label>Show all 4</span><span class="ctx"> files</span>
        </button>`;
      return {
        button: document.querySelector('button'),
        list: document.getElementById('files'),
        hiddenItems: () =>
          [...document.querySelectorAll('[data-mg-show-more-item]')].filter(
            element => element.hasAttribute('hidden')
          ),
      };
    };

    it('ships open with the toggle hidden until initialised', () => {
      const { button, hiddenItems } = setupItems();
      expect(button.hidden).toBe(true);
      expect(hiddenItems()).toHaveLength(0);
    });

    it('hides whole items with hidden="until-found" and is a real disclosure', () => {
      const { button, list, hiddenItems } = setupItems();
      mgShowMore(button);
      expect(button.hidden).toBe(false);
      expect(hiddenItems()).toHaveLength(2);
      hiddenItems().forEach(element =>
        expect(element.getAttribute('hidden')).toBe('until-found')
      );
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.getAttribute('aria-controls')).toBe(list.id);
      // The visual-only mode's class is not used.
      expect(list.classList.contains('mg-show-more--collapsed')).toBe(false);
      expect(button.textContent.replace(/\s+/g, ' ').trim()).toBe(
        'Show all 4 files'
      );
    });

    it('opens and closes, keeping the label and aria-expanded in sync', () => {
      const { button, hiddenItems } = setupItems();
      mgShowMore(button);
      button.focus();
      button.click();
      expect(hiddenItems()).toHaveLength(0);
      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(
        button.querySelector('[data-mg-show-more-label]').textContent
      ).toBe('Show fewer');
      // A reader's open moves focus to the first revealed item's link.
      expect(document.activeElement).toBe(
        document.querySelector('a[href="/3"]')
      );
      button.click();
      expect(hiddenItems()).toHaveLength(2);
      expect(button.getAttribute('aria-expanded')).toBe('false');
    });

    it('a reader opening it focuses the first revealed control', () => {
      const { button } = setupItems();
      mgShowMore(button);
      button.focus();
      button.click();
      expect(document.activeElement).toBe(
        document.querySelector('a[href="/3"]')
      );
    });

    it('focuses the first revealed item itself when it has no control', () => {
      document.body.innerHTML = `
        <ul id="plain"><li>One</li><li data-mg-show-more-item>Two</li><li data-mg-show-more-item>Three</li></ul>
        <button type="button" data-mg-show-more data-mg-show-more-mode="items" data-mg-show-more-target="#plain">Show more</button>`;
      const button = document.querySelector('button');
      mgShowMore(button);
      button.click();
      const first = document.querySelectorAll('li')[1];
      expect(document.activeElement).toBe(first);
      expect(first).toHaveAttribute('tabindex', '-1');
      button.focus(); // blur the item
      expect(first.hasAttribute('tabindex')).toBe(false);
    });

    it('skips controls inside a closed details, except its summary', () => {
      document.body.innerHTML = `
        <ul id="d"><li>One</li><li data-mg-show-more-item><details><summary>Why?</summary><a href="/x">Inside</a></details></li></ul>
        <button type="button" data-mg-show-more data-mg-show-more-mode="items" data-mg-show-more-target="#d">Show more</button>`;
      const button = document.querySelector('button');
      mgShowMore(button);
      button.click();
      expect(document.activeElement.tagName).toBe('SUMMARY');
    });

    it('opening from code or find-in-page leaves focus alone', () => {
      const { button } = setupItems();
      mgShowMore(button);
      const outside = document.createElement('a');
      outside.href = '/outside';
      document.body.append(outside);
      outside.focus();
      mgShowMoreSetOpen(button, true);
      expect(document.activeElement).toBe(outside);
      mgShowMoreSetOpen(button, false);
      document
        .querySelector('[data-mg-show-more-item]')
        .dispatchEvent(new Event('beforematch', { bubbles: true }));
      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(document.activeElement).toBe(outside);
    });

    it('warns when an items-mode toggle is not a button', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        document.body.innerHTML = `
          <ul id="w"><li>One</li><li data-mg-show-more-item>Two</li></ul>
          <a href="#" data-mg-show-more data-mg-show-more-mode="items" data-mg-show-more-target="#w">Show more</a>`;
        mgShowMore(document.querySelector('a'));
        expect(warn).toHaveBeenCalledWith(
          expect.stringMatching(/needs a <button>/),
          expect.anything()
        );
      } finally {
        warn.mockRestore();
      }
    });

    it('moves focus to the toggle when closing hides the focused item', () => {
      const { button } = setupItems();
      mgShowMore(button);
      button.click();
      document.querySelector('a[href="/4"]').focus();
      mgShowMoreSetOpen(button, false);
      expect(document.activeElement).toBe(button);
    });

    it('opens the whole set on beforematch (find-in-page)', () => {
      const { button, hiddenItems } = setupItems();
      mgShowMore(button);
      document
        .querySelector('a[href="/4"]')
        .closest('li')
        .dispatchEvent(new Event('beforematch', { bubbles: true }));
      expect(hiddenItems()).toHaveLength(0);
      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(
        button.querySelector('[data-mg-show-more-label]').textContent
      ).toBe('Show fewer');
    });

    it('falls back to plain hidden without until-found support', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'onbeforematch'
      );
      delete HTMLElement.prototype.onbeforematch;
      try {
        expect('onbeforematch' in document.documentElement).toBe(false);
        const { button, hiddenItems } = setupItems();
        mgShowMore(button);
        expect(hiddenItems()).toHaveLength(2);
        hiddenItems().forEach(element =>
          expect(element.getAttribute('hidden')).toBe('')
        );
      } finally {
        Object.defineProperty(
          HTMLElement.prototype,
          'onbeforematch',
          descriptor
        );
      }
    });

    it('mgShowMoreSetOpen opens without a click and ignores other toggles', () => {
      const { button, hiddenItems } = setupItems();
      const onClick = jest.fn();
      button.addEventListener('click', onClick);
      mgShowMore(button);
      expect(mgShowMoreSetOpen(button, true)).toBe(true);
      expect(hiddenItems()).toHaveLength(0);
      expect(onClick).not.toHaveBeenCalled();
      expect(mgShowMoreSetOpen(document.createElement('button'), true)).toBe(
        false
      );
    });

    it('reports per-state analytics labels, or keeps an author label', () => {
      const first = setupItems();
      mgShowMore(first.button);
      expect(first.button.getAttribute('data-vf-analytics-label')).toBe(
        'Show more'
      );
      first.button.click();
      expect(first.button.getAttribute('data-vf-analytics-label')).toBe(
        'Show less'
      );
      const second = setupItems({ extra: 'data-vf-analytics-label="nav_x"' });
      mgShowMore(second.button);
      second.button.click();
      expect(second.button.getAttribute('data-vf-analytics-label')).toBe(
        'nav_x'
      );
    });

    it('is idempotent and cleanup restores the shipped markup', () => {
      const { button, hiddenItems } = setupItems();
      const cleanup = mgShowMore(button);
      const noop = mgShowMore(button);
      noop();
      expect(button.dataset.mgShowMoreInitialized).toBe('true');
      cleanup();
      expect(hiddenItems()).toHaveLength(0);
      expect(button.hidden).toBe(true);
      expect(button.hasAttribute('aria-expanded')).toBe(false);
      expect(button.hasAttribute('aria-controls')).toBe(false);
      expect(button.classList.contains('mg-show-more--button--open')).toBe(
        false
      );
      expect(button.dataset.mgShowMoreInitialized).toBeUndefined();
      expect(mgShowMoreSetOpen(button, true)).toBe(false);
      mgShowMore(button);
      expect(hiddenItems()).toHaveLength(2);
    });

    it('cleanup restores a class the toggle shipped with', () => {
      const { button } = setupItems();
      button.classList.add('mg-show-more--button--open');
      const cleanup = mgShowMore(button);
      expect(button.classList.contains('mg-show-more--button--open')).toBe(
        false
      );
      cleanup();
      expect(button.classList.contains('mg-show-more--button--open')).toBe(
        true
      );
    });

    it('leaves the toggle hidden when there are no items to hide', () => {
      document.body.innerHTML = `<ul id="few"><li>One</li></ul>
        <button hidden data-mg-show-more data-mg-show-more-mode="items" data-mg-show-more-target="#few">Show more</button>`;
      const button = document.querySelector('button');
      mgShowMore(button);
      expect(button.hidden).toBe(true);
    });

    it('does not change the visual-only mode on the same page', () => {
      document.body.innerHTML = `
        <div id="body"><p>Text</p></div>
        <button data-mg-show-more data-mg-show-more-target="#body">Show more</button>
        <ul id="files"><li data-mg-show-more-item>Hidden</li></ul>
        <button data-mg-show-more data-mg-show-more-mode="items" data-mg-show-more-target="#files">Show more</button>`;
      mgShowMore();
      const [visual] = document.querySelectorAll('button');
      expect(document.getElementById('body').classList).toContain(
        'mg-show-more--collapsed'
      );
      expect(visual.hasAttribute('aria-expanded')).toBe(false);
      expect(mgShowMoreSetOpen(visual, true)).toBe(false);
      visual.click();
      expect(document.getElementById('body').classList).not.toContain(
        'mg-show-more--collapsed'
      );
    });
  });
});
