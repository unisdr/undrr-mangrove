import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  // --------------------------------------------------
  // Default rendering
  // --------------------------------------------------

  it('renders all sections by default', () => {
    render(<PageHeader />);

    // Logo
    expect(screen.getByAltText('UNDRR Logo')).toBeInTheDocument();
    // Account link
    expect(screen.getByText('My account')).toBeInTheDocument();
    // Language selector
    expect(screen.getByLabelText('Select your language')).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Visibility toggles
  // --------------------------------------------------

  it('hides the logo section when showLogo is false', () => {
    render(<PageHeader showLogo={false} />);

    expect(screen.queryByAltText('UNDRR Logo')).toBeNull();
    // Other sections still present
    expect(screen.getByText('My account')).toBeInTheDocument();
    expect(screen.getByLabelText('Select your language')).toBeInTheDocument();
  });

  it('hides the account link when showAccount is false', () => {
    render(<PageHeader showAccount={false} />);

    expect(screen.queryByText('My account')).toBeNull();
    expect(screen.getByAltText('UNDRR Logo')).toBeInTheDocument();
  });

  it('hides the language selector when showLanguage is false', () => {
    render(<PageHeader showLanguage={false} />);

    expect(screen.queryByLabelText('Select your language')).toBeNull();
    expect(screen.getByAltText('UNDRR Logo')).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Decoration-only variant
  // --------------------------------------------------

  it('renders only the decoration stripe for decoration-only variant', () => {
    const { container } = render(<PageHeader variant="decoration-only" />);

    expect(
      container.querySelector('.mg-page-header__decoration'),
    ).toBeInTheDocument();
    // No toolbar, no logo, no account, no language
    expect(
      container.querySelector('.mg-page-header__toolbar-wrapper'),
    ).toBeNull();
    expect(screen.queryByAltText('UNDRR Logo')).toBeNull();
    expect(screen.queryByText('My account')).toBeNull();
  });

  // --------------------------------------------------
  // Custom logo and home URL props
  // --------------------------------------------------

  it('applies custom logoUrl, logoAlt, and homeUrl', () => {
    render(
      <PageHeader
        logoUrl="/custom-logo.svg"
        logoAlt="Custom logo"
        homeUrl="/home"
      />,
    );

    const img = screen.getByAltText('Custom logo');
    expect(img).toHaveAttribute('src', '/custom-logo.svg');
    expect(img.closest('a')).toHaveAttribute('href', '/home');
  });

  // --------------------------------------------------
  // Language options
  // --------------------------------------------------

  it('renders language options from the languages prop', () => {
    const languages = [
      { value: 'en', label: 'English', selected: true },
      { value: 'fr', label: 'French' },
      { value: 'zh', label: 'Chinese' },
    ];

    render(<PageHeader languages={languages} />);

    const select = screen.getByLabelText('Select your language');
    const options = select.querySelectorAll('option');

    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('English');
    expect(options[1]).toHaveTextContent('French');
    expect(options[2]).toHaveTextContent('Chinese');
    expect(select.value).toBe('en');
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has no a11y violations in default variant', async () => {
    const { container } = render(<PageHeader />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations in decoration-only variant', async () => {
    const { container } = render(<PageHeader variant="decoration-only" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
