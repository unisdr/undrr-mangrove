import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { HubHeader } from '../HubHeader';

const sections = [
  { label: 'About', href: '#about' },
  { label: 'Reporting', href: '#reporting', current: 'location' },
  { label: 'Data', href: '#data' },
];

const base = {
  name: 'Sendai Framework Monitor',
  nameHref: '#overview',
  navLabel: 'Sendai Framework Monitor sections',
  sections,
};

test('carries identity and navigation in both variants', () => {
  for (const variant of ['compact', 'expressive']) {
    const { unmount } = render(
      <HubHeader {...base} variant={variant} title="A title" />
    );
    expect(
      screen.getByRole('link', { name: 'Sendai Framework Monitor' })
    ).toHaveAttribute('href', '#overview');
    const nav = screen.getByRole('navigation', {
      name: 'Sendai Framework Monitor sections',
    });
    expect(within(nav).getAllByRole('link')).toHaveLength(3);
    expect(
      within(nav).getByRole('link', { name: 'Reporting' })
    ).toHaveAttribute('aria-current', 'location');
    unmount();
  }
});

test('the compact variant drops the banner but never the navigation', () => {
  const { container } = render(<HubHeader {...base} variant="compact" />);
  expect(
    container.querySelector('.mg-hub-header__banner')
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('navigation', {
      name: 'Sendai Framework Monitor sections',
    })
  ).toBeVisible();
});

test('the banner is optional media, so a text-only hub page still gets weight', () => {
  const { container } = render(
    <HubHeader {...base} variant="expressive" title="How to report" />
  );
  expect(container.querySelector('.mg-hub-header__banner')).toBeInTheDocument();
  expect(
    container.querySelector('.mg-hub-header__media')
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('heading', { level: 1, name: 'How to report' })
  ).toBeVisible();
});

test('keeps every link out of the media surface', () => {
  const { container } = render(
    <HubHeader
      {...base}
      variant="expressive"
      title="A title"
      media={{ src: 'https://example.com/photo.jpg', alt: '' }}
    />
  );
  const media = container.querySelector('.mg-hub-header__media');
  expect(media.querySelectorAll('a')).toHaveLength(0);
});

test('marks the hub name as the current page on the hub home', () => {
  render(<HubHeader {...base} nameCurrent />);
  expect(
    screen.getByRole('link', { name: 'Sendai Framework Monitor' })
  ).toHaveAttribute('aria-current', 'page');
});

test('carries a surface variant onto the bar without losing the navigation', () => {
  const { container, rerender } = render(<HubHeader {...base} />);
  // Unified by default.
  expect(
    container.querySelector('.mg-hub-header--surface-primary')
  ).toBeInTheDocument();

  for (const surface of ['secondary', 'tertiary', 'detached']) {
    rerender(<HubHeader {...base} surface={surface} />);
    expect(
      container.querySelector(`.mg-hub-header--surface-${surface}`)
    ).toBeInTheDocument();
    // The bar is the surface; the navigation stays inside it either way.
    const bar = container.querySelector('.mg-hub-header__bar');
    expect(bar.querySelector('.mg-hub-header__nav')).toBeInTheDocument();
    expect(
      within(bar).getByRole('link', { name: 'Reporting' })
    ).toHaveAttribute('aria-current', 'location');
  }
});

test('marks exactly one current section, whatever the surface', () => {
  for (const surface of ['primary', 'detached']) {
    const { container, unmount } = render(
      <HubHeader {...base} surface={surface} />
    );
    const marked = container.querySelectorAll(
      '.mg-hub-header__nav a[aria-current]'
    );
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveTextContent('Reporting');
    unmount();
  }
  // The visual signals on a coloured ground — weight and the leading rule —
  // are CSS, so they are verified by review rather than here: jsdom does not
  // load the stylesheet and getComputedStyle returns nothing for them.
});

test('has no detectable accessibility violations', async () => {
  const { container } = render(
    <HubHeader
      {...base}
      variant="expressive"
      title="A title"
      summary="A summary."
      media={{ src: 'https://example.com/photo.jpg', alt: '' }}
    />
  );
  expect(await axe(container)).toHaveNoViolations();
});
