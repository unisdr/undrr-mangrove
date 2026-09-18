import { mgShowMore } from '../show-more';

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
});
