/**
 * Desktop keyboard regressions from unisdr/undrr-mangrove#1499.
 *
 * jsdom applies no stylesheet, so the mobile destination list that CSS hides
 * on desktop is hidden here with an inline style, as the browser would.
 * `scripts/test-megamenu-keyboard-browser.mjs` checks the same paths against
 * the real stylesheet.
 */
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import MegaMenu from '../MegaMenu';

const sections = [
  {
    title: 'Knowledge',
    bannerHeading: 'Knowledge',
    bannerDescription: 'Resources and insights.',
    items: [
      {
        title: 'Publications',
        url: '/publications',
        items: [
          { title: 'Global report', url: '/global-report' },
          {
            title: 'Policy briefs',
            url: '/policy-briefs',
            items: [{ title: 'Guidelines', url: '/guidelines' }],
          },
        ],
      },
      {
        title: 'Risk information',
        url: '/risk',
        items: [{ title: 'Risk data', url: '/risk-data' }],
      },
    ],
  },
  {
    title: 'News',
    bannerHeading: 'News',
    bannerDescription: 'Latest updates.',
    items: [
      {
        title: 'Stories',
        url: '/stories',
        items: [{ title: 'Features', url: '/features' }],
      },
    ],
  },
  {
    title: 'Promo',
    bannerDescription:
      '<p>Banner-only panel with <a href="/promo">a link</a>.</p>',
  },
];

const renderDesktop = (props = {}, data = sections) => {
  render(<MegaMenu sections={data} {...props} />);
  document.querySelectorAll('.mg-mega-content__menu--mobile').forEach(list => {
    list.style.display = 'none';
  });
  const trigger = screen.getByRole('button', { name: 'Knowledge' });
  const panel = document.querySelectorAll('.mg-mega-content')[0];
  return { trigger, panel };
};

// Enter and Space on a button dispatch a click with no pointer clicks.
const keyboardClick = element => fireEvent.click(element, { detail: 0 });

describe('MegaMenu desktop trigger activation', () => {
  it('opens immediately on keyboard activation and closes on a second one', () => {
    const { trigger, panel } = renderDesktop();
    trigger.focus();
    keyboardClick(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveAttribute('inert');

    keyboardClick(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('inert');
  });

  it('reopens with Enter after Escape closed the panel', () => {
    const { trigger, panel } = renderDesktop();
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(panel, { key: 'Escape' });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    keyboardClick(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('switches to its own panel when another section was opened by pointer', () => {
    const { trigger } = renderDesktop();
    const other = screen.getByRole('button', { name: 'News' });
    trigger.focus();
    keyboardClick(other);
    expect(other).toHaveAttribute('aria-expanded', 'true');

    keyboardClick(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(other).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps a hover-opened panel open when the pointer clicks its trigger', () => {
    jest.useFakeTimers();
    try {
      const { trigger } = renderDesktop();
      fireEvent.mouseEnter(trigger.closest('li'));
      act(() => jest.advanceTimersByTime(500));
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(trigger, { detail: 1 });
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps a focus-opened panel open on Enter after a pause, then closes on the next', () => {
    jest.useFakeTimers();
    try {
      const { trigger, panel } = renderDesktop();
      act(() => trigger.focus());
      // Focus opens the panel once the hover delay has passed.
      act(() => jest.advanceTimersByTime(500));
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      keyboardClick(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(panel).not.toHaveAttribute('inert');

      keyboardClick(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps open a panel that hovering opened when Enter is pressed on it', () => {
    jest.useFakeTimers();
    try {
      const { trigger } = renderDesktop({ hoverDelay: 0 });
      fireEvent.mouseEnter(trigger.closest('li'));
      act(() => jest.advanceTimersByTime(10));
      act(() => trigger.focus());
      act(() => jest.advanceTimersByTime(10));
      keyboardClick(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    } finally {
      jest.useRealTimers();
    }
  });

  it('opens a banner-only panel with Enter and announces its state', () => {
    renderDesktop();
    const promo = screen.getByRole('button', { name: 'Promo' });
    expect(promo).toHaveAttribute('aria-expanded', 'false');
    keyboardClick(promo);
    expect(promo).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('MegaMenu desktop panel arrow keys', () => {
  const openPanel = () => {
    const result = renderDesktop();
    result.trigger.focus();
    keyboardClick(result.trigger);
    return result;
  };

  it('moves right from the first category into its visible destinations', () => {
    const { panel } = openPanel();
    const publications = within(panel)
      .getAllByRole('menuitem', { name: 'Publications' })
      .find(link => link.closest('.mg-mega-content__section-list'));
    publications.focus();

    fireEvent.keyDown(publications, { key: 'ArrowRight' });
    const desktop = panel.querySelector('.mg-mega-content__menu--desktop');
    expect(document.activeElement).toBe(
      within(desktop).getByRole('menuitem', { name: 'Global report' })
    );

    // The nested destination is reachable without leaving the category.
    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(
      within(desktop).getByRole('menuitem', { name: 'Guidelines' })
    );
  });

  it('never moves focus onto links in the hidden mobile list', () => {
    const { panel } = openPanel();
    const mobile = panel.querySelector('.mg-mega-content__menu--mobile');
    panel.focus();
    for (let i = 0; i < 12; i++) {
      fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
      expect(mobile.contains(document.activeElement)).toBe(false);
      if (!panel.contains(document.activeElement)) break;
    }
    // Leaving the end of the panel reaches the next top-bar item.
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'News' })
    );
  });

  it('continues from wherever focus is after a pointer or Tab move', () => {
    const { panel } = openPanel();
    const desktop = panel.querySelector('.mg-mega-content__menu--desktop');
    const report = within(desktop).getByRole('menuitem', {
      name: 'Global report',
    });
    report.focus();
    fireEvent.keyDown(report, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(
      within(desktop).getByRole('menuitem', { name: 'Policy briefs' })
    );
  });

  it('moves left from destinations back to the active category', () => {
    const { panel } = openPanel();
    const desktop = panel.querySelector('.mg-mega-content__menu--desktop');
    const report = within(desktop).getByRole('menuitem', {
      name: 'Global report',
    });
    report.focus();
    fireEvent.keyDown(report, { key: 'ArrowLeft' });
    expect(document.activeElement).toHaveClass(
      'mg-mega-content__section-list-link--active'
    );
    expect(document.activeElement).toHaveTextContent('Publications');
  });

  it('leaves Tab to the browser', () => {
    const { panel } = openPanel();
    panel.focus();
    const tab = fireEvent.keyDown(panel, { key: 'Tab' });
    // fireEvent returns false when the handler called preventDefault.
    expect(tab).toBe(true);
    expect(panel).toHaveFocus();
  });
  it('steps over links that cannot take focus', () => {
    const data = [
      {
        ...sections[0],
        items: [
          {
            title: 'Publications',
            url: '/publications',
            items: [
              { title: 'Global report', url: '/global-report' },
              { title: 'No address' },
              { title: 'Policy briefs', url: '/policy-briefs' },
            ],
          },
        ],
      },
    ];
    const { trigger, panel } = renderDesktop({}, data);
    act(() => trigger.focus());
    keyboardClick(trigger);
    const desktop = panel.querySelector('.mg-mega-content__menu--desktop');
    within(desktop).getByRole('menuitem', { name: 'Global report' }).focus();
    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(
      within(desktop).getByRole('menuitem', { name: 'Policy briefs' })
    );
  });

  it('starts from inside a focused column rather than the top of the panel', () => {
    const { panel } = openPanel();
    const right = panel.querySelector('.mg-mega-content__right');
    const desktop = panel.querySelector('.mg-mega-content__menu--desktop');
    right.focus();
    fireEvent.keyDown(right, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(
      within(desktop).getByRole('menuitem', { name: 'Global report' })
    );
    right.focus();
    fireEvent.keyDown(right, { key: 'ArrowUp' });
    // The item before the destinations column is the last category.
    expect(document.activeElement).toHaveTextContent('Risk information');
  });

  it('keeps ArrowRight inside the destinations column where it is', () => {
    const { panel } = openPanel();
    const desktop = panel.querySelector('.mg-mega-content__menu--desktop');
    const guidelines = within(desktop).getByRole('menuitem', {
      name: 'Guidelines',
    });
    guidelines.focus();
    fireEvent.keyDown(guidelines, { key: 'ArrowRight' });
    expect(guidelines).toHaveFocus();
  });

  it('swaps left and right in right-to-left layouts', () => {
    const { panel } = openPanel();
    panel.style.direction = 'rtl';
    const desktop = panel.querySelector('.mg-mega-content__menu--desktop');
    const publications = within(panel)
      .getAllByRole('menuitem', { name: 'Publications' })
      .find(link => link.closest('.mg-mega-content__section-list'));
    publications.focus();
    // In RTL the destinations column sits to the left of the categories.
    fireEvent.keyDown(publications, { key: 'ArrowRight' });
    expect(publications).toHaveFocus();
    fireEvent.keyDown(publications, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(
      within(desktop).getByRole('menuitem', { name: 'Global report' })
    );
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(publications);
  });
});
