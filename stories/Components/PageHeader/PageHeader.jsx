import React from 'react';
import PropTypes from 'prop-types';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

/**
 * UNDRR page header with logo, user account link, and language selector.
 * The "decoration-only" variant renders just the colored stripe.
 */
export function PageHeader({
  variant = 'default',
  className,
  logoUrl = 'https://assets.undrr.org/static/logos/undrr/undrr-logo-horizontal.svg',
  logoAlt = 'UNDRR Logo',
  logoTitle = 'UNDRR Logo',
  homeUrl = '/',
  languages = [
    { value: 'en', label: 'English', selected: true },
    { value: 'es', label: 'Spanish' },
    { value: 'ar', label: 'Arabic' },
  ],
  ...args
}) {
  const headerClasses = cls(
    'mg-page-header',
    variant && `mg-page-header--${variant}`,
    className
  );

  // If decoration-only variant, render only the decoration stripe
  if (variant === 'decoration-only') {
    return (
      <div className={cls('mg-page-header__decoration', className)} {...args}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    );
  }

  return (
    <header id="header" className={headerClasses} {...args}>
      {/* Decoration stripe */}
      <div className="mg-page-header__decoration">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div
        className="mg-page-header__toolbar-wrapper"
        data-vf-google-analytics-region="undrr-black-bar"
      >
        <div className="mg-page-header__container mg-container">
          <div className="mg-page-header__region mg-page-header__region--toolbar">
            {/* UNDRR Logo Section */}
            <section
              id="block-undrrlogo"
              className="mg-page-header__block mg-page-header__block--logo "
            >
              <a href={homeUrl}>
                <img
                  alt={logoAlt}
                  src={logoUrl}
                  width="324"
                  height="47"
                  title={logoTitle}
                  className="mg-page-header__logo-img"
                />
              </a>
            </section>

            {/* User icon */}
            <a alt="Log in or register" title="Log in or register" href="/user">
              <i className="mg-icon mg-icon-user"></i>{' '}
              <span className="mg-page-header__label">My account</span>
              {/* <span className="mg-page-header__label-mobile">Login</span> */}
            </a>

            {/* Language Dropdown Section */}
            <section className="mg-page-header__block mg-page-header__block--language ">
              <form
                className="mg-page-header__lang-form lang-dropdown-form lang_dropdown_form"
                id="lang_dropdown_form_lang-dropdown-form"
                action="/"
                method="post"
                acceptCharset="UTF-8"
                noValidate
              >
                <div className="mg-page-header__form-item form-item js-form-item form-type-select js-form-type-select form-item-lang-dropdown-select js-form-item-lang-dropdown-select form-no-label">
                  <label
                    htmlFor="edit-lang-dropdown-select"
                    className="mg-u-sr-only"
                  >
                    Select your language
                  </label>

                  <div className="mg-page-header__select-wrapper">
                    <select
                      style={{ width: '165px' }}
                      className="mg-page-header__select lang-dropdown-select-element form-select form-control"
                      data-lang-dropdown-id="lang-dropdown-form"
                      id="edit-lang-dropdown-select"
                      name="lang_dropdown_select"
                      defaultValue={
                        languages.find(lang => lang.selected)?.value ||
                        languages[0]?.value
                      }
                    >
                      {languages.map((lang, index) => (
                        <option key={index} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <noscript>
                  <div>
                    <button
                      type="submit"
                      id="edit-submit"
                      name="op"
                      value="Go"
                      className="button js-form-submit form-submit btn"
                    >
                      Go
                    </button>
                  </div>
                </noscript>
              </form>
            </section>
          </div>
        </div>
      </div>
    </header>
  );
}

PageHeader.propTypes = {
  /** Visual variant: "default" shows the full header, "decoration-only" shows just the colored stripe. */
  variant: PropTypes.oneOf(['default', 'decoration-only']),
  /** Additional CSS class(es). */
  className: PropTypes.string,
  /** URL for the header logo image. */
  logoUrl: PropTypes.string,
  /** Alt text for the logo. */
  logoAlt: PropTypes.string,
  /** Title attribute for the logo. */
  logoTitle: PropTypes.string,
  /** URL the logo links to. */
  homeUrl: PropTypes.string,
  /** Available languages for the language selector dropdown. */
  languages: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      selected: PropTypes.bool,
    })
  ),
};
