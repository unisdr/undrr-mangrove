/**
 * Integration tests for identifierPrefix uniqueness, using the real
 * react-dom/client so the prefix reaches useId().
 *
 * With createRoot, React appends a counter that is global to one copy of
 * react-dom, so roots sharing a prefix only produce duplicate ids when a page
 * loads more than one copy of React (for example a site bundle alongside the
 * import-map build). The prefix is what keeps those ids apart.
 */
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Load an isolated copy of React, react-dom/client and the hydrate runtime,
 * as a page with two bundles would.
 */
function loadCopy() {
  let copy;
  jest.isolateModules(() => {
    const React = require('react');
    const createHydrator = require('../hydrate').default;
    function IdComponent() {
      const id = React.useId();
      return React.createElement('span', {
        id: `${id}item`,
        'data-testid': 'id',
      });
    }
    copy = { React, createHydrator, IdComponent };
  });
  return copy;
}

const mounted = [];

function hydrate(copy, config) {
  let hydrator;
  copy.React.act(() => {
    hydrator = copy.createHydrator({ component: copy.IdComponent, ...config });
  });
  mounted.push({ copy, hydrator });
  return hydrator;
}

function renderedIds() {
  return Array.from(document.querySelectorAll('[data-testid="id"]')).map(
    el => el.id
  );
}

afterEach(() => {
  mounted.forEach(({ copy, hydrator }) => {
    copy.React.act(() => hydrator.unmountAll());
  });
  mounted.length = 0;
  document.body.innerHTML = '';
});

describe('createHydrator useId uniqueness', () => {
  // A single copy of React already keeps useId values apart, so this passes
  // without the page-wide counter too; it guards the behaviour rather than
  // reproducing the bug. The two-copy tests below are the regression tests.
  it('gives distinct ids to roots mounted in separate update() calls', () => {
    const copy = loadCopy();
    document.body.innerHTML = '<div class="id-target"></div>';
    const hydrator = hydrate(copy, {
      selector: '.id-target',
      fromElement: () => ({}),
    });

    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<div class="id-target"></div>';
    document.body.appendChild(wrapper);
    copy.React.act(() => {
      hydrator.update(wrapper);
    });

    const ids = renderedIds();
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('keeps ids unique across update() calls when two copies of React share a page', () => {
    const first = loadCopy();
    const second = loadCopy();
    expect(second.React).not.toBe(first.React);

    document.body.innerHTML =
      '<div id="a"><div data-mg-tree></div></div><div id="b"></div>';
    hydrate(first, {
      selector: '[data-mg-tree]',
      fromElement: () => ({}),
    });

    const hydrator = hydrate(second, {
      selector: '[data-mg-tree]',
      fromElement: () => ({}),
    });
    // New markup attached later, as a Drupal behavior would pass it.
    const later = document.getElementById('b');
    later.innerHTML = '<div data-mg-tree></div>';
    second.React.act(() => {
      hydrator.update(later);
    });

    const ids = renderedIds();
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('does not collide across hydrators for different components on one page', () => {
    const first = loadCopy();
    const second = loadCopy();

    // `.alpha` and `#alpha` derive the same default prefix.
    document.body.innerHTML = '<div class="alpha"></div><div id="alpha"></div>';
    hydrate(first, { selector: '.alpha', fromElement: () => ({}) });
    hydrate(second, { selector: '#alpha', fromElement: () => ({}) });

    const ids = renderedIds();
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
});
