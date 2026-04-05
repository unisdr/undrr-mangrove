import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Icon } from '../Icon';

describe('Icon', () => {
  // --------------------------------------------------
  // Class name normalisation
  // --------------------------------------------------

  it('renders plain name as mg-icon mg-icon-{name}', () => {
    const { container } = render(<Icon name="globe" />);
    expect(container.firstChild).toHaveClass('mg-icon', 'mg-icon-globe');
  });

  it('renders fa- prefix as mg-icon fa-{name}', () => {
    const { container } = render(<Icon name="fa-globe" />);
    expect(container.firstChild).toHaveClass('mg-icon', 'fa-globe');
    expect(container.firstChild).not.toHaveClass('mg-icon-fa-globe');
  });

  it('renders mg-icon- prefix as mg-icon mg-icon-{name}', () => {
    const { container } = render(<Icon name="mg-icon-globe" />);
    expect(container.firstChild).toHaveClass('mg-icon', 'mg-icon-globe');
  });

  it('renders mg- prefix (legacy) as mg-icon mg-icon-{name}', () => {
    const { container } = render(<Icon name="mg-globe" />);
    expect(container.firstChild).toHaveClass('mg-icon', 'mg-icon-globe');
  });

  it('passes through a full class string unchanged', () => {
    const { container } = render(<Icon name="mg-icon fa-globe" />);
    expect(container.firstChild.className).toBe('mg-icon fa-globe');
  });

  // --------------------------------------------------
  // Size modifier
  // --------------------------------------------------

  it('appends the size modifier class when size is provided', () => {
    const { container } = render(<Icon name="globe" size="lg" />);
    expect(container.firstChild).toHaveClass('mg-icon--lg');
  });

  it.each(['sm', 'lg', 'xl'])('applies mg-icon--%s size modifier', size => {
    const { container } = render(<Icon name="globe" size={size} />);
    expect(container.firstChild).toHaveClass(`mg-icon--${size}`);
  });

  // --------------------------------------------------
  // Additional className
  // --------------------------------------------------

  it('appends extra className to the class list', () => {
    const { container } = render(
      <Icon name="globe" className="mg-u-color--interactive" />,
    );
    expect(container.firstChild).toHaveClass('mg-u-color--interactive');
    expect(container.firstChild).toHaveClass('mg-icon', 'mg-icon-globe');
  });

  // --------------------------------------------------
  // Accessibility — decorative icon contract
  // --------------------------------------------------

  it('always renders aria-hidden="true"', () => {
    const { container } = render(<Icon name="globe" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders aria-hidden="true" for fa- icons too', () => {
    const { container } = render(<Icon name="fa-globe" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('passes axe accessibility check', async () => {
    const { container } = render(<Icon name="globe" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // --------------------------------------------------
  // Edge cases
  // --------------------------------------------------

  it('returns null when name is not provided', () => {
    const { container } = render(<Icon name="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a span element', () => {
    const { container } = render(<Icon name="globe" />);
    expect(container.firstChild.tagName).toBe('SPAN');
  });

  it('forwards additional props to the span', () => {
    const { container } = render(
      <Icon name="globe" data-testid="my-icon" />,
    );
    expect(container.firstChild).toHaveAttribute('data-testid', 'my-icon');
  });
});
