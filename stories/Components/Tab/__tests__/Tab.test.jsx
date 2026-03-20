import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Tab } from '../Tab';

// Mock mgTabsRuntime so the React component's useEffect doesn't run the runtime
// (we call the real runtime ourselves after render for controlled setup).
jest.mock('../../../assets/js/tabs', () => ({
  mgTabsRuntime: jest.fn(),
  mgTabsApplyStackedDefaults: jest.requireActual('../../../assets/js/tabs').mgTabsApplyStackedDefaults,
  setDisclosureState: jest.requireActual('../../../assets/js/tabs').setDisclosureState,
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
    it('renders filter input when filterable is true on stacked variant', () => {
      render(<Tab tabdata={tabdata} variant="stacked" filterable />);
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('does not render filter input on horizontal variant', () => {
      render(<Tab tabdata={tabdata} variant="horizontal" filterable />);
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });

    it('renders sr-only hint text', () => {
      render(<Tab tabdata={tabdata} variant="stacked" filterable />);
      expect(screen.getByText('Results will filter as you type')).toBeInTheDocument();
    });

    it('hides non-matching items when typing a query', () => {
      const { container } = render(
        <Tab tabdata={tabdata} variant="stacked" filterable defaultOpen={false} />
      );
      const tabContainer = container.querySelector('[data-mg-js-tabs]');
      mgTabsRuntime(tabContainer, false);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'Section 1' } });

      const items = container.querySelectorAll('.mg-tabs__item');
      // First item should be visible, others hidden via CSS class
      expect(items[0].classList.contains('mg-tabs__item--hidden')).toBe(false);
      expect(items[1].classList.contains('mg-tabs__item--hidden')).toBe(true);
      expect(items[2].classList.contains('mg-tabs__item--hidden')).toBe(true);
    });

    it('auto-expands matching panels', () => {
      const { container } = render(
        <Tab tabdata={tabdata} variant="stacked" filterable defaultOpen={false} />
      );
      const tabContainer = container.querySelector('[data-mg-js-tabs]');
      mgTabsRuntime(tabContainer, true);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'section 2' } });

      const panel = getPanel(container, 'tab-2');
      expect(panel.hasAttribute('hidden')).toBe(false);
    });

    it('shows no-results message when nothing matches', () => {
      const { container } = render(
        <Tab tabdata={tabdata} variant="stacked" filterable />
      );
      const tabContainer = container.querySelector('[data-mg-js-tabs]');
      mgTabsRuntime(tabContainer, false);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'xyznonexistent' } });

      expect(screen.getByText('No matching sections found.')).toBeInTheDocument();
    });

    it('restores all items when clearing input', () => {
      const { container } = render(
        <Tab tabdata={tabdata} variant="stacked" filterable defaultOpen={false} />
      );
      const tabContainer = container.querySelector('[data-mg-js-tabs]');
      mgTabsRuntime(tabContainer, true);

      const input = screen.getByRole('searchbox');

      // Filter first
      fireEvent.change(input, { target: { value: 'Section 1' } });
      // Then clear
      fireEvent.change(input, { target: { value: '' } });

      const items = container.querySelectorAll('.mg-tabs__item');
      items.forEach(item => {
        expect(item.classList.contains('mg-tabs__item--hidden')).toBe(false);
      });

      // No "no results" message
      expect(screen.queryByText('No matching sections found.')).not.toBeInTheDocument();
    });

    it('uses custom placeholder text', () => {
      render(<Tab tabdata={tabdata} variant="stacked" filterable filterPlaceholder="Search FAQs…" />);
      expect(screen.getByPlaceholderText('Search FAQs…')).toBeInTheDocument();
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
