import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ContentHub } from '../ContentHub';

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
    name: 'Monitor sections',
  });
  expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  follow(within(navigation).getByRole('link', { name: 'Reporting' }));
  expect(
    screen.getByRole('heading', { level: 1, name: 'Reporting' })
  ).toHaveFocus();
  follow(screen.getByRole('link', { name: 'How to report' }));
  expect(
    screen.getByRole('heading', { level: 1, name: 'How to report' })
  ).toHaveFocus();
  expect(
    within(navigation).getByRole('link', { name: 'Reporting' })
  ).toHaveAttribute('aria-current', 'location');
  expect(screen.getByRole('link', { name: 'UNDRR home' })).toHaveAttribute(
    'href',
    'https://www.undrr.org/'
  );
});

test('restores the initial page when browser history returns to the initial URL', () => {
  render(<ContentHub initialPage="overview" />);
  follow(
    within(
      screen.getByRole('navigation', { name: 'Monitor sections' })
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
  ).toHaveFocus();
});

test('restores a stable story route on reload and reveals an offscreen active section horizontally', () => {
  window.history.replaceState(null, '', '/#stable-demo/validate-data/1');
  const scrollBy = jest.fn();
  const originalScrollBy = HTMLElement.prototype.scrollBy;
  HTMLElement.prototype.scrollBy = scrollBy;
  const bounds = jest
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function () {
      return this.hasAttribute('aria-current')
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
      return this.hasAttribute('aria-current') && loaded
        ? { left: -20, right: 87 }
        : { left: 16, right: 344 };
    });
  try {
    const { unmount } = render(
      <ContentHub initialPage="how-to-report" locale="arabic" />
    );
    expect(observe).toHaveBeenCalledTimes(2);
    expect(scrollBy).not.toHaveBeenCalled();
    loaded = true;
    act(() => notifyResize());
    expect(scrollBy).toHaveBeenCalledWith({ left: -36, behavior: 'instant' });
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
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
  const contents = screen.getByRole('navigation', { name: 'On this page' });
  for (const link of within(contents).getAllByRole('link')) {
    expect(document.getElementById(link.hash.slice(1))).toBeInTheDocument();
  }
});

test('localizes navigation and removes optional navigation for a simple landing page', () => {
  const { container } = render(
    <ContentHub initialPage="landing" locale="arabic" />
  );
  expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  expect(
    screen.queryByRole('navigation', { name: 'أقسام المرصد' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('navigation', { name: 'في هذه الصفحة' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('heading', { level: 1, name: 'رصد تنفيذ إطار سنداي' })
  ).toBeVisible();
});

test('has no detectable accessibility violations on a detail page', async () => {
  const { container } = render(<ContentHub initialPage="how-to-report" />);
  expect(await axe(container)).toHaveNoViolations();
});
