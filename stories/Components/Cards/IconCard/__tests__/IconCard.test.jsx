import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { IconCard } from '../IconCard';

/** Helper to build a minimal data array for IconCard. */
function makeData(overrides = {}) {
  return [{ title: 'Test card', ...overrides }];
}

describe('IconCard', () => {
  // --------------------------------------------------
  // Basic rendering
  // --------------------------------------------------

  it('renders title and summary text', () => {
    render(
      <IconCard
        data={makeData({ summaryText: 'Card description' })}
      />,
    );

    expect(screen.getByText('Test card')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Icon rendering
  // --------------------------------------------------

  it('renders icon span when data item has icon classes', () => {
    const { container } = render(
      <IconCard data={makeData({ icon: 'mg-icon mg-icon-globe' })} />,
    );

    const iconWrap = container.querySelector('.mg-card__icon-wrap');
    expect(iconWrap).toBeInTheDocument();
    expect(iconWrap).toHaveAttribute('aria-hidden', 'true');

    const glyph = iconWrap.querySelector('.mg-icon.mg-icon-globe');
    expect(glyph).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Image rendering
  // --------------------------------------------------

  it('renders image when imgback is set', () => {
    render(
      <IconCard
        data={makeData({
          imgback: '/images/photo.jpg',
          imgalt: 'A photograph',
        })}
      />,
    );

    const img = screen.getByRole('img', { name: 'A photograph' });
    expect(img).toHaveAttribute('src', '/images/photo.jpg');
    expect(img).toHaveClass('mg-card__image');
  });

  // --------------------------------------------------
  // iconColor / iconFgColor
  // --------------------------------------------------

  it('applies --mg-icon-bg custom property and --colored modifier for iconColor', () => {
    const { container } = render(
      <IconCard
        data={makeData({ icon: 'mg-icon mg-icon-globe', iconColor: '#f4b8a8' })}
      />,
    );

    const iconWrap = container.querySelector('.mg-card__icon-wrap');
    expect(iconWrap).toHaveClass('mg-card__icon-wrap--colored');
    expect(iconWrap).toHaveStyle({ '--mg-icon-bg': '#f4b8a8' });
  });

  it('applies --mg-icon-fg custom property for iconFgColor', () => {
    const { container } = render(
      <IconCard
        data={makeData({
          icon: 'mg-icon mg-icon-globe',
          iconColor: '#f4b8a8',
          iconFgColor: '#333',
        })}
      />,
    );

    const iconWrap = container.querySelector('.mg-card__icon-wrap');
    expect(iconWrap).toHaveStyle({ '--mg-icon-fg': '#333' });
  });

  // --------------------------------------------------
  // borderColor
  // --------------------------------------------------

  it('applies --mg-card-border custom property and --bordered modifier for borderColor', () => {
    const { container } = render(
      <IconCard data={makeData({ borderColor: '#e8963a' })} />,
    );

    const article = container.querySelector('article');
    expect(article).toHaveClass('mg-card__icon--bordered');
    expect(article).toHaveStyle({ '--mg-card-border': '#e8963a' });
  });

  // --------------------------------------------------
  // labelPosition
  // --------------------------------------------------

  it('places label before the visual when labelPosition is "top"', () => {
    const { container } = render(
      <IconCard
        data={makeData({ label: 'Category', icon: 'mg-icon mg-icon-globe' })}
        labelPosition="top"
      />,
    );

    const article = container.querySelector('article');
    const label = article.querySelector('.mg-card__meta');
    const visual = article.querySelector('.mg-card__visual');

    // Label should appear before visual in the DOM
    expect(label).toBeInTheDocument();
    expect(visual).toBeInTheDocument();
    expect(
      label.compareDocumentPosition(visual) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('places label inside content area by default', () => {
    const { container } = render(
      <IconCard
        data={makeData({ label: 'Category', icon: 'mg-icon mg-icon-globe' })}
      />,
    );

    const content = container.querySelector('.mg-card__content');
    const label = content.querySelector('.mg-card__label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('Category');
  });

  // --------------------------------------------------
  // srOnlyTitle
  // --------------------------------------------------

  it('renders screen-reader-only title when srOnlyTitle is true', () => {
    const { container } = render(
      <IconCard
        data={makeData({
          srOnlyTitle: true,
          link: '/example',
          icon: 'mg-icon mg-icon-globe',
        })}
      />,
    );

    const header = container.querySelector('.mg-card__title');
    expect(header).toHaveClass('mg-u-sr-only');
    expect(header).toHaveTextContent('Test card');

    // Visual should be wrapped in a link
    const visualLink = container.querySelector('.mg-card__visual-link');
    expect(visualLink).toHaveAttribute('href', '/example');
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has no a11y violations', async () => {
    const { container } = render(
      <IconCard
        data={[
          {
            title: 'Resilience',
            icon: 'mg-icon mg-icon-globe',
            summaryText: 'Building disaster resilience worldwide.',
            link: '/resilience',
          },
        ]}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations with borderColor and iconColor', async () => {
    const { container } = render(
      <IconCard
        data={[
          {
            title: 'Colored card',
            icon: 'mg-icon mg-icon-globe',
            iconColor: '#f4b8a8',
            borderColor: '#e8963a',
            summaryText: 'A styled card.',
          },
        ]}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
