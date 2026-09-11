import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { HubHeader } from '../HubHeader';

const sections = [
  { label: 'About', href: '#about' },
  { label: 'Reporting', href: '#reporting', ancestor: true },
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
    // An ancestor is styled, not announced: a second "current" in one landmark
    // would tell a screen-reader user they are somewhere they are not.
    expect(
      within(nav).getByRole('link', { name: 'Reporting' })
    ).not.toHaveAttribute('aria-current');
    expect(
      nav.querySelector('.mg-hub-header__nav-item--ancestor')
    ).toBeInTheDocument();
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
      bar.querySelector('.mg-hub-header__nav-item--ancestor')
    ).toBeInTheDocument();
  }
});

test('marks exactly one current section, whatever the surface', () => {
  for (const surface of ['primary', 'detached']) {
    const { container, unmount } = render(
      <HubHeader {...base} surface={surface} />
    );
    const marked = container.querySelectorAll(
      '.mg-hub-header__nav-item--ancestor'
    );
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveTextContent('Reporting');
    // Nothing in the strip claims to be the current page on a descendant.
    expect(
      container.querySelectorAll('.mg-hub-header__nav a[aria-current]')
    ).toHaveLength(0);
    unmount();
  }
  // The visual signals on a coloured ground — weight and the leading rule —
  // are CSS, so they are verified by review rather than here: jsdom does not
  // load the stylesheet and getComputedStyle returns nothing for them.
});

test('renders banner actions as links, and only when given', () => {
  const plain = render(
    <HubHeader {...base} variant="expressive" title="A title" />
  );
  expect(
    plain.container.querySelector('.mg-hub-header__actions')
  ).not.toBeInTheDocument();
  plain.unmount();

  render(
    <HubHeader
      {...base}
      variant="expressive"
      title="A title"
      actions={[
        { label: 'Open the Monitor', url: 'https://sendaimonitor.undrr.org/' },
        { label: 'Reporting guidance', url: '#reporting', type: 'Secondary' },
      ]}
    />
  );
  const cta = screen.getByRole('link', { name: 'Open the Monitor' });
  expect(cta).toHaveAttribute('href', 'https://sendaimonitor.undrr.org/');
  // Actions belong to the banner, not the navigation landmark.
  expect(
    within(
      screen.getByRole('navigation', {
        name: 'Sendai Framework Monitor sections',
      })
    ).queryByRole('link', { name: 'Open the Monitor' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Reporting guidance' })
  ).toBeVisible();
});

describe('the section contract is enforced, not just documented', () => {
  // DSFR states its equivalent limit in the type. These assert ours actually
  // fires: a validator nobody has watched fail is a validator that does not.
  let warn;

  beforeEach(() => {
    warn = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => warn.mockRestore());

  const message = () => warn.mock.calls.map(call => call.join(' ')).join('\n');

  test('rejects more sections than the row can carry', () => {
    const many = Array.from({ length: 8 }, (unused, i) => ({
      label: `Section ${i}`,
      href: `#s${i}`,
    }));
    render(<HubHeader {...base} sections={many} />);
    expect(message()).toMatch(/8 sections is past the 7/);
  });

  test('rejects two current sections', () => {
    render(
      <HubHeader
        {...base}
        sections={[
          { label: 'About', href: '#about', current: true },
          { label: 'Data', href: '#data', current: true },
        ]}
      />
    );
    expect(message()).toMatch(/Only one can be the page the reader is on/);
  });

  test('rejects a section that is both the page and its own ancestor', () => {
    render(
      <HubHeader
        {...base}
        sections={[
          { label: 'About', href: '#about', current: true, ancestor: true },
        ]}
      />
    );
    expect(message()).toMatch(/A page cannot contain itself/);
  });

  test('rejects a navigation label that does not name the hub', () => {
    render(<HubHeader {...base} navLabel="Sections" />);
    expect(message()).toMatch(/should name the hub/);
  });

  test('accepts the shapes the stories actually use', () => {
    render(<HubHeader {...base} />);
    expect(warn).not.toHaveBeenCalled();
  });
});

test('has no detectable accessibility violations', async () => {
  const { container } = render(
    <HubHeader
      {...base}
      variant="expressive"
      title="A title"
      summary="A summary."
      media={{ src: 'https://example.com/photo.jpg', alt: '' }}
      actions={[{ label: 'Open the Monitor', url: '#open' }]}
    />
  );
  expect(await axe(container)).toHaveNoViolations();
});
