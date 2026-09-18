/**
 * @file ScrollContainer.hydrate.test.jsx
 * @description Hydration tests for two scroll containers on one page.
 *
 * A page can carry more than one horizontally scrolling region. Each
 * hydrated container must render its own server-rendered children, never a
 * sibling's. See undrr/undrr-mangrove#1205.
 */

import { act } from '@testing-library/react';
import createHydrator from '../../../../src/hydrate';
import ScrollContainer from '../ScrollContainer';
import fromElement from '../ScrollContainer.fromElement';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('ScrollContainer hydration', () => {
  let hydrator;

  afterEach(() => {
    if (hydrator) {
      act(() => hydrator.unmountAll());
      hydrator = undefined;
    }
    document.body.innerHTML = '';
  });

  it('gives each of two containers its own children', () => {
    document.body.innerHTML = `
      <div id="first" data-mg-scroll-container>
        <div class="mg-scroll__content">
          <div class="card">First A</div>
          <div class="card">First B</div>
        </div>
      </div>
      <div id="second" data-mg-scroll-container>
        <div class="mg-scroll__content">
          <div class="card">Second A</div>
        </div>
      </div>
    `;

    act(() => {
      hydrator = createHydrator({
        selector: '[data-mg-scroll-container]',
        component: ScrollContainer,
        fromElement,
      });
    });

    const first = document.getElementById('first');
    const second = document.getElementById('second');

    expect(hydrator.roots).toHaveLength(2);
    expect(first.textContent).toContain('First A');
    expect(first.textContent).toContain('First B');
    expect(first.textContent).not.toContain('Second');
    expect(second.textContent).toContain('Second A');
    expect(second.textContent).not.toContain('First');
    expect(second.querySelectorAll('.card')).toHaveLength(1);
  });
});
