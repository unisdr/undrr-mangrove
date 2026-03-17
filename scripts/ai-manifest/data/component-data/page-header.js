/**
 * @file page-header.js
 * @source manual (metadata + curated HTML)
 *
 * All content is manually maintained. Update the HTML examples
 * when the component markup changes. See scripts/README.md for
 * the entry schema and available fields.
 */

export default {
  // ===================================================================

  'components-pageheader': {
    vanillaHtml: true,
    description: 'UNDRR page header with colored decoration stripe, logo, user account link, and language selector dropdown.',
    doNotModify: 'The PageHeader structure (decoration stripe, toolbar wrapper, logo section) is a UNDRR branding requirement. Use the documented markup exactly as shown. The four empty divs inside mg-page-header__decoration are intentional — they render the colored stripe segments.',
    cssClasses: [
      'mg-page-header',
      'mg-page-header--default',
      'mg-page-header__decoration',
      'mg-page-header__toolbar-wrapper',
      'mg-page-header__container',
      'mg-page-header__region',
      'mg-page-header__region--toolbar',
      'mg-page-header__block',
      'mg-page-header__block--logo',
      'mg-page-header__logo-img',
      'mg-page-header__label',
      'mg-page-header__label-mobile',
      'mg-page-header__lang-form',
      'mg-page-header__form-item',
      'mg-page-header__select-wrapper',
      'mg-page-header__select',
    ],
    examples: [
      {
        name: 'Page header with logo and language selector',
        html: `<header id="header" class="mg-page-header mg-page-header--default">
  <div class="mg-page-header__decoration">
    <div></div><div></div><div></div><div></div>
  </div>
  <div class="mg-page-header__toolbar-wrapper">
    <div class="mg-page-header__container mg-container">
      <div class="mg-page-header__region mg-page-header__region--toolbar">
        <div class="mg-page-header__block mg-page-header__block--logo">
          <a href="/">
            <img class="mg-page-header__logo-img" src="/logo.svg" alt="UNDRR" />
          </a>
        </div>
        <div class="mg-page-header__block">
          <a href="/account">
            <span class="mg-icon mg-icon-user"></span>
            <span class="mg-page-header__label">My account</span>
          </a>
        </div>
        <div class="mg-page-header__block">
          <form class="mg-page-header__lang-form">
            <div class="mg-page-header__form-item">
              <label class="mg-u-sr-only" for="lang-select">Language</label>
              <div class="mg-page-header__select-wrapper">
                <select id="lang-select" class="mg-page-header__select">
                  <option value="en" selected>English</option>
                  <option value="fr">Fran\u00e7ais</option>
                  <option value="es">Espa\u00f1ol</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</header>`,
      },
    ],
  },
};
