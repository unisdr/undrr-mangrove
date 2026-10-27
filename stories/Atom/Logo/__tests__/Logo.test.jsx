import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Logo } from '../Logo';

describe('Logo', () => {
  // --------------------------------------------------
  // Basic rendering
  // --------------------------------------------------

  it('renders an image with the given src and alt text', () => {
    render(<Logo src="/logo.svg" alt="UNDRR logo" />);

    const img = screen.getByAltText('UNDRR logo');
    expect(img).toHaveAttribute('src', '/logo.svg');
    expect(img).toHaveClass('mg-logo');
  });

  it('applies title, width, and height attributes', () => {
    render(
      <Logo
        src="/logo.svg"
        alt="UNDRR logo"
        title="UNDRR"
        width="324"
        height="47"
      />
    );

    const img = screen.getByAltText('UNDRR logo');
    expect(img).toHaveAttribute('title', 'UNDRR');
    expect(img).toHaveAttribute('width', '324');
    expect(img).toHaveAttribute('height', '47');
  });

  it('applies additional classes via className', () => {
    render(<Logo src="/logo.svg" alt="UNDRR logo" className="custom" />);

    expect(screen.getByAltText('UNDRR logo')).toHaveClass('mg-logo', 'custom');
  });

  // --------------------------------------------------
  // Translated logos
  // --------------------------------------------------

  it('applies the lang attribute for translated logos', () => {
    render(<Logo src="/logo-ar.png" alt="UNDRR logo (Arabic)" lang="ar" />);

    expect(screen.getByAltText('UNDRR logo (Arabic)')).toHaveAttribute(
      'lang',
      'ar'
    );
  });

  it('omits the lang attribute by default', () => {
    render(<Logo src="/logo.svg" alt="UNDRR logo" />);

    expect(screen.getByAltText('UNDRR logo')).not.toHaveAttribute('lang');
  });

  // --------------------------------------------------
  // Crop variant
  // --------------------------------------------------

  it('does not apply a crop modifier by default', () => {
    const { container } = render(<Logo src="/logo.svg" alt="UNDRR logo" />);
    expect(container.firstChild).not.toHaveClass('mg-logo--autocrop');
  });

  it('applies mg-logo--autocrop when crop="autocrop"', () => {
    render(<Logo src="/logo.svg" alt="UNDRR logo" crop="autocrop" />);

    expect(screen.getByAltText('UNDRR logo')).toHaveClass(
      'mg-logo',
      'mg-logo--autocrop'
    );
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has no a11y violations', async () => {
    const { container } = render(<Logo src="/logo.svg" alt="UNDRR logo" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations with the autocrop variant and a translated lang', async () => {
    const { container } = render(
      <Logo
        src="/logo-ar.png"
        alt="UNDRR logo (Arabic)"
        lang="ar"
        crop="autocrop"
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
