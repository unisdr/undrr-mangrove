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
      container.querySelector('.mg-page-header__decoration')
    ).toBeInTheDocument();
    // No toolbar, no logo, no account, no language
    expect(
      container.querySelector('.mg-page-header__toolbar-wrapper')
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
      />
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
  // languageDisplay="links"
  // --------------------------------------------------

  describe('languageDisplay="links"', () => {
    const languages = [
      { value: 'en', label: 'English', selected: true },
      { value: 'ar', label: 'العربية' },
      { value: 'es', label: 'Español' },
    ];

    it('renders a button per language instead of the native select', () => {
      render(<PageHeader languageDisplay="links" languages={languages} />);

      expect(
        screen.getByRole('button', { name: 'English' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'العربية' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Español' })
      ).toBeInTheDocument();
      // The select stays in the DOM (it's what actually gets submitted) but
      // is removed from both the accessibility tree and the tab order —
      // the buttons are the only way to reach language selection here.
      const select = screen.getByDisplayValue('English');
      expect(select.tagName).toBe('SELECT');
      expect(select).toHaveAttribute('aria-hidden', 'true');
      expect(select).toHaveAttribute('tabindex', '-1');
    });

    it('marks the selected language with aria-current', () => {
      render(<PageHeader languageDisplay="links" languages={languages} />);

      expect(
        screen.getByRole('button', { name: 'English' })
      ).toHaveAttribute('aria-current', 'true');
      expect(
        screen.getByRole('button', { name: 'العربية' })
      ).not.toHaveAttribute('aria-current');
    });

    it('defaults to the first language when none is marked selected', () => {
      render(
        <PageHeader
          languageDisplay="links"
          languages={[
            { value: 'fr', label: 'Français' },
            { value: 'de', label: 'Deutsch' },
          ]}
        />
      );

      expect(
        screen.getByRole('button', { name: 'Français' })
      ).toHaveAttribute('aria-current', 'true');
      expect(
        screen.getByRole('button', { name: 'Deutsch' })
      ).not.toHaveAttribute('aria-current');
    });

    it('drives the underlying select and submits the form on click', () => {
      render(<PageHeader languageDisplay="links" languages={languages} />);

      const form = document.querySelector('.mg-page-header__lang-form');
      const requestSubmit = jest.fn();
      form.requestSubmit = requestSubmit;

      screen.getByRole('button', { name: 'Español' }).click();

      const select = document.querySelector('.mg-page-header__select');
      expect(select.value).toBe('es');
      expect(requestSubmit).toHaveBeenCalledTimes(1);
    });

    it('has no a11y violations', async () => {
      const { container } = render(
        <PageHeader languageDisplay="links" languages={languages} />
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  // --------------------------------------------------
  // Skip link
  // --------------------------------------------------

  it('emits no skip link unless a target is given', () => {
    const { container } = render(<PageHeader />);

    expect(container.querySelector('.mg-skip-link')).toBeNull();
    expect(container.firstChild).toHaveClass('mg-page-header');
  });

  it('emits a skip link before the header when a target is given', () => {
    const { container } = render(<PageHeader skipLinkTarget="main-content" />);

    const link = screen.getByRole('link', { name: 'Skip to main content' });

    expect(link).toHaveAttribute('href', '#main-content');
    expect(container.firstChild).toBe(link);
  });

  it('takes a translated skip link label', () => {
    render(
      <PageHeader
        skipLinkTarget="main-content"
        skipLinkLabel="Aller au contenu principal"
      />
    );

    expect(
      screen.getByRole('link', { name: 'Aller au contenu principal' })
    ).toBeInTheDocument();
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

  it('keeps the shipped Drupal ids when no idPrefix is given', () => {
    const { container } = render(<PageHeader />);
    expect(container.querySelector('#header')).not.toBeNull();
    expect(container.querySelector('#block-undrrlogo')).not.toBeNull();
    expect(screen.getByLabelText('Select your language')).toHaveAttribute(
      'id',
      'edit-lang-dropdown-select'
    );
  });

  // Two stacked headers still leave two banner landmarks, which is inherent to
  // the demo composition rather than to the ids; axe is not asserted here.
  it('namespaces its ids so two headers on a page stay valid and labelled', () => {
    const { container } = render(
      <div>
        <PageHeader idPrefix="one" />
        <PageHeader idPrefix="two" />
      </div>
    );

    const ids = Array.from(container.querySelectorAll('[id]')).map(
      node => node.id
    );
    expect(new Set(ids).size).toBe(ids.length);

    const selects = screen.getAllByLabelText('Select your language');
    expect(selects).toHaveLength(2);
    expect(selects[0]).toHaveAttribute('id', 'one-edit-lang-dropdown-select');
    expect(selects[1]).toHaveAttribute('id', 'two-edit-lang-dropdown-select');
  });
});
