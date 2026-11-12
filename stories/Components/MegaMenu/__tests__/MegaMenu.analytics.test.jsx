import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import MegaMenu from '../MegaMenu';
import megaMenuFromElement from '../MegaMenu.fromElement';

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalCloseDialog = HTMLDialogElement.prototype.close;
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});
afterAll(() => {
  HTMLDialogElement.prototype.showModal = originalShowModal;
  HTMLDialogElement.prototype.close = originalCloseDialog;
});

const sections = [
  {
    title: 'Knowledge Base',
    bannerHeading: 'Knowledge Base',
    bannerDescription: '<p>Explore</p>',
    bannerButton: { label: 'Explore', url: '/knowledge-base' },
    items: [
      {
        title: 'Hazards',
        items: [{ title: 'Floods', url: '/hazards/floods' }],
      },
    ],
  },
  { title: 'About', items: [{ title: 'Team', url: '/team' }] },
];

const label = element => element.getAttribute('data-vf-analytics-label');

describe('MegaMenu analytics attributes', () => {
  it('reports under the mega-menu region by default', () => {
    const { container } = render(<MegaMenu sections={sections} />);
    expect(container.querySelector('nav.mg-mega-wrapper')).toHaveAttribute(
      'data-vf-google-analytics-region',
      'mega-menu'
    );
  });

  it('lets the host rename or drop the region', () => {
    const { container, rerender } = render(
      <MegaMenu sections={sections} analyticsRegion="site-nav" />
    );
    expect(container.querySelector('.mg-mega-wrapper')).toHaveAttribute(
      'data-vf-google-analytics-region',
      'site-nav'
    );
    rerender(<MegaMenu sections={sections} analyticsRegion={null} />);
    expect(container.querySelector('.mg-mega-wrapper')).not.toHaveAttribute(
      'data-vf-google-analytics-region'
    );
  });

  it('uses a region set on the hydration host', () => {
    const host = document.createElement('div');
    expect(megaMenuFromElement(host)).not.toHaveProperty('analyticsRegion');
    host.setAttribute('data-vf-google-analytics-region', 'header-nav');
    expect(megaMenuFromElement(host).analyticsRegion).toBe('header-nav');
  });

  it('labels mobile open, close, back and section controls', () => {
    const { container } = render(<MegaMenu sections={sections} />);
    const opener = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(label(opener)).toBe('Mega menu: Open');
    fireEvent.click(opener);
    expect(label(opener)).toBe('Mega menu: Close');
    expect(
      label(container.querySelector('.mg-mega-mobile-sidebar-overlay'))
    ).toBe('Mega menu: Close');

    const dialog = screen.getByRole('dialog');
    expect(label(dialog.querySelector('.mg-mega-mobile-sidebar__close'))).toBe(
      'Mega menu: Close'
    );
    const section = within(dialog).getByRole('button', {
      name: 'Knowledge Base',
    });
    expect(label(section)).toBe('Mega menu: Section');
    fireEvent.click(section);
    expect(label(within(dialog).getByRole('button', { name: 'Back' }))).toBe(
      'Mega menu: Back'
    );
  });

  it('labels desktop section buttons without the section name', () => {
    const { container } = render(<MegaMenu sections={sections} />);
    const button = container.querySelector('button.mg-mega-topbar__item-link');
    expect(button).toHaveTextContent('About');
    expect(label(button)).toBe('Mega menu: Section');
  });

  it('keeps typed queries out of mobile filter labels', () => {
    render(<MegaMenu sections={sections} enableFilter />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Open navigation menu' })
    );
    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByRole('searchbox');
    expect(label(input)).toBe('Mega menu: Filter');
    fireEvent.change(input, { target: { value: 'secret query' } });
    expect(
      label(within(dialog).getByRole('button', { name: 'Clear filter' }))
    ).toBe('Mega menu: Clear filter');
    const search = dialog.querySelector('.mg-mega-filter__empty-search-btn');
    expect(search).toHaveTextContent('secret query');
    expect(label(search)).toBe('Mega menu: Site search');

    fireEvent.change(input, { target: { value: 'flood' } });
    expect(
      label(dialog.querySelector('.mg-mega-filter__site-search-link'))
    ).toBe('Mega menu: Site search');
  });

  it('labels the desktop finder controls with fixed text', async () => {
    render(<MegaMenu sections={sections} enableFilter hoverDelay={0} />);
    fireEvent.focus(
      screen.getByRole('link', { name: 'Knowledge Base', exact: true })
    );
    const panel = await screen.findByRole('region', {
      name: 'Knowledge Base',
      exact: true,
    });
    const trigger = within(panel).getByRole('button', { name: 'Find in menu' });
    expect(label(trigger)).toBe('Mega menu: Finder');
    fireEvent.click(trigger);

    const finder = panel.querySelector('.mg-mega-menu-finder');
    const input = within(finder).getByRole('searchbox');
    expect(label(input)).toBe('Mega menu: Filter');
    expect(label(finder.querySelector('label'))).toBe('Mega menu: Filter');
    expect(label(within(finder).getByRole('button', { name: 'Close' }))).toBe(
      'Mega menu: Close finder'
    );

    fireEvent.change(input, { target: { value: 'secret query' } });
    expect(
      label(within(finder).getByRole('button', { name: 'Clear filter' }))
    ).toBe('Mega menu: Clear filter');
    const search = finder.querySelector('.mg-mega-filter__site-search-link');
    expect(search).toHaveTextContent('secret query');
    expect(label(search)).toBe('Mega menu: Site search');
  });
});
