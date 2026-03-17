/**
 * @file constants.js
 * @source manual
 *
 * Single source of truth for asset URLs, script references, and logo paths
 * used across the AI manifest data files. Update URLs here when they change.
 *
 * Version-dependent URLs use {{version}} which gets replaced at generation
 * time with the actual version from package.json.
 */

// ---------------------------------------------------------------------------
// CDN base URLs ({{version}} is replaced at build time)
// ---------------------------------------------------------------------------

export const CDN_BASE = 'https://cdn.jsdelivr.net/npm/@undrr/undrr-mangrove@{{version}}';
export const ASSETS_BASE = 'https://assets.undrr.org';

// ---------------------------------------------------------------------------
// Theme stylesheets
// ---------------------------------------------------------------------------

export const THEME_CSS = {
  undrr: `${CDN_BASE}/dist/css/style.css`,
  preventionweb: `${CDN_BASE}/dist/css/style-preventionweb.css`,
  mcr2030: `${CDN_BASE}/dist/css/style-mcr.css`,
  irp: `${CDN_BASE}/dist/css/style-irp.css`,
};

// ---------------------------------------------------------------------------
// Required page scripts (order matters)
// ---------------------------------------------------------------------------

export const REQUIRED_SCRIPTS = [
  {
    name: 'UNDRR analytics (GA4)',
    url: `${ASSETS_BASE}/static/analytics/v1.0.0/google_analytics_enhancements.js`,
    placement: 'before closing </body>',
    attributes: 'defer',
    note: 'Google Analytics 4 bootstrap and enhancements for UNDRR sites.',
  },
  {
    name: 'UNDRR critical messaging',
    url: 'https://messaging.undrr.org/src/undrr-messaging.js',
    placement: 'before closing </body>',
    attributes: 'defer',
    note: 'Emergency broadcasts. Injects messages at top of body or into .mg-critical-messaging container.',
  },
  {
    name: 'Cookie consent JS (UMD)',
    url: `${ASSETS_BASE}/static/cookie-banner/v1/cookieconsent.umd.js`,
    placement: 'before closing </body>, after analytics',
    attributes: 'none (synchronous)',
    note: 'Cookie consent library. Must load before the UNDRR config script.',
  },
  {
    name: 'Cookie consent UNDRR config',
    url: `${ASSETS_BASE}/static/cookie-banner/v1/cookieconsent-undrr.js`,
    placement: 'immediately after cookieconsent.umd.js',
    attributes: 'none (synchronous)',
    note: 'UNDRR-specific cookie consent configuration.',
  },
];

// ---------------------------------------------------------------------------
// Required stylesheets
// ---------------------------------------------------------------------------

export const REQUIRED_STYLESHEETS = [
  {
    name: 'Mangrove theme CSS',
    url: THEME_CSS.undrr,
    placement: 'head',
    note: 'Choose one theme. See THEME_CSS for alternatives.',
  },
  {
    name: 'Cookie consent CSS',
    url: `${ASSETS_BASE}/static/cookie-banner/v1/cookieconsent.css`,
    placement: 'head',
    note: 'Required if using the UNDRR cookie consent banner.',
  },
];

// ---------------------------------------------------------------------------
// Logo URLs
// ---------------------------------------------------------------------------

export const LOGOS = {
  horizontal: `${ASSETS_BASE}/static/logos/undrr/undrr-logo-horizontal.svg`,
  vertical: `${ASSETS_BASE}/static/logos/undrr/undrr-logo-vertical.svg`,
  squareBlue: `${ASSETS_BASE}/static/logos/undrr/undrr-logo-square-blue.svg`,
};

// ---------------------------------------------------------------------------
// Syndication widget
// ---------------------------------------------------------------------------

export const SYNDICATION_WIDGET_URL = 'https://publish.preventionweb.net/widget.js';

export const SYNDICATION_DEFAULT_CONFIG = {
  contenttype: 'landingpage',
  pageid: '83835',
  includecss: false,
  suffixID: 'footer',
  activedomain: 'www.undrr.org',
};

// ---------------------------------------------------------------------------
// Reusable HTML snippets (branding-critical, do not modify)
// ---------------------------------------------------------------------------

export const PAGE_HEADER_HTML = `<!-- Page header — DO NOT MODIFY this structure, it is a UNDRR branding requirement -->
  <header id="header" class="mg-page-header mg-page-header--default">
    <div class="mg-page-header__decoration">
      <div></div><div></div><div></div><div></div>
    </div>
    <div class="mg-page-header__toolbar-wrapper">
      <div class="mg-page-header__container mg-container">
        <div class="mg-page-header__region mg-page-header__region--toolbar">
          <section class="mg-page-header__block mg-page-header__block--logo">
            <a href="/">
              <img class="mg-page-header__logo-img" src="${LOGOS.horizontal}" alt="UNDRR" width="324" height="47" />
            </a>
          </section>
          <a alt="Log in or register" title="Log in or register" href="/user">
            <i class="mg-icon mg-icon-user"></i>
            <span class="mg-page-header__label">My account</span>
          </a>
          <section class="mg-page-header__block mg-page-header__block--language">
            <form class="mg-page-header__lang-form" action="/" method="post">
              <div class="mg-page-header__form-item">
                <label for="lang-select" class="mg-u-sr-only">Select your language</label>
                <div class="mg-page-header__select-wrapper">
                  <select id="lang-select" class="mg-page-header__select" name="lang_dropdown_select">
                    <option value="en" selected>English</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  </header>`;

export const FOOTER_HTML = `<!-- Footer — DO NOT MODIFY, UNDRR branding requirement -->
  <footer class="mg-footer">
    <div class="pw-widget-footer"></div>
  </footer>

  <!-- Footer syndication widget -->
  <script src="${SYNDICATION_WIDGET_URL}"></script>
  <script>
    new PW_Widget.initialize({
      contenttype: '${SYNDICATION_DEFAULT_CONFIG.contenttype}',
      pageid: '${SYNDICATION_DEFAULT_CONFIG.pageid}',
      includecss: ${SYNDICATION_DEFAULT_CONFIG.includecss},
      suffixID: '${SYNDICATION_DEFAULT_CONFIG.suffixID}',
      activedomain: '${SYNDICATION_DEFAULT_CONFIG.activedomain}'
    });
  </script>`;

export const CLOSING_SCRIPTS_HTML = `<!-- === Required scripts (order matters) === -->

  <!-- UNDRR analytics (GA4) -->
  <script src="${REQUIRED_SCRIPTS[0].url}" defer></script>

  <!-- UNDRR critical messaging -->
  <script src="${REQUIRED_SCRIPTS[1].url}" defer></script>

  <!-- Cookie consent (library then UNDRR config) -->
  <script src="${REQUIRED_SCRIPTS[2].url}"></script>
  <script src="${REQUIRED_SCRIPTS[3].url}"></script>`;
