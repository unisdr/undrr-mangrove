import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { TextCta } from '../TextCta';

describe('TextCta', () => {
  const defaultButtons = [
    { label: 'Read more', url: '/about' },
    { label: 'Contact us', url: '/contact', type: 'Secondary' },
  ];

  // --------------------------------------------------
  // Headline rendering
  // --------------------------------------------------

  it('renders headline text', () => {
    render(<TextCta headline="Join the platform" />);

    expect(screen.getByText('Join the platform')).toBeInTheDocument();
  });

  it('applies headlineSize class', () => {
    const { container } = render(
      <TextCta headline="Big heading" headlineSize="800" />,
    );

    const header = container.querySelector('.mg-cta__headline');
    expect(header).toHaveClass('mg-u-font-size-800');
  });

  // --------------------------------------------------
  // Text (dangerouslySetInnerHTML)
  // --------------------------------------------------

  it('renders sanitized HTML in text prop', () => {
    const { container } = render(
      <TextCta text="<p>Hello <strong>world</strong></p>" />,
    );

    const textEl = container.querySelector('.mg-cta__text');
    expect(textEl.innerHTML).toContain('<strong>world</strong>');
  });

  // --------------------------------------------------
  // Buttons
  // --------------------------------------------------

  it('renders buttons as links', () => {
    render(<TextCta buttons={defaultButtons} />);

    const readMore = screen.getByText('Read more');
    expect(readMore.tagName).toBe('A');
    expect(readMore).toHaveAttribute('href', '/about');
    expect(readMore).toHaveClass('mg-button-primary');

    const contact = screen.getByText('Contact us');
    expect(contact).toHaveClass('mg-button-secondary');
  });

  it('defaults button href to # when url is missing', () => {
    render(<TextCta buttons={[{ label: 'Click' }]} />);

    expect(screen.getByText('Click')).toHaveAttribute('href', '#');
  });

  // --------------------------------------------------
  // Variant classes
  // --------------------------------------------------

  it('applies variant class', () => {
    const { container } = render(<TextCta variant="secondary" />);

    expect(container.firstChild).toHaveClass('mg-cta--secondary');
  });

  it('applies primary variant by default', () => {
    const { container } = render(<TextCta />);

    expect(container.firstChild).toHaveClass('mg-cta--primary');
  });

  // --------------------------------------------------
  // Image layout
  // --------------------------------------------------

  it('adds mg-cta--with-image class when image is set', () => {
    const { container } = render(
      <TextCta image="https://example.com/photo.jpg" imageAlt="A photo" />,
    );

    expect(container.firstChild).toHaveClass('mg-cta--with-image');
    expect(container.firstChild).not.toHaveClass('mg-cta--centered');

    const img = screen.getByAltText('A photo');
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  // --------------------------------------------------
  // Centered layout
  // --------------------------------------------------

  it('adds mg-cta--centered class when centered and no image', () => {
    const { container } = render(<TextCta centered />);

    expect(container.firstChild).toHaveClass('mg-cta--centered');
  });

  it('does not add mg-cta--centered when image is present', () => {
    const { container } = render(
      <TextCta centered image="https://example.com/photo.jpg" />,
    );

    expect(container.firstChild).not.toHaveClass('mg-cta--centered');
  });

  // --------------------------------------------------
  // Custom background color
  // --------------------------------------------------

  it('sets --mg-cta-bg CSS variable from backgroundColor', () => {
    const { container } = render(<TextCta backgroundColor="#2c5f2d" />);

    expect(container.firstChild).toHaveStyle({ '--mg-cta-bg': '#2c5f2d' });
  });

  it('sets custom padding via style', () => {
    const { container } = render(<TextCta padding="8rem 0" />);

    expect(container.firstChild).toHaveStyle({ padding: '8rem 0' });
  });

  // --------------------------------------------------
  // Additional className
  // --------------------------------------------------

  it('appends custom className', () => {
    const { container } = render(<TextCta className="my-custom" />);

    expect(container.firstChild).toHaveClass('mg-cta', 'my-custom');
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has no a11y violations', async () => {
    const { container } = render(
      <TextCta
        headline="Take action now"
        text="<p>Register for the conference.</p>"
        buttons={defaultButtons}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations with image', async () => {
    const { container } = render(
      <TextCta
        headline="Recovery Help Desk"
        buttons={[{ label: 'Learn more', url: '#' }]}
        image="https://example.com/photo.jpg"
        imageAlt="Help desk icon"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
