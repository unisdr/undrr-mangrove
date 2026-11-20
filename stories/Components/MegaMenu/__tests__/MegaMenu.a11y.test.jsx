/**
 * Desktop-state accessibility tests for MegaMenu.
 *
 * The mobile sidebar is covered by MegaMenu.progressive.test.jsx, which opens
 * the dialog and scopes axe to it — so the desktop topbar went unchecked and
 * shipped three axe failures (unisdr/undrr-mangrove#1114). These assertions
 * run against the whole container in its default, unopened state.
 */
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import MegaMenu from '../MegaMenu';

const sections = [
  {
    title: 'About',
    bannerHeading: 'About us',
    bannerDescription: '<p>Who we are</p>',
    bannerButton: { label: 'About overview', url: '/about' },
    items: [
      {
        title: 'Who we are',
        url: '/who',
        items: [{ title: 'Leadership', url: '/leadership' }],
      },
    ],
  },
  {
    title: 'Our work',
    bannerHeading: 'Our work',
    bannerDescription: '<p>What we do</p>',
    bannerButton: { label: 'Work overview', url: '/work' },
    items: [
      {
        title: 'Risk',
        url: '/risk',
        items: [{ title: 'Risk data', url: '/risk-data' }],
      },
    ],
  },
];

describe('MegaMenu desktop accessibility', () => {
  it('has no axe violations in its default desktop state', async () => {
    const { container } = render(<MegaMenu sections={sections} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations in the branded variant', async () => {
    const { container } = render(
      <MegaMenu sections={sections} logoSrc="/logo.svg" logoAlt="UNDRR" />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('names every section landmark after its own section', () => {
    render(<MegaMenu sections={sections} />);
    const names = screen
      .getAllByRole('navigation', { hidden: true })
      .map(node => node.getAttribute('aria-label'));
    expect(names).toEqual(expect.arrayContaining(['About categories']));
    expect(new Set(names).size).toBe(names.length);
  });

  it('exposes top-level items as disclosure buttons, not menu items', () => {
    render(<MegaMenu sections={sections} />);
    expect(screen.queryByRole('menubar')).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    const bar = document.querySelector('.mg-mega-topbar');
    const topLevel = within(bar).getByRole('button', { name: 'About' });
    // The panel is a disclosure: collapsed state is announced, not implied.
    expect(topLevel).toHaveAttribute('aria-expanded', 'false');
    const panel = document.getElementById(
      topLevel.getAttribute('aria-controls')
    );
    expect(panel).toHaveClass('mg-mega-content');
    // The section's landing page stays one step away, inside the panel.
    fireEvent.click(topLevel);
    expect(topLevel).toHaveAttribute('aria-expanded', 'true');
    expect(
      within(screen.getByRole('region', { name: 'About' })).getByRole('link', {
        name: 'About overview',
      })
    ).toHaveAttribute('href', '/about');
  });

  it('keeps arrow-key movement across the bar and down into a panel', () => {
    render(<MegaMenu sections={sections} />);
    const bar = document.querySelector('.mg-mega-topbar');
    const first = within(bar).getByRole('button', { name: 'About' });
    const second = within(bar).getByRole('button', { name: 'Our work' });

    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(second).toHaveFocus();

    fireEvent.keyDown(second, { key: 'ArrowLeft' });
    expect(first).toHaveFocus();

    fireEvent.keyDown(first, { key: 'ArrowDown' });
    const panel = document.querySelectorAll('.mg-mega-content')[0];
    expect(panel).not.toHaveAttribute('inert');
    expect(document.activeElement).toBe(panel);
  });

  it('keeps arrow movement inside an open section panel', () => {
    render(<MegaMenu sections={sections} />);
    const bar = document.querySelector('.mg-mega-topbar');
    const first = within(bar).getByRole('button', { name: 'About' });

    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    const panel = document.querySelectorAll('.mg-mega-content')[0];

    // Down walks the panel's focusable elements, starting with the banner CTA.
    fireEvent.keyDown(panel, { key: 'ArrowDown' });
    expect(
      within(panel).getByRole('link', { name: 'About overview' })
    ).toHaveFocus();

    // Down continues to the category, then to the chosen category's
    // destinations, in document order.
    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
    expect(
      within(panel).getByRole('button', { name: 'Who we are' })
    ).toHaveFocus();
    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
    expect(panel.querySelector('.mg-mega-content__right')).toContainElement(
      document.activeElement
    );
  });
});

it('makes closing desktop panels inert immediately and returns Escape focus before hiding', () => {
  jest.useFakeTimers();
  try {
    render(<MegaMenu sections={sections} />);
    const opener = screen.getByRole('button', { name: 'About' });
    fireEvent.keyDown(opener, { key: 'ArrowDown' });
    const panel = screen.getByRole('region', { name: 'About' });
    fireEvent.keyDown(panel, { key: 'ArrowDown' });
    expect(panel).toContainElement(document.activeElement);
    fireEvent.keyDown(document.activeElement, { key: 'Escape' });
    expect(opener).toHaveFocus();
    expect(panel).toHaveAttribute('inert');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(
      screen.queryByRole('region', { name: 'About' })
    ).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1000));
    expect(panel).toHaveAttribute('inert');
  } finally {
    jest.useRealTimers();
  }
});
