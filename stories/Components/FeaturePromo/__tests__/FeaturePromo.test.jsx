import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { FeaturePromo } from '../FeaturePromo';

const defaultProps = {
  image: 'https://example.com/photo.jpg',
  imageAlt: 'Scientists review flood data in the field',
  heading: 'Global Assessment Report 2024',
  summary: 'Early warning systems reduce deaths eightfold.',
  ctaLabel: 'Read the report',
  ctaUrl: '/publications/gar2024',
};

describe('FeaturePromo', () => {
  it('renders as a <section> landmark', () => {
    render(<FeaturePromo {...defaultProps} />);
    expect(document.querySelector('section.mg-feature-promo')).toBeInTheDocument();
  });

  it('renders the image with the provided alt text', () => {
    render(<FeaturePromo {...defaultProps} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', defaultProps.imageAlt);
    expect(img).toHaveAttribute('src', defaultProps.image);
  });

  it('renders an empty alt for decorative images', () => {
    const { container } = render(<FeaturePromo {...defaultProps} imageAlt="" />);
    // alt="" removes the 'img' ARIA role (becomes 'presentation'), so query by tag
    expect(container.querySelector('img.mg-feature-promo__image')).toHaveAttribute('alt', '');
  });

  it('renders the heading as h2 by default', () => {
    render(<FeaturePromo {...defaultProps} />);
    expect(screen.getByRole('heading', { level: 2, name: defaultProps.heading })).toBeInTheDocument();
  });

  it('renders the heading at the specified headlineLevel', () => {
    render(<FeaturePromo {...defaultProps} headlineLevel={3} />);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('renders the summary text', () => {
    render(<FeaturePromo {...defaultProps} />);
    expect(screen.getByText(defaultProps.summary)).toBeInTheDocument();
  });

  it('renders the CTA link with correct href', () => {
    render(<FeaturePromo {...defaultProps} />);
    const link = screen.getByRole('link', { name: defaultProps.ctaLabel });
    expect(link).toHaveAttribute('href', defaultProps.ctaUrl);
    expect(link).not.toHaveAttribute('target');
  });

  it('opens external CTA in a new tab with noopener', () => {
    render(<FeaturePromo {...defaultProps} ctaExternal />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('hides the CTA when ctaUrl is missing', () => {
    render(<FeaturePromo {...defaultProps} ctaUrl={undefined} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('hides the CTA when ctaLabel is missing', () => {
    render(<FeaturePromo {...defaultProps} ctaLabel={undefined} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('omits the summary paragraph when no summary is provided', () => {
    const { container } = render(<FeaturePromo {...defaultProps} summary={undefined} />);
    expect(container.querySelector('.mg-feature-promo__summary')).not.toBeInTheDocument();
  });

  it('applies the variant class', () => {
    const { container } = render(<FeaturePromo {...defaultProps} variant="secondary" />);
    expect(container.firstChild).toHaveClass('mg-feature-promo--secondary');
  });

  it('applies the reverse class when reverse=true', () => {
    const { container } = render(<FeaturePromo {...defaultProps} reverse />);
    expect(container.firstChild).toHaveClass('mg-feature-promo--reverse');
  });

  it('does not apply the reverse class by default', () => {
    const { container } = render(<FeaturePromo {...defaultProps} />);
    expect(container.firstChild).not.toHaveClass('mg-feature-promo--reverse');
  });

  it('merges extra className onto the root element', () => {
    const { container } = render(<FeaturePromo {...defaultProps} className="my-custom" />);
    expect(container.firstChild).toHaveClass('my-custom');
  });

  it('passes axe accessibility audit (default)', async () => {
    const { container } = render(<FeaturePromo {...defaultProps} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes axe accessibility audit (reverse, no CTA)', async () => {
    const { container } = render(
      <FeaturePromo
        image={defaultProps.image}
        imageAlt={defaultProps.imageAlt}
        heading={defaultProps.heading}
        reverse
        variant="tertiary"
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
