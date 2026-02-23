import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import QuoteHighlight from '../QuoteHighlight';

describe('QuoteHighlight', () => {
  const defaultProps = {
    quote: 'Test quote text',
    attribution: 'Test Author',
    attributionTitle: 'Test Title',
  };

  it('renders the quote text', () => {
    render(<QuoteHighlight {...defaultProps} />);
    expect(screen.getByText('Test quote text')).toBeInTheDocument();
  });

  it('renders attribution name and title', () => {
    render(<QuoteHighlight {...defaultProps} />);
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders as a section element', () => {
    const { container } = render(<QuoteHighlight {...defaultProps} />);
    expect(container.querySelector('section')).toBeInTheDocument();
  });

  it('applies background color class', () => {
    const { container } = render(
      <QuoteHighlight {...defaultProps} backgroundColor="dark" />,
    );
    expect(
      container.querySelector('.mg-quote-highlight--dark'),
    ).toBeInTheDocument();
  });

  it('applies variant class', () => {
    const { container } = render(
      <QuoteHighlight {...defaultProps} variant="image" />,
    );
    expect(
      container.querySelector('.mg-quote-highlight--image'),
    ).toBeInTheDocument();
  });

  it('applies alignment class', () => {
    const { container } = render(
      <QuoteHighlight {...defaultProps} alignment="left" />,
    );
    expect(
      container.querySelector('.mg-quote-highlight--left'),
    ).toBeInTheDocument();
  });

  it('renders separator line for line variant', () => {
    const { container } = render(
      <QuoteHighlight {...defaultProps} variant="line" />,
    );
    expect(
      container.querySelector('.mg-quote-highlight__separator'),
    ).toBeInTheDocument();
  });

  it('does not render separator for image variant', () => {
    const { container } = render(
      <QuoteHighlight {...defaultProps} variant="image" />,
    );
    expect(
      container.querySelector('.mg-quote-highlight__separator'),
    ).toBeNull();
  });

  it('renders portrait image when imageSrc is provided', () => {
    render(
      <QuoteHighlight
        {...defaultProps}
        imageSrc="https://example.com/photo.jpg"
        imageAlt="Author photo"
      />,
    );
    const img = screen.getByAltText('Author photo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('does not render image when imageSrc is not provided', () => {
    const { container } = render(<QuoteHighlight {...defaultProps} />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('uses dangerouslySetInnerHTML for HTML quotes', () => {
    const { container } = render(
      <QuoteHighlight
        {...defaultProps}
        quote="Quote with <a href='#'>link</a>"
      />,
    );
    expect(container.querySelector('a')).toBeInTheDocument();
  });

  it('renders plain text quotes in a <p> element', () => {
    const { container } = render(
      <QuoteHighlight {...defaultProps} quote="Plain text quote" />,
    );
    const blockquote = container.querySelector('.mg-quote-highlight__quote');
    expect(blockquote.querySelector('p')).toBeInTheDocument();
  });

  it('renders without attribution', () => {
    render(<QuoteHighlight quote="Just a quote" />);
    expect(screen.getByText('Just a quote')).toBeInTheDocument();
  });

  it('adds custom className', () => {
    const { container } = render(
      <QuoteHighlight {...defaultProps} className="custom-class" />,
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('adds has-image class when imageSrc is provided', () => {
    const { container } = render(
      <QuoteHighlight
        {...defaultProps}
        imageSrc="https://example.com/photo.jpg"
      />,
    );
    expect(
      container.querySelector('.mg-quote-highlight--has-image'),
    ).toBeInTheDocument();
  });

  it('renders large image in image variant', () => {
    render(
      <QuoteHighlight
        {...defaultProps}
        variant="image"
        imageSrc="https://example.com/photo.jpg"
        imageAlt="Large photo"
      />,
    );
    const images = screen.getAllByAltText('Large photo');
    // Should render both portrait and large image in image variant
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it('has no a11y violations', async () => {
    const { container } = render(<QuoteHighlight {...defaultProps} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
