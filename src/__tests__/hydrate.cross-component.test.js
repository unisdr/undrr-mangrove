/**
 * @file hydrate.cross-component.test.js
 * @description ScrollContainer and Drawer read the consumer's markup in their
 * `fromElement` and re-emit it through `dangerouslySetInnerHTML`, so anything
 * an author nested in them — including another component's hydration host —
 * comes back out of React verbatim and must still hydrate.
 *
 * The #1227 guard must not swallow that. A rule of "skip every match inside
 * any hydrated container" does, silently: a scrolling row of hydrated cards is
 * ScrollContainer's canonical use, and on Drupal the nested markup is
 * author-entered. See undrr/undrr-mangrove#1234.
 *
 * These tests render through the real `react-dom/client` with the real
 * components and their real `fromElement` functions.
 */

import { act } from 'react';
import createHydrator from '../hydrate';
import ScrollContainer from '../../stories/Components/ScrollContainer/ScrollContainer';
import scrollContainerFromElement from '../../stories/Components/ScrollContainer/ScrollContainer.fromElement';
import { Drawer } from '../../stories/Components/Navigation/Drawer/Drawer';
import drawerFromElement from '../../stories/Components/Navigation/Drawer/Drawer.fromElement';
import { IconCard } from '../../stories/Components/Cards/IconCard/IconCard';
import iconCardFromElement from '../../stories/Components/Cards/IconCard/IconCard.fromElement';

// act() only gives its flush guarantee when the environment opts in.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const cardItems = title => JSON.stringify([{ title, summaryText: 'Summary' }]);

function hydrateCards() {
  return createHydrator({
    selector: '[data-mg-icon-card]',
    component: IconCard,
    fromElement: iconCardFromElement,
  });
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('a hydration host nested inside a hydrated container', () => {
  it('hydrates cards a ScrollContainer re-emitted from the consumer markup', () => {
    document.body.innerHTML = `
      <div data-mg-scroll-container data-height="300px">
        <div class="mg-scroll__content">
          <div data-mg-icon-card data-items='${cardItems('Card one')}'></div>
          <div data-mg-icon-card data-items='${cardItems('Card two')}'></div>
        </div>
      </div>
    `;

    act(() => {
      createHydrator({
        selector: '[data-mg-scroll-container]',
        component: ScrollContainer,
        fromElement: scrollContainerFromElement,
      });
    });

    // The two hosts survived into React's output, so they are still findable.
    expect(document.querySelectorAll('[data-mg-icon-card]')).toHaveLength(2);

    let cardHydrator;
    act(() => {
      cardHydrator = hydrateCards();
    });

    expect(cardHydrator.roots).toHaveLength(2);
    expect(document.querySelectorAll('.mg-card')).toHaveLength(2);
    expect(document.body.textContent).toContain('Card one');
    expect(document.body.textContent).toContain('Card two');
  });

  it('hydrates a card a Drawer re-emitted from its body markup', () => {
    document.body.innerHTML = `
      <div id="filters" data-mg-drawer data-is-open="true" data-title="Filters">
        <div class="mg-drawer__body">
          <div data-mg-icon-card data-items='${cardItems('In a drawer')}'></div>
        </div>
      </div>
    `;

    act(() => {
      createHydrator({
        selector: '[data-mg-drawer]',
        component: Drawer,
        fromElement: drawerFromElement,
      });
    });

    expect(document.querySelectorAll('[data-mg-icon-card]')).toHaveLength(1);

    let cardHydrator;
    act(() => {
      cardHydrator = hydrateCards();
    });

    expect(cardHydrator.roots).toHaveLength(1);
    expect(document.body.textContent).toContain('In a drawer');
  });

  it('does not re-hydrate those cards on a later update()', () => {
    document.body.innerHTML = `
      <div data-mg-scroll-container data-height="300px">
        <div class="mg-scroll__content">
          <div data-mg-icon-card data-items='${cardItems('Card one')}'></div>
        </div>
      </div>
    `;

    act(() => {
      createHydrator({
        selector: '[data-mg-scroll-container]',
        component: ScrollContainer,
        fromElement: scrollContainerFromElement,
      });
    });

    let cardHydrator;
    act(() => {
      cardHydrator = hydrateCards();
    });

    let newRoots;
    act(() => {
      newRoots = cardHydrator.update();
    });

    expect(newRoots).toHaveLength(0);
    expect(cardHydrator.roots).toHaveLength(1);
    expect(document.querySelectorAll('.mg-card')).toHaveLength(1);
  });
});
