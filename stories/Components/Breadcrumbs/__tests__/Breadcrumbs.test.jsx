import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Breadcrumbcomponent } from '../Breadcrumbs';

const defaultData = [
  { text: 'Home' },
  { text: 'Section' },
  { text: 'Current Page' },
];

describe('Breadcrumbs', () => {
  // --------------------------------------------------
  // Structure
  // --------------------------------------------------

  it('renders a <nav> with aria-label="breadcrumbs"', () => {
    const { container } = render(<Breadcrumbcomponent data={defaultData} />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('aria-label', 'breadcrumbs');
  });

  it('renders the correct number of items', () => {
    const { container } = render(<Breadcrumbcomponent data={defaultData} />);
    expect(container.querySelectorAll('li')).toHaveLength(defaultData.length);
  });

  // --------------------------------------------------
  // aria-current
  // --------------------------------------------------

  it('marks the last <li> with aria-current="page"', () => {
    const { container } = render(<Breadcrumbcomponent data={defaultData} />);
    const items = container.querySelectorAll('li');
    expect(items[items.length - 1]).toHaveAttribute('aria-current', 'page');
  });

  it('does not set aria-current on non-last items', () => {
    const { container } = render(<Breadcrumbcomponent data={defaultData} />);
    const items = container.querySelectorAll('li');
    for (let i = 0; i < items.length - 1; i++) {
      expect(items[i]).not.toHaveAttribute('aria-current');
    }
  });

  it('works correctly with a single item', () => {
    const { container } = render(
      <Breadcrumbcomponent data={[{ text: 'Home' }]} />,
    );
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveAttribute('aria-current', 'page');
  });

  // --------------------------------------------------
  // White variant
  // --------------------------------------------------

  it('applies white modifier class when Color="White"', () => {
    const { container } = render(
      <Breadcrumbcomponent data={defaultData} Color="White" />,
    );
    expect(container.querySelector('nav')).toHaveClass('mg-breadcrumb--white');
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has no a11y violations (default)', async () => {
    const { container } = render(<Breadcrumbcomponent data={defaultData} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations (White variant)', async () => {
    const { container } = render(
      <Breadcrumbcomponent data={defaultData} Color="White" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
