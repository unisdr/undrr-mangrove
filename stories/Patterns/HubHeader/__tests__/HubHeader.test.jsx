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
