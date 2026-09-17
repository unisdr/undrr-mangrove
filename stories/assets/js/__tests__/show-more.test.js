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

  describe('disclosure semantics', () => {
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

    it('keeps aria-expanded in sync with the collapsed state', () => {
      const btn = setupButton();
      const target = document.querySelector('.mg-show-more--container');
      mgShowMore();

      // Init clicks once, so the content starts expanded.
      expect(target.classList.contains('mg-show-more--collapsed')).toBe(false);
      expect(btn.getAttribute('aria-expanded')).toBe('true');

      btn.click();
      expect(target.classList.contains('mg-show-more--collapsed')).toBe(true);
      expect(btn.getAttribute('aria-expanded')).toBe('false');

      btn.click();
      expect(btn.getAttribute('aria-expanded')).toBe('true');
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
      expect(link.getAttribute('aria-expanded')).toBe('true');
      expect(link.hasAttribute('aria-controls')).toBe(true);
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
