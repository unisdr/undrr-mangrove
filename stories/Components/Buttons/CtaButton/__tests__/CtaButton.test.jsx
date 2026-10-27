import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { CtaButton } from '../CtaButton';

describe('CtaButton', () => {
  it('uses the supplied destination when enabled', () => {
    render(<CtaButton label="Read the report" href="/report" />);

    expect(
      screen.getByRole('link', { name: 'Read the report' })
    ).toHaveAttribute('href', '/report');
  });

  it('cannot navigate when disabled even if a destination is supplied', () => {
    render(
      <CtaButton label="Read the report" href="/report" State="Disabled" />
    );

    const control = screen.getByText('Read the report').closest('a');
    expect(control).not.toHaveAttribute('href');
    expect(control).toHaveAttribute('aria-disabled', 'true');
    expect(control).toHaveAttribute('tabindex', '-1');
  });

  it('composes caller classes with its variants', () => {
    render(
      <CtaButton
        label="Browse publications"
        Variant="CTA"
        className="custom-class"
      />
    );

    expect(screen.getByRole('link')).toHaveClass(
      'mg-button',
      'mg-button-cta',
      'mg-button-primary',
      'custom-class'
    );
    expect(screen.getByRole('link')).toHaveTextContent('Browse publications');
    expect(screen.getByRole('link').children).toHaveLength(0);
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <CtaButton label="Browse publications" href="/publications" />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
