import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ContentHub } from '../ContentHub';

// OnThisPageNav's scroll-spy needs observers jsdom does not provide.
const noopObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeAll(() => {
  global.IntersectionObserver = noopObserver;
  global.ResizeObserver = noopObserver;
});

beforeEach(() => window.history.replaceState(null, '', '/'));

function follow(link) {
  act(() => {
    window.history.pushState(null, '', link.getAttribute('href'));
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

test('uses page links for lateral navigation and keeps Reporting active on a child page', () => {
  render(<ContentHub initialPage="overview" />);
  const navigation = screen.getByRole('navigation', {
    name: 'Sendai Framework Monitor sections',
  });
  expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  follow(within(navigation).getByRole('link', { name: 'Reporting' }));
  expect(
    screen.getByRole('heading', { level: 1, name: 'Reporting' })
  ).toBeVisible();
  expect(screen.getByRole('main')).toHaveFocus();
  follow(screen.getByRole('link', { name: 'How to report' }));
  expect(
    screen.getByRole('heading', { level: 1, name: 'How to report' })
  ).toBeVisible();
  // An ancestor is styled, not announced — see HubHeader.
  expect(
    within(navigation).getByRole('link', { name: 'Reporting' })
  ).not.toHaveAttribute('aria-current');
  expect(
    navigation.querySelector('.mg-hub-header__nav-item--ancestor')
  ).toHaveTextContent('Reporting');
  expect(screen.getByRole('link', { name: 'UNDRR home' })).toHaveAttribute(
    'href',
    'https://www.undrr.org/'
  );
});

test('keeps the standard UNDRR header and global navigation above the hub', () => {
  render(<ContentHub initialPage="how-to-report" />);
  const global = screen.getByRole('navigation', { name: 'UNDRR navigation' });
  // The section title also names the panel's banner button, so pick the
  // top-level bar link rather than matching on the accessible name alone.
  const topLevelLink = within(global)
    .getAllByRole('link', { name: 'Our work' })
    .find(link => link.classList.contains('mg-mega-topbar__item-link'));
  expect(topLevelLink).toHaveAttribute(
    'href',
    'https://www.undrr.org/our-work'
  );
  // The hub's own navigation stays a separate landmark with its own label.
  expect(
    within(global).queryByRole('link', { name: 'Reporting' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('navigation', {
      name: 'Sendai Framework Monitor sections',
    })
  ).toBeVisible();
});

test('restores the initial page when browser history returns to the initial URL', () => {
  render(<ContentHub initialPage="overview" />);
  follow(
    within(
      screen.getByRole('navigation', {
        name: 'Sendai Framework Monitor sections',
      })
    ).getByRole('link', { name: 'Reporting' })
  );
  act(() => {
    window.history.replaceState(null, '', '/');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: 'Tracking progress towards a more resilient world',
    })
  ).toBeVisible();
  expect(screen.getByRole('main')).toHaveFocus();
});

test('restores a stable story route on reload and reveals an offscreen active section horizontally', () => {
  window.history.replaceState(null, '', '/#stable-demo/validate-data/1');
  const scrollBy = jest.fn();
  const originalScrollBy = HTMLElement.prototype.scrollBy;
  HTMLElement.prototype.scrollBy = scrollBy;
  const bounds = jest
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function () {
      return this.hasAttribute('data-hub-current')
        ? { left: 350, right: 440 }
        : { left: 0, right: 320 };
    });
  try {
    render(<ContentHub routePrefix="stable-demo" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Validate your data' })
    ).toBeVisible();
    expect(scrollBy).toHaveBeenCalledWith({ left: 120, behavior: 'instant' });
  } finally {
    bounds.mockRestore();
    HTMLElement.prototype.scrollBy = originalScrollBy;
  }
});

test('reveals the selected section after delayed label resizing and disconnects on unmount', () => {
  const originalObserver = global.ResizeObserver;
  const originalScrollBy = HTMLElement.prototype.scrollBy;
  const scrollBy = jest.fn();
  let notifyResize;
  const observe = jest.fn();
  const disconnect = jest.fn();
  global.ResizeObserver = jest.fn(callback => {
    notifyResize = callback;
    return { observe, disconnect };
  });
  HTMLElement.prototype.scrollBy = scrollBy;
  let loaded = false;
  const bounds = jest
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function () {
      return this.hasAttribute('data-hub-current') && loaded
        ? { left: -20, right: 87 }
        : { left: 16, right: 344 };
    });
  try {
    const { unmount } = render(
      <ContentHub initialPage="how-to-report" locale="arabic" />
    );
    const observed = selector =>
      observe.mock.calls.some(([element]) => element?.matches?.(selector));
    expect(observed('.mg-hub-header__nav')).toBe(true);
    expect(observed('.mg-hub-header__nav ul')).toBe(true);
    expect(scrollBy).not.toHaveBeenCalled();
    loaded = true;
    act(() => notifyResize());
    expect(scrollBy).toHaveBeenCalledWith({ left: -36, behavior: 'instant' });
    unmount();
    expect(disconnect).toHaveBeenCalled();
  } finally {
    bounds.mockRestore();
    global.ResizeObserver = originalObserver;
    HTMLElement.prototype.scrollBy = originalScrollBy;
  }
});

test('keeps in-page links attached to the current route and makes the deeper hierarchy visible', () => {
  render(<ContentHub initialPage="validate-data" />);
  const breadcrumbs = screen.getByRole('navigation', { name: 'Breadcrumbs' });
  expect(
    within(breadcrumbs).getByRole('link', { name: 'How to report' })
  ).toBeVisible();
  // TableOfContents renders a section, not a nav landmark.
  const contents = document.querySelector('.mg-table-of-contents');
  const links = within(contents).getAllByRole('link');
  expect(links.length).toBeGreaterThan(0);
  for (const link of links) {
    expect(
      document.getElementById(decodeURIComponent(link.hash.slice(1)))
    ).toBeInTheDocument();
  }
});

test('localizes navigation and removes optional navigation for a simple landing page', () => {
  const { container } = render(
    <ContentHub initialPage="landing" locale="arabic" />
  );
  expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  expect(
    screen.queryByRole('navigation', { name: 'أقسام مرصد إطار سنداي' })
  ).not.toBeInTheDocument();
  expect(
    document.querySelector('.mg-table-of-contents')
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('heading', { level: 1, name: 'رصد تنفيذ إطار سنداي' })
  ).toBeVisible();
});

test.each(['overview', 'how-to-report'])(
  'a hero on %s carries the title without duplicating it or moving identity',
  page => {
    const plain = render(<ContentHub initialPage={page} />);
    const identity = plain.container.querySelector(
      '.mg-hub-header__identity'
    ).textContent;
    plain.unmount();

    render(<ContentHub initialPage={page} withHero />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.querySelector('.mg-demo-intro')).not.toBeInTheDocument();
    // Identity is invariant chrome: a hero must not change or displace it.
    expect(document.querySelector('.mg-hub-header__identity').textContent).toBe(
      identity
    );
  }
);

test('offers the hero as header chrome or as a separate page block', () => {
  const chrome = render(
    <ContentHub initialPage="how-to-report" withHero heroSource="header" />
  );
  expect(
    chrome.container.querySelector('.mg-hub-header--expressive')
  ).toBeInTheDocument();
  expect(chrome.container.querySelector('.mg-hero')).not.toBeInTheDocument();
  chrome.unmount();

  const body = render(
    <ContentHub
      initialPage="how-to-report"
      withHero
      heroSource="page"
      pageHeroMedia="video"
    />
  );
  // The header stays compact, and the hero is a separate block below it.
  expect(
    body.container.querySelector('.mg-hub-header--compact')
  ).toBeInTheDocument();
  expect(body.container.querySelector('.mg-hero')).toBeInTheDocument();
  // The point of the comparison: a body-content hero can be something the
  // chrome-owned banner cannot.
  expect(body.container.querySelector('.mg-hero__media iframe')).toBeVisible();
  // Either way the page has exactly one h1 and keeps its navigation.
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(
    screen.getByRole('navigation', {
      name: 'Sendai Framework Monitor sections',
    })
  ).toBeVisible();
});

test('keeps the active section marked when a hero owns the heading', () => {
  render(<ContentHub initialPage="how-to-report" withHero />);
  expect(
    screen
      .getByRole('navigation', { name: 'Sendai Framework Monitor sections' })
      .querySelector('.mg-hub-header__nav-item--ancestor')
  ).toHaveTextContent('Reporting');
});

test('shows ancestry only where it says something the hub navigation cannot', () => {
  const crumbs = () =>
    screen.queryByRole('navigation', { name: 'Breadcrumbs' });

  // The identity row and the heading already carry these pages.
  for (const page of ['overview', 'reporting', 'how-to-report']) {
    const { unmount } = render(<ContentHub initialPage={page} />);
    expect(crumbs()).not.toBeInTheDocument();
    unmount();
  }

  // Deep enough to have an intermediate parent the section strip cannot show.
  const deep = render(<ContentHub initialPage="validate-data" />);
  expect(
    within(crumbs()).getByRole('link', { name: 'How to report' })
  ).toBeVisible();
  deep.unmount();

  // The landing page has no hub navigation at all.
  render(<ContentHub initialPage="landing" />);
  expect(crumbs()).toBeInTheDocument();
});

test('routes are horizontal icon cards by default, vertical on request', () => {
  const { container, rerender } = render(<ContentHub initialPage="overview" />);
  const routes = container.querySelector('.mg-grid');
  expect(routes.querySelectorAll('.mg-card__icon--horizontal')).toHaveLength(3);
  // Same destinations either way; only the presentation changes.
  expect(within(routes).getByRole('link', { name: 'Reporting' })).toBeVisible();

  rerender(<ContentHub initialPage="overview" routeCards="vertical" />);
  // Scoped to the routes grid: the supporting band below also uses horizontal
  // icon cards, and always does.
  expect(
    container
      .querySelector('.mg-grid')
      .querySelector('.mg-card__icon--horizontal')
  ).not.toBeInTheDocument();
});

test('has no detectable accessibility violations on a detail page', async () => {
  const { container } = render(<ContentHub initialPage="how-to-report" />);
  // Unscoped: the parent chrome (MegaMenu, PageHeader) is covered too.
  expect(await axe(container)).toHaveNoViolations();
});
