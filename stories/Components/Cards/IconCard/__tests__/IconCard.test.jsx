import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
    render(<IconCard data={makeData({ summaryText: 'Card description' })} />);

    expect(screen.getByText('Test card')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Icon rendering
  // --------------------------------------------------

  it('renders icon span when data item has icon classes', () => {
    const { container } = render(
      <IconCard data={makeData({ icon: 'mg-icon mg-icon-globe' })} />
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
      />
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
      />
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
      />
    );

    const iconWrap = container.querySelector('.mg-card__icon-wrap');
    expect(iconWrap).toHaveStyle({ '--mg-icon-fg': '#333' });
  });

  // --------------------------------------------------
  // borderColor
  // --------------------------------------------------

  it('applies --mg-card-border custom property and --bordered modifier for borderColor', () => {
    const { container } = render(
      <IconCard data={makeData({ borderColor: '#e8963a' })} />
    );

    const article = container.querySelector('article');
    expect(article).toHaveClass('mg-card__icon--bordered');
    expect(article).toHaveStyle({ '--mg-card-border': '#e8963a' });
  });

  // --------------------------------------------------
  // visualLabel
  // --------------------------------------------------

  it('renders visualLabel inside .mg-card__visual', () => {
    const { container } = render(
      <IconCard
        data={makeData({ visualLabel: 'Data', icon: 'mg-icon mg-icon-globe' })}
      />
    );

    const visual = container.querySelector('.mg-card__visual');
    const visualLabel = visual.querySelector('.mg-card__visual-label');
    expect(visualLabel).toBeInTheDocument();
    expect(visualLabel).toHaveTextContent('Data');
    expect(visualLabel.tagName).toBe('SPAN');
  });

  it('always renders label inside .mg-card__content regardless of visualLabel', () => {
    const { container } = render(
      <IconCard
        data={makeData({
          label: 'Category',
          visualLabel: 'Data',
          icon: 'mg-icon mg-icon-globe',
        })}
      />
    );

    const content = container.querySelector('.mg-card__content');
    const label = content.querySelector('.mg-card__label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('Category');
  });

  it('supports both visualLabel and label on the same card', () => {
    const { container } = render(
      <IconCard
        data={makeData({
          label: 'Category',
          visualLabel: 'Data',
          icon: 'mg-icon mg-icon-globe',
        })}
      />
    );

    const visual = container.querySelector('.mg-card__visual');
    const visualLabel = visual.querySelector('.mg-card__visual-label');
    expect(visualLabel).toHaveTextContent('Data');

    const content = container.querySelector('.mg-card__content');
    const contentLabel = content.querySelector('.mg-card__label');
    expect(contentLabel).toHaveTextContent('Category');
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
      />
    );

    const header = container.querySelector('.mg-card__title');
    expect(header).toHaveClass('mg-u-sr-only');
    expect(header).toHaveTextContent('Test card');

    // Visual should be wrapped in a link
    const visualLink = container.querySelector('.mg-card__visual-link');
    expect(visualLink).toHaveAttribute('href', '/example');
  });

  it('supports client-side navigation handlers without requiring a link URL', () => {
    const onClick = jest.fn(event => event.preventDefault());
    render(
      <IconCard
        data={makeData({
          icon: 'mg-icon mg-icon-globe',
          linkText: 'Explore',
          onClick,
        })}
      />
    );

    const titleLink = screen.getByRole('link', { name: 'Test card' });
    const actionLink = screen.getByRole('link', { name: 'Explore' });
    expect(titleLink).toHaveAttribute('href', '#');
    expect(actionLink).toHaveAttribute('href', '#');

    fireEvent.click(titleLink);
    fireEvent.click(actionLink);
    expect(onClick).toHaveBeenCalledTimes(2);
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
      />
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
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

const sass = require('sass');
const path = require('path');

/** Compiled once: layout bugs of this kind are invisible to jsdom. */
let compiled;
const css = () => {
  if (compiled === undefined) {
    compiled = sass.compile(
      path.resolve(__dirname, '../../../../assets/scss/style.scss'),
      {
        loadPaths: [path.resolve(__dirname, '../../../../assets/scss')],
        logger: sass.Logger.silent,
      }
    ).css;
  }
  return compiled;
};

const ruleFor = selector => {
  const match = css().match(
    new RegExp(
      `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`
    )
  );
  return match ? match[1] : '';
};

describe('icon card layout', () => {
  test("centred cards centre the icon on the visual's cross axis", () => {
    // The visual is a column flex container, so justify-content centres it
    // vertically. Without align-items the icon stays pinned left while the
    // text centres — which is what shipped.
    const rule = ruleFor('.mg-card__icon--centered .mg-card__visual');
    expect(rule).toMatch(/align-items:\s*center/);
  });

  test('horizontal cards give the visual an explicit size', () => {
    // imageScale pins --small to 72px and sizes the glyph by container query;
    // in a row that holds the column open wider than the icon drawn in it.
    const rule = ruleFor('.mg-card__icon--horizontal .mg-card__visual');
    expect(rule).toMatch(/inline-size:\s*var\(--mg-card-icon-size/);
    expect(rule).toMatch(/aspect-ratio:\s*auto/);
  });
});
