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
      const classAfterFirst = target.classList.contains('mg-show-more--collapsed');

      mgShowMore();
      // Second call should be a no-op — collapsed state must not change
      expect(target.classList.contains('mg-show-more--collapsed')).toBe(classAfterFirst);
      expect(btn.dataset.mgShowMoreInitialized).toBe('true');
    });
  });

  describe('missing target guard', () => {
    it('does not throw when target element is missing', () => {
      document.body.innerHTML = `
        <button data-mg-show-more data-mg-show-more-target=".nonexistent">Show more</button>
      `;
      expect(() => mgShowMore()).not.toThrow();
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
