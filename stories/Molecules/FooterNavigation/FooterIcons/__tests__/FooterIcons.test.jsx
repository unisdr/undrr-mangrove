import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { FooterIcons } from '../FooterIcons';

describe('FooterIcons', () => {
  // --------------------------------------------------
  // Structure
  // --------------------------------------------------

  it('renders a <ul> with class footer-icons', () => {
    const { container } = render(<FooterIcons />);
    expect(container.querySelector('ul.footer-icons')).toBeInTheDocument();
  });

  it('renders all five social links', () => {
    const { container } = render(<FooterIcons />);
    expect(container.querySelectorAll('li')).toHaveLength(5);
  });

  // --------------------------------------------------
  // Accessible names on icon-only links
  // --------------------------------------------------

  it('every social link has an aria-label', () => {
    const { container } = render(<FooterIcons />);
    const links = container.querySelectorAll('a');
    links.forEach(link => {
      expect(link).toHaveAttribute('aria-label');
      expect(link.getAttribute('aria-label').length).toBeGreaterThan(0);
    });
  });

  it('icon spans inside links are aria-hidden', () => {
    const { container } = render(<FooterIcons />);
    // Icon component renders aria-hidden spans; check all icon spans
    const iconSpans = container.querySelectorAll('.mg-icon');
    iconSpans.forEach(span => {
      expect(span).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // --------------------------------------------------
  // Backward-compat classes
  // --------------------------------------------------

  it('preserves legacy CSS class on each social link', () => {
    const { container } = render(<FooterIcons />);
    expect(container.querySelector('a.facebook')).toBeInTheDocument();
    expect(container.querySelector('a.linkedin')).toBeInTheDocument();
    expect(container.querySelector('a.instagram')).toBeInTheDocument();
    expect(container.querySelector('a.twitter')).toBeInTheDocument();
    expect(container.querySelector('a.youtube')).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Inverted variant
  // --------------------------------------------------

  it('applies inverted class when variant="inverted"', () => {
    const { container } = render(<FooterIcons variant="inverted" />);
    expect(container.querySelector('ul')).toHaveClass('inverted');
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has no a11y violations (default)', async () => {
    const { container } = render(<FooterIcons />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations (inverted)', async () => {
    const { container } = render(<FooterIcons variant="inverted" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
