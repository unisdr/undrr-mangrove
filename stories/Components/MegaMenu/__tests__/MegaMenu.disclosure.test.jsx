/**
 * Desktop disclosure navigation (WAI-ARIA APG pattern), from
 * unisdr/undrr-mangrove#1499. See "Design principles" in MegaMenu.mdx.
 *
 * jsdom applies no stylesheet, so the mobile destination list that CSS hides
 * on desktop is hidden here with an inline style, as the browser would.
 * `scripts/test-megamenu-keyboard-browser.mjs` checks real Tab order and
 * layout against the stylesheet.
 */
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import MegaMenu from '../MegaMenu';

const sections = [
  {
    title: 'Knowledge',
    bannerHeading: 'Knowledge',
    bannerDescription: 'Resources and insights.',
    bannerButton: { label: 'Knowledge overview', url: '/knowledge' },
    items: [
      {
        title: 'Publications',
        url: '/publications',
        items: [
          { title: 'Global report', url: '/global-report' },
          { title: 'No address' },
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
    title: 'Directory',
    bannerButton: { url: '/directory' },
    items: [
      { title: 'Partners', url: '/partners' },
      { title: 'Offices', url: '/offices' },
    ],
  },
  {
    title: 'Promo',
    bannerDescription: '<p>Banner-only panel.</p>',
    bannerButton: { label: 'Read the promo', url: '/promo' },
  },
  { title: 'Search', bannerButton: { url: '/search' } },
];

const renderDesktop = (props = {}) => {
  const result = render(<MegaMenu sections={sections} {...props} />);
  document.querySelectorAll('.mg-mega-content__menu--mobile').forEach(list => {
    list.style.display = 'none';
  });
  return result;
};

const trigger = name => screen.getByRole('button', { name, exact: true });
const panelOf = button =>
  document.getElementById(button.getAttribute('aria-controls'));

describe('top-level disclosure buttons', () => {
  it('render as buttons for every section with a panel, and links otherwise', () => {
    renderDesktop();
    for (const name of ['Knowledge', 'Directory', 'Promo']) {
      expect(trigger(name)).toHaveAttribute('aria-expanded', 'false');
      expect(panelOf(trigger(name))).toHaveClass('mg-mega-content');
    }
    const search = screen.getByRole('link', { name: 'Search' });
    expect(search).toHaveAttribute('href', '/search');
    expect(search).not.toHaveAttribute('aria-expanded');
  });

  it('do not open on focus or hover, even after the former delays', () => {
    jest.useFakeTimers();
    try {
      renderDesktop({ hoverDelay: 0, delay: 0 });
      const knowledge = trigger('Knowledge');
      act(() => knowledge.focus());
      fireEvent.mouseEnter(knowledge.closest('li'));
      act(() => jest.advanceTimersByTime(1000));
      expect(knowledge).toHaveAttribute('aria-expanded', 'false');
      expect(panelOf(knowledge)).toHaveAttribute('inert');
    } finally {
      jest.useRealTimers();
    }
  });

  it('toggle on activation, whatever the input', () => {
    renderDesktop();
    const knowledge = trigger('Knowledge');
    for (const detail of [0, 1]) {
      fireEvent.click(knowledge, { detail });
      expect(knowledge).toHaveAttribute('aria-expanded', 'true');
      expect(panelOf(knowledge)).not.toHaveAttribute('inert');
      fireEvent.click(knowledge, { detail });
      expect(knowledge).toHaveAttribute('aria-expanded', 'false');
    }
  });

  it('keep one panel open at a time', () => {
    renderDesktop();
    fireEvent.click(trigger('Knowledge'));
    fireEvent.click(trigger('Directory'));
    expect(trigger('Knowledge')).toHaveAttribute('aria-expanded', 'false');
    expect(trigger('Directory')).toHaveAttribute('aria-expanded', 'true');
  });

  it('stay open when the pointer leaves', () => {
    jest.useFakeTimers();
    try {
      const { container } = renderDesktop();
      fireEvent.click(trigger('Knowledge'));
      fireEvent.mouseLeave(container.querySelector('.mg-mega-wrapper'));
      act(() => jest.advanceTimersByTime(1000));
      expect(trigger('Knowledge')).toHaveAttribute('aria-expanded', 'true');
    } finally {
      jest.useRealTimers();
    }
  });

  it('close when focus moves outside the navigation, not within it', () => {
    renderDesktop();
    const knowledge = trigger('Knowledge');
    fireEvent.click(knowledge);
    const outside = document.createElement('button');
    document.body.append(outside);
    try {
      fireEvent.blur(knowledge, { relatedTarget: trigger('Directory') });
      expect(knowledge).toHaveAttribute('aria-expanded', 'true');
      // A click on non-focusable content reports no related target.
      fireEvent.blur(knowledge, { relatedTarget: null });
      expect(knowledge).toHaveAttribute('aria-expanded', 'true');
      fireEvent.blur(knowledge, { relatedTarget: outside });
      expect(knowledge).toHaveAttribute('aria-expanded', 'false');
    } finally {
      outside.remove();
    }
  });

  it('close on Escape and return focus to the button', () => {
    renderDesktop();
    const knowledge = trigger('Knowledge');
    fireEvent.click(knowledge);
    const link = within(panelOf(knowledge)).getByRole('link', {
      name: 'Knowledge overview',
    });
    link.focus();
    fireEvent.keyDown(link, { key: 'Escape' });
    expect(knowledge).toHaveFocus();
    expect(knowledge).toHaveAttribute('aria-expanded', 'false');
  });

  it('move along the bar with arrows, Home and End', () => {
    renderDesktop();
    const knowledge = trigger('Knowledge');
    knowledge.focus();
    fireEvent.keyDown(knowledge, { key: 'ArrowRight' });
    expect(trigger('Directory')).toHaveFocus();
    fireEvent.keyDown(document.activeElement, { key: 'End' });
    expect(screen.getByRole('link', { name: 'Search' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement, { key: 'Home' });
    expect(knowledge).toHaveFocus();
  });
});

describe('landing pages stay reachable inside panels', () => {
  it('offers the section landing page in the banner', () => {
    renderDesktop();
    fireEvent.click(trigger('Knowledge'));
    expect(
      within(panelOf(trigger('Knowledge'))).getByRole('link', {
        name: 'Knowledge overview',
      })
    ).toHaveAttribute('href', '/knowledge');
  });

  it('leads the destinations with the landing page when there is no banner', () => {
    renderDesktop();
    fireEvent.click(trigger('Directory'));
    const desktop = panelOf(trigger('Directory')).querySelector(
      '.mg-mega-content__menu--desktop'
    );
    expect(within(desktop).getAllByRole('link')[0]).toHaveAttribute(
      'href',
      '/directory'
    );
  });

  it('follows banner-only copy with the landing page', () => {
    renderDesktop();
    fireEvent.click(trigger('Promo'));
    const panel = panelOf(trigger('Promo'));
    expect(panel).toHaveTextContent('Banner-only panel.');
    expect(
      within(panel).getByRole('link', { name: 'Read the promo' })
    ).toHaveAttribute('href', '/promo');
  });
});

describe('category disclosure buttons', () => {
  const open = () => {
    renderDesktop();
    fireEvent.click(trigger('Knowledge'));
    const panel = panelOf(trigger('Knowledge'));
    return {
      panel,
      desktop: panel.querySelector('.mg-mega-content__menu--desktop'),
      category: name => within(panel).getByRole('button', { name }),
    };
  };

  it('do not switch destinations on focus, so Tab reaches the chosen ones', () => {
    const { desktop, category } = open();
    category('Risk information').focus();
    expect(category('Risk information')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(
      within(desktop).getByRole('link', { name: 'Global report' })
    ).toBeInTheDocument();
    // The destinations follow every category in document order.
    const order = Array.from(document.querySelectorAll('*'));
    expect(order.indexOf(desktop)).toBeGreaterThan(
      order.indexOf(category('Risk information'))
    );
  });

  it('switch destinations on activation and on hover', () => {
    const { desktop, category } = open();
    expect(category('Publications')).toHaveAttribute('aria-expanded', 'true');
    expect(category('Publications')).toHaveAttribute(
      'aria-controls',
      desktop.id
    );
    fireEvent.click(category('Risk information'));
    expect(category('Risk information')).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(category('Publications')).toHaveAttribute('aria-expanded', 'false');
    expect(
      within(desktop).getByRole('link', { name: 'Risk data' })
    ).toBeTruthy();
    fireEvent.mouseEnter(category('Publications').closest('li'));
    expect(
      within(desktop).getByRole('link', { name: 'Global report' })
    ).toBeTruthy();
  });

  it('lead the destinations with the category page', () => {
    const { desktop } = open();
    expect(within(desktop).getAllByRole('link')[0]).toHaveAttribute(
      'href',
      '/publications'
    );
    expect(desktop).toHaveAccessibleName('Publications');
  });

  it('carry no menu roles or misused current-page state', () => {
    const { panel } = open();
    expect(panel.querySelector('[role="menu"], [role="menuitem"]')).toBeNull();
    expect(panel.querySelector('[aria-current]')).toBeNull();
    expect(panel).not.toHaveAttribute('aria-live');
  });
});

describe('arrow keys inside a panel', () => {
  const open = () => {
    renderDesktop();
    const knowledge = trigger('Knowledge');
    fireEvent.click(knowledge);
    const panel = panelOf(knowledge);
    return {
      knowledge,
      panel,
      desktop: panel.querySelector('.mg-mega-content__menu--desktop'),
    };
  };

  it('step through focusable entries, skipping links without an address', () => {
    const { desktop } = open();
    within(desktop).getByRole('link', { name: 'Global report' }).focus();
    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
    expect(document.activeElement).toHaveTextContent('Policy briefs');
  });

  it('start from the panel itself, which is not a tab stop', () => {
    const { panel } = open();
    // Links and buttons are the tab stops; the panel and its columns take
    // focus only from script.
    expect(panel).toHaveAttribute('tabindex', '-1');
    for (const column of panel.querySelectorAll(
      '.mg-mega-content__left, .mg-mega-content__right'
    )) {
      expect(column).not.toHaveAttribute('tabindex');
    }
    panel.focus();
    fireEvent.keyDown(panel, { key: 'ArrowDown' });
    expect(document.activeElement).toHaveTextContent('Knowledge overview');
  });

  it('never land on the hidden mobile list', () => {
    const { panel } = open();
    const mobile = panel.querySelector('.mg-mega-content__menu--mobile');
    panel.focus();
    for (let i = 0; i < 15; i++) {
      fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
      expect(mobile.contains(document.activeElement)).toBe(false);
    }
  });

  it('jump with Home and End, and return to the button from the top', () => {
    const { knowledge, panel, desktop } = open();
    panel.focus();
    fireEvent.keyDown(panel, { key: 'End' });
    expect(document.activeElement).toHaveTextContent('Guidelines');
    fireEvent.keyDown(document.activeElement, { key: 'Home' });
    expect(document.activeElement).toHaveTextContent('Knowledge overview');
    fireEvent.keyDown(document.activeElement, { key: 'ArrowUp' });
    expect(knowledge).toHaveFocus();
    expect(desktop).toBeInTheDocument();
  });

  it('leave Tab, left and right to the browser', () => {
    const { panel } = open();
    panel.focus();
    for (const key of ['Tab', 'ArrowLeft', 'ArrowRight']) {
      // fireEvent returns false when a handler called preventDefault.
      expect(fireEvent.keyDown(panel, { key })).toBe(true);
      expect(panel).toHaveFocus();
    }
  });
});
