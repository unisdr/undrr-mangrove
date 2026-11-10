import React from 'react';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Tab } from '../Tab';
import { mgTabsRuntime, mgTabsDestroy } from '../../../assets/js/tabs';

const sizeProperty = '--mg-tab-sticky-rail-size';
const data = [
  { text: 'Overview', text_id: 'sticky-overview', data: '<p>Overview</p>' },
  { text: 'Findings', text_id: 'sticky-findings', data: '<p>Findings</p>' },
];

// Legacy CMS markup intentionally omits the rail: enhancement must build it.
const markup = `<article class="mg-tabs mg-tabs--horizontal mg-tabs--sticky" data-mg-js-tabs>
  <ul class="mg-tabs__list">
    <li class="mg-tabs__item"><a class="mg-tabs__link" href="#cms-one">One</a></li>
    <li class="mg-tabs-content"><section class="mg-tabs__section" id="cms-one">First</section></li>
    <li class="mg-tabs__item"><a class="mg-tabs__link" href="#cms-two">Two</a></li>
    <li class="mg-tabs-content"><section class="mg-tabs__section" id="cms-two">Second</section></li>
  </ul>
</article>`;

beforeEach(() => {
  window.innerWidth = 1024;
  window.history.replaceState({}, '', '/');
});
afterEach(() => {
  mgTabsDestroy();
  cleanup();
  document.body.innerHTML = '';
  window.innerWidth = 1024;
});

describe('sticky Tab variant', () => {
  it('opts in without changing selection or focus when toggled', () => {
    const result = render(<Tab tabdata={data} />);
    const root = result.container.querySelector('.mg-tabs');
    expect(root).not.toHaveClass('mg-tabs--sticky');
    expect(root.style.getPropertyValue(sizeProperty)).toBe('');
    fireEvent.click(within(root).getByRole('tab', { name: 'Findings' }));
    const selected = within(root).getByRole('tab', { selected: true });
    selected.focus();
    result.rerender(<Tab tabdata={data} sticky />);
    expect(root).toHaveClass('mg-tabs--sticky');
    expect(within(root).getByRole('tab', { selected: true })).toBe(selected);
    expect(document.activeElement).toBe(selected);
    expect(root.style.getPropertyValue(sizeProperty)).toBe('0px');
    result.rerender(<Tab tabdata={data} />);
    expect(root).not.toHaveClass('mg-tabs--sticky');
    expect(root.style.getPropertyValue(sizeProperty)).toBe('');
    expect(within(root).getByRole('tab', { selected: true })).toBe(selected);
  });

  it('measures a plain HTML rail on resize and restores authored inline state on destroy', () => {
    document.body.innerHTML = markup;
    const root = document.querySelector('.mg-tabs');
    root.style.setProperty(sizeProperty, '13px', 'important');
    root.style.setProperty('--consumer-colour', 'red');
    const original = root.innerHTML;
    const authoredPriority = root.style.getPropertyPriority(sizeProperty);
    mgTabsRuntime(root, false);
    const rail = root.querySelector('.mg-tabs__rail');
    let height = 61.5;
    rail.getBoundingClientRect = () => ({ height });
    fireEvent.resize(window);
    expect(root.style.getPropertyValue(sizeProperty)).toBe('62px');
    height = 83;
    fireEvent.resize(window);
    expect(root.style.getPropertyValue(sizeProperty)).toBe('83px');
    mgTabsDestroy(root);
    expect(root.style.getPropertyValue(sizeProperty)).toBe('13px');
    expect(root.style.getPropertyPriority(sizeProperty)).toBe(authoredPriority);
    expect(root.style.getPropertyValue('--consumer-colour')).toBe('red');
    expect(root.innerHTML).toBe(original);
  });

  it('leaves non-sticky roots unmodified and restores measurement when the modifier is removed', () => {
    const result = render(<Tab tabdata={data} />);
    const root = result.container.querySelector('.mg-tabs');
    fireEvent.resize(window);
    expect(root).not.toHaveAttribute('style');
    root.classList.add('mg-tabs--sticky');
    fireEvent.resize(window);
    expect(root.style.getPropertyValue(sizeProperty)).toBe('0px');
    root.classList.remove('mg-tabs--sticky');
    fireEvent.resize(window);
    expect(root.style.getPropertyValue(sizeProperty)).toBe('');
  });

  it('retains the opt-in across responsive stacking and releases horizontal geometry', () => {
    const result = render(<Tab tabdata={data} sticky stackOnMobile />);
    const root = result.container.querySelector('.mg-tabs');
    expect(root).toHaveClass('mg-tabs--horizontal', 'mg-tabs--sticky');
    expect(root.style.getPropertyValue(sizeProperty)).toBe('0px');
    window.innerWidth = 375;
    fireEvent.resize(window);
    expect(root).toHaveClass('mg-tabs--stacked', 'mg-tabs--sticky');
    expect(root).not.toHaveClass('mg-tabs--horizontal');
    expect(root.style.getPropertyValue(sizeProperty)).toBe('');
    expect(within(root).getAllByRole('button')).toHaveLength(2);
    window.innerWidth = 1024;
    fireEvent.resize(window);
    expect(root).toHaveClass('mg-tabs--horizontal', 'mg-tabs--sticky');
    expect(root.style.getPropertyValue(sizeProperty)).toBe('0px');
  });

  it('keeps explicit stacked disclosures unpinned and accessible', async () => {
    const result = render(<Tab tabdata={data} sticky variant="stacked" />);
    const root = result.container.querySelector('.mg-tabs');
    expect(root).not.toHaveClass('mg-tabs--horizontal');
    expect(root.querySelector('.mg-tabs__rail')).toBeNull();
    expect(root.style.getPropertyValue(sizeProperty)).toBe('');
    expect(await axe(result.container)).toHaveNoViolations();
  });

  it('cleans up the measurement when the vanilla lifetime is aborted', () => {
    document.body.innerHTML = markup;
    const root = document.querySelector('.mg-tabs');
    const controller = new AbortController();
    mgTabsRuntime(root, false, { signal: controller.signal });
    expect(root.style.getPropertyValue(sizeProperty)).toBe('0px');
    controller.abort();
    expect(root.style.getPropertyValue(sizeProperty)).toBe('');
    expect(root.querySelector('.mg-tabs__rail')).toBeNull();
  });
});
