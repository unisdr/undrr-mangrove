import React from 'react';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from '@testing-library/react';
import { axe } from 'jest-axe';
import { Tab } from '../Tab';

// Mock mgTabsRuntime so the React component's useEffect doesn't run the runtime
// (we call the real runtime ourselves after render for controlled setup).
jest.mock('../../../assets/js/tabs', () => ({
  mgTabsRuntime: jest.fn(),
  mgTabsDestroy: (...args) =>
    jest.requireActual('../../../assets/js/tabs').mgTabsDestroy(...args),
}));

// Import the real module for direct runtime testing
const { mgTabsRuntime, mgTabsDestroy } = jest.requireActual(
  '../../../assets/js/tabs'
);

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
function renderAndInit(
  variant = 'horizontal',
  activateDeepLink = false,
  extraProps = {}
) {
  const result = render(
    <Tab
      tabdata={tabdata}
      variant={variant}
      {...(variant === 'stacked' && !activateDeepLink
        ? { defaultOpen: false }
        : {})}
      {...extraProps}
    />
  );
  const tabContainer = result.container.querySelector('[data-mg-js-tabs]');
  mgTabsRuntime(tabContainer, activateDeepLink);
  return { ...result, container: result.container, tabContainer };
}

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe('Tab', () => {
  beforeEach(() => {
    // Tests override this to verify horizontal semantics at narrow widths.
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    mgTabsDestroy(document);
    cleanup();
    window.history.replaceState(null, '', window.location.pathname);
    jest.restoreAllMocks();
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

  describe('horizontal rail behaviour', () => {
    it.each([320, 375, 479, 480, 481])('keeps tab semantics at %ipx', width => {
      window.innerWidth = width;
      const { tabContainer } = renderAndInit();
      expect(tabContainer.querySelectorAll('[role="tab"]')).toHaveLength(3);
      expect(tabContainer.querySelectorAll('[role="tabpanel"]')).toHaveLength(
        3
      );
      expect(tabContainer.querySelector('[role="button"]')).toBeNull();
    });

    it('names the tablist and keeps panels outside its scrollport', () => {
      const { tabContainer } = renderAndInit('horizontal', true, {
        labels: { tabListLabel: 'Project stages' },
      });
      const list = tabContainer.querySelector('[role="tablist"]');
      expect(list).toHaveAccessibleName('Project stages');
      expect(list.children).toHaveLength(3);
      expect(list.closest('.mg-tabs__scroll')).not.toBeNull();
      tabContainer.querySelectorAll('[role="tabpanel"]').forEach(panel => {
        expect(panel.closest('.mg-tabs__scroll')).toBeNull();
        expect(panel.closest('.mg-tabs__panels')).not.toBeNull();
      });
    });

    it('uses a default accessible tablist name', () => {
      const { tabContainer } = renderAndInit();
      expect(
        tabContainer.querySelector('[role="tablist"]')
      ).toHaveAccessibleName('Sections');
    });

    it.each(['default', 'hash'])(
      'selects an initial %s without taking focus or scrolling the page',
      mode => {
        const result = render(
          <>
            <button>Before tabs</button>
            <Tab
              tabdata={tabdata.map((tab, i) => ({
                ...tab,
                is_default: mode === 'default' && i === 2 ? 'true' : undefined,
              }))}
            />
          </>
        );
        const container = result.container.querySelector('[data-mg-js-tabs]');
        const before = screen.getByRole('button', { name: 'Before tabs' });
        before.focus();
        if (mode === 'hash')
          window.history.replaceState(null, '', '#mg-tabs__section-tab-3');
        const scrollPage = jest
          .spyOn(window, 'scrollTo')
          .mockImplementation(() => {});
        const panel = getPanel(container, 'tab-3');
        panel.scrollIntoView = jest.fn();

        mgTabsRuntime(container, true);

        expect(
          container.querySelector('[aria-selected="true"]')
        ).toHaveTextContent('Section 3');
        expect(panel).not.toHaveAttribute('hidden');
        expect(document.activeElement).toBe(before);
        expect(panel.scrollIntoView).not.toHaveBeenCalled();
        expect(scrollPage).not.toHaveBeenCalled();
      }
    );

    it('activates and focuses tabs with Home/End and RTL arrows, then Down focuses the panel', () => {
      const { tabContainer } = renderAndInit();
      tabContainer.style.direction = 'rtl';
      const tabs = tabContainer.querySelectorAll('[role="tab"]');
      tabs[0].focus();
      fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(tabs[1]);
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      fireEvent.keyDown(tabs[1], { key: 'ArrowRight' });
      expect(document.activeElement).toBe(tabs[0]);
      fireEvent.keyDown(tabs[0], { key: 'End' });
      expect(document.activeElement).toBe(tabs[2]);
      expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
      fireEvent.keyDown(tabs[2], { key: 'ArrowDown' });
      expect(document.activeElement).toBe(getPanel(tabContainer, 'tab-3'));
      fireEvent.keyDown(tabs[2], { key: 'Home' });
      expect(document.activeElement).toBe(tabs[0]);
      expect(Array.from(tabs).filter(tab => tab.tabIndex === 0)).toEqual([
        tabs[0],
      ]);
      expect(getPanel(tabContainer, 'tab-3')).toHaveAttribute('hidden');
    });

    it('pointer selection retains focus on the trigger', () => {
      const { tabContainer } = renderAndInit();
      const tab = tabContainer.querySelectorAll('[role="tab"]')[2];
      fireEvent.click(tab);
      expect(document.activeElement).toBe(tab);
      expect(getPanel(tabContainer, 'tab-3')).not.toHaveAttribute('hidden');
    });

    it.each(['ltr', 'rtl'])(
      'reveals tabs and reports logical overflow without selecting on scroll (%s)',
      direction => {
        const result = render(<Tab tabdata={tabdata} />);
        const container = result.container.querySelector('[data-mg-js-tabs]');
        container.style.direction = direction;
        const scroller = container.querySelector('.mg-tabs__scroll');
        const list = container.querySelector('.mg-tabs__list');
        const tabs = container.querySelectorAll('.mg-tabs__link');
        let viewportWidth = 200;
        let offset = 0;
        const contentWidth = 600;
        const rectangle = (left, width) => ({
          left,
          right: left + width,
          width,
          top: 0,
          bottom: 44,
          height: 44,
        });
        const listLeft = () =>
          direction === 'rtl' ? viewportWidth - contentWidth - offset : -offset;
        Object.defineProperties(scroller, {
          clientWidth: { get: () => viewportWidth },
          scrollWidth: { get: () => contentWidth },
        });
        scroller.getBoundingClientRect = () => rectangle(0, viewportWidth);
        list.getBoundingClientRect = () => rectangle(listLeft(), contentWidth);
        tabs.forEach((tab, i) => {
          tab.getBoundingClientRect = () =>
            rectangle(
              listLeft() + (direction === 'rtl' ? 2 - i : i) * 200,
              200
            );
        });
        scroller.scrollBy = jest.fn(({ left }) => {
          const limit = Math.max(0, contentWidth - viewportWidth);
          offset =
            direction === 'rtl'
              ? Math.max(-limit, Math.min(0, offset + left))
              : Math.max(0, Math.min(limit, offset + left));
        });
        mgTabsRuntime(container, true);
        const rail = container.querySelector('.mg-tabs__rail');
        expect(offset).toBe(0);
        expect(rail).not.toHaveAttribute('data-mg-tabs-overflow-start');
        expect(rail).toHaveAttribute('data-mg-tabs-overflow-end');

        fireEvent.click(tabs[2]);
        expect(Math.abs(offset)).toBe(400);
        expect(rail).toHaveAttribute('data-mg-tabs-overflow-start');
        expect(rail).not.toHaveAttribute('data-mg-tabs-overflow-end');
        const revealCalls = scroller.scrollBy.mock.calls.length;
        offset = direction === 'rtl' ? -100 : 100;
        fireEvent.scroll(scroller);
        expect(rail).toHaveAttribute('data-mg-tabs-overflow-start');
        expect(rail).toHaveAttribute('data-mg-tabs-overflow-end');
        expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
        expect(document.activeElement).toBe(tabs[2]);
        expect(scroller.scrollBy).toHaveBeenCalledTimes(revealCalls);

        fireEvent(window, new Event('orientationchange'));
        expect(Math.abs(offset)).toBe(400);
        viewportWidth = contentWidth;
        fireEvent.resize(window);
        expect(rail).not.toHaveAttribute('data-mg-tabs-overflow-start');
        expect(rail).not.toHaveAttribute('data-mg-tabs-overflow-end');
        expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
      }
    );

    it('disconnects resize observers and removes viewport listeners on destroy', () => {
      const OriginalResizeObserver = global.ResizeObserver;
      const observers = [];
      global.ResizeObserver = class {
        constructor(callback) {
          this.callback = callback;
          this.observe = jest.fn();
          this.disconnect = jest.fn();
          observers.push(this);
        }
      };
      try {
        const { tabContainer } = renderAndInit();
        const scroller = tabContainer.querySelector('.mg-tabs__scroll');
        scroller.scrollBy = jest.fn();
        expect(observers).toHaveLength(1);
        expect(observers[0].observe).toHaveBeenCalledWith(scroller);
        mgTabsRuntime(tabContainer, true);
        expect(observers).toHaveLength(1);
        mgTabsDestroy(tabContainer);
        expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
        fireEvent.resize(window);
        fireEvent(window, new Event('orientationchange'));
        observers[0].callback();
        expect(scroller.scrollBy).not.toHaveBeenCalled();
      } finally {
        global.ResizeObserver = OriginalResizeObserver;
      }
    });

    it('enhances legacy interleaved markup without replacing panel content', () => {
      const result = render(<div />);
      result.container.firstElementChild.innerHTML = `<article class="mg-tabs mg-tabs--horizontal" data-mg-js-tabs>
        <ul class="mg-tabs__list">${tabdata
          .map(
            tab => `<li class="mg-tabs__item"><a class="mg-tabs__link" href="#mg-tabs__section-${tab.text_id}">${tab.text}</a></li>
        <li class="mg-tabs-content" data-mg-js-tabs-content><section class="mg-tabs__section" id="mg-tabs__section-${tab.text_id}">${tab.data}</section></li>`
          )
          .join('')}</ul></article>`;
      const container = result.container.firstElementChild.firstElementChild;
      const originalPanel = getPanel(container, 'tab-3');
      const click = jest.fn();
      originalPanel.addEventListener('click', click);
      mgTabsRuntime(container, true);
      mgTabsRuntime(container, true);
      expect(container.querySelectorAll('.mg-tabs__rail')).toHaveLength(1);
      expect(
        container.querySelector('[role="tablist"]').querySelector('section')
      ).toBeNull();
      expect(getPanel(container, 'tab-3')).toBe(originalPanel);
      fireEvent.click(originalPanel);
      expect(click).toHaveBeenCalledTimes(1);
      mgTabsDestroy(container);
    });

    it('supports a legacy v1 tablist with shared sibling panel content through reinitialisation', () => {
      const result = render(<div />);
      const host = result.container.firstElementChild;
      host.innerHTML = `<article class="mg-tabs"><ul class="mg-tabs__list" data-mg-js-tabs>
        ${tabdata.map(tab => `<li class="mg-tabs__item"><a class="mg-tabs__link" href="#mg-tabs__section-${tab.text_id}">${tab.text}</a></li>`).join('')}
        </ul><div class="mg-tabs-content" data-mg-js-tabs-content>
        ${tabdata.map(tab => `<section class="mg-tabs__section" id="mg-tabs__section-${tab.text_id}">${tab.data}</section>`).join('')}</div></article>`;
      const list = host.querySelector('[data-mg-js-tabs]');
      const originalPanel = getPanel(host, 'tab-3');
      for (let cycle = 0; cycle < 2; cycle++) {
        mgTabsRuntime(host, true);
        expect(host.querySelectorAll('.mg-tabs__rail')).toHaveLength(1);
        expect(list.querySelector('[role="tabpanel"]')).toBeNull();
        fireEvent.click(list.querySelectorAll('[role="tab"]')[2]);
        expect(getPanel(host, 'tab-3')).toBe(originalPanel);
        expect(originalPanel).not.toHaveAttribute('hidden');
        expect(getPanel(host, 'tab-1')).toHaveAttribute('hidden');
        mgTabsDestroy(host);
        expect(host.querySelector('.mg-tabs__rail')).toBeNull();
        expect(originalPanel).not.toHaveAttribute('hidden');
      }
    });

    it('keeps nested tab sets independent when either selection changes', () => {
      const { tabContainer } = renderAndInit();
      mgTabsDestroy(tabContainer);
      const nestedHost = getPanel(tabContainer, 'tab-1');
      const nestedData = tabdata.map(tab => ({
        ...tab,
        text_id: `nested-${tab.text_id}`,
      }));
      const nested = render(<Tab tabdata={nestedData} />, {
        container: nestedHost,
      });
      const nestedContainer =
        nested.container.querySelector('[data-mg-js-tabs]');
      mgTabsRuntime(tabContainer, true);
      const nestedTabs = nestedContainer.querySelectorAll('[role="tab"]');
      const outerTabs = tabContainer
        .querySelector('.mg-tabs__list')
        .querySelectorAll('[role="tab"]');
      fireEvent.click(nestedTabs[2]);
      expect(outerTabs[0]).toHaveAttribute('aria-selected', 'true');
      fireEvent.click(outerTabs[1]);
      expect(nestedTabs[2]).toHaveAttribute('aria-selected', 'true');
      fireEvent.click(outerTabs[0]);
      expect(getPanel(nestedContainer, 'nested-tab-3')).not.toHaveAttribute(
        'hidden'
      );
      nested.unmount();
    });

    it('keeps scoped instances independent through hash changes and cleanup', () => {
      const secondData = tabdata.map(tab => ({
        ...tab,
        text_id: `other-${tab.text_id}`,
      }));
      const result = render(
        <>
          <Tab tabdata={tabdata} />
          <Tab tabdata={secondData} />
        </>
      );
      const [first, second] =
        result.container.querySelectorAll('[data-mg-js-tabs]');
      mgTabsRuntime(result.container, true);
      fireEvent.click(first.querySelectorAll('[role="tab"]')[1]);
      expect(second.querySelector('[aria-selected="true"]')).toHaveTextContent(
        'Section 1'
      );
      window.history.replaceState(null, '', '#mg-tabs__section-other-tab-3');
      fireEvent(window, new HashChangeEvent('hashchange'));
      expect(first.querySelector('[aria-selected="true"]')).toHaveTextContent(
        'Section 2'
      );
      expect(second.querySelector('[aria-selected="true"]')).toHaveTextContent(
        'Section 3'
      );
      mgTabsDestroy(second);
      const stateAfterDestroy = second.innerHTML;
      window.history.replaceState(null, '', '#mg-tabs__section-other-tab-1');
      fireEvent(window, new HashChangeEvent('hashchange'));
      expect(second.innerHTML).toBe(stateAfterDestroy);
      mgTabsRuntime(second, true);
      expect(second.querySelectorAll('.mg-tabs__rail')).toHaveLength(1);
      expect(second.querySelector('[aria-selected="true"]')).toHaveTextContent(
        'Section 1'
      );
    });

    it('cleans up and reinitialises when React data and variant change', () => {
      const runtimeMock = jest.requireMock(
        '../../../assets/js/tabs'
      ).mgTabsRuntime;
      runtimeMock.mockImplementation(mgTabsRuntime);
      try {
        const result = render(<Tab tabdata={tabdata} />);
        const nextData = [
          ...tabdata,
          { text: 'Section 4', text_id: 'tab-4', data: '<p>New content</p>' },
        ];
        result.rerender(
          <Tab
            tabdata={nextData}
            labels={{ tabListLabel: 'Updated sections' }}
          />
        );
        expect(screen.getByRole('tablist')).toHaveAccessibleName(
          'Updated sections'
        );
        fireEvent.click(screen.getByRole('tab', { name: 'Section 4' }));
        expect(screen.getByRole('tabpanel')).toHaveTextContent('New content');
        result.rerender(
          <Tab
            tabdata={nextData}
            variant="stacked"
            filterable
            defaultOpen={false}
          />
        );
        expect(screen.queryByRole('tablist')).toBeNull();
        expect(screen.getAllByRole('searchbox')).toHaveLength(1);
        const disclosure = screen.getByRole('button', { name: 'Section 4' });
        fireEvent.click(disclosure);
        expect(disclosure).toHaveAttribute('aria-expanded', 'true');
        result.unmount();
      } finally {
        runtimeMock.mockReset();
      }
    });
  });

  // -------------------------------------------------------
  // Stacked toggle behavior
  // -------------------------------------------------------

  describe('stacked toggle behavior', () => {
    it('reveals a find-in-page match and synchronises the disclosure trigger', () => {
      const { tabContainer } = renderAndInit('stacked', false, {
        singleOpen: true,
      });
      const triggers = tabContainer.querySelectorAll('.mg-tabs__link');
      fireEvent.click(triggers[0]);
      const match = getPanel(tabContainer, 'tab-3');
      fireEvent(match, new Event('beforematch'));
      expect(match).not.toHaveAttribute('hidden');
      expect(triggers[2]).toHaveAttribute('aria-expanded', 'true');
      expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
    });

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
      const { tabContainer } = renderAndInit('stacked', true, {
        defaultOpen: false,
      });
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');
      const panels = tabContainer.querySelectorAll('section.mg-tabs__section');

      panels.forEach((panel, i) => {
        expect(panel.getAttribute('hidden')).toBe('until-found');
        expect(tabs[i].getAttribute('aria-expanded')).toBe('false');
      });
    });

    it('all panels start open when defaultOpen={true}', () => {
      const { tabContainer } = renderAndInit('stacked', true, {
        defaultOpen: true,
      });
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
        {
          text: 'Section 2',
          text_id: 'tab-2',
          data: '<p>Content 2</p>',
          is_default: 'true',
        },
        { text: 'Section 3', text_id: 'tab-3', data: '<p>Content 3</p>' },
      ];
      const result = render(
        <Tab tabdata={dataWithDefault} variant="stacked" defaultOpen={false} />
      );
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
      const { tabContainer } = renderAndInit('stacked', false, {
        singleOpen: true,
      });
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
      const { tabContainer } = renderAndInit('stacked', false, {
        singleOpen: true,
      });
      const tabs = tabContainer.querySelectorAll('.mg-tabs__link');

      // Open each panel in turn, verify only one is open
      fireEvent.click(tabs[0]);
      fireEvent.click(tabs[2]);

      const panels = tabContainer.querySelectorAll('section.mg-tabs__section');
      const openPanels = Array.from(panels).filter(
        p => !p.hasAttribute('hidden')
      );
      expect(openPanels).toHaveLength(1);
      expect(openPanels[0].id).toBe('mg-tabs__section-tab-3');
    });

    it('can close the only open panel by clicking it again', () => {
      const { tabContainer } = renderAndInit('stacked', false, {
        singleOpen: true,
      });
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
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    /** Helper: type into the runtime-injected filter input and flush the debounce */
    function typeFilter(container, value) {
      const input = container.querySelector('.mg-tabs__filter-input');
      input.value = value;
      fireEvent.input(input);
      jest.advanceTimersByTime(200); // flush 150ms debounce
    }

    it('renders filter input when filterable is true on stacked variant', () => {
      const { tabContainer } = renderAndInit('stacked', false, {
        filterable: true,
      });
      expect(
        tabContainer.querySelector('.mg-tabs__filter-input')
      ).toBeInTheDocument();
    });

    it('does not render filter input on horizontal variant', () => {
      const { tabContainer } = renderAndInit('horizontal', false, {
        filterable: true,
      });
      expect(
        tabContainer.querySelector('.mg-tabs__filter-input')
      ).not.toBeInTheDocument();
    });

    it('renders sr-only hint text', () => {
      const { tabContainer } = renderAndInit('stacked', false, {
        filterable: true,
      });
      expect(tabContainer.querySelector('.mg-u-sr-only')).toBeInTheDocument();
      expect(tabContainer.querySelector('.mg-u-sr-only').textContent).toBe(
        'Results will filter as you type'
      );
    });

    it('hides non-matching items when typing a query', () => {
      const { tabContainer } = renderAndInit('stacked', false, {
        filterable: true,
        defaultOpen: false,
      });

      typeFilter(tabContainer, 'Section 1');

      const items = tabContainer.querySelectorAll('.mg-tabs__item');
      expect(items[0].classList.contains('mg-tabs__item--hidden')).toBe(false);
      expect(items[1].classList.contains('mg-tabs__item--hidden')).toBe(true);
      expect(items[2].classList.contains('mg-tabs__item--hidden')).toBe(true);
    });

    it('auto-expands matching panels', () => {
      const { tabContainer } = renderAndInit('stacked', true, {
        filterable: true,
        defaultOpen: false,
      });

      typeFilter(tabContainer, 'section 2');

      const panel = getPanel(tabContainer, 'tab-2');
      expect(panel.hasAttribute('hidden')).toBe(false);
    });

    it('shows no-results message when nothing matches', () => {
      const { tabContainer } = renderAndInit('stacked', false, {
        filterable: true,
      });

      typeFilter(tabContainer, 'xyznonexistent');

      const noResults = tabContainer.querySelector('.mg-tabs__no-results');
      expect(noResults).toBeInTheDocument();
      expect(noResults.classList.contains('mg-tabs__no-results--hidden')).toBe(
        false
      );
    });

    it('restores all items when clearing input', () => {
      const { tabContainer } = renderAndInit('stacked', true, {
        filterable: true,
        defaultOpen: false,
      });

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
      expect(noResults.classList.contains('mg-tabs__no-results--hidden')).toBe(
        true
      );
    });

    it('matches all words independently (AND logic, not exact phrase)', () => {
      const { tabContainer } = renderAndInit('stacked', false, {
        filterable: true,
      });

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
      const { tabContainer } = renderAndInit('stacked', false, {
        filterable: true,
      });

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
        labels: { filterPlaceholder: 'Search FAQs\u2026' },
      });
      const input = tabContainer.querySelector('.mg-tabs__filter-input');
      expect(input.placeholder).toBe('Search FAQs\u2026');
    });
  });

  // -------------------------------------------------------
  // mgTabs lifecycle (wrapper function)
  // -------------------------------------------------------

  describe('mgTabs lifecycle', () => {
    const { mgTabs: realMgTabs } = jest.requireActual(
      '../../../assets/js/tabs'
    );

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

  describe('optional mobile stacking', () => {
    function resizeTo(width) {
      window.innerWidth = width;
      fireEvent.resize(window);
    }

    it.each([375, 479, 480, 1024])(
      'uses disclosures only below 480px when opted in (%ipx)',
      width => {
        window.innerWidth = width;
        const { tabContainer } = renderAndInit('horizontal', true, {
          stackOnMobile: true,
        });
        expect(tabContainer).toHaveAttribute('data-mg-js-tabs-stack-on-mobile');
        expect(
          within(tabContainer).getAllByRole(width < 480 ? 'button' : 'tab')
        ).toHaveLength(3);
        expect(
          tabContainer.querySelectorAll(
            width < 480 ? '[role="region"]' : '[role="tabpanel"]'
          )
        ).toHaveLength(3);
        if (width < 480)
          expect(within(tabContainer).queryByRole('tablist')).toBeNull();
      }
    );

    it('keeps default horizontal tabs horizontal during viewport changes', () => {
      const { tabContainer } = renderAndInit();
      expect(tabContainer).not.toHaveAttribute(
        'data-mg-js-tabs-stack-on-mobile'
      );
      resizeTo(375);
      expect(within(tabContainer).getAllByRole('tab')).toHaveLength(3);
      resizeTo(1024);
      expect(within(tabContainer).getAllByRole('tab')).toHaveLength(3);
    });

    it('keeps explicit stacked sections stacked and preserves open panels at every width', () => {
      const { tabContainer } = renderAndInit('stacked', false, {
        stackOnMobile: true,
      });
      const triggers = tabContainer.querySelectorAll('[role="button"]');
      fireEvent.click(triggers[1]);
      resizeTo(375);
      resizeTo(1024);
      expect(within(tabContainer).getAllByRole('button')).toHaveLength(3);
      expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
      expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens the selected tab on mobile and restores the latest open interaction on desktop', () => {
      const { tabContainer } = renderAndInit('horizontal', true, {
        stackOnMobile: true,
      });
      const triggers = within(tabContainer).getAllByRole('tab');
      fireEvent.click(triggers[1]);
      resizeTo(375);
      const mobileTriggers = within(tabContainer).getAllByRole('button');
      expect(mobileTriggers[1]).toHaveAttribute('aria-expanded', 'true');
      expect(mobileTriggers[0]).toHaveAttribute('aria-expanded', 'false');
      expect(document.activeElement).toBe(mobileTriggers[1]);
      fireEvent.click(mobileTriggers[2]);
      expect(mobileTriggers[1]).toHaveAttribute('aria-expanded', 'true');
      expect(mobileTriggers[2]).toHaveAttribute('aria-expanded', 'true');
      resizeTo(480);
      expect(triggers[2]).toHaveAttribute('aria-selected', 'true');
      expect(getPanel(tabContainer, 'tab-2')).toHaveAttribute('hidden');
      expect(getPanel(tabContainer, 'tab-3')).not.toHaveAttribute('hidden');
      expect(document.activeElement).toBe(triggers[2]);
      expect(
        Array.from(triggers).filter(trigger => trigger.tabIndex === 0)
      ).toEqual([triggers[2]]);
    });

    it('supports disclosure keyboard navigation and panel associations in mobile mode', () => {
      window.innerWidth = 375;
      const { tabContainer } = renderAndInit('horizontal', true, {
        stackOnMobile: true,
      });
      const triggers = within(tabContainer).getAllByRole('button');
      triggers[0].focus();
      fireEvent.keyDown(triggers[0], { key: 'ArrowDown' });
      expect(document.activeElement).toBe(triggers[1]);
      expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
      fireEvent.keyDown(triggers[1], { key: 'Enter' });
      expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
      const panel = getPanel(tabContainer, 'tab-2');
      expect(triggers[1]).toHaveAttribute('aria-controls', panel.id);
      expect(panel).toHaveAttribute('aria-labelledby', triggers[1].id);
      expect(panel).not.toHaveAttribute('hidden');
    });

    it('keeps a focused control visible when returning from mobile with multiple panels open', () => {
      const data = tabdata.map(tab => ({
        ...tab,
        data: `<button>Action ${tab.text}</button>`,
      }));
      const { tabContainer } = renderAndInit('horizontal', true, {
        tabdata: data,
        stackOnMobile: true,
      });
      resizeTo(375);
      fireEvent.click(
        within(tabContainer).getByRole('button', { name: 'Section 3' })
      );
      const control = getPanel(tabContainer, 'tab-1').querySelector('button');
      control.focus();
      resizeTo(1024);
      expect(
        within(tabContainer).getByRole('tab', { name: 'Section 1' })
      ).toHaveAttribute('aria-selected', 'true');
      expect(getPanel(tabContainer, 'tab-1')).not.toHaveAttribute('hidden');
      expect(document.activeElement).toBe(control);
      expect(getPanel(tabContainer, 'tab-3')).toHaveAttribute('hidden');
    });

    it('preserves live form controls and their values across mobile and desktop transitions', () => {
      const data = tabdata.map(tab => ({
        ...tab,
        data: `<label>Notes ${tab.text}<input type="text" /></label>`,
      }));
      const { tabContainer } = renderAndInit('horizontal', true, {
        tabdata: data,
        stackOnMobile: true,
      });
      const panel = getPanel(tabContainer, 'tab-1');
      const input = panel.querySelector('input');
      const listener = jest.fn();
      input.addEventListener('input', listener);
      fireEvent.input(input, { target: { value: 'Unsaved notes' } });
      input.focus();
      resizeTo(375);
      expect(panel.querySelector('input')).toBe(input);
      expect(input).toHaveValue('Unsaved notes');
      expect(document.activeElement).toBe(input);
      resizeTo(1024);
      expect(panel.querySelector('input')).toBe(input);
      expect(input).toHaveValue('Unsaved notes');
      expect(document.activeElement).toBe(input);
      fireEvent.input(input, { target: { value: 'More unsaved notes' } });
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('restores a usable selected panel when every mobile disclosure is closed', () => {
      const { tabContainer } = renderAndInit('horizontal', true, {
        stackOnMobile: true,
      });
      const triggers = within(tabContainer).getAllByRole('tab');
      fireEvent.click(triggers[1]);
      resizeTo(375);
      fireEvent.click(
        within(tabContainer).getByRole('button', { name: 'Section 2' })
      );
      expect(tabContainer.querySelector('[aria-expanded="true"]')).toBeNull();
      resizeTo(1024);
      expect(triggers[1]).toHaveAttribute('aria-selected', 'true');
      expect(getPanel(tabContainer, 'tab-2')).not.toHaveAttribute('hidden');
      expect(document.activeElement).toBe(triggers[1]);
    });

    it('passes full accessibility checks after crossing the breakpoint in both directions', async () => {
      const { container } = renderAndInit('horizontal', true, {
        stackOnMobile: true,
      });
      resizeTo(375);
      expect(await axe(container)).toHaveNoViolations();
      resizeTo(480);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('switches opted-in legacy HTML without replacing panel content or duplicating wrappers', () => {
      const result = render(<div />);
      const host = result.container.firstElementChild;
      host.innerHTML = `<article class="mg-tabs mg-tabs--horizontal" data-mg-js-tabs data-mg-js-tabs-stack-on-mobile>
        <ul class="mg-tabs__list">${tabdata
          .map(
            tab => `<li class="mg-tabs__item"><a class="mg-tabs__link" href="#mg-tabs__section-${tab.text_id}">${tab.text}</a></li>
        <li class="mg-tabs-content" data-mg-js-tabs-content><section class="mg-tabs__section" id="mg-tabs__section-${tab.text_id}">${tab.data}</section></li>`
          )
          .join('')}</ul></article>`;
      const container = host.firstElementChild;
      const panel = getPanel(container, 'tab-2');
      mgTabsRuntime(container, true);
      const trigger = within(container).getByRole('tab', { name: 'Section 2' });
      fireEvent.click(trigger);
      for (let cycle = 0; cycle < 2; cycle++) {
        resizeTo(375);
        expect(
          within(container).getByRole('button', { name: 'Section 2' })
        ).toHaveAttribute('aria-expanded', 'true');
        resizeTo(1024);
        expect(trigger).toHaveAttribute('role', 'tab');
        expect(trigger).toHaveAttribute('aria-selected', 'true');
        expect(getPanel(container, 'tab-2')).toBe(panel);
        expect(container.querySelectorAll('.mg-tabs__rail')).toHaveLength(1);
      }
      mgTabsDestroy(container);
    });

    it('supports responsive v1 tablists whose panels are siblings outside the initialisation scope', () => {
      const result = render(<div />);
      const host = result.container.firstElementChild;
      host.innerHTML = `<article class="mg-tabs"><ul class="mg-tabs__list" data-mg-js-tabs data-mg-js-tabs-stack-on-mobile>
        ${tabdata.map(tab => `<li class="mg-tabs__item"><a class="mg-tabs__link" href="#mg-tabs__section-${tab.text_id}">${tab.text}</a></li>`).join('')}
        </ul><div class="mg-tabs-content" data-mg-js-tabs-content>
        ${tabdata.map(tab => `<section class="mg-tabs__section" id="mg-tabs__section-${tab.text_id}">${tab.data}</section>`).join('')}</div></article>`;
      const list = host.querySelector('[data-mg-js-tabs]');
      const originalPanel = getPanel(host, 'tab-3');
      window.innerWidth = 375;
      mgTabsRuntime(list, true);
      expect(within(host).getAllByRole('button')).toHaveLength(3);
      fireEvent.click(within(host).getByRole('button', { name: 'Section 3' }));
      expect(originalPanel).not.toHaveAttribute('hidden');
      resizeTo(1024);
      expect(
        within(host).getByRole('tab', { name: 'Section 3' })
      ).toHaveAttribute('aria-selected', 'true');
      expect(getPanel(host, 'tab-3')).toBe(originalPanel);
      resizeTo(375);
      expect(
        within(host).getByRole('button', { name: 'Section 3' })
      ).toHaveAttribute('aria-expanded', 'true');
      mgTabsDestroy(list);
      expect(host.querySelector('.mg-tabs__rail')).toBeNull();
      expect(getPanel(host, 'tab-3')).toBe(originalPanel);
    });

    it('stops responsive enhancement after destroy and supports reinitialisation', () => {
      const { tabContainer } = renderAndInit('horizontal', true, {
        stackOnMobile: true,
      });
      resizeTo(375);
      mgTabsDestroy(tabContainer);
      const markup = tabContainer.innerHTML;
      resizeTo(1024);
      resizeTo(375);
      expect(tabContainer.innerHTML).toBe(markup);
      mgTabsRuntime(tabContainer, true);
      expect(within(tabContainer).getAllByRole('button')).toHaveLength(3);
      resizeTo(1024);
      expect(within(tabContainer).getAllByRole('tab')).toHaveLength(3);
      expect(tabContainer.querySelectorAll('.mg-tabs__rail')).toHaveLength(1);
    });

    it('supports React opt-in and data updates while mobile without losing or duplicating panels', () => {
      const runtimeMock = jest.requireMock(
        '../../../assets/js/tabs'
      ).mgTabsRuntime;
      runtimeMock.mockImplementation(mgTabsRuntime);
      window.innerWidth = 375;
      try {
        const result = render(<Tab tabdata={tabdata} />);
        expect(screen.getAllByRole('tab')).toHaveLength(3);
        result.rerender(<Tab tabdata={tabdata} stackOnMobile />);
        expect(screen.getAllByRole('button')).toHaveLength(3);
        const nextData = [
          ...tabdata,
          { text: 'Section 4', text_id: 'tab-4', data: '<p>New content</p>' },
        ];
        result.rerender(<Tab tabdata={nextData} stackOnMobile />);
        fireEvent.click(screen.getByRole('button', { name: 'Section 4' }));
        expect(screen.getByText('New content')).toBeVisible();
        result.rerender(<Tab tabdata={nextData} stackOnMobile={false} />);
        expect(screen.getAllByRole('tab')).toHaveLength(4);
        expect(
          result.container.querySelectorAll('.mg-tabs__section')
        ).toHaveLength(4);
        result.unmount();
      } finally {
        runtimeMock.mockReset();
      }
    });
  });

  describe('accessibility', () => {
    it('horizontal tabs have no axe violations', async () => {
      const { container } = renderAndInit('horizontal');
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('stacked tabs have no axe violations', async () => {
      const { container } = renderAndInit('stacked');
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
