import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { LandingPage } from '../LandingPages';

const noopObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeAll(() => {
  global.IntersectionObserver = noopObserver;
  global.ResizeObserver = noopObserver;
});

test.each([
  ['topic', 'Early warnings for all'],
  ['report', 'Global assessment report on disaster risk reduction'],
  ['index', 'Publications'],
])('%s gives the page exactly one h1 and locates it', (archetype, title) => {
  render(<LandingPage archetype={archetype} id="demo" />);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('heading', { level: 1, name: title })).toBeVisible();
  const crumbs = screen.getByRole('navigation', { name: 'Breadcrumbs' });
  expect(within(crumbs).getByText(title)).toHaveAttribute(
    'aria-current',
    'page'
  );
});

test('the report archetype links its contents to real section ids', () => {
  const { container } = render(<LandingPage archetype="report" id="demo" />);
  const contents = container.querySelector('.mg-table-of-contents');
  const links = within(contents).getAllByRole('link');
  expect(links).toHaveLength(4);
  for (const link of links) {
    expect(
      document.getElementById(decodeURIComponent(link.hash.slice(1)))
    ).toBeInTheDocument();
  }
});

test('localizes copy and direction from the locale toolbar', () => {
  const { container } = render(
    <LandingPage archetype="topic" locale="arabic" id="demo" />
  );
  expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  expect(
    screen.getByRole('heading', { level: 1, name: 'الإنذار المبكر للجميع' })
  ).toBeVisible();
});

test('has no detectable accessibility violations in the page body', async () => {
  const { container } = render(<LandingPage archetype="topic" id="demo" />);
  // Scoped to the pattern. The parent chrome is shipped MegaMenu markup, whose
  // desktop topbar has its own pre-existing axe failures.
  expect(
    await axe(container.querySelector('.mg-demo-shell'))
  ).toHaveNoViolations();
});
