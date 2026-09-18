/**
 * @file hydrate.nested.test.js
 * @description A component may render the same `data-mg-*` marker its own
 * hydration selector matches — SyndicationSearchWidget does, so its pager can
 * find the widget root. A re-scan must not mount a second copy into that
 * React-rendered marker. See undrr/undrr-mangrove#1227.
 *
 * This file renders through the real `react-dom/client`, unlike
 * `hydrate.test.js`, which mocks it: the bug only appears once React has put
 * its own markup inside the hydrated container.
 */

import React from 'react';
import { act } from 'react';
import createHydrator from '../hydrate';

/** Mirrors the widget: the rendered root repeats the hydration marker. */
function MarkerRenderingComponent({ text }) {
  return React.createElement(
    'div',
    { 'data-mg-widget': '', className: 'inner-root' },
    text
  );
}

function PlainComponent({ text }) {
  return React.createElement('div', { className: 'inner-plain' }, text);
}

const fromElement = el => ({ text: el.dataset.text ?? '' });

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('createHydrator nested-marker handling', () => {
  it('leaves exactly one root when update() re-scans a component that renders its own marker', () => {
    document.body.innerHTML =
      '<div data-mg-widget data-text="one"></div>';

    let hydrator;
    act(() => {
      hydrator = createHydrator({
        selector: '[data-mg-widget]',
        component: MarkerRenderingComponent,
        fromElement,
      });
    });

    expect(hydrator.roots).toHaveLength(1);
    expect(document.querySelectorAll('.inner-root')).toHaveLength(1);

    act(() => {
      hydrator.update();
    });

    expect(hydrator.roots).toHaveLength(1);
    expect(document.querySelectorAll('.inner-root')).toHaveLength(1);
    expect(document.querySelectorAll('.inner-root .inner-root')).toHaveLength(
      0
    );
  });

  it('still hydrates markup added after the first pass', () => {
    document.body.innerHTML =
      '<div data-mg-widget data-text="one"></div>';

    let hydrator;
    act(() => {
      hydrator = createHydrator({
        selector: '[data-mg-widget]',
        component: MarkerRenderingComponent,
        fromElement,
      });
    });

    const added = document.createElement('div');
    added.setAttribute('data-mg-widget', '');
    added.dataset.text = 'two';
    document.body.appendChild(added);

    let newRoots;
    act(() => {
      newRoots = hydrator.update();
    });

    expect(newRoots).toHaveLength(1);
    expect(hydrator.roots).toHaveLength(2);
    expect(added.dataset.mgHydrated).toBe('true');
  });

  it('does not hydrate a marker React rendered inside an unrelated hydrated container', () => {
    document.body.innerHTML = `
      <div data-mg-host data-text="host"></div>
      <div data-mg-widget data-text="sibling"></div>
    `;

    // A host hydrated by one hydrator renders markup carrying a second
    // hydrator's marker. That markup is React-owned, so it is not a target.
    function HostComponent() {
      return React.createElement('div', { 'data-mg-widget': '' });
    }

    act(() => {
      createHydrator({
        selector: '[data-mg-host]',
        component: HostComponent,
        fromElement,
      });
    });

    let widgetHydrator;
    act(() => {
      widgetHydrator = createHydrator({
        selector: '[data-mg-widget]',
        component: PlainComponent,
        fromElement,
      });
    });

    expect(widgetHydrator.roots).toHaveLength(1);
    expect(document.querySelectorAll('.inner-plain')).toHaveLength(1);
  });

  it('unmountAll then a fresh scan re-hydrates the original container once', () => {
    document.body.innerHTML =
      '<div data-mg-widget data-text="one"></div>';

    let hydrator;
    act(() => {
      hydrator = createHydrator({
        selector: '[data-mg-widget]',
        component: MarkerRenderingComponent,
        fromElement,
      });
    });

    act(() => {
      hydrator.unmountAll();
    });

    act(() => {
      hydrator.update();
    });

    expect(hydrator.roots).toHaveLength(1);
    expect(document.querySelectorAll('[data-mg-widget]')).toHaveLength(2);
  });
});
