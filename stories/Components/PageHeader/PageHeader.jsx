import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../../Atom/Icons/Icon';
import { SkipLink } from '../../Utilities/SkipLink/SkipLink';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

/**
 * UNDRR page header with logo, user account link, and language selector.
 * The "decoration-only" variant renders just the colored stripe.
 */
export function PageHeader({
  variant = 'default',
  className,
  idPrefix = '',
  skipLinkTarget,
  skipLinkLabel = 'Skip to main content',
  logoUrl = 'https://assets.undrr.org/logos/undrr/undrr-logo-horizontal.svg',
  logoAlt = 'UNDRR Logo',
  logoTitle = 'UNDRR Logo',
  homeUrl = '/',
  showAccount = true,
  showLanguage = true,
  showLogo = true,
  languageDisplay = 'dropdown',
  languages = [
    { value: 'en', label: 'English', selected: true },
    { value: 'es', label: 'Spanish' },
    { value: 'ar', label: 'Arabic' },
  ],
  ...args
}) {
  const langSelectRef = useRef(null);
  // Element ids are Drupal-derived and consumers style and script against
  // them, so they stay verbatim by default. `idPrefix` namespaces them for
  // pages that render more than one header, where duplicate ids would break
  // the language `label`/`select` pairing (WCAG 1.3.1, 4.1.1).
  const id = name => (idPrefix ? `${idPrefix}-${name}` : name);

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
    <React.Fragment>
      {skipLinkTarget && (
        <SkipLink targetId={skipLinkTarget} label={skipLinkLabel} />
      )}
      <header id={id('header')} className={headerClasses} {...args}>
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
              {showLogo && (
                <div
                  id={id('block-undrrlogo')}
                  className="mg-page-header__block mg-page-header__block--logo"
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
                </div>
              )}

              {/* User icon */}
              {showAccount && (
                <a title="My account" href="/user">
                  <Icon
                    name="user"
                    className="mg-page-header__toolbar-icon"
                  />{' '}
                  <span className="mg-u-sr-only">My account</span>
                </a>
              )}

              {/* Language Section */}
              {showLanguage && (
                <div
                  className={cls(
                    'mg-page-header__block',
                    languageDisplay === 'links'
                      ? 'mg-page-header__block--language-links'
                      : 'mg-page-header__block--language'
                  )}
                >
                  {languageDisplay === 'links' ? (
                    <div
                      className="mg-page-header__language-links"
                      role="group"
                      aria-label="Language"
                    >
                      {languages.map((lang, index) => {
                        const isSelected =
                          lang.selected ??
                          (!languages.some(l => l.selected) && index === 0);
                        return (
                          <button
                            key={lang.value}
                            type="button"
                            className="mg-page-header__language-link"
                            aria-label={lang.label}
                            aria-current={isSelected ? 'true' : undefined}
                            onClick={() => {
                              const select = langSelectRef.current;
                              if (!select) return;
                              select.value = lang.value;
                              select.dispatchEvent(
                                new Event('change', { bubbles: true })
                              );
                              if (select.form?.requestSubmit) {
                                select.form.requestSubmit();
                              } else {
                                select.form?.submit();
                              }
                            }}
                          >
                            <span
                              className="mg-page-header__language-link-full"
                              aria-hidden="true"
                            >
                              {lang.label}
                            </span>
                            <span
                              className="mg-page-header__language-link-code"
                              aria-hidden="true"
                            >
                              {lang.value.slice(0, 2).toUpperCase()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <Icon
                      name="languages"
                      className="mg-page-header__toolbar-icon mg-page-header__language-icon"
                    />
                  )}
                  <form
                    className="mg-page-header__lang-form lang-dropdown-form lang_dropdown_form"
                    id={id('lang_dropdown_form_lang-dropdown-form')}
                    action="/"
                    method="post"
                    acceptCharset="UTF-8"
                    noValidate
                  >
                    <div className="mg-page-header__form-item form-item js-form-item form-type-select js-form-type-select form-item-lang-dropdown-select js-form-item-lang-dropdown-select form-no-label">
                      <label
                        htmlFor={id('edit-lang-dropdown-select')}
                        className="mg-u-sr-only"
                      >
                        Select your language
                      </label>

                      <div className="mg-page-header__select-wrapper">
                        <select
                          ref={langSelectRef}
                          title="Select your language"
                          className="mg-page-header__select lang-dropdown-select-element form-select form-control"
                          data-lang-dropdown-id="lang-dropdown-form"
                          id={id('edit-lang-dropdown-select')}
                          name="lang_dropdown_select"
                          tabIndex={languageDisplay === 'links' ? -1 : undefined}
                          aria-hidden={languageDisplay === 'links' || undefined}
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

                    {languageDisplay !== 'links' && (
                      <noscript>
                        <div>
                          <button
                            type="submit"
                            id={id('edit-submit')}
                            name="op"
                            value="Go"
                            className="button js-form-submit form-submit btn"
                          >
                            Go
                          </button>
                        </div>
                      </noscript>
                    )}
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </React.Fragment>
  );
}

PageHeader.propTypes = {
  /** Component variant ('default' for full header, 'decoration-only' for stripe only) */
  variant: PropTypes.oneOf(['default', 'decoration-only']),
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Namespace for the header's element ids. Required when a page renders more than one PageHeader. */
  idPrefix: PropTypes.string,
  /**
   * Id of the page's `<main>` element. When set, the header emits a skip link
   * before itself. The target must also carry `tabIndex={-1}`.
   */
  skipLinkTarget: PropTypes.string,
  /** Label for that skip link. */
  skipLinkLabel: PropTypes.string,
  /** URL for the UNDRR logo image */
  logoUrl: PropTypes.string,
  /** Alt text for the logo image */
  logoAlt: PropTypes.string,
  /** Title attribute for the logo image */
  logoTitle: PropTypes.string,
  /** URL for the logo link */
  homeUrl: PropTypes.string,
  /** Show or hide the UNDRR logo section */
  showLogo: PropTypes.bool,
  /** Show or hide the "My account" link */
  showAccount: PropTypes.bool,
  /** Show or hide the language switcher */
  showLanguage: PropTypes.bool,
  /**
   * How the language switcher is presented. 'dropdown' (default) is an
   * icon-only trigger that opens a native <select> — works everywhere,
   * including with JavaScript disabled (see the <noscript> submit button).
   * 'links' shows each language inline in the toolbar as its own button —
   * one click instead of open-then-select, best for 2-4 languages. It
   * requires JavaScript (the buttons drive the same underlying <select>
   * rather than each linking to a real URL, since `languages` doesn't carry
   * per-language URLs), so 'dropdown' is the safer default for progressive
   * enhancement.
   */
  languageDisplay: PropTypes.oneOf(['dropdown', 'links']),
  /** Array of language objects: { value, label, selected } */
  languages: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      selected: PropTypes.bool,
    })
  ),
};
