/**
 * @file hydrate.nested.test.js
 * @description A component may render the same `data-mg-*` marker its own
 * hydration selector matches — SyndicationSearchWidget does, so its pager can
 * find the widget root. A re-scan must not mount a second copy into that
 * React-rendered marker. See undrr/undrr-mangrove#1227.
 *
 * The guard is scoped by selector, not to each hydrator's own mounts: it walks
 * the DOM for a hydrated ancestor that `selector` also matches. A different
 * component's hydration host nested inside a hydrated container must still
 * hydrate — `hydrate.cross-component.test.js` covers that against the real
 * ScrollContainer and IconCard — while two hydrators sharing one selector must
 * not reopen #1227, which the last test here pins.
 *
 * This file renders through the real `react-dom/client`, unlike
 * `hydrate.test.js`, which mocks it: the bug only appears once React has put
 * its own markup inside the hydrated container.
 */

import React from 'react';
import { act } from 'react';
import createHydrator from '../hydrate';

// act() only gives its flush guarantee when the environment opts in; without
// this React logs "not configured to support act(...)" on every render.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
    document.body.innerHTML = '<div data-mg-widget data-text="one"></div>';

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
    document.body.innerHTML = '<div data-mg-widget data-text="one"></div>';

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

  it('hydrates a marker that sits inside another hydrator’s container', () => {
    document.body.innerHTML = `
      <div data-mg-host data-text="host"></div>
      <div data-mg-widget data-text="sibling"></div>
    `;

    // A host hydrated by one hydrator puts a second hydrator's marker in its
    // output. The hydrated ancestor does not match the second hydrator's
    // selector, so this is still a target — which is what keeps ScrollContainer
    // and Drawer working:
    // both re-emit the consumer's markup through dangerouslySetInnerHTML, so a
    // nested hydration host reaches the DOM as React output it did not author.
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

    expect(widgetHydrator.roots).toHaveLength(2);
    expect(document.querySelectorAll('.inner-plain')).toHaveLength(2);
    expect(
      document.querySelector('[data-mg-host] [data-mg-widget]').dataset
        .mgHydrated
    ).toBe('true');
  });

  it('skips markup a consumer appends inside an already-hydrated container', () => {
    document.body.innerHTML = '<div id="host" data-mg-widget></div>';

    let hydrator;
    act(() => {
      hydrator = createHydrator({
        selector: '[data-mg-widget]',
        component: PlainComponent,
        fromElement,
      });
    });

    // A match inside a container this hydrator mounted is React's own output
    // as far as this hydrator can tell, so markup appended there is not a
    // target. To replace a hydrated container's contents, call unmountAll()
    // and re-scan.
    const added = document.createElement('div');
    added.setAttribute('data-mg-widget', '');
    document.getElementById('host').appendChild(added);

    let newRoots;
    act(() => {
      newRoots = hydrator.update();
    });

    expect(newRoots).toHaveLength(0);
    expect(added.dataset.mgHydrated).toBeUndefined();
  });

  it('hydrates inside a detached context, which is scoped by contains() not isConnected', () => {
    let hydrator;
    act(() => {
      hydrator = createHydrator({
        selector: '[data-mg-widget]',
        component: PlainComponent,
        fromElement,
      });
    });

    // A fragment the consumer builds off-document and hydrates before
    // inserting it. The detached-node check is scoped to the scan context, so
    // this still works.
    const fragment = document.createDocumentFragment();
    const inFragment = document.createElement('div');
    inFragment.setAttribute('data-mg-widget', '');
    fragment.appendChild(inFragment);

    let fragmentRoots;
    act(() => {
      fragmentRoots = hydrator.update(fragment);
    });

    expect(fragmentRoots).toHaveLength(1);
    expect(inFragment.dataset.mgHydrated).toBe('true');

    // Same for an element subtree that is not in the document.
    const detached = document.createElement('div');
    detached.innerHTML = '<div data-mg-widget id="detached-child"></div>';

    let detachedRoots;
    act(() => {
      detachedRoots = hydrator.update(detached);
    });

    expect(detachedRoots).toHaveLength(1);
    expect(detached.querySelector('#detached-child').dataset.mgHydrated).toBe(
      'true'
    );
  });

  it('a second hydrator for the same selector does not take the first one’s rendered marker', () => {
    document.body.innerHTML = '<div data-mg-widget data-text="one"></div>';

    // Two hydrators for one selector is a misconfiguration — a page loading
    // the same wrapper twice, or a site bundle alongside the CDN build — but
    // it must not resurrect #1227. The second hydrator skips the host on its
    // `data-mg-hydrated` flag, and skips the marker React rendered inside it
    // because the guard reads the DOM rather than either hydrator's own
    // bookkeeping. Scoping the guard to one hydrator's mounts would mount a
    // second widget here.
    let first;
    act(() => {
      first = createHydrator({
        selector: '[data-mg-widget]',
        component: MarkerRenderingComponent,
        fromElement,
      });
    });

    let second;
    act(() => {
      second = createHydrator({
        selector: '[data-mg-widget]',
        component: MarkerRenderingComponent,
        fromElement,
      });
    });

    expect(first.roots).toHaveLength(1);
    expect(second.roots).toHaveLength(0);
    expect(document.querySelectorAll('.inner-root .inner-root')).toHaveLength(
      0
    );
  });

  it('unmountAll then a fresh scan re-hydrates the original container once', () => {
    document.body.innerHTML = '<div data-mg-widget data-text="one"></div>';

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
