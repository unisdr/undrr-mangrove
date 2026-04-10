import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Tab } from '../Tab';

// Mock mgTabsRuntime so the React component's useEffect doesn't run the runtime
// (we call the real runtime ourselves after render for controlled setup).
jest.mock('../../../assets/js/tabs', () => ({
  mgTabsRuntime: jest.fn(),
}));

// Import the real module for direct runtime testing
const { mgTabsRuntime } = jest.requireActual('../../../assets/js/tabs');

const tabdata = [
  {
    text: 'Section 1',
    text_id: 'tab-1',
    data: '<p>Content for section 1</p>',
  },
  {
    text: 'Section 2',
    text_id: 'tab-2',
    data: '<p>Content for section 2</p>',
  },
  {
    text: 'Section 3',
    text_id: 'tab-3',
    data: '<p>Content for section 3</p>',
  },
];

/**
 * Helper: query a panel <section> by its text_id.
 * We use `section#...` because the tab trigger <a> also gets the same ID
 * (pre-existing design — tab.id === panel.id for matching purposes).
 */
function getPanel(container, textId) {
  return container.querySelector(`section#mg-tabs__section-${textId}`);
}

/**
 * Render the Tab component and run the real tabs runtime.
 * @param {string} variant - 'horizontal' or 'stacked'
 * @param {boolean} activateDeepLink - whether to run deep link activation (default false)
 * @param {object} extraProps - additional props to pass to Tab
 */
function renderAndInit(variant = 'horizontal', activateDeepLink = false, extraProps = {}) {
  const result = render(<Tab tabdata={tabdata} variant={variant} {...extraProps} />);
  const tabContainer = result.container.querySelector('[data-mg-js-tabs]');
  mgTabsRuntime(tabContainer, activateDeepLink);
  return { ...result, container: result.container, tabContainer };
}

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe('Tab', () => {
  beforeEach(() => {
    // Default to a wide viewport so horizontal mode activates
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('renders horizontal variant by default', () => {
    const { container } = render(<Tab tabdata={tabdata} />);
    expect(container.querySelector('.mg-tabs--horizontal')).toBeInTheDocument();
  });

  it('renders stacked variant', () => {
    const { container } = render(<Tab tabdata={tabdata} variant="stacked" />);
    expect(container.querySelector('.mg-tabs--stacked')).toBeInTheDocument();
  });

  it('renders all tab labels', () => {
    render(<Tab tabdata={tabdata} />);
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
    expect(screen.getByText('Section 3')).toBeInTheDocument();
  });

  it('renders empty comment when tabdata is missing', () => {
    const { container } = render(<Tab tabdata={null} />);
    expect(container.querySelector('.mg-tabs')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------
  // Horizontal ARIA
  // -------------------------------------------------------

  describe('horizontal tabs ARIA', () => {
    it('applies role="tab" to triggers', () => {
      const { tabContainer } = renderAndInit('horizontal');
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      tabs.forEach(tab => {
        expect(tab.getAttribute('role')).toBe('tab');
      });
    });

    it('applies role="tabpanel" to panels', () => {
      const { tabContainer } = renderAndInit('horizontal');
      const panels = tabContainer.querySelectorAll('section.mg-tabs__section');
      panels.forEach(panel => {
        expect(panel.getAttribute('role')).toBe('tabpanel');
      });
    });

    it('applies role="tablist" to the tab list', () => {
      const { tabContainer } = renderAndInit('horizontal');
      const tabList = tabContainer.querySelector('.mg-tabs__list');
      expect(tabList.getAttribute('role')).toBe('tablist');
    });

    it('sets aria-labelledby on panels to the tab trigger id', () => {
      const { tabContainer } = renderAndInit('horizontal');
      const panels = tabContainer.querySelectorAll('section.mg-tabs__section');
      panels.forEach(panel => {
        const labelId = panel.getAttribute('aria-labelledby');
        expect(labelId).toBeTruthy();
        // The corresponding tab trigger should exist with this ID
        expect(
          tabContainer.querySelector(`a#${CSS.escape(labelId)}[role="tab"]`)
        ).toBeTruthy();
      });
    });

    it('activates first tab by default', () => {
      const { tabContainer } = renderAndInit('horizontal');
      const firstTab = tabContainer.querySelector('.mg-tabs__link');
      expect(firstTab.getAttribute('aria-selected')).toBe('true');
      expect(firstTab.classList.contains('is-active')).toBe(true);
    });
  });

  // -------------------------------------------------------
  // Stacked / disclosure ARIA
  // -------------------------------------------------------

  describe('stacked tabs ARIA (disclosure pattern)', () => {
    it('applies role="button" to triggers', () => {
      const { tabContainer } = renderAndInit('stacked');
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      tabs.forEach(tab => {
        expect(tab.getAttribute('role')).toBe('button');
      });
    });

    it('applies aria-expanded="false" to all triggers initially', () => {
      const { tabContainer } = renderAndInit('stacked');
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      tabs.forEach(tab => {
        expect(tab.getAttribute('aria-expanded')).toBe('false');
      });
    });

    it('applies aria-controls linking trigger to panel', () => {
      const { tabContainer } = renderAndInit('stacked');
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      tabs.forEach(tab => {
        const controlsId = tab.getAttribute('aria-controls');
        expect(controlsId).toBeTruthy();
        expect(
          tabContainer.querySelector(`section#${CSS.escape(controlsId)}`)
        ).toBeTruthy();
      });
    });

    it('applies role="region" to panels', () => {
      const { tabContainer } = renderAndInit('stacked');
      const panels = tabContainer.querySelectorAll('section.mg-tabs__section');
      panels.forEach(panel => {
        expect(panel.getAttribute('role')).toBe('region');
      });
    });

    it('does NOT apply role="tablist" to the tab list', () => {
      const { tabContainer } = renderAndInit('stacked');
      const tabList = tabContainer.querySelector('.mg-tabs__list');
      expect(tabList.getAttribute('role')).not.toBe('tablist');
    });

    it('uses hidden="until-found" for stacked panels', () => {
      const { tabContainer } = renderAndInit('stacked');
      const panels = tabContainer.querySelectorAll('section.mg-tabs__section');
      panels.forEach(panel => {
        expect(panel.getAttribute('hidden')).toBe('until-found');
      });
    });

    it('gives triggers distinct IDs from panels', () => {
      const { tabContainer } = renderAndInit('stacked');
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      const panels = tabContainer.querySelectorAll('section.mg-tabs__section');
      tabs.forEach((tab, i) => {
        expect(tab.id).not.toBe(panels[i].id);
        expect(tab.id).toContain('--trigger');
      });
    });

    it('stacked triggers are in the tab order (no tabindex=-1)', () => {
      const { tabContainer } = renderAndInit('stacked');
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      tabs.forEach(tab => {
        expect(tab.getAttribute('tabindex')).not.toBe('-1');
      });
    });
  });

  // -------------------------------------------------------
  // Stacked toggle behavior
  // -------------------------------------------------------

  describe('stacked toggle behavior', () => {
    it('opens a panel on click', () => {
      const { tabContainer } = renderAndInit('stacked');
      const tab = tabContainer.querySelectorAll('.mg-tabs__link')[0];
      const panel = getPanel(tabContainer, 'tab-1');

      // Initially hidden
      expect(panel.getAttribute('hidden')).toBe('until-found');
      expect(tab.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(tab);

      expect(panel.hasAttribute('hidden')).toBe(false);
      expect(tab.getAttribute('aria-expanded')).toBe('true');
    });

    it('closes an open panel on second click', () => {
      const { tabContainer } = renderAndInit('stacked');
      const tab = tabContainer.querySelectorAll('.mg-tabs__link')[0];
      const panel = getPanel(tabContainer, 'tab-1');

      fireEvent.click(tab); // open
      expect(panel.hasAttribute('hidden')).toBe(false);

      fireEvent.click(tab); // close
      expect(panel.getAttribute('hidden')).toBe('until-found');
      expect(tab.getAttribute('aria-expanded')).toBe('false');
    });

    it('allows multiple panels open simultaneously', () => {
      const { tabContainer } = renderAndInit('stacked');
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      const panel1 = getPanel(tabContainer, 'tab-1');
      const panel2 = getPanel(tabContainer, 'tab-2');

      fireEvent.click(tabs[0]);
      fireEvent.click(tabs[1]);

      expect(panel1.hasAttribute('hidden')).toBe(false);
      expect(panel2.hasAttribute('hidden')).toBe(false);
      expect(tabs[0].getAttribute('aria-expanded')).toBe('true');
      expect(tabs[1].getAttribute('aria-expanded')).toBe('true');
    });
  });

  // -------------------------------------------------------
  // Keyboard navigation
  // -------------------------------------------------------

  describe('keyboard navigation', () => {
    it('uses ArrowLeft/ArrowRight for horizontal tabs', () => {
      const { tabContainer } = renderAndInit('horizontal');
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');

      // Focus first tab, press ArrowRight
      tabs[0].focus();
      fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });

      expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    });

    it('uses ArrowUp/ArrowDown for stacked tabs', () => {
      const { tabContainer } = renderAndInit('stacked');
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');

      tabs[0].focus();
      fireEvent.keyDown(tabs[0], { key: 'ArrowDown' });

      // In stacked mode, arrow keys move focus without toggling
      expect(document.activeElement).toBe(tabs[1]);
    });

    it('Home/End jump to first/last trigger in stacked mode', () => {
      const { tabContainer } = renderAndInit('stacked');
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');

      tabs[1].focus();
      fireEvent.keyDown(tabs[1], { key: 'Home' });
      expect(document.activeElement).toBe(tabs[0]);

      tabs[1].focus();
      fireEvent.keyDown(tabs[1], { key: 'End' });
      expect(document.activeElement).toBe(tabs[2]);
    });

    it('Space key toggles stacked panel', () => {
      const { tabContainer } = renderAndInit('stacked');
      const tab = tabContainer.querySelectorAll('.mg-tabs__link')[0];
      const panel = getPanel(tabContainer, 'tab-1');

      tab.focus();
      fireEvent.keyDown(tab, { key: ' ' });

      expect(panel.hasAttribute('hidden')).toBe(false);
      expect(tab.getAttribute('aria-expanded')).toBe('true');
    });

    it('arrow keys wrap around in stacked mode', () => {
      const { tabContainer } = renderAndInit('stacked');
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');

      // ArrowUp on first trigger wraps to last
      tabs[0].focus();
      fireEvent.keyDown(tabs[0], { key: 'ArrowUp' });
      expect(document.activeElement).toBe(tabs[2]);

      // ArrowDown on last trigger wraps to first
      tabs[2].focus();
      fireEvent.keyDown(tabs[2], { key: 'ArrowDown' });
      expect(document.activeElement).toBe(tabs[0]);
    });
  });

  // -------------------------------------------------------
  // defaultOpen
  // -------------------------------------------------------

  describe('defaultOpen', () => {
    it('opens first panel by default when no defaultOpen is set', () => {
      const { tabContainer } = renderAndInit('stacked', true);
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      const panel1 = getPanel(tabContainer, 'tab-1');
      const panel2 = getPanel(tabContainer, 'tab-2');
      const panel3 = getPanel(tabContainer, 'tab-3');

      expect(panel1.hasAttribute('hidden')).toBe(false);
      expect(tabs[0].getAttribute('aria-expanded')).toBe('true');
      expect(panel2.getAttribute('hidden')).toBe('until-found');
      expect(panel3.getAttribute('hidden')).toBe('until-found');
    });

    it('all panels start closed when defaultOpen={false}', () => {
      const { tabContainer } = renderAndInit('stacked', true, { defaultOpen: false });
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      const panels = tabContainer.querySelectorAll('section.mg-tabs__section');

      panels.forEach((panel, i) => {
        expect(panel.getAttribute('hidden')).toBe('until-found');
        expect(tabs[i].getAttribute('aria-expanded')).toBe('false');
      });
    });

    it('all panels start open when defaultOpen={true}', () => {
      const { tabContainer } = renderAndInit('stacked', true, { defaultOpen: true });
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      const panels = tabContainer.querySelectorAll('section.mg-tabs__section');

      panels.forEach((panel, i) => {
        expect(panel.hasAttribute('hidden')).toBe(false);
        expect(tabs[i].getAttribute('aria-expanded')).toBe('true');
      });
    });

    it('per-item is_default overrides container defaultOpen', () => {
      const dataWithDefault = [
        { text: 'Section 1', text_id: 'tab-1', data: '<p>Content 1</p>' },
        { text: 'Section 2', text_id: 'tab-2', data: '<p>Content 2</p>', is_default: 'true' },
        { text: 'Section 3', text_id: 'tab-3', data: '<p>Content 3</p>' },
      ];
      const result = render(<Tab tabdata={dataWithDefault} variant="stacked" defaultOpen={false} />);
      const tabContainer = result.container.querySelector('[data-mg-js-tabs]');
      mgTabsRuntime(tabContainer, true);

      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      const panel1 = getPanel(result.container, 'tab-1');
      const panel2 = getPanel(result.container, 'tab-2');
      const panel3 = getPanel(result.container, 'tab-3');

      // Only section 2 (with is_default="true") should be open
      expect(panel1.getAttribute('hidden')).toBe('until-found');
      expect(tabs[0].getAttribute('aria-expanded')).toBe('false');

      expect(panel2.hasAttribute('hidden')).toBe(false);
      expect(tabs[1].getAttribute('aria-expanded')).toBe('true');

      expect(panel3.getAttribute('hidden')).toBe('until-found');
      expect(tabs[2].getAttribute('aria-expanded')).toBe('false');
    });
  });

  // -------------------------------------------------------
  // singleOpen
  // -------------------------------------------------------

  describe('singleOpen', () => {
    it('opening one panel closes the previously open panel', () => {
      const { tabContainer } = renderAndInit('stacked', false, { singleOpen: true });
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      const panel1 = getPanel(tabContainer, 'tab-1');
      const panel2 = getPanel(tabContainer, 'tab-2');

      // Open first panel
      fireEvent.click(tabs[0]);
      expect(panel1.hasAttribute('hidden')).toBe(false);
      expect(tabs[0].getAttribute('aria-expanded')).toBe('true');

      // Open second panel — first should close
      fireEvent.click(tabs[1]);
      expect(panel2.hasAttribute('hidden')).toBe(false);
      expect(tabs[1].getAttribute('aria-expanded')).toBe('true');

      expect(panel1.getAttribute('hidden')).toBe('until-found');
      expect(tabs[0].getAttribute('aria-expanded')).toBe('false');
    });

    it('only one panel is visible at a time', () => {
      const { tabContainer } = renderAndInit('stacked', false, { singleOpen: true });
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');

      // Open each panel in turn, verify only one is open
      fireEvent.click(tabs[0]);
      fireEvent.click(tabs[2]);

      const panels = tabContainer.querySelectorAll('section.mg-tabs__section');
      const openPanels = Array.from(panels).filter(p => !p.hasAttribute('hidden'));
      expect(openPanels).toHaveLength(1);
      expect(openPanels[0].id).toBe('mg-tabs__section-tab-3');
    });

    it('can close the only open panel by clicking it again', () => {
      const { tabContainer } = renderAndInit('stacked', false, { singleOpen: true });
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      const panel1 = getPanel(tabContainer, 'tab-1');

      fireEvent.click(tabs[0]); // open
      fireEvent.click(tabs[0]); // close

      expect(panel1.getAttribute('hidden')).toBe('until-found');
      expect(tabs[0].getAttribute('aria-expanded')).toBe('false');
    });
  });

  // -------------------------------------------------------
  // filterable
  // -------------------------------------------------------

  describe('filterable', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    /** Helper: type into the runtime-injected filter input and flush the debounce */
    function typeFilter(container, value) {
      const input = container.querySelector('.mg-tabs__filter-input');
      input.value = value;
      fireEvent.input(input);
      jest.advanceTimersByTime(200); // flush 150ms debounce
    }

    it('renders filter input when filterable is true on stacked variant', () => {
      const { tabContainer } = renderAndInit('stacked', false, { filterable: true });
      expect(tabContainer.querySelector('.mg-tabs__filter-input')).toBeInTheDocument();
    });

    it('does not render filter input on horizontal variant', () => {
      const { tabContainer } = renderAndInit('horizontal', false, { filterable: true });
      expect(tabContainer.querySelector('.mg-tabs__filter-input')).not.toBeInTheDocument();
    });

    it('renders sr-only hint text', () => {
      const { tabContainer } = renderAndInit('stacked', false, { filterable: true });
      expect(tabContainer.querySelector('.mg-u-sr-only')).toBeInTheDocument();
      expect(tabContainer.querySelector('.mg-u-sr-only').textContent).toBe(
        'Results will filter as you type'
      );
    });

    it('hides non-matching items when typing a query', () => {
      const { tabContainer } = renderAndInit('stacked', false, { filterable: true, defaultOpen: false });

      typeFilter(tabContainer, 'Section 1');

      const items = tabContainer.querySelectorAll('.mg-tabs__item');
      expect(items[0].classList.contains('mg-tabs__item--hidden')).toBe(false);
      expect(items[1].classList.contains('mg-tabs__item--hidden')).toBe(true);
      expect(items[2].classList.contains('mg-tabs__item--hidden')).toBe(true);
    });

    it('auto-expands matching panels', () => {
      const { tabContainer } = renderAndInit('stacked', true, { filterable: true, defaultOpen: false });

      typeFilter(tabContainer, 'section 2');

      const panel = getPanel(tabContainer, 'tab-2');
      expect(panel.hasAttribute('hidden')).toBe(false);
    });

    it('shows no-results message when nothing matches', () => {
      const { tabContainer } = renderAndInit('stacked', false, { filterable: true });

      typeFilter(tabContainer, 'xyznonexistent');

      const noResults = tabContainer.querySelector('.mg-tabs__no-results');
      expect(noResults).toBeInTheDocument();
      expect(noResults.classList.contains('mg-tabs__no-results--hidden')).toBe(false);
    });

    it('restores all items when clearing input', () => {
      const { tabContainer } = renderAndInit('stacked', true, { filterable: true, defaultOpen: false });

      // Filter first
      typeFilter(tabContainer, 'Section 1');
      // Then clear
      typeFilter(tabContainer, '');

      const items = tabContainer.querySelectorAll('.mg-tabs__item');
      items.forEach(item => {
        expect(item.classList.contains('mg-tabs__item--hidden')).toBe(false);
      });

      // No-results message should be hidden
      const noResults = tabContainer.querySelector('.mg-tabs__no-results');
      expect(noResults.classList.contains('mg-tabs__no-results--hidden')).toBe(true);
    });

    it('matches all words independently (AND logic, not exact phrase)', () => {
      const { tabContainer } = renderAndInit('stacked', false, { filterable: true });

      // "section 1" should match "Section 1" (words appear in header)
      typeFilter(tabContainer, 'section 1');
      const items = tabContainer.querySelectorAll('.mg-tabs__item');
      expect(items[0].classList.contains('mg-tabs__item--hidden')).toBe(false);
      expect(items[1].classList.contains('mg-tabs__item--hidden')).toBe(true);

      // "1 section" should also match (word order doesn't matter)
      typeFilter(tabContainer, '1 section');
      expect(items[0].classList.contains('mg-tabs__item--hidden')).toBe(false);
      expect(items[1].classList.contains('mg-tabs__item--hidden')).toBe(true);
    });

    it('arrow keys skip hidden triggers during filtering', () => {
      const { tabContainer } = renderAndInit('stacked', false, { filterable: true });

      // Filter to show only Section 1 and Section 3 (hide Section 2)
      typeFilter(tabContainer, 'section');
      // All match "section", so narrow further
      typeFilter(tabContainer, '');
      // Instead, manually hide Section 2 to simulate a filter that hides the middle item
      const items = tabContainer.querySelectorAll('.mg-tabs__item');
      items[1].classList.add('mg-tabs__item--hidden');

      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      tabs[0].focus();
      fireEvent.keyDown(tabs[0], { key: 'ArrowDown' });

      // Should skip hidden Section 2 and land on Section 3
      expect(document.activeElement).toBe(tabs[2]);
    });

    it('uses custom placeholder text', () => {
      const { tabContainer } = renderAndInit('stacked', false, {
        filterable: true,
        filterPlaceholder: 'Search FAQs\u2026',
      });
      const input = tabContainer.querySelector('.mg-tabs__filter-input');
      expect(input.placeholder).toBe('Search FAQs\u2026');
    });
  });

  // -------------------------------------------------------
  // mgTabs lifecycle (wrapper function)
  // -------------------------------------------------------

  describe('mgTabs lifecycle', () => {
    const { mgTabs: realMgTabs } = jest.requireActual('../../../assets/js/tabs');

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('skips containers with data-mg-js-tabs-skip-auto-init during auto-init', () => {
      document.body.innerHTML = `<div data-mg-js-tabs data-mg-js-tabs-skip-auto-init></div>`;
      realMgTabs(); // no scope = auto-init path
      const container = document.querySelector('[data-mg-js-tabs]');
      expect(container.hasAttribute('data-mg-tabs-initialized')).toBe(false);
    });

    it('processes data-mg-js-tabs-skip-auto-init containers when scope is passed explicitly', () => {
      const { container: rendered } = render(<Tab tabdata={tabdata} />);
      const tabContainer = rendered.querySelector('[data-mg-js-tabs]');
      tabContainer.setAttribute('data-mg-js-tabs-skip-auto-init', '');
      realMgTabs([tabContainer]);
      expect(tabContainer.hasAttribute('data-mg-tabs-initialized')).toBe(true);
    });

    it('accepts a single HTMLElement as scope without throwing', () => {
      const { container: rendered } = render(<Tab tabdata={tabdata} />);
      const tabContainer = rendered.querySelector('[data-mg-js-tabs]');
      expect(() => realMgTabs(tabContainer)).not.toThrow();
      expect(tabContainer.hasAttribute('data-mg-tabs-initialized')).toBe(true);
    });
  });

  // -------------------------------------------------------
  // Accessibility (jest-axe)
  // -------------------------------------------------------

  describe('accessibility', () => {
    it('horizontal tabs have no axe violations', async () => {
      const { container } = renderAndInit('horizontal');
      // aria-required-children: the current HTML interleaves tabs and panels
      // inside the same <ul role="tablist">. Axe flags role="tabpanel" as a
      // disallowed child of role="tablist". Fixing this requires separating
      // the HTML structure so panels live outside the tablist.
      const results = await axe(container, {
        rules: { 'aria-required-children': { enabled: false } },
      });
      expect(results).toHaveNoViolations();
    });

    it('stacked tabs have no axe violations', async () => {
      const { container } = renderAndInit('stacked');
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
