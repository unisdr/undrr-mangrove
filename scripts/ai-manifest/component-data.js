// Component data: curated metadata, HTML examples, and flags for the AI manifest.
//
// Each entry is keyed by the Storybook component ID (derived from the story title:
// 'Components/Cards/Vertical card' → 'components-cards-vertical-card').
//
// Entry schema:
//   description      (string, required)  — What the component does. Fallback when
//                     Storybook/react-docgen has no description.
//   cssClasses       (string[], optional) — BEM class names for the component.
//   examples         (array, optional)    — [{ name: string, html: string }] curated HTML.
//                     Only needed for components that can't auto-render in Node.js.
//   doNotModify      (string, optional)   — Warning text for branding-critical components.
//   vanillaHtmlEmbed (object, optional)   — Embed instructions for syndication widgets.
//   hydration        (object, optional)   — Vanilla hydration contract for components
//                     whose static renderedHtml is not interactive on its own:
//                     { note, selector, modules, dataAttributes, events, example }.
//                     `{{version}}` in any string is replaced with the package version.
//
// Auto-rendered entry (minimal):
//   'components-buttons-buttons': { description: 'Primary and secondary CTA buttons.' },
//
// Curated entry (when auto-render is not possible):
//   'components-table': {
//     description: 'Styled HTML table with responsive options.',
//     cssClasses: ['mg-table', 'mg-table--striped'],
//     examples: [{ name: 'Default table', html: '<table class="mg-table">...</table>' }],
//   },
//
// Components not listed in REQUIRES_REACT are treated as vanilla HTML by default.

// ---------------------------------------------------------------------------
// React-only components (everything else is vanilla HTML by default)
// ---------------------------------------------------------------------------

export const REQUIRES_REACT = {
  'design-decisions-language-boundaries':
    'Storybook integration demo measuring rendered font families across nested Arabic and Latin language boundaries. Requires React and browser layout APIs for live measurements; this is a documentation specimen, not a reusable production component.',

  'components-syndicated-search':
    'SyndicationSearchWidget is a complex search interface querying an Elasticsearch API. Requires React 19. Can be hydrated on a vanilla HTML page using the createHydrator pattern with data-mg-search-widget attributes. Supports full UI string translation via the labels prop (or data-labels JSON attribute in Drupal). Ships with label sets for ES, FR, JA, ZH (Simplified), AR, and RU. See the hydration documentation.',
  'components-syndicated-search-translations':
    'SyndicationSearchWidget translation label sets for ES, FR, JA, ZH-Hans, AR, and RU. Pass via the labels prop (React) or data-labels JSON attribute (Drupal). String keys support {token} substitution; function keys handle Intl.PluralRules plural forms for Arabic (6-form) and Russian (3-form). Function keys cannot be serialized to JSON for data-labels.',
  'components-syndicated-search-display-modes':
    'SyndicationSearchWidget display-mode variants (list / card / card-book layouts and teaser-field visibility). Requires React 19. Same hydration pattern as the main widget.',
  'components-syndicated-search-filters':
    'SyndicationSearchWidget filter and facet customisation variants (customFilters, customFacets, allowedTypes). Requires React 19. Same hydration pattern as the main widget.',
  'components-syndicated-search-integrations':
    'SyndicationSearchWidget integration / syndication examples (taxonomy term results, custom endpoints, syndicated card layouts as content blocks). Requires React 19. Same hydration pattern as the main widget.',
  'components-syndicated-search-layouts':
    'SyndicationSearchWidget layout variants — facets sidebar, horizontal facet strip, and external-region portals (facetsTarget, searchTarget). Requires React 19. Same hydration pattern as the main widget.',
  'components-syndicated-search-toggles':
    'SyndicationSearchWidget UI visibility toggles (showPager, showSearchMetrics). Requires React 19. Same hydration pattern as the main widget.',
  'components-navigation-megamenu':
    'MegaMenu manages complex open/close state and keyboard navigation. Below 900px it provides bounded progressive navigation (minimum 400px where space permits, maximum min(700px, 90dvh)) with Back above the title, a separate Close control and outside-click dismissal, nested groups, section headings linked to their landing pages and immediately visible authored banner content. Existing sections and hydration attributes remain supported; additional optional labels are menuLabel, backLabel, allSectionsLabel, closeLabel, overviewLabel and toggleMobileNavLabel. Requires React. Can be hydrated via createHydrator. Adds mg-mega-wrapper--js-active on mount so pointer-events restrictions only apply when the sidebar is available; plain HTML nav markup and failed-hydration states remain fully clickable on mobile.',
  'components-gallery':
    'Gallery provides a lightbox image viewer. Requires React for modal state and keyboard navigation. Can be hydrated via createHydrator.',
  'components-navigation-pager':
    'Pager manages pagination state. Requires React. Import via npm. Supports translated labels via props: prevLabel, nextLabel, goPrevLabel, goNextLabel, pageLabel, currentPageLabel, pageOfLabel (all string or function). Can be hydrated via createHydrator using data-prev-label, data-next-label, etc. attributes.',
  'components-notice-cookieconsentbanner':
    'CookieConsentBanner manages consent state and cookie storage. Requires React.',
  'components-notice-snackbar':
    'Snackbar manages auto-dismiss timing and state. Requires React.',
  'components-scrollcontainer':
    'ScrollContainer manages horizontal scroll state with navigation buttons. Requires React. Can be hydrated via createHydrator.',
  'components-user-feedback':
    'UserFeedback manages a binary page response, confirmation state and focus. Requires React for button behavior and can be hydrated via createHydrator with data-mg-user-feedback. Place it as a separate sibling immediately before Footer when the pattern is used.',
  'components-navigation-tree':
    'Tree needs JavaScript: keyboard navigation and expand/collapse come from React, so the static renderedHtml is not a working tree. On non-React pages, hydrate a nested list inside a data-mg-tree container; see the hydration field for the full contract.',
  'components-buttons-sharebuttons':
    'ShareButtons manages share URLs and clipboard state. Requires React. Can be hydrated via createHydrator with data-mg-share-buttons.',
  'components-navigation-table-of-contents':
    'TableOfContents inspects the DOM for heading elements and manages scroll-spy state. React component available, or use the vanilla JS at js/table-of-contents.js with data-mg-table-of-contents.',
  'components-buttons-sharebuttons-translations':
    'ShareButtons translation label sets for ES, FR, JA, ZH, AR, RU. Pass via the labels prop.',
  'components-gallery-translations':
    'Gallery translation label sets for ES, FR, JA, ZH, AR, RU. Pass galleryAriaLabel, prevLabel, nextLabel, loadingLabel props.',
  'components-navigation-megamenu-translations':
    'MegaMenu translation label sets for ES, FR, JA, ZH, AR, RU. Pass navLabel, closeMobileNavLabel props.',
  'components-notice-snackbar-translations':
    'Snackbar translation label sets for ES, FR, JA, ZH, AR, RU. Pass closeLabel, closeAriaLabel props.',
  'components-scrollcontainer-translations':
    'ScrollContainer translation label sets for ES, FR, JA, ZH, AR, RU. Pass scrollLeftLabel, scrollRightLabel props.',
  'components-breadcrumbs-translations':
    'Breadcrumbs translation label sets for ES, FR, JA, ZH, AR, RU. Pass navLabel prop.',
  'components-tableofcontents-translations':
    'TableOfContents translation label sets for ES, FR, JA, ZH, AR, RU. Pass title prop.',
  'components-onthispagenav-translations':
    'OnThisPageNav translation label sets for ES, FR, JA, ZH, AR, RU. Pass label prop.',
  'components-forms-formerrorsummary-translations':
    'FormErrorSummary translation label sets for ES, FR, JA, ZH, AR, RU. Pass title prop.',
  'components-tab-translations':
    'Tab translation label sets for ES, FR, JA, ZH, AR, RU. Pass filterPlaceholder prop.',
};

// ---------------------------------------------------------------------------
// Shared pieces for hydration contracts
//
// Every React hydration contract points at the same two CDN modules and needs
// the same import map, so they are built here rather than repeated per entry.
// Every hydration contract goes through them; none inlines the boilerplate.
// `{{version}}` is replaced with the package version when the manifest is
// generated.
// ---------------------------------------------------------------------------
const CDN = 'https://assets.undrr.org/mangrove/{{version}}';

const hydrationModules = name => ({
  hydrate: `${CDN}/components/hydrate.js`,
  component: `${CDN}/components/${name}.js`,
});

const STYLESHEET_TAG = `<link rel="stylesheet" href="${CDN}/css/style.css" />`;

const IMPORT_MAP = `<script type="importmap">
  { "imports": {
    "react": "https://esm.sh/react@19.3.0",
    "react-dom": "https://esm.sh/react-dom@19.3.0",
    "react-dom/": "https://esm.sh/react-dom@19.3.0/"
  }}
</script>`;

/**
 * Build a runnable hydration example: stylesheet, import map, the consumer's
 * markup, and the three-line createHydrator call.
 *
 * @param {object} options
 * @param {string} options.name     Module name under /components/ (e.g. 'Pager').
 * @param {string} options.selector CSS selector passed to createHydrator.
 * @param {string} options.markup   Server-rendered container markup.
 * @param {string} [options.extra]  Extra script body appended inside the module.
 * @returns {string} A complete HTML snippet.
 */
const hydrationExample = ({ name, selector, markup, extra = '' }) =>
  `${STYLESHEET_TAG}

${IMPORT_MAP}

${markup}

<script type="module">
  import createHydrator from '${CDN}/components/hydrate.js';
  import ${name}, { fromElement } from '${CDN}/components/${name}.js';

  createHydrator({ selector: '${selector}', component: ${name}, fromElement });${extra}
</script>`;

// ---------------------------------------------------------------------------
// Curated component data (descriptions, HTML examples, flags)
export const COMPONENT_DATA = {
  // --- Layout ---
  'design-decisions-container': {
    description:
      'Centered responsive container with breakpoint-driven max-widths (480/900/1164/1440px). Variants for padding and vertical spacing.',
    cssClasses: [
      'mg-container',
      'mg-container--slim',
      'mg-container--padded',
      'mg-container--spacer',
    ],
    examples: [
      {
        name: 'Default container',
        html: `<div class="mg-container">
  <h2>Section heading</h2>
  <p>Container centers content and adds horizontal padding. Max-width scales with viewport.</p>
</div>`,
      },
      {
        name: 'Padded container with spacer',
        html: `<div class="mg-container mg-container--padded mg-container--spacer">
  <section aria-labelledby="spacer-heading-1">
    <h2 id="spacer-heading-1">First section</h2>
    <p>The spacer modifier adds consistent vertical gaps between children.</p>
  </section>
  <section aria-labelledby="spacer-heading-2">
    <h2 id="spacer-heading-2">Second section</h2>
    <p>Padding adds 2rem top and bottom to the container itself.</p>
  </section>
</div>`,
      },
      {
        name: 'Slim container',
        html: `<div class="mg-container mg-container--slim">
  <p>This container stops expanding at the desktop breakpoint (1164px) and does not grow to 1440px.</p>
</div>`,
      },
    ],
  },

  'design-decisions-grid-layout': {
    description:
      'Responsive CSS grid system. 1-12 equal-fraction column layouts with column and row spanning, plus a single-row auto-fit fallback, for card-style grids. mg-grid--article is a different shape: an asymmetric flexible-column-plus-fixed-rail split (used by the mg-reading--with-contents reading grid), not an equal-fraction layout. Flexbox fallback for older browsers.',
    cssClasses: [
      'mg-grid',
      'mg-grid--auto-fit',
      'mg-grid--article',
      'mg-grid__col-1',
      'mg-grid__col-2',
      'mg-grid__col-3',
      'mg-grid__col-4',
      'mg-grid__col-5',
      'mg-grid__col-6',
      'mg-grid__col-7',
      'mg-grid__col-8',
      'mg-grid__col-9',
      'mg-grid__col-10',
      'mg-grid__col-11',
      'mg-grid__col-12',
      'mg-grid__col--span-2',
      'mg-grid__col--span-3',
      'mg-grid__col--span-all',
      'mg-grid__row--span-2',
      'mg-grid__row--span-all',
    ],
    examples: [
      {
        name: 'Three-column grid',
        html: `<div class="mg-grid mg-grid__col-3">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>`,
      },
      {
        name: 'Two-column grid',
        html: `<div class="mg-grid mg-grid__col-2">
  <div>Column 1</div>
  <div>Column 2</div>
</div>`,
      },
      {
        name: 'Column spanning',
        html: `<div class="mg-grid mg-grid__col-3">
  <div class="mg-grid__col--span-2">Spans 2 columns</div>
  <div>Column 3</div>
  <div>Column 4</div>
  <div>Column 5</div>
  <div>Column 6</div>
</div>`,
      },
      {
        name: 'Full-width row in a grid',
        html: `<div class="mg-grid mg-grid__col-3">
  <div class="mg-grid__col--span-all">Full-width header row</div>
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>`,
      },
    ],
  },

  // --- Buttons (auto-rendered) ---
  'components-buttons-buttons': {
    description:
      'Primary and secondary CTA buttons with disabled variant. Themed via design tokens. WCAG AA contrast on both light and dark backgrounds.',
  },
  'components-buttons-chips': {
    description:
      'Compact pill-shaped controls for categories and active filters. The default variant is a link; the dismissible variant is a button with a visible X and a localisable accessible name.',
  },
  'components-buttons-copybutton': {
    description:
      'One-click copy button with micro-feedback tooltip and aria-live announcements. Supports zero-dependency vanilla JS (js/copy-button.js), Layer 2 React hydration via createHydrator, and React JSX.',
    cssClasses: [
      'mg-copy-button',
      'mg-copy-button--copied',
      'mg-copy-button__feedback',
      'mg-copy-button__feedback--visible',
      'mg-copy-button__feedback--error',
    ],
    examples: [
      {
        name: 'Default copy button',
        html: `<button type="button" class="mg-button mg-button-primary mg-button-outline mg-button--icon mg-copy-button" data-mg-copy-button data-text-to-copy="https://preventionweb.net" aria-label="Copy link to clipboard">
  <span class="mg-icon mg-icon-copy mg-button__icon" aria-hidden="true"></span>
  <span class="mg-copy-button__feedback" aria-hidden="true">Copied!</span>
  <span class="mg-u-sr-only" aria-live="polite"></span>
</button>`,
      },
    ],
    vanillaModule: {
      note: 'Preferred for plain HTML pages: no React, no import map. renderedHtml is inert until js/copy-button.js runs. The script enhances every [data-mg-copy-button] on load and dispatches no events; it writes the tooltip into .mg-copy-button__feedback and the announcement into the .mg-u-sr-only aria-live span, so include both in the button markup. For buttons inserted later, import the named export and call it again — `import { mgCopyButton } from ".../js/copy-button.js"; mgCopyButton(scope);`. The module puts nothing on window, so the plain `<script src>` tag in the example below cannot call it; use an inline `<script type="module">` with an import if you need to re-run it. Already-initialised buttons are skipped. Clipboard writes need a secure context (https or localhost); the script falls back to execCommand. The failed tooltip and manual-copy hint (5 seconds) are shown only when the clipboard call rejects or throws — an execCommand that merely returns false is not detected and the success tooltip is shown instead.',
      selector: '[data-mg-copy-button]',
      modules: {
        script: `${CDN}/js/copy-button.js`,
      },
      dataAttributes: {
        'data-mg-copy-button': 'Marks the button to enhance (required).',
        'data-text-to-copy':
          'Text written to the clipboard. data-text and data-copy-text are accepted aliases.',
        'data-tooltip-label':
          'Visible confirmation in the tooltip (default "Copied!"). data-feedback-text is an accepted alias.',
        'data-copied-label':
          'Screen-reader announcement on success (default "Copied to clipboard."). data-aria-live-text is an accepted alias.',
        'data-failed-tooltip-label':
          'Visible tooltip when the copy fails (default "Copy failed").',
        'data-failed-label':
          'Screen-reader announcement when the copy fails (default "Copy failed. Select the text and copy it manually.").',
        'data-mg-copy-button-initialized':
          'Set by the script. Do not author it.',
        'aria-label':
          'Accessible name of the icon-only button. Author it; the script does not add one.',
      },
      events: [],
      example: `${STYLESHEET_TAG}

<button type="button"
  class="mg-button mg-button-primary mg-button-outline mg-button--icon mg-copy-button"
  data-mg-copy-button
  data-text-to-copy="https://www.undrr.org/publication/global-assessment-report"
  data-tooltip-label="Copied!"
  data-copied-label="Link copied to clipboard."
  aria-label="Copy link to clipboard">
  <span class="mg-icon mg-icon-copy mg-button__icon" aria-hidden="true"></span>
  <span class="mg-copy-button__feedback" aria-hidden="true">Copied!</span>
  <span class="mg-u-sr-only" aria-live="polite"></span>
</button>

<script type="module" src="${CDN}/js/copy-button.js"></script>`,
    },
    hydration: {
      note: 'React alternative to js/copy-button.js — use one or the other, not both. Hydrate an empty non-interactive container such as a span or div — the component renders its own button element, so never hydrate a button (that would nest a button inside a button). The component renders the icon, tooltip and live region itself. renderedHtml plus js/copy-button.js is simpler for a page that needs no other React component.',
      selector: '[data-mg-copy-button]',
      modules: hydrationModules('CopyButton'),
      dataAttributes: {
        'data-mg-copy-button': 'Marks the container to hydrate (required).',
        'data-text-to-copy':
          'Text written to the clipboard. data-text and data-copy-text are accepted aliases.',
        'data-aria-label':
          'Accessible name of the button. data-label and data-copy-label are accepted aliases.',
        'data-copied-label':
          'Screen-reader announcement on success. data-aria-live-text is an accepted alias.',
        'data-tooltip-label':
          'Visible confirmation in the tooltip. data-feedback-text is an accepted alias.',
        'data-failed-label': 'Screen-reader announcement when the copy fails.',
        'data-failed-tooltip-label': 'Visible tooltip when the copy fails.',
        'data-labels':
          'JSON object of translated UI strings: ariaLabel, copiedLabel, tooltipLabel, failedLabel, failedTooltipLabel. The individual attributes above win over the JSON.',
        'data-variant': 'Button variant (default "outline").',
        'data-size':
          'Button size: "small" or "large". Omit it for the default size.',
        'data-class-name': 'Extra class on the button.',
      },
      events: [],
      example: hydrationExample({
        name: 'CopyButton',
        selector: '[data-mg-copy-button]',
        markup: `<span data-mg-copy-button
  data-text-to-copy="https://www.undrr.org/publication/global-assessment-report"
  data-aria-label="Copy link to clipboard"
  data-tooltip-label="Copied!"
  data-copied-label="Link copied to clipboard."></span>`,
      }),
    },
  },

  'components-buttons-sharebuttons': {
    description:
      'Row of share controls for the current page: social networks, email, a QR code modal and a copy-link button with confirmation. Labels and the email subject and body come from props or data attributes, so every string can be translated.',
    cssClasses: [
      'mg-share',
      'mg-share__header',
      'mg-share__buttons',
      'mg-share__button',
      'mg-share__copy-button',
      'mg-share__copy-text',
    ],
    hydration: {
      note: 'The share row is rendered in renderedHtml but inert: no share opens, the QR modal never appears and the copy button does nothing. Render an empty data-mg-share-buttons container and hydrate it. Only these four strings can be set from the DOM — the other thirteen labels (the QR modal copy and every social button aria-label) stay English on the hydration path, because there is no data-labels attribute; use the React labels prop if you need them translated. Omitted attributes fall back to values fromElement supplies, not always to the component defaults: data-sharing-body defaults to an empty string, so the email body has no lead-in text unless you set it. The component reads the current page URL itself — a link[rel="shortlink"] in the head if there is one, otherwise window.location.href — so there is no URL attribute.',
      selector: '[data-mg-share-buttons]',
      modules: hydrationModules('ShareButtons'),
      dataAttributes: {
        'data-mg-share-buttons': 'Marks the container to hydrate (required).',
        'data-main-label':
          'Heading above the share row (default "Share this").',
        'data-on-copy-label':
          'Confirmation after the link is copied (default "Link copied").',
        'data-sharing-subject':
          'Subject line for the email share (default "Sharing Link").',
        'data-sharing-body': 'Body text placed before the link in the email.',
      },
      events: [],
      example: hydrationExample({
        name: 'ShareButtons',
        selector: '[data-mg-share-buttons]',
        markup: `<section data-mg-share-buttons
  data-main-label="Share this"
  data-on-copy-label="Link copied"
  data-sharing-subject="From PreventionWeb"
  data-sharing-body="I thought this might interest you: "></section>`,
      }),
    },
  },

  // --- Cards ---
  'components-cards-vertical-card': {
    description:
      'Card with stacked image, labels, title, summary, and optional CTA button. Four color variants.',
    cssClasses: [
      'mg-card',
      'mg-card__vc',
      'mg-card--secondary',
      'mg-card--tertiary',
      'mg-card--quaternary',
      'mg-card--no-link',
      'mg-card__visual',
      'mg-card__image',
      'mg-card__content',
      'mg-card__meta',
      'mg-card__label',
      'mg-card__label--active',
      'mg-card__title',
      'mg-card__summary',
    ],
    examples: [
      {
        name: 'Default vertical card',
        html: `<article class="mg-card mg-card__vc">
  <div class="mg-card__visual">
    <img src="https://picsum.photos/600/400" alt="Disaster risk reduction workshop" class="mg-card__image" />
  </div>
  <div class="mg-card__content">
    <div class="mg-card__meta">
      <a href="/topics/early-warning" class="mg-card__label mg-card__label--active">Early warning</a>
    </div>
    <header class="mg-card__title">
      <a href="/news/building-resilience">Building resilience in vulnerable communities</a>
    </header>
    <p class="mg-card__summary">New partnerships strengthen disaster preparedness across the Asia-Pacific region.</p>
  </div>
</article>`,
      },
      {
        name: 'Vertical card with button',
        html: `<article class="mg-card mg-card__vc">
  <div class="mg-card__visual">
    <img src="https://picsum.photos/600/400" alt="Global Assessment Report 2024 cover" class="mg-card__image" />
  </div>
  <div class="mg-card__content">
    <header class="mg-card__title">
      <a href="/reports/gar-2024">Global Assessment Report 2024</a>
    </header>
    <p class="mg-card__summary">The flagship report on global efforts to reduce disaster risk.</p>
    <a class="mg-button mg-button-primary" href="/reports/gar-2024">Read the report</a>
  </div>
</article>`,
      },
      {
        name: 'Vertical card without a link',
        html: `<article class="mg-card mg-card__vc mg-card--no-link">
  <div class="mg-card__visual">
    <img src="https://picsum.photos/600/400" alt="Careers information session" class="mg-card__image" />
  </div>
  <div class="mg-card__content">
    <div class="mg-card__meta">
      <span class="mg-card__label">Careers</span>
    </div>
    <header class="mg-card__title">Jobs and careers</header>
    <p class="mg-card__summary">Stay current on the latest vacancies.</p>
    <a class="mg-button mg-button-primary" href="/community/careers">Browse vacancies</a>
  </div>
</article>`,
      },
      {
        name: 'Three vertical cards in a grid',
        html: `<div class="mg-grid mg-grid__col-3">
  <article class="mg-card mg-card__vc">
    <div class="mg-card__visual">
      <img src="https://picsum.photos/600/400?1" alt="Early warning workshop" class="mg-card__image" />
    </div>
    <div class="mg-card__content">
      <header class="mg-card__title"><a href="#">Card one</a></header>
      <p class="mg-card__summary">Summary text for the first card.</p>
    </div>
  </article>
  <article class="mg-card mg-card__vc">
    <div class="mg-card__visual">
      <img src="https://picsum.photos/600/400?2" alt="Community resilience training" class="mg-card__image" />
    </div>
    <div class="mg-card__content">
      <header class="mg-card__title"><a href="#">Card two</a></header>
      <p class="mg-card__summary">Summary text for the second card.</p>
    </div>
  </article>
  <article class="mg-card mg-card__vc">
    <div class="mg-card__visual">
      <img src="https://picsum.photos/600/400?3" alt="Disaster preparedness planning" class="mg-card__image" />
    </div>
    <div class="mg-card__content">
      <header class="mg-card__title"><a href="#">Card three</a></header>
      <p class="mg-card__summary">Summary text for the third card.</p>
    </div>
  </article>
</div>`,
      },
    ],
  },

  'components-cards-horizontal-card': {
    description:
      'Side-by-side card with image left and content right. Labels, title, summary, and CTA button.',
    cssClasses: [
      'mg-card',
      'mg-card__hc',
      'mg-card--secondary',
      'mg-card--no-link',
      'mg-card__visual',
      'mg-card__image',
      'mg-card__content',
      'mg-card__meta',
      'mg-card__label',
      'mg-card__label--active',
      'mg-card__title',
      'mg-card__summary',
    ],
    examples: [
      {
        name: 'Default horizontal card',
        html: `<article class="mg-card mg-card__hc">
  <div class="mg-card__visual">
    <img src="https://picsum.photos/400/300" alt="Climate adaptation meeting" class="mg-card__image" />
  </div>
  <div class="mg-card__content">
    <div class="mg-card__meta">
      <a href="/topics/climate" class="mg-card__label mg-card__label--active">Climate</a>
      <a href="/topics/adaptation" class="mg-card__label mg-card__label--active">Adaptation</a>
    </div>
    <header class="mg-card__title">
      <a href="/news/climate-adaptation">Climate adaptation strategies for small island states</a>
    </header>
    <p class="mg-card__summary">Experts gather to discuss integrated approaches to climate resilience.</p>
  </div>
</article>`,
      },
    ],
  },

  'components-cards-icon-card': {
    description:
      'Card with icon or image, title, summary, and optional CTA. Variants: default, centered, negative (dark background). Orientation: vertical (icon above the content) or horizontal (icon beside it, for route rows); horizontal sizes the visual itself, so imageScale does not apply. Image scale options: small, medium, large, full. Supports custom icon background/foreground colors (iconColor, iconFgColor), border color, and label position (top or content area).',
    hydration: {
      note: "The whole card set comes from one JSON attribute, so renderedHtml is only a preview of the markup the component produces. Render an empty data-mg-icon-card container carrying data-items and hydrate it. Malformed JSON is swallowed and renders an empty set, so validate the attribute server-side. The orientation prop has no data attribute, so the horizontal layout is React-only. Each item's summaryText accepts inline HTML and is sanitised with DOMPurify.",
      selector: '[data-mg-icon-card]',
      modules: hydrationModules('IconCard'),
      dataAttributes: {
        'data-mg-icon-card': 'Marks the container to hydrate (required).',
        'data-items':
          'JSON array of card objects, mapped to the data prop (required). title is required on every object; the rest — id, icon, iconSize, imgback, imgalt, imageScale, iconColor, iconFgColor, borderColor, label, visualLabel, srOnlyTitle, summaryText, link, linkText, button, buttonType — are the per-card options in the component props. The onClick prop is the only one that cannot be expressed in JSON. Invalid JSON renders nothing.',
        'data-centered': '"true" to centre the card contents.',
        'data-variant': '"default" (default) or "negative" for dark surfaces.',
      },
      events: [],
      example: hydrationExample({
        name: 'IconCard',
        selector: '[data-mg-icon-card]',
        markup: `<div data-mg-icon-card
  data-variant="default"
  data-items='[
    {"title":"Sendai Framework","summaryText":"Priorities, targets and indicators.","icon":"mg-icon mg-icon-book","link":"/sendai-framework","linkText":"Read the framework"},
    {"title":"Terminology","summaryText":"Agreed definitions for disaster risk reduction.","icon":"mg-icon mg-icon-search","link":"/terminology","linkText":"Browse terms"}
  ]'></div>`,
      }),
    },
  },
  'components-cards-book-card': {
    description: 'Minimal card for publications: cover image and title only.',
  },

  'components-cards-horizontal-book-card': {
    description:
      'Horizontal card for publications: cover image left, title and summary right.',
    cssClasses: [
      'mg-card',
      'mg-card__hc',
      'mg-card-book__hc',
      'mg-card--no-link',
      'mg-card__visual',
      'mg-card__image',
      'mg-card__content',
      'mg-card__meta',
      'mg-card__label',
      'mg-card__title',
      'mg-card__summary',
    ],
    examples: [
      {
        name: 'Horizontal book card',
        html: `<article class="mg-card mg-card__hc mg-card-book__hc">
  <div class="mg-card__visual">
    <img src="https://picsum.photos/300/400" alt="Report cover" class="mg-card__image" />
  </div>
  <div class="mg-card__content">
    <div class="mg-card__meta">
      <a href="/topics/drr" class="mg-card__label mg-card__label--active">DRR</a>
    </div>
    <header class="mg-card__title">
      <a href="/publications/sendai-monitor">Sendai Framework Monitor Report</a>
    </header>
    <p class="mg-card__summary">Progress on the implementation of the Sendai Framework for Disaster Risk Reduction.</p>
  </div>
</article>`,
      },
    ],
  },

  'components-cards-stats-card': {
    description:
      'Grid of numeric statistics with optional icons, labels, and descriptions. Variants: default, compact, highlighted, negative.',
    hydration: {
      note: 'The figures come from one JSON attribute, so renderedHtml is a preview of the markup, not a template to fill in. Render an empty data-mg-stats-card container carrying data-stats and hydrate it. Malformed JSON is swallowed and renders an empty card, so validate the attribute server-side.',
      selector: '[data-mg-stats-card]',
      modules: hydrationModules('StatsCard'),
      dataAttributes: {
        'data-mg-stats-card': 'Marks the container to hydrate (required).',
        'data-stats':
          'JSON array of stat objects (required; one to three recommended). value is required on every object; icon, label, bottomLabel, summaryText and link are optional. summaryText allows inline HTML links. Invalid JSON renders nothing.',
        'data-title': 'Optional heading above the figures.',
        'data-variant':
          '"default", "compact", "highlighted" or "negative" (for dark surfaces).',
        'data-class-name': 'Extra class on the card.',
      },
      events: [],
      example: hydrationExample({
        name: 'StatsCard',
        selector: '[data-mg-stats-card]',
        markup: `<div data-mg-stats-card
  data-title="Disaster losses, 2005 to 2024"
  data-variant="default"
  data-stats='[
    {"label":"People affected","value":"4.2 billion","bottomLabel":"across 160 countries"},
    {"label":"Economic losses","value":"US$ 2.3 trillion"},
    {"label":"Countries reporting","value":"128","link":"/sendai-framework/monitor"}
  ]'></div>`,
      }),
    },
  },

  // --- Status and empty states ---
  'components-status-label': {
    name: 'Status label',
    description:
      'Status of a record or event, as a coloured indicator plus the status name in text. Workflow variants: draft (rounded square), waiting-information (capsule), waiting-validation (rounded diamond), published (circle). Service health variants: warning/degraded (triangle) and negative/offline (octagon), also used by ServiceNotice. Without a modifier the indicator is a neutral circle. Each status has its own shape as well as its own colour, from CSS alone, so the markup is the same for every variant, and every mark carries the same uniform ring. The indicator is decorative: the status name is always present as text, so meaning never depends on colour. Wrap several in mg-status-label-group, which keeps list semantics without showing a bullet, so no role="list" is needed on the ul. Theming is done with custom properties, not by overriding rules — set them on any ancestor. Text and layout: --mg-status-label-color (label text, default --mg-color-text), --mg-status-label-font-size (default 16px), --mg-status-label-gap (space between indicator and text, default --mg-spacing-75). Indicator geometry: --mg-status-label-indicator-size (default 14px; every shape is a multiple of it, and the wider shapes are pulled back with a compensating margin so each one still occupies exactly this much inline space), --mg-status-label-indicator-radius (default 50%; it rounds the base and published circles only, because the other five set their own geometry), --mg-status-label-indicator-border-width (the ring, default 1px, the same width on every edge of every shape; 0 drops the ring on all seven) and --mg-status-label-indicator-border-color (default --mg-color-neutral-500). Indicator fills, one per status, named --mg-status-label-indicator--<modifier>: --mg-status-label-indicator (the base, no modifier suffix), --mg-status-label-indicator--draft, --mg-status-label-indicator--waiting-information, --mg-status-label-indicator--waiting-validation, --mg-status-label-indicator--published, --mg-status-label-indicator--warning and --mg-status-label-indicator--negative. The shapes are built on these hooks: the square, the capsule and the diamond are border-radius and transform overrides that keep a real CSS border, and the triangle and the octagon are clip-path shapes whose ring is the element background and whose fill is a ::before clipped to a matching inner polygon. Do not set background-color, border, border-radius, width, height or transform on mg-status-label__indicator directly — a border is cut through by the clip path, a fill on the element hides the ring, and a transform replaces the diamond. --mg-status-label-indicator-ring is internal plumbing that carries the ring width into those inner polygons; set --mg-status-label-indicator-border-width instead. Use the custom properties.',
    cssClasses: [
      'mg-status-label',
      'mg-status-label__indicator',
      'mg-status-label--draft',
      'mg-status-label--waiting-validation',
      'mg-status-label--waiting-information',
      'mg-status-label--published',
      'mg-status-label--warning',
      'mg-status-label--negative',
      'mg-status-label-group',
    ],
    examples: [
      {
        name: 'Single status',
        html: '<span class="mg-status-label mg-status-label--published">\n  <span class="mg-status-label__indicator"></span>\n  Published\n</span>',
      },
      {
        name: 'All four workflow states',
        html: '<ul class="mg-status-label-group">\n  <li>\n    <span class="mg-status-label mg-status-label--draft">\n      <span class="mg-status-label__indicator"></span>\n      Draft\n    </span>\n  </li>\n  <li>\n    <span class="mg-status-label mg-status-label--waiting-information">\n      <span class="mg-status-label__indicator"></span>\n      Waiting for more information\n    </span>\n  </li>\n  <li>\n    <span class="mg-status-label mg-status-label--waiting-validation">\n      <span class="mg-status-label__indicator"></span>\n      Waiting for validation\n    </span>\n  </li>\n  <li>\n    <span class="mg-status-label mg-status-label--published">\n      <span class="mg-status-label__indicator"></span>\n      Published\n    </span>\n  </li>\n</ul>',
      },
      {
        name: 'Service health states',
        html: '<ul class="mg-status-label-group">\n  <li>\n    <span class="mg-status-label mg-status-label--warning">\n      <span class="mg-status-label__indicator"></span>\n      Degraded\n    </span>\n  </li>\n  <li>\n    <span class="mg-status-label mg-status-label--negative">\n      <span class="mg-status-label__indicator"></span>\n      Offline\n    </span>\n  </li>\n</ul>',
      },
      {
        name: 'Neutral status (no modifier)',
        html: '<span class="mg-status-label">\n  <span class="mg-status-label__indicator"></span>\n  Archived\n</span>',
      },
    ],
  },
  'components-empty-state': {
    name: 'Empty state',
    description:
      'Message shown where a collection, table or panel has no content. Optional media slot for a glyph, a title, a description and an optional actions slot. Variants: panel, compact, start-aligned. mg-empty-state__title is a class, not a tag: choose the element to fit the surrounding outline, one level below the heading of the section or card that contains it (h3 in a section headed h2, even after an h3 subsection; h4 inside a card titled h3) and never skipping levels; use a p where a heading would be out of place, such as a table cell or dashboard tile. Examples use h2 only because they stand alone. Inside a table, place it in a single td with colspan so the row structure and column headers survive for screen readers.',
    cssClasses: [
      'mg-empty-state',
      'mg-empty-state--panel',
      'mg-empty-state--compact',
      'mg-empty-state--start',
      'mg-empty-state-cell',
      'mg-empty-state__media',
      'mg-empty-state__title',
      'mg-empty-state__description',
      'mg-empty-state__actions',
    ],
    examples: [
      {
        name: 'Default, with an action',
        html: '<div class="mg-empty-state">\n  <div class="mg-empty-state__media" aria-hidden="true">\n    <svg viewBox="0 0 56 44" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" focusable="false">\n      <path d="M8 18 14 4h28l6 14" />\n      <path d="M8 18h12l3 6h10l3-6h12v18a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" />\n    </svg>\n  </div>\n  <h2 class="mg-empty-state__title">No records yet</h2>\n  <p class="mg-empty-state__description">\n    Records you add or import will appear here.\n  </p>\n  <div class="mg-empty-state__actions">\n    <a href="/records/add" class="mg-button mg-button-primary">Add a record</a>\n  </div>\n</div>',
      },
      {
        name: 'Panel variant, no action',
        html: '<div class="mg-empty-state mg-empty-state--panel">\n  <h2 class="mg-empty-state__title">Nothing to chart yet</h2>\n  <p class="mg-empty-state__description">\n    This chart appears once economic loss figures have been recorded.\n  </p>\n</div>',
      },
      {
        name: 'Compact, for a dashboard tile',
        html: '<div class="mg-empty-state mg-empty-state--compact mg-empty-state--panel">\n  <p class="mg-empty-state__description">No data</p>\n</div>',
      },
      {
        name: 'Heading level to fit the outline',
        html: '<div>\n  <h2>Recent disaster records</h2>\n  <div class="mg-empty-state mg-empty-state--panel">\n    <h3 class="mg-empty-state__title">No records this month</h3>\n    <p class="mg-empty-state__description">\n      Records published in the last 30 days will appear here.\n    </p>\n  </div>\n</div>',
      },
      {
        name: 'Start-aligned',
        html: '<div class="mg-empty-state mg-empty-state--start">\n  <h2 class="mg-empty-state__title">No saved searches</h2>\n  <p class="mg-empty-state__description">\n    Save a search from the results page and it will be listed here.\n  </p>\n</div>',
      },
      {
        name: 'Inside a table',
        // The empty state goes in one td with colspan so the column headers
        // survive for screen readers. role="status" belongs here only because
        // the emptiness is the result of a filter the user just applied; a
        // table that renders empty on first load must omit it.
        html: '<table class="mg-table">\n  <caption class="mg-u-sr-only">Disaster records</caption>\n  <thead>\n    <tr>\n      <th scope="col">Record</th>\n      <th scope="col">Updated</th>\n      <th scope="col">Status</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td class="mg-empty-state-cell" colspan="3">\n        <div class="mg-empty-state" role="status">\n          <p class="mg-empty-state__title">No records match your filters</p>\n          <p class="mg-empty-state__description">\n            Clear the country filter to see all records.\n          </p>\n        </div>\n      </td>\n    </tr>\n  </tbody>\n</table>',
      },
    ],
  },

  // --- Tags ---
  'components-tag': {
    description:
      'Compact taxonomy label with theme-owned colours and radius. Variants: default, secondary, outline, accent. Use spans for static metadata and anchors with href for destinations. Container children receive the same styling; static and linked tags share compact geometry (28px minimum height, 24px minimum width); links have visible keyboard focus.',
    cssClasses: [
      'mg-tag',
      'mg-tag--secondary',
      'mg-tag--outline',
      'mg-tag--accent',
      'mg-tag-container',
    ],
    examples: [
      {
        name: 'Tag variants',
        html: `<span class="mg-tag">Default tag</span>
<a href="/topics/drr" class="mg-tag">Linked tag</a>
<span class="mg-tag mg-tag--secondary">Secondary</span>
<span class="mg-tag mg-tag--outline">Outline</span>
<span class="mg-tag mg-tag--accent">Accent</span>`,
      },
      {
        name: 'Tag container (auto-styles children)',
        html: `<div class="mg-tag-container">
  <a href="/topics/earthquake">Earthquake</a>
  <a href="/topics/flood">Flood</a>
  <a href="/topics/drought">Drought</a>
  <span>Wildfire</span>
</div>`,
      },
    ],
  },

  // --- Typography ---
  'components-typography': {
    description:
      'Base typography styles applied to standard HTML heading and body elements. Use `mg-details` on a `<details>` element to apply Mangrove styled disclosure.',
    cssClasses: ['mg-details'],
    examples: [
      {
        name: 'Heading hierarchy',
        html: `<div class="mg-container">
  <h1>Heading level 1</h1>
  <h2>Heading level 2</h2>
  <h3>Heading level 3</h3>
  <h4>Heading level 4</h4>
  <h5>Heading level 5</h5>
  <h6>Heading level 6</h6>
  <p>Body text uses the base font size. Mangrove applies a consistent type scale across breakpoints.</p>
</div>`,
      },
      {
        name: 'Details disclosure',
        html: `<details class="mg-details">
  <summary>The Sendai Framework</summary>
  <p>The Sendai Framework is the global roadmap for reducing human and economic loss as a direct result of disasters.</p>
</details>`,
      },
    ],
  },

  'components-typography-links': {
    description:
      'Link styles applied to standard anchor elements. Underlined by default with interactive color.',
    cssClasses: [],
    examples: [
      {
        name: 'Link styles',
        html: `<p>Standard <a href="/example">inline link</a> within body text.</p>
<p>Links are underlined by default and use the interactive color token.</p>`,
      },
    ],
  },

  // --- Table ---
  'components-table': {
    description:
      'Styled HTML table with compact size, striped/border variants and stacked/scroll options. For wide plain HTML tables, wrap the native table in .mg-table-scroll-region with role=region, a translated aria-label and tabindex=0. React responsive=scroll generates this wrapper; scrollLabel supplies its accessible name.',
    cssClasses: [
      'mg-table',
      'mg-table--small',
      'mg-table--striped',
      'mg-table--border',
      'mg-table--stacked',
      'mg-table--scroll',
      'mg-table-scroll-region',
      'mg-table__cell--start',
      'mg-table__cell--center',
      'mg-table__cell--end',
    ],
    examples: [
      {
        name: 'Default table',
        html: `<table class="mg-table">
  <thead>
    <tr>
      <th scope="col">Country</th>
      <th scope="col">Hazard type</th>
      <th class="mg-table__cell--end" scope="col">People affected</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Nepal</td>
      <td>Earthquake</td>
      <td class="mg-table__cell--end">2.8 million</td>
    </tr>
    <tr>
      <td>Philippines</td>
      <td>Typhoon</td>
      <td class="mg-table__cell--end">4.1 million</td>
    </tr>
  </tbody>
</table>`,
      },
      {
        name: 'Striped scrollable table',
        html: `<table class="mg-table mg-table--striped mg-table--scroll" tabindex="0">
  <thead>
    <tr>
      <th scope="col">Year</th>
      <th scope="col">Events</th>
      <th scope="col">Deaths</th>
      <th scope="col">Economic losses (USD)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>2022</td><td>387</td><td>30,704</td><td>$224 billion</td></tr>
    <tr><td>2023</td><td>399</td><td>86,473</td><td>$280 billion</td></tr>
  </tbody>
</table>`,
      },
    ],
  },

  // --- Preview access ---
  'components-preview-access': {
    description:
      'Page-level gate that hides an unfinished page behind a PIN-prompt modal until a reviewer enters the right code. Drop <div data-mg-preview-access> into a page and load js/preview-access.js. Unlock persists in sessionStorage for the browser session. CSS-first anti-flash via :has(). Editorial signalling only — not a security mechanism, since the PIN sits in the DOM.',
    cssClasses: [
      'mg-preview-access--unlocked',
      'mg-preview-access__overlay',
      'mg-preview-access__modal',
      'mg-preview-access__eyebrow',
      'mg-preview-access__title',
      'mg-preview-access__body',
      'mg-preview-access__form',
      'mg-preview-access__label',
      'mg-preview-access__field',
      'mg-preview-access__input',
      'mg-preview-access__submit',
      'mg-preview-access__error',
      'mg-preview-access__contact',
    ],
    examples: [
      {
        name: 'Default gate (PIN 5498)',
        html: `<div data-mg-preview-access></div>`,
      },
      {
        name: 'Branded gate with shared id',
        html: `<div data-mg-preview-access
     data-mg-preview-pin="5498"
     data-mg-preview-id="delta-2026-preview"
     data-mg-preview-eyebrow="DELTA Resilience · Preview"
     data-mg-preview-title="This page is a preview"
     data-mg-preview-message="The DELTA Resilience country dashboard is in active development and is not yet ready for public review. Enter the preview PIN to continue, or contact UNDRR if you need access."></div>`,
      },
    ],
  },

  // --- On this page nav ---
  'components-navigation-on-this-page-nav': {
    description:
      'Sticky horizontal "On this page" navigation bar with IntersectionObserver scroll-spy. Two modes: auto-detect (scans h2/h3/h4 headings) or explicit (author-provided links). Optional CTA button. Vanilla JS — requires on-this-page-nav.js.',
    cssClasses: [
      'mg-on-this-page-nav',
      'mg-on-this-page-nav--hidden',
      'mg-on-this-page-nav--has-left-overflow',
      'mg-on-this-page-nav__list',
      'mg-on-this-page-nav__item',
      'mg-on-this-page-nav__link',
      'mg-on-this-page-nav__link--active',
      'mg-on-this-page-nav__cta',
      'mg-on-this-page-nav--exclude',
      'mg-on-this-page-nav__scroll-btn',
      'mg-on-this-page-nav__scroll-btn--prev',
      'mg-on-this-page-nav__scroll-btn--next',
    ],
    examples: [
      {
        name: 'Auto-detect (scans headings)',
        html: `<nav data-mg-on-this-page-nav data-mg-on-this-page-nav-content=".article-body" class="mg-on-this-page-nav"></nav>`,
      },
      {
        name: 'Explicit links with CTA',
        html: `<nav data-mg-on-this-page-nav class="mg-on-this-page-nav">
  <ul class="mg-on-this-page-nav__list">
    <li class="mg-on-this-page-nav__item"><a href="#intro" class="mg-on-this-page-nav__link">Introduction</a></li>
    <li class="mg-on-this-page-nav__item"><a href="#methods" class="mg-on-this-page-nav__link">Methodology</a></li>
    <li class="mg-on-this-page-nav__item"><a href="#findings" class="mg-on-this-page-nav__link">Findings</a></li>
  </ul>
  <a href="/report.pdf" class="mg-on-this-page-nav__cta">Download report</a>
</nav>`,
      },
    ],
  },

  // --- Tabs (auto-rendered) ---
  'components-tabs': {
    cssClasses: [
      'mg-tabs',
      'mg-tabs--horizontal',
      'mg-tabs--stacked',
      'mg-tabs__rail',
      'mg-tabs__scroll',
      'mg-tabs__list',
      'mg-tabs__item',
      'mg-tabs__link',
      'mg-tabs__panels',
      'mg-tabs--responsive-stacked',
      'mg-tabs__mobile-item',
      'mg-tabs__mobile-link',
      'mg-tabs-content',
      'mg-tabs__section',
    ],
    description:
      'Tabbed content with centred, softly filled horizontal tabs that scroll at every viewport width, or explicit stacked disclosures. Opt into disclosures below 480px with stackOnMobile (React) or the presence-based data-mg-js-tabs-stack-on-mobile attribute (HTML); horizontal scrolling remains the default. Only the horizontal rail scrolls; panels sit outside the tablist. Requires tabs.js as an ES module for ARIA semantics, keyboard navigation, selection and overflow indicators. Without JavaScript, panel content remains visible. Set labels.tabListLabel (React) or data-mg-js-tabs-label (HTML) to name the tablist. Existing interleaved HTML is enhanced at runtime. Before removing dynamically initialised markup, call mgTabsDestroy(scope), or pass { signal } as the third argument to mgTabs or mgTabsRuntime and abort it. A tab set removed without either is suspended, not destroyed: once a rail resize observer notification (horizontal sets, usually within a frame in Chromium), a window resize or hash change (the runtime keeps one listener for each while any set is initialised), an orientation change or font load, or a later mgTabs/mgTabsRuntime call finds it detached, its window, document.fonts and ResizeObserver registrations are released while markup, in-container listeners and selection stay intact. A re-attached set resumes on the next pointer press, focus, key press or click inside it, window resize or hash change, or mgTabs/mgTabsRuntime call; an interaction resume also resumes other re-attached sets, including nested ones. On resume, a URL hash changed while suspended selects its panel (also on React re-render or mgTabsDestroy(container, true) plus re-init), and a stackOnMobile breakpoint crossed while suspended switches layout; after an interaction both wait until it has been handled, so a tap acts on the visible layout and its selection wins. Until a removal is found its listeners stay registered.',
  },

  // --- Highlight box (auto-rendered) ---
  'components-highlightbox': {
    description:
      'Highlighted content box. Tones: default, primary, secondary. Layouts: centered, float-start, float-end. Supports embedded video.',
  },

  // --- CodeBlock ---
  'components-codeblock': {
    description: `Formatted source code display. Two rendering paths share the same CSS:

VANILLA HTML (Drupal pages): Use \`<pre><code>\` directly. Prism.js (loaded globally) tokenises the code and emits \`.token.*\` span elements — Mangrove's \`code.scss\` styles those classes. Add a \`data-language="Bash"\` attribute on \`<pre>\` for a language badge. Wrap in \`<figure class="mg-code-block"><figcaption>filename</figcaption>…</figure>\` for a filename header bar.

REACT (Storybook / JS apps): Use the \`CodeBlock\` component. Props: \`code\` (required string), \`language\` ("bash" | "javascript" | "jsx" — enables react-syntax-highlighter/PrismLight which emits the same \`.token.*\` classes), \`filename\` (string — adds the figure/figcaption wrapper), \`lineNumbers\` (boolean — gutter line numbers, requires \`language\`).

IMPORTANT — token classes: \`.token.keyword\`, \`.token.string\`, \`.token.tag\` etc. are NOT Mangrove BEM classes. They are emitted by Prism.js (and react-syntax-highlighter under the hood). Mangrove owns the \`code.scss\` rules that colour them; the class names themselves are Prism's API. Do not rename or prefix them with \`mg-\`.

For inline \`<code>\` snippets in prose, use the bare HTML element — the global \`code.scss\` styles it automatically. The CodeBlock component is only for block-level code display.`,
    cssClasses: [
      // Mangrove-defined classes:
      'mg-code-block', // <figure> wrapper with filename header
      'mg-code--block', // standalone block variant (e.g. ShareButtons URL display)
      // Prism.js token classes (styled by Mangrove, emitted by Prism/react-syntax-highlighter):
      // .token.comment .token.keyword .token.string .token.number .token.function
      // .token.class-name .token.tag .token.attr-name .token.attr-value
      // .token.operator .token.punctuation .token.boolean
    ],
    examples: [
      {
        name: 'Plain block',
        html: `<pre><code>npm install @undrr/undrr-mangrove</code></pre>`,
      },
      {
        name: 'With language badge (Prism.js tokenises on page load)',
        html: `<pre data-language="Bash"><code class="language-bash">#!/bin/bash
npm ci --production
npm run build</code></pre>`,
      },
      {
        name: 'With filename header',
        html: `<figure class="mg-code-block">
  <figcaption>deploy.sh</figcaption>
  <pre data-language="Bash"><code class="language-bash">#!/bin/bash
npm ci --production
npm run build</code></pre>
</figure>`,
      },
    ],
  },

  // --- Quote highlight (auto-rendered) ---
  'components-quotehighlight': {
    description:
      'Testimonial or pull quote with attribution, portrait, and optional large image. Background: light, dark, bright. Variants: line separator or image. Alignment: full, left, right.',
    hydration: {
      note: 'QuoteHighlight has no interactive behaviour, so the static renderedHtml is fully usable on its own — hydrate only when the surrounding page is already React. Every value comes from a data attribute; markup inside the container is discarded, not read. Security: data-quote, data-attribution and data-attribution-title are injected as raw HTML and are NOT sanitised — unlike TextCta and Drawer, this component does not run DOMPurify. Sanitise these values server-side before emitting them, and never build them from untrusted input.',
      selector: '[data-mg-quote-highlight]',
      modules: hydrationModules('QuoteHighlight'),
      dataAttributes: {
        'data-mg-quote-highlight': 'Marks the container to hydrate (required).',
        'data-quote':
          'Quote text (required). A value containing "<" is rendered as raw, unsanitised HTML; anything else is rendered as text. Sanitise it yourself.',
        'data-attribution':
          'Name of the person quoted. Always rendered as raw, unsanitised HTML. Sanitise it yourself.',
        'data-attribution-title':
          'Their role or organization. Always rendered as raw, unsanitised HTML. Sanitise it yourself.',
        'data-image-src': 'Portrait or feature image URL.',
        'data-image-alt':
          'Alt text for the image. There is no way to get a decorative empty alt through hydration: an omitted or empty value falls back to the generated string "<attribution> image", so always supply meaningful alt text.',
        'data-background-color': '"light" (default), "dark" or "bright".',
        'data-variant': '"line" (default) or "image".',
        'data-alignment': '"full" (default), "left" or "right".',
      },
      events: [],
      example: hydrationExample({
        name: 'QuoteHighlight',
        selector: '[data-mg-quote-highlight]',
        markup: `<div data-mg-quote-highlight
  data-quote="Countries need to reduce risk in every decision, action, and investment they make."
  data-attribution="Mami Mizutori"
  data-attribution-title="Special Representative of the UN Secretary-General for Disaster Risk Reduction and head of UNDRR"
  data-variant="line"
  data-background-color="light"
  data-alignment="full"></div>`,
      }),
    },
  },

  // --- Hero ---
  'components-hero-hero': {
    description:
      'Full-width hero banner with title, summary, and CTA buttons. Four color variants. Two layouts: `background` (full-bleed image with overlay, default) and `split` (solid theme-colour background with a content column plus a media column). Split layout supports 2/3, 1/2, and 1/3 content-to-media ratios, a configurable heading level (h1–h3), and three media types: `image` (default), `video` (iframe embed — provide the provider embed URL and a `title` for accessibility), or `html` (pre-sanitized HTML string for custom embeds; consumer must sanitize).',
    cssClasses: [
      'mg-hero',
      'mg-hero--secondary',
      'mg-hero--tertiary',
      'mg-hero--quaternary',
      'mg-hero--split',
      'mg-hero--split-2-3',
      'mg-hero--split-1-2',
      'mg-hero--split-1-3',
      'mg-hero__overlay',
      'mg-hero__split-grid',
      'mg-hero__content',
      'mg-hero__meta',
      'mg-hero__label',
      'mg-hero__title',
      'mg-hero__summaryText',
      'mg-hero__buttons',
      'mg-hero__media',
      'mg-hero__media--video',
      'mg-hero__media--html',
      'mg-hero__media-img',
      'mg-hero__media-iframe',
    ],
  },

  'components-hero-hero-child': {
    description:
      'DEPRECATED — planned for removal by end of 2026. Never adopted in production across UNDRR sites; do not use in new work. Migrate to the main Hero component (`headingLevel="h2"`/`"h3"` or `layout="split"`), which covers the same use cases. Kept available for reference only. Smaller hero banner for child/section pages. Single CTA button, linked label.',
    deprecated: true,
    deprecationNotice:
      'Planned for removal by end of 2026. Migrate to `components-hero-hero`.',
    cssClasses: [
      'mg-hero',
      'mg-hero--child',
      'mg-hero__overlay',
      'mg-hero__content',
      'mg-hero__meta',
      'mg-hero__label',
      'mg-hero__title',
      'mg-hero__summaryText',
      'mg-hero__buttons',
    ],
    examples: [
      {
        name: 'Child hero',
        html: `<section class="mg-hero mg-hero--child" aria-label="Early warning systems save lives" style="background-image: url('https://picsum.photos/1600/400')">
  <div class="mg-hero__overlay">
    <article class="mg-hero__content">
      <div class="mg-hero__meta">
        <a href="/topics/early-warning" class="mg-hero__label">Early warning</a>
      </div>
      <header class="mg-hero__title">
        <a href="#" class="text-xxl">Early warning systems save lives</a>
      </header>
      <div class="mg-hero__summaryText">Multi-hazard early warning systems are one of the most effective tools for disaster risk reduction.</div>
      <div class="mg-hero__buttons">
        <a class="mg-button mg-button-primary" href="/early-warning">Read more</a>
      </div>
    </article>
  </div>
</section>`,
      },
    ],
  },

  // --- User feedback (auto-rendered) ---
  'components-user-feedback': {
    description:
      'Standalone page-usefulness prompt generally paired as the sibling immediately before Footer. Response storage and consent remain product-owned.',
    cssClasses: [
      'mg-user-feedback',
      'mg-user-feedback__prompt',
      'mg-user-feedback__question',
      'mg-user-feedback__actions',
      'mg-user-feedback__issue',
      'mg-user-feedback__confirmation',
    ],
    hydration: {
      note: 'renderedHtml is static: the Yes and No buttons do nothing and the confirmation never appears. Render an empty data-mg-user-feedback container and hydrate it. Hydration has no onResponse hook, so Mangrove itself records nothing — attach your own analytics listener to the buttons, or mount the React component, if you need the answer. The markup does carry analytics hooks for a tag manager to bind to: data-vf-google-analytics-region="undrr-feedback-container" on the container and data-mg-user-feedback-type on each button, so on a page that loads such a tag manager the answer is recorded by that tool, not by Mangrove. Mangrove never stores responses itself.',
      selector: '[data-mg-user-feedback]',
      modules: hydrationModules('UserFeedback'),
      dataAttributes: {
        'data-mg-user-feedback': 'Marks the container to hydrate (required).',
        'data-feedback-url':
          'Where the "report an issue" link points (default https://www.undrr.org/contact/website-feedback).',
        'data-question': 'The prompt, e.g. "Is this page useful?".',
        'data-yes-label': 'Label for the positive answer.',
        'data-no-label': 'Label for the negative answer.',
        'data-report-issue-label': 'Label for the report-an-issue link.',
        'data-confirmation-before-link':
          'Confirmation text before the link. With data-confirmation-separator, data-confirmation-link and data-confirmation-after-link it composes the thank-you line.',
        'data-confirmation-separator':
          'Separator between the confirmation text and the link.',
        'data-confirmation-link': 'Link text inside the confirmation.',
        'data-confirmation-after-link': 'Confirmation text after the link.',
      },
      events: [],
      example: hydrationExample({
        name: 'UserFeedback',
        selector: '[data-mg-user-feedback]',
        markup: `<div data-mg-user-feedback
  data-feedback-url="/contact/website-feedback"
  data-question="Is this page useful?"
  data-yes-label="Yes"
  data-no-label="No"
  data-report-issue-label="Report an issue on this page"></div>`,
      }),
    },
  },

  // --- Service notice (auto-rendered + hydration) ---
  'components-notice-service-notice': {
    description:
      'In-page degraded state or partial outage notice for live feeds, interactive maps, or remote APIs with status link, optional retry action, and capped automatic retries with backoff.',
    cssClasses: [
      'mg-notice__meta',
      'mg-notice',
      'mg-notice--warning',
      'mg-notice--negative',
      'mg-notice--compact',
      'mg-notice--overlay',
      'mg-notice__header',
      'mg-notice__icon',
      'mg-notice__title',
      'mg-notice__description',
      'mg-notice__actions',
      'mg-status-label',
      'mg-status-label--warning',
      'mg-status-label--negative',
    ],
    hydration: {
      note: 'renderedHtml is static markup: its retry button has no handler, no countdown runs and nothing is announced. For a working retry, render an empty data-mg-service-notice container and hydrate it, then listen for the mg-service-notice:retry event.',
      selector: '[data-mg-service-notice]',
      modules: {
        hydrate:
          'https://assets.undrr.org/mangrove/{{version}}/components/hydrate.js',
        component:
          'https://assets.undrr.org/mangrove/{{version}}/components/ServiceNotice.js',
      },
      dataAttributes: {
        'data-mg-service-notice': 'Marks the container to hydrate (required).',
        'data-title':
          'Heading text (plain text). Falls back to the text of a child .mg-notice__title.',
        'data-description':
          'Explanation (plain text). Falls back to the text of a child .mg-notice__description.',
        'data-status': '"degraded" (default) or "offline".',
        'data-heading-level': 'h2 to h6 (default h3).',
        'data-is-compact':
          '"true" for compact padding and typography (preferred). The mg-notice--compact class on the container also works and is removed on hydration so the container is not styled twice.',
        'data-is-overlay':
          '"true" for a centered overlay inside a positioned embed container (preferred). The mg-notice--overlay class on the container also works and is removed on hydration so the container is not styled twice.',
        'data-retry':
          'Boolean attribute. When present, a retry button renders and each retry dispatches mg-service-notice:retry on the container. Without it, no retry button or countdown renders.',
        'data-retry-label': 'Retry button text.',
        'data-status-url':
          'External status page URL (http or https only; other schemes are ignored). Opens in a new tab.',
        'data-status-url-label': 'Status link text.',
        'data-countdown-seconds':
          'Seconds before the first automatic retry; doubles after each attempt. Needs data-retry.',
        'data-max-auto-retries':
          'Automatic retries before the countdown stops (default 3).',
        'data-labels':
          'JSON object of translated UI strings: retryLabel, statusUrlLabel, opensInNewTab, statusDegraded, statusOffline, countdownPrefix, countdownAnnouncement, autoRetryStopped.',
      },
      events: [
        {
          name: 'mg-service-notice:retry',
          target: 'The data-mg-service-notice container',
          bubbles: true,
          when: 'The retry button is pressed or an automatic retry fires. Only dispatched when data-retry is present.',
        },
      ],
      example: hydrationExample({
        name: 'ServiceNotice',
        selector: '[data-mg-service-notice]',
        markup: `<div id="map-notice"
  data-mg-service-notice
  data-title="Map service temporarily unavailable"
  data-description="Unable to connect to the tile server."
  data-status="offline"
  data-retry
  data-status-url="https://messaging.undrr.org/"
  data-countdown-seconds="30"
  data-max-auto-retries="3"></div>`,
        extra: `

  document
    .getElementById('map-notice')
    .addEventListener('mg-service-notice:retry', () => {
      // Re-fetch your data here, then remove the notice once it loads.
      console.log('Retry requested');
    });`,
      }),
    },
  },

  // --- Notice / Alert Banner (auto-rendered + hydration) ---
  'components-notice-notice': {
    description:
      'Universal in-page notice and alert banner container for informational callouts, contextual warnings, and error alerts. Combine negative with the prominent modifier for emergency banners.',
    cssClasses: [
      'mg-notice',
      'mg-notice--info',
      'mg-notice--warning',
      'mg-notice--negative',
      'mg-notice--positive',
      'mg-notice--compact',
      'mg-notice--prominent',
      'mg-notice--overlay',
      'mg-notice__header',
      'mg-notice__icon',
      'mg-notice__title',
      'mg-notice__description',
      'mg-notice__actions',
      'mg-notice__meta',
      'mg-notice__dismiss',
    ],
    hydration: {
      note: 'A plain CSS notice needs no JavaScript — copy renderedHtml and stop there unless the notice is dismissible, because the dismiss button in the static markup has no handler. Hydration also lets a Drupal template pass translated strings as attributes. The title and description are read as plain text: markup inside .mg-notice__title or .mg-notice__description is not preserved, so pass rich content through React instead. The component hides itself when dismissed, with or without a handler.',
      selector: '[data-mg-notice]',
      modules: hydrationModules('Notice'),
      dataAttributes: {
        'data-mg-notice': 'Marks the container to hydrate (required).',
        'data-title':
          'Heading text (plain text). Falls back to the text of a child .mg-notice__title.',
        'data-description':
          'Body text (plain text). Falls back to the text of a child .mg-notice__description.',
        'data-variant': '"info", "warning", "negative" or "positive".',
        'data-heading-level':
          'h2 to h6 (default h3). Pick the level that fits the page outline.',
        'data-is-compact': '"true" for compact padding and typography.',
        'data-is-prominent':
          '"true" for a sitewide banner. With variant "negative" this is the emergency banner.',
        'data-is-overlay':
          '"true" for a centred overlay inside a positioned embed container.',
        'data-is-dismissible': '"true" to render the dismiss button.',
        'data-dismiss-label': 'Accessible name of the dismiss button.',
      },
      events: [],
      example: hydrationExample({
        name: 'Notice',
        selector: '[data-mg-notice]',
        markup: `<div data-mg-notice
  data-title="Scheduled maintenance"
  data-description="PreventionWeb will be briefly unavailable on Sunday from 02:00 to 04:00 UTC."
  data-variant="warning"
  data-heading-level="h2"
  data-is-dismissible="true"
  data-dismiss-label="Dismiss"></div>`,
      }),
    },
  },

  // --- Footer (auto-rendered + embed) ---
  'components-footer': {
    description:
      'Site footer with optional UNDRR syndication. Loads global footer content from PreventionWeb via a widget script. Works with or without React.',
    doNotModify:
      'The Footer structure is a UNDRR branding requirement. Use the documented markup exactly as shown. Do not simplify, reorganize, or omit elements.',
    vanillaHtmlEmbed: {
      description:
        'The UNDRR global footer can be embedded on any page using the PreventionWeb syndication widget. No React required. The widget script fetches footer content from PreventionWeb and injects it into the container element.',
      html: `<footer class="mg-footer">
  <!-- Your site-specific footer content -->
  <nav aria-label="Footer navigation">
    <ul>
      <li><a href="/about">About</a></li>
      <li><a href="/contact">Contact</a></li>
      <li><a href="/privacy">Privacy policy</a></li>
    </ul>
  </nav>

  <!-- UNDRR syndicated footer (content loads here) -->
  <div class="pw-widget-footer"></div>
</footer>

<script src="https://publish.preventionweb.net/widget.js"></script>
<script>
  new PW_Widget.initialize({
    contenttype: 'landingpage',
    pageid: '83835',
    includecss: false,
    suffixID: 'footer',
    activedomain: 'www.undrr.org'
  });
</script>`,
      configOptions: {
        contenttype: 'Type of syndicated content (e.g. landingpage)',
        pageid: 'PreventionWeb page ID to syndicate',
        includecss:
          'Whether to include PreventionWeb default styles (set false when using Mangrove CSS)',
        suffixID:
          'Unique suffix for the widget container class (creates pw-widget-{suffixID})',
        activedomain: 'Domain for absolute URLs in syndicated content',
      },
    },
  },

  // --- Page header (auto-rendered) ---
  'components-pageheader': {
    description:
      'UNDRR page header with colored decoration stripe, logo, user account link, and language selector dropdown.',
    doNotModify:
      'The PageHeader structure (decoration stripe, toolbar wrapper, logo section) is a UNDRR branding requirement. Use the documented markup exactly as shown. The four empty divs inside mg-page-header__decoration are intentional — they render the colored stripe segments.',
  },

  // --- Navigation (auto-rendered) ---
  'components-navigation-breadcrumbs': {
    description:
      'Breadcrumb navigation trail. White variant available for dark backgrounds.',
  },

  // --- Forms (auto-rendered) ---
  'components-forms-text-input': {
    description:
      'Text input field with label, help text, required indicator, and error state.',
  },
  'components-forms-select': {
    description:
      'Dropdown select field with label, placeholder, help text, and error state.',
  },
  'components-forms-checkbox': {
    description:
      'Styled checkbox with label. Error and disabled states available. Also documents the CSS-only .mg-switch toggle (role="switch"), including a pending state set with aria-busy="true" on the input or .mg-switch--pending on the label. The switch has an error state, set the same way as on any other control: aria-invalid="true" on the input (preferred, and the only form assistive technology sees), or mg-switch__input--error on the input, or mg-switch--error on the label, each giving the track a red boundary; put the message in a sibling p.mg-form-error with role="alert" OUTSIDE the label (inside it would join the switch\'s accessible name) and join the two with aria-describedby, exactly as with a text input, so FormErrorSummary can link to the switch by id. The error state does not move the thumb: use it for "the thing this switch controls failed", and the pending helper when the save itself failed and the switch must revert. The switch is sized with custom properties and never by overriding the thumb transform, which also breaks RTL: --mg-switch-size (default 1.5rem/24px) sizes the whole control, and --mg-switch-track-block-size (default --mg-switch-size), --mg-switch-track-inline-size (default 1.75x the track block size), --mg-switch-track-inset (default 1/12 of the track block size; it is the space around the thumb, drawn as a transparent border, which is what the error state and forced colours colour) and --mg-switch-thumb-size (default the track block size less its two insets) each set one part. The thumb travel, its RTL counterpart and the pending ring all derive from these, so setting them is enough in both directions. .mg-switch--small sets --mg-switch-size: 1.125rem and a tighter row gap, and re-declares no length inside the switch; prefer it to a size of your own for a toolbar, table row or panel header. The colour hooks are --mg-switch-track-background, --mg-switch-track-background--checked, --mg-switch-thumb-background, --mg-switch-track-border-color--error (default rgb(var(--mg-color-red-900))), --mg-switch-pending-ring-color, --mg-switch-pending-ring-gap-color, --mg-switch-track-overlay--pending and --mg-switch-track-overlay--disabled. Set any of them on the switch or any ancestor. Do not paint a switch state with box-shadow or outline on the track: the focus ring owns both, and a consumer rule of equal specificity replaces its separator band. For a switch that saves a setting, load the dependency-free js/switch-pending.js module (no React): it announces "Saving…", "Still saving…" and the outcome in a role="status" region, ignores presses while saving, sets aria-busy a frame after the change, honours only the latest request, and times out (10s) and reverts on failure. Use mgSwitchPending(input, { save }) where save(checked, signal) returns a Promise, or mark switches with data-mg-switch-pending and answer one document-level mg-switch:save listener. Both defaults can be switched off: revert: false keeps the position the user asked for and sets aria-invalid="true" instead (which also turns on the error state above, so supply the .mg-form-error message too), and timeout: 0 or Infinity removes the deadline. mgSwitchAnnouncer(element, { status, labels }) exports the announcements on their own, for apps that run their own save.',
    vanillaModule: {
      note: 'Plain ES module: no React, no hydrate.js, no import map. renderedHtml switches toggle but do not save. Marked switches are enhanced on load; an explicit mgSwitchPending or mgSwitchPendingInit call takes over those switches with its options. Without a save function, each change dispatches a cancelable mg-switch:save event; a listener must call event.detail.respondWith(promise) synchronously (wrap awaited work in an async function and pass its promise), or call event.preventDefault() synchronously and respondWith later. Otherwise the switch reverts with a console warning. Call mgSwitchPendingDestroy(scope), or abort the { signal } passed to mgSwitchPendingInit, before removing switches. Exports: mgSwitchPending(input, { save, status, timeout, revert, labels, signal }) returning { destroy() }, mgSwitchPendingInit(scope, options) returning the new helpers, mgSwitchPendingDestroy(scope), and mgSwitchAnnouncer(element, { status, labels }). The announcer is the announcements without the save state machine, for an app that owns the switch position and its own requests: it adds no listeners and sets no attributes, and returns { status, labels, label(), announce(text), pending(), stillSaving(force), settled(checked), failed(), destroy() }, where announce() takes a string with {label} or a function (labelText, input). mgSwitchPending runs the same announcer.',
      selector: '[data-mg-switch-pending]',
      modules: {
        script:
          'https://assets.undrr.org/mangrove/{{version}}/js/switch-pending.js',
      },
      dataAttributes: {
        'data-mg-switch-pending':
          'On the .mg-switch__input or its label. Enhanced on page load, or by mgSwitchPendingInit(scope).',
        'data-mg-switch-pending-skip-auto-init':
          'Presence-based. Skips the switch during page-load auto-init; call mgSwitchPendingInit yourself.',
        'data-mg-switch-labels':
          'JSON on the input or label: saving, stillSaving, error, on, off. "{label}" is replaced with the switch label text. Defaults are English ("Saving…", "Still saving…", "Could not save the change. Try again.", "{label} turned on", "{label} turned off"). Input wins over label; JS labels option wins over both.',
        'data-mg-switch-timeout':
          'Milliseconds before a save is abandoned with a TimeoutError. "0" or "Infinity" removes the deadline, so only the save can settle the switch and aria-busy stays true until it does. Default 10000. On the input or the label; the input wins, and the JS timeout option wins over both.',
        'data-mg-switch-revert':
          '"false" keeps the position the user asked for when a save fails, instead of moving the switch back, and sets aria-invalid="true" on the input. The page then owns showing the failure; handle mg-switch:failed. On the input or the label; the input wins, and the JS revert option wins over both.',
        'aria-invalid':
          'Set by the script to "true" on a non-reverting switch whose save failed. When the next save starts, and on destroy(), whatever the input had there before is put back, so an aria-invalid the page authored survives.',
        'data-mg-switch-status':
          'id of a role="status" element for announcements. Otherwise an aria-describedby target with role="status" or aria-live, else a visually hidden mg-u-sr-only region is added after the label and removed on destroy.',
        'data-mg-switch-pending-enhanced':
          'Set by the script on enhanced inputs. Do not author it.',
      },
      events: [
        {
          name: 'mg-switch:save',
          target: 'The .mg-switch__input',
          bubbles: true,
          when: 'A change starts a save and no save function was passed. Cancelable: preventDefault() during dispatch claims the save, so respondWith can follow an await. detail: { checked, signal, respondWith(promise) }; resolve for success, reject for failure.',
        },
        {
          name: 'mg-switch:pending',
          target: 'The .mg-switch__input',
          bubbles: true,
          when: 'A save starts. detail: { checked } (the requested position).',
        },
        {
          name: 'mg-switch:settled',
          target: 'The .mg-switch__input',
          bubbles: true,
          when: 'The save succeeded. detail: { checked, ok: true }.',
        },
        {
          name: 'mg-switch:failed',
          target: 'The .mg-switch__input',
          bubbles: true,
          when: "The save failed or timed out. detail: { checked (the position the switch is left in), requested, reverted (false when revert: false kept the requested position), reason: 'error' | 'timeout', error }.",
        },
      ],
      example: `<link rel="stylesheet" href="https://assets.undrr.org/mangrove/{{version}}/css/style.css" />

<label class="mg-switch" data-mg-switch-pending>
  <input type="checkbox" role="switch" class="mg-switch__input" name="alerts" />
  <span class="mg-switch__track" aria-hidden="true">
    <span class="mg-switch__thumb"></span>
  </span>
  <span class="mg-switch__label">Real-time alerts</span>
</label>

<script type="module" src="https://assets.undrr.org/mangrove/{{version}}/js/switch-pending.js"></script>
<script>
  document.addEventListener('mg-switch:save', event => {
    const { checked, signal, respondWith } = event.detail;
    respondWith(
      fetch('/api/settings/' + event.target.name, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked }),
        signal,
      }).then(response => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
      })
    );
  });
</script>`,
    },
    cssClasses: [
      'mg-form-check',
      'mg-form-check__input',
      'mg-form-check__input--checkbox',
      'mg-form-check__input--disabled',
      'mg-form-check__input--error',
      'mg-form-check__label',
      'mg-form-error',
      'mg-switch',
      'mg-switch--error',
      'mg-switch--pending',
      'mg-switch--small',
      'mg-switch__input',
      'mg-switch__input--error',
      'mg-switch__track',
      'mg-switch__thumb',
      'mg-switch__label',
    ],
  },
  'components-forms-radio': {
    description:
      'Styled radio button with label. Error and disabled states available.',
  },
  'components-forms-textarea': {
    description:
      'Multi-line text input with label, help text, and error state.',
  },
  'components-forms-formgroup': {
    description:
      'Fieldset wrapper for grouping related form controls with a legend. Error and disabled states.',
  },
  'components-forms-form-action': {
    description:
      'Joins one form field to one high-priority action as a continuous control for search, subscribe, apply, check, redeem, or compact submission flows. Keep the field and button as separate semantic controls. Do not use for unrelated actions, destructive actions, multi-step forms, or multiple fields sharing one submit button. Add mg-form-action--stack-mobile when a long or translated action needs the full mobile width.',
    cssClasses: [
      'mg-form-action',
      'mg-form-action--stack-mobile',
      'mg-form-action__control',
      'mg-form-action__action',
    ],
    examples: [
      {
        name: 'Joined email subscription',
        html: `<form class="mg-form-field" action="/subscribe" method="post">
  <label class="mg-form-label" for="subscription-email">Email address</label>
  <div class="mg-form-action">
    <input class="mg-form-input mg-form-action__control" id="subscription-email" name="email" type="email" autocomplete="email" required>
    <button class="mg-button mg-button-primary mg-form-action__action" type="submit">Subscribe</button>
  </div>
</form>`,
      },
    ],
  },
  'components-forms-formerrorsummary': {
    description:
      'Error summary box listing all form validation errors with anchor links to each field.',
  },
  'components-forms-range': {
    description:
      'Prototype. Range slider supporting continuous and stepped intervals with labelled tick marks; stepped sliders announce the tick label via aria-valuetext.',
    cssClasses: ['mg-range', 'mg-range__ticks'],
  },

  // --- CTA ---
  'components-cta': {
    description:
      'Call-to-action banner with heading, rich text body, action buttons, and optional image. Four color variants (primary, secondary, tertiary, quaternary), strong or soft accent tone, and custom backgroundColor override. Supports centered and side-by-side (with image) layouts.',
    cssClasses: [
      'mg-cta',
      'mg-cta--primary',
      'mg-cta--soft',
      'mg-cta--secondary',
      'mg-cta--tertiary',
      'mg-cta--quaternary',
      'mg-cta--centered',
      'mg-cta--with-image',
      'mg-cta__inner',
      'mg-cta__body',
      'mg-cta__headline',
      'mg-cta__text',
      'mg-cta__actions',
      'mg-cta__custom-content',
      'mg-cta__image',
    ],
    hydration: {
      note: 'The CTA banner is plain CSS, so renderedHtml works on its own. Hydrate when a Drupal template needs to pass translated text and a button list as attributes. The hydrator supports the text-and-buttons model only: arbitrary child markup is discarded, so render CTA classes directly around a form rather than hydrating one. data-text is sanitised with DOMPurify.',
      selector: '[data-mg-text-cta]',
      modules: hydrationModules('TextCta'),
      dataAttributes: {
        'data-mg-text-cta': 'Marks the container to hydrate (required).',
        'data-eyebrow': 'Short label above the headline.',
        'data-headline': 'Banner heading text.',
        'data-headline-size':
          'Font size token, e.g. "400", "600" (default) or "800".',
        'data-headline-level':
          'Semantic heading level, 2 to 6 (default 2). Out-of-range values fall back to 2.',
        'data-text': 'Body HTML, sanitised with DOMPurify.',
        'data-buttons':
          'JSON array of button objects: { label, url, type, variant, outline, target, rel }. type is "Primary" (default) or "Secondary"; variant is "Default" or "CTA"; outline is a boolean; target and rel are the only way to get an external-link CTA from a hydrated banner. Invalid JSON renders no buttons.',
        'data-variant':
          '"primary" (default), "secondary", "tertiary" or "quaternary".',
        'data-tone': '"strong" (default) or "soft".',
        'data-background-color': 'CSS background colour override.',
        'data-padding': 'CSS padding override.',
        'data-image': 'Image URL; supplying one switches to the split layout.',
        'data-image-alt': 'Alt text for the image.',
        'data-centered': '"false" to left-align (default "true").',
        'data-layout': '"stacked" (default) or "inline".',
        'data-class-name': 'Extra class on the banner.',
      },
      events: [],
      example: hydrationExample({
        name: 'TextCta',
        selector: '[data-mg-text-cta]',
        markup: `<div data-mg-text-cta
  data-eyebrow="Registration open"
  data-headline="Global Platform for Disaster Risk Reduction"
  data-headline-level="2"
  data-text="<p>Join governments, scientists and practitioners in Geneva.</p>"
  data-buttons='[{"label":"Register","url":"/global-platform/register"},{"label":"Read the programme","url":"/global-platform","type":"Secondary"}]'
  data-variant="primary"
  data-layout="inline"></div>`,
      }),
    },
  },

  // --- Images ---
  'components-images-author-image': {
    description:
      'Circular author portrait with optional hover color accent (yellow, green, red, blue) and size variant.',
    cssClasses: ['mg-author-image'],
    examples: [
      {
        name: 'Author image',
        html: `<div class="mg-author-image mg-author-image--large mg-author-image--blue">
  <img src="https://picsum.photos/150/150" alt="Author name" title="Author name" />
</div>`,
      },
    ],
  },

  'components-images-image-with-credit-caption': {
    description: 'Figure element with image, caption, and photo credit.',
    cssClasses: ['mg-image-figcaption', 'mg-image-figcaption__cart'],
    examples: [
      {
        name: 'Image with caption and credit',
        html: `<figure class="mg-image-figcaption">
  <div class="mg-image-figcaption__cart">
    <img src="https://picsum.photos/800/450" alt="Disaster preparedness training exercise" />
  </div>
  <figcaption>
    Disaster preparedness training in the Philippines.
    <span class="mg-credits">Photo: UNDRR / John Smith</span>
  </figcaption>
</figure>`,
      },
    ],
  },

  // --- Logos ---
  'components-logos': {
    description:
      'Logo images for UNDRR, PreventionWeb, IRP, and partner organizations.',
    cssClasses: [],
    examples: [
      {
        name: 'Logo',
        html: `<img src="https://assets.undrr.org/logos/undrr/undrr-logo-blue.svg" alt="UNDRR" />`,
      },
    ],
  },

  // --- Icons ---
  'components-icons': {
    description:
      'Mangrove icon font. Use span elements with mg-icon and mg-icon-{name} classes.',
    cssClasses: ['mg-icon'],
    examples: [
      {
        name: 'Mangrove icons',
        html: `<span class="mg-icon mg-icon-globe" aria-hidden="true"></span>
<span class="mg-icon mg-icon-chart-bar" aria-hidden="true"></span>
<span class="mg-icon mg-icon-file-alt" aria-hidden="true"></span>
<span class="mg-icon mg-icon-lightbulb" aria-hidden="true"></span>
<span class="mg-icon mg-icon-cubes" aria-hidden="true"></span>
<span class="mg-icon mg-icon-user" aria-hidden="true"></span>`,
      },
    ],
  },

  // --- Utilities ---
  'components-embedcontainer': {
    description:
      'Responsive aspect-ratio wrapper for iframes and embeds. Default 16:9 with 4:3, 1:1, and 21:9 variants.',
  },
  'components-fullwidth': {
    description:
      'Makes content break out of its container to span the full viewport width. RTL-safe.',
  },
  'components-loader': {
    description: 'Animated loading spinner. 40px on mobile, 96px on desktop.',
  },

  'components-showmore': {
    description:
      'Collapse long content behind a gradient fade with a toggle button. Height customizable via CSS variable.',
    cssClasses: ['mg-show-more--collapsed', 'mg-show-more--button'],
    examples: [
      {
        name: 'Show more / collapse pattern',
        // `data-mg-show-more` marks the toggle, not the content;
        // `data-mg-show-more-target` points at what it reveals. mgShowMore()
        // adds aria-controls and role="button", so do not hand-write them.
        // It deliberately adds no aria-expanded: the collapse is visual
        // clipping and the content stays in the accessibility tree, so there
        // is nothing hidden for aria-expanded to describe. See ShowMore.mdx.
        //
        // The content must NOT ship `mg-show-more--collapsed`: mgShowMore()
        // clicks the toggle once at init, which toggles the class on. Marking
        // the content collapsed in the source makes that first click expand it,
        // leaving the example open with a "Show less" label on page load.
        html: `<div id="extra-content" style="--mg-show-more-height: 150px;">
  <p>This is long content that will be collapsed behind a gradient fade. Only the first 150px is visible initially.</p>
  <p>Additional content hidden until the user clicks the button.</p>
  <p>More content here...</p>
</div>
<button type="button" class="mg-button mg-button-primary mg-show-more--button" data-mg-show-more data-mg-show-more-target="#extra-content" data-mg-show-more-label-collapsed="Show more" data-mg-show-more-label-open="Show less">Show more</button>`,
      },
    ],
  },

  // Added here rather than in unisdr/undrr-mangrove#1113, which shipped the
  // pattern without a manifest entry and left `validate-manifest` failing.
  'components-navigation-skip-link': {
    description:
      'Bypass block: an anchor that stays visually hidden until it receives keyboard focus, then appears in normal flow above the header. Points at the page\'s <main>, which must carry both an id and tabindex="-1" so focus lands there rather than only the scroll position. The label is a prop, and the stylesheet uses logical properties, so it works translated and in right-to-left. Place it as the first focusable element in the page wrapper, before the brand bar. Not built on mg-u-sr-only, which has no focus reveal.',
    cssClasses: ['mg-skip-link'],
    examples: [
      {
        name: 'Skip link with its target',
        html: `<a class="mg-skip-link" href="#main-content">Skip to main content</a>
<header id="header"><!-- brand bar, mega menu --></header>
<main id="main-content" tabindex="-1">
  <h1>Page title</h1>
</main>`,
      },
    ],
  },

  'components-error-pages': {
    description:
      'Branded full-page error templates (404, 500, Cloudflare challenges) with status banner, search field, diagnostic details, and action buttons.',
    cssClasses: [
      'mg-error-page',
      'mg-error-page__container',
      'mg-error-page__search',
      'mg-error-page--challenge',
    ],
    examples: [
      {
        name: '404 error page',
        html: `<main class="mg-error-page">
  <div class="mg-error-page__container">
    <div class="undrr-logo" role="img" aria-label="UNDRR logo"></div>
    <h1>404</h1>
    <h2>Page not found</h2>
    <p>The page you requested could not be located.</p>
    <div class="mg-error-page__search">
      <input type="search" placeholder="Search UNDRR..." aria-label="Search UNDRR" />
      <button class="mg-button mg-button-primary" type="submit">Search</button>
    </div>
    <a class="mg-button mg-button-primary" href="/">Return to homepage</a>
  </div>
</main>`,
      },
    ],
  },

  // --- CSS utilities and documentation pages ---
  'components-font-size-utilities': {
    description:
      'Font size utility classes (mg-font-size-*) for overriding typography scale.',
  },
  'components-normalize': {
    description:
      'CSS normalize/reset layer applied globally before component styles.',
  },
  'components-typography-typography-integration-example': {
    description:
      'Integration example showing Mangrove typography classes in a page context.',
  },
  'components-utility-css': {
    description:
      'CSS utility class reference (spacing, visibility, text alignment, floats).',
  },

  // --- Page templates ---
  'components-reading-column': {
    description:
      "Reading column for a long page: constrains the article to a readable measure, and with mg-reading--with-contents places a table of contents in a sticky sidebar from 48rem up, stacking it above the article below that. The sidebar split itself is mg-grid's --article variant (see design-decisions-grid-layout) — pair mg-reading--with-contents with mg-grid mg-grid--article in markup.",
    cssClasses: [
      'mg-reading',
      'mg-reading--with-contents',
      'mg-reading__article',
    ],
  },

  'patterns-content-hub': {
    description:
      'A named group of pages inside the parent site — a programme, a monitor, a guidance collection — carrying the same identity and section links on every page so readers move sideways without returning to a landing page. Composes HubHeader with shipped cards, hero and contents components.',
  },

  'patterns-article-story': {
    description:
      'A news or event article page: headline, header image, reading body and related content cards. imageProminence controls the header treatment: bleeds full width (large), stays in the reading column (compact), or runs a two-column Hero split band (split). heroImage controls whether the header shows the same image used for teasers/social cards, a different one, or none. Composes VerticalCard, TableOfContents and mg-reading.',
  },

  'patterns-landing-pages': {
    description:
      'Three UNDRR landing page shapes: topic or initiative (hero, route cards, supporting band), report or publication (feature band and a reading column with contents), and collection index (grouped rows of covers).',
  },

  'example-page-template-example': {
    description:
      'Complete page templates showing how to compose Mangrove components into working UNDRR-branded pages with all required scripts and assets.',
    examples: [
      {
        name: 'Canonical UNDRR page shell (use this as your starting point)',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page title - UNDRR</title>
  <!-- Theme CSS (required, choose one) -->
  <link rel="stylesheet" href="https://assets.undrr.org/mangrove/{{version}}/css/style.css" />
  <!-- Cookie consent CSS (required if using cookie banner) -->
  <link rel="stylesheet" href="https://assets.undrr.org/cookie-banner/v1/cookieconsent.css" />
</head>
<body>
<!-- Page header — DO NOT MODIFY this structure, it is a UNDRR branding requirement -->
  <a class="mg-skip-link" href="#main-content">Skip to main content</a>
  <header id="header" class="mg-page-header mg-page-header--default">
    <div class="mg-page-header__decoration">
      <div></div><div></div><div></div><div></div>
    </div>
    <div class="mg-page-header__toolbar-wrapper">
      <div class="mg-page-header__container mg-container">
        <div class="mg-page-header__region mg-page-header__region--toolbar">
          <div class="mg-page-header__block mg-page-header__block--logo">
            <a href="/">
              <img class="mg-page-header__logo-img" src="https://assets.undrr.org/logos/undrr/undrr-logo-horizontal.svg" alt="UNDRR" width="324" height="47" />
            </a>
          </div>
          <a title="My account" href="/user">
            <span class="mg-icon mg-icon-user mg-page-header__toolbar-icon" aria-hidden="true"></span>
            <span class="mg-u-sr-only">My account</span>
          </a>
          <div class="mg-page-header__block mg-page-header__block--language">
            <span class="mg-icon mg-icon-languages mg-page-header__toolbar-icon mg-page-header__language-icon" aria-hidden="true"></span>
            <form class="mg-page-header__lang-form" action="/" method="post">
              <div class="mg-page-header__form-item">
                <label for="lang-select" class="mg-u-sr-only">Select your language</label>
                <div class="mg-page-header__select-wrapper">
                  <select id="lang-select" class="mg-page-header__select" name="lang_dropdown_select">
                    <option value="en" selected>English</option>
                    <option value="fr" lang="fr">Fran\u00e7ais</option>
                    <option value="es" lang="es">Espa\u00f1ol</option>
                    <option value="ar" lang="ar">\u0627\u0644\u0639\u0631\u0628\u064a\u0629</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Optional: MegaMenu navigation goes here (requires React) -->

  <!-- Critical messaging container (optional, messages inject here) -->
  <div class="mg-critical-messaging"></div>

  <main id="main-content">
    <!-- PAGE CONTENT GOES HERE -->
    <div class="mg-container mg-container--padded mg-container--spacer">
      <h1>Page title</h1>
      <p>Content here.</p>
    </div>
  </main>

<!-- Footer — DO NOT MODIFY, UNDRR branding requirement -->
  <footer class="mg-footer">
    <div class="pw-widget-footer"></div>
  </footer>

  <!-- Footer syndication widget -->
  <script src="https://publish.preventionweb.net/widget.js"></script>
  <script>
    new PW_Widget.initialize({
      contenttype: 'landingpage',
      pageid: '83835',
      includecss: false,
      suffixID: 'footer',
      activedomain: 'www.undrr.org'
    });
  </script>

<!-- === Required scripts (order matters) === -->

  <!-- UNDRR analytics (GA4) -->
  <script src="https://assets.undrr.org/analytics/v1.0.0/google_analytics_enhancements.js" defer></script>
  <!-- UNDRR critical messaging -->
  <script src="https://messaging.undrr.org/src/undrr-messaging.js" defer></script>
  <!-- Cookie consent JS (UMD) -->
  <script src="https://assets.undrr.org/cookie-banner/v1/cookieconsent.umd.js"></script>
  <!-- Cookie consent UNDRR config -->
  <script src="https://assets.undrr.org/cookie-banner/v1/cookieconsent-undrr.js"></script>
</body>
</html>`,
      },
      {
        name: 'Listing page (card grid with pager)',
        html: `<!-- Main content for a listing/index page — wrap in <main id="main-content"> within the page shell -->
<div class="mg-container mg-container--padded mg-container--spacer">
  <nav aria-label="Breadcrumbs" class="mg-breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li aria-current="page">Publications</li>
    </ol>
  </nav>

  <h1>Publications</h1>

  <!-- Filter chips -->
  <div style="margin-bottom: 1rem;">
    <button class="mg-chip mg-chip__cross" type="button" aria-label="Remove filter: Earthquake">Earthquake</button>
    <button class="mg-chip mg-chip__cross" type="button" aria-label="Remove filter: 2024">2024</button>
  </div>

  <!-- Card grid -->
  <div class="mg-grid mg-grid__col-3">
    <article class="mg-card mg-card__vc">
      <div class="mg-card__visual">
        <img src="https://picsum.photos/600/400?1" alt="Global Assessment Report 2024 cover" class="mg-card__image" />
      </div>
      <div class="mg-card__content">
        <div class="mg-card__meta">
          <a href="/topics/drr" class="mg-card__label mg-card__label--active">DRR</a>
        </div>
        <header class="mg-card__title"><a href="/report-1">Global Assessment Report 2024</a></header>
        <p class="mg-card__summary">The flagship report on disaster risk reduction.</p>
      </div>
    </article>
    <article class="mg-card mg-card__vc">
      <div class="mg-card__visual">
        <img src="https://picsum.photos/600/400?2" alt="Sendai Framework progress report" class="mg-card__image" />
      </div>
      <div class="mg-card__content">
        <header class="mg-card__title"><a href="/report-2">Sendai Framework progress</a></header>
        <p class="mg-card__summary">Tracking implementation across 195 countries.</p>
      </div>
    </article>
    <article class="mg-card mg-card__vc">
      <div class="mg-card__visual">
        <img src="https://picsum.photos/600/400?3" alt="Making cities resilient guide" class="mg-card__image" />
      </div>
      <div class="mg-card__content">
        <header class="mg-card__title"><a href="/report-3">Making cities resilient</a></header>
        <p class="mg-card__summary">Urban resilience for local governments.</p>
      </div>
    </article>
  </div>

  <!-- Pager -->
  <nav class="mg-pager" aria-label="Pagination">
    <ul class="mg-pager__list">
      <li class="mg-pager__item mg-pager__item--prev">
        <button class="mg-pager__link mg-pager__link--prev mg-pager__link--disabled" type="button" disabled aria-label="Go to previous page">
          <span aria-hidden="true">&#8249;</span><span class="mg-pager__text">Previous</span>
        </button>
      </li>
      <li class="mg-pager__item">
        <button class="mg-pager__link mg-pager__link--number mg-pager__link--current" type="button" aria-current="page" aria-label="Page 1, current page">1</button>
      </li>
      <li class="mg-pager__item"><a class="mg-pager__link mg-pager__link--number" href="?page=2" aria-label="Page 2">2</a></li>
      <li class="mg-pager__item"><a class="mg-pager__link mg-pager__link--number" href="?page=3" aria-label="Page 3">3</a></li>
      <li class="mg-pager__item mg-pager__item--next">
        <a class="mg-pager__link mg-pager__link--next" href="?page=2" aria-label="Go to next page">
          <span class="mg-pager__text">Next</span><span aria-hidden="true">&#8250;</span>
        </a>
      </li>
    </ul>
  </nav>
</div>`,
      },
      {
        name: 'Detail page (article with sidebar content)',
        html: `<!-- Main content for a detail/article page — wrap in <main id="main-content"> within the page shell -->
<section class="mg-hero mg-hero--child" aria-label="Early warning systems save lives" style="background-image: url('https://picsum.photos/1600/400')">
  <div class="mg-hero__overlay">
    <article class="mg-hero__content">
      <div class="mg-hero__meta">
        <a href="/topics/early-warning" class="mg-hero__label">Early warning</a>
      </div>
      <header class="mg-hero__title">
        <a href="#" class="text-xxl">Early warning systems save lives</a>
      </header>
      <div class="mg-hero__summaryText">Published 15 March 2026</div>
    </article>
  </div>
</section>

<div class="mg-container mg-container--padded mg-container--spacer">
  <nav aria-label="Breadcrumbs" class="mg-breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/news">News</a></li>
      <li aria-current="page">Early warning systems save lives</li>
    </ol>
  </nav>

  <div class="mg-grid mg-grid__col-2">
    <!-- Main article body -->
    <div>
      <p>Multi-hazard early warning systems are one of the most effective tools for disaster risk reduction, with proven capacity to save lives and reduce economic losses.</p>

      <div class="mg-highlight-box mg-highlight-box--primary">
        <h2>Key finding</h2>
        <p>Countries with early warning systems experience eight times fewer deaths from disasters.</p>
      </div>

      <p>The Sendai Framework calls for substantially increasing the availability of and access to multi-hazard early warning systems by 2030.</p>

      <blockquote>
        Prevention is not a cost. It is an investment in our common future.
        <cite>UNDRR</cite>
      </blockquote>

      <!-- Tags -->
      <div class="mg-tag-container" style="margin-top: 2rem;">
        <a href="/topics/early-warning">Early warning</a>
        <a href="/topics/sendai-framework">Sendai Framework</a>
        <a href="/regions/asia-pacific">Asia-Pacific</a>
      </div>
    </div>

    <!-- Sidebar -->
    <aside>
      <h2>Related publications</h2>
      <article class="mg-card mg-card__vc">
        <div class="mg-card__content">
          <header class="mg-card__title"><a href="/report-1">Global Assessment Report 2024</a></header>
          <p class="mg-card__summary">The flagship report on global disaster risk.</p>
        </div>
      </article>
      <article class="mg-card mg-card__vc">
        <div class="mg-card__content">
          <header class="mg-card__title"><a href="/report-2">Early warning for all</a></header>
          <p class="mg-card__summary">UN initiative for universal early warning coverage.</p>
        </div>
      </article>
    </aside>
  </div>
</div>`,
      },
      {
        name: 'Form page (contact form with validation)',
        html: `<!-- Main content for a form page — wrap in <main id="main-content"> within the page shell -->
<div class="mg-container mg-container--padded mg-container--spacer">
  <nav aria-label="Breadcrumbs" class="mg-breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li aria-current="page">Contact us</li>
    </ol>
  </nav>

  <div class="mg-container--slim">
    <h1>Contact us</h1>
    <p>Get in touch with the UNDRR team.</p>

    <!-- Error summary (show when form has validation errors) -->
    <!--
    <div class="mg-form-error-summary" role="alert" tabindex="-1">
      <h2 class="mg-form-error-summary__title">There is a problem</h2>
      <ul class="mg-form-error-summary__list">
        <li><a href="#email">Enter a valid email address</a></li>
        <li><a href="#message">Message is required</a></li>
      </ul>
    </div>
    -->

    <form action="/contact" method="post">
      <div class="mg-form-field">
        <label class="mg-form-label mg-form-label--required" for="full-name">Full name</label>
        <input class="mg-form-input" type="text" id="full-name" name="full_name" autocomplete="name" required />
      </div>

      <div class="mg-form-field">
        <label class="mg-form-label mg-form-label--required" for="email">Email address</label>
        <input class="mg-form-input" type="email" id="email" name="email" autocomplete="email" aria-describedby="email-help" required />
        <p class="mg-form-help" id="email-help">We will only use this to respond to your inquiry.</p>
      </div>

      <div class="mg-form-field">
        <label class="mg-form-label" for="organization">Organization</label>
        <input class="mg-form-input" type="text" id="organization" name="organization" autocomplete="organization" />
      </div>

      <div class="mg-form-field">
        <label class="mg-form-label" for="topic">Topic</label>
        <select class="mg-form-select" id="topic" name="topic">
          <option value="" disabled selected>Select a topic</option>
          <option value="general">General inquiry</option>
          <option value="partnership">Partnership</option>
          <option value="media">Media inquiry</option>
          <option value="technical">Technical support</option>
        </select>
      </div>

      <fieldset class="mg-form-group">
        <legend class="mg-form-group__legend">Preferred contact method</legend>
        <div class="mg-form-check">
          <input class="mg-form-check__input mg-form-check__input--radio" type="radio" id="contact-email" name="contact_method" value="email" checked />
          <label class="mg-form-check__label" for="contact-email">Email</label>
        </div>
        <div class="mg-form-check">
          <input class="mg-form-check__input mg-form-check__input--radio" type="radio" id="contact-phone" name="contact_method" value="phone" />
          <label class="mg-form-check__label" for="contact-phone">Phone</label>
        </div>
      </fieldset>

      <div class="mg-form-field">
        <label class="mg-form-label mg-form-label--required" for="message">Message</label>
        <textarea class="mg-form-textarea" id="message" name="message" rows="6" aria-describedby="message-help" required></textarea>
        <p class="mg-form-help" id="message-help">Max 2000 characters.</p>
      </div>

      <div class="mg-form-check">
        <input class="mg-form-check__input mg-form-check__input--checkbox" type="checkbox" id="privacy" name="privacy" required />
        <label class="mg-form-check__label" for="privacy">I agree to the <a href="/privacy">privacy policy</a></label>
      </div>

      <div style="margin-top: 2rem;">
        <button type="submit" class="mg-button mg-button-primary">Send message</button>
      </div>
    </form>
  </div>
</div>`,
      },
    ],
  },

  'example-form-validation': {
    description:
      'Interactive form validation example demonstrating error summary blocks, field-level error messages, and snackbar toast notifications with multi-language support.',
  },

  'example-newsletter-promotion': {
    description:
      'Interactive newsletter promotion pattern demonstrating email input validation, topic preferences checkboxes, submission states, and confirmation messaging.',
  },

  // --- Media and scrolling collections (hydration) ---
  'components-gallery': {
    description:
      'Media gallery with a main stage, optional thumbnail rail, navigation arrows, captions and keyboard support. Handles images, videos and embedded players.',
    hydration: {
      note: 'renderedHtml contains the arrows and the thumbnail rail, but they are inert markup: slide changing, thumbnail selection and keyboard navigation are all React behaviour. Render an empty data-mg-gallery container carrying data-media and hydrate it. Every media object whose type is "image" (or has no type) needs an alt value — WCAG 1.1.1. Validate data-media server-side: the JSON parse failure itself is swallowed, but the component has no empty-media guard, so an empty or malformed list throws during render and leaves the container blank. Security: an item of type "html" is injected unsanitised, so never build one from untrusted input.',
      selector: '[data-mg-gallery]',
      modules: hydrationModules('Gallery'),
      dataAttributes: {
        'data-mg-gallery': 'Marks the container to hydrate (required).',
        'data-media':
          'JSON array of media objects (required): { id, type, src, alt, title, description, thumbnail, poster, embedUrl, html }. The caption text comes from description; there is no caption key. type is "image" (default), "video", "embed" or "html". Invalid or empty JSON throws during render.',
        'data-initial-index': 'Index of the first slide shown (default 0).',
        'data-show-thumbnails':
          '"false" to hide the thumbnail rail (default "true").',
        'data-thumbnail-position': '"left" (default) or "bottom".',
        'data-show-arrows': '"false" to hide the arrows (default "true").',
        'data-arrow-style': '"overlay" (default) or "corner".',
        'data-show-description':
          '"false" to hide the title and caption (default "true").',
        'data-enable-keyboard':
          '"false" to switch off arrow-key navigation (default "true").',
        'data-loop': '"true" to wrap from the last slide to the first.',
      },
      events: [],
      example: hydrationExample({
        name: 'Gallery',
        selector: '[data-mg-gallery]',
        markup: `<div data-mg-gallery
  data-show-thumbnails="true"
  data-thumbnail-position="left"
  data-arrow-style="overlay"
  data-media='[
    {"id":"1","src":"/images/flood-response.jpg","alt":"Volunteers clearing debris from a flooded street","title":"Flood response, Cebu"},
    {"id":"2","src":"/images/early-warning.jpg","alt":"A community radio operator broadcasting a storm warning","title":"Early warning in practice"}
  ]'></div>`,
      }),
    },
  },
  'components-scrollcontainer': {
    description:
      'Horizontally scrolling rail for a row of cards or media, with optional arrow controls, drag scrolling, scroll snapping and equal-height items.',
    hydration: {
      note: 'Unusually, this hydrator reads your server-rendered content rather than a JSON attribute: put the items inside a .mg-scroll__content wrapper in the container and each child becomes a slide. Without that wrapper the whole container innerHTML becomes a single item. The markup is re-rendered from HTML strings, so any event handlers bound to it before hydration are lost, and it is re-injected unsanitised — unlike Drawer, this component does not run DOMPurify, so only ever hand it markup you control. renderedHtml scrolls natively and snapping works from the stylesheet; the arrow markup is present but dead until hydration. The scrollLeftLabel and scrollRightLabel strings have no data attribute, so a hydrated container keeps the English arrow labels.',
      selector: '[data-mg-scroll-container]',
      modules: hydrationModules('ScrollContainer'),
      dataAttributes: {
        'data-mg-scroll-container':
          'Marks the container to hydrate (required).',
        'data-height': 'Container height as a CSS value (default "auto").',
        'data-min-width': 'Minimum width as a CSS value (default "auto").',
        'data-item-width':
          'Width of each item as a CSS value (default "auto").',
        'data-padding': 'Container padding (default "0").',
        'data-show-arrows':
          '"true" to render the arrow controls. They are suppressed on touch devices regardless.',
        'data-stretch-items':
          '"true" to give mixed-length items a shared row height.',
        'data-step-size': 'Arrow scroll step in pixels.',
        '.mg-scroll__content':
          'Wrapper inside the container. Each of its children becomes one item.',
      },
      events: [],
      example: hydrationExample({
        name: 'ScrollContainer',
        selector: '[data-mg-scroll-container]',
        markup: `<div data-mg-scroll-container
  data-item-width="280px"
  data-show-arrows="true"
  data-stretch-items="true"
  data-step-size="300">
  <div class="mg-scroll__content">
    <div class="mg-card">First publication</div>
    <div class="mg-card">Second publication</div>
    <div class="mg-card">Third publication</div>
  </div>
</div>`,
      }),
    },
  },
  'components-syndicated-search': {
    description:
      'Search interface over the UNDRR syndication API: query box, facets, active filters, result list or cards, pager and search metrics. UI strings are translatable through the labels prop; most of them can also be set from a data-labels JSON attribute, but function-valued plural forms cannot be serialized to JSON and need the prop.',
    hydration: {
      note: 'The widget queries an Elasticsearch-backed API and owns all of its state, so renderedHtml is only the empty initial shell — no results, facets or pager are in it. Render an empty data-mg-search-widget container and hydrate it. fromElement returns { config }, plus a labels key only when a valid data-labels attribute is present, so destructure defensively. Only attributes you set are included in config, so every unset option keeps its default. Malformed JSON in any of the JSON attributes is ignored and that option falls back to its default.',
      selector: '[data-mg-search-widget]',
      modules: hydrationModules('SyndicationSearchWidget'),
      dataAttributes: {
        'data-mg-search-widget': 'Marks the container to hydrate (required).',
        'data-search-endpoint': 'Search API URL.',
        'data-results-per-page': 'Results per page.',
        'data-debounce-delay':
          'Milliseconds to wait before searching as you type.',
        'data-min-search-length': 'Minimum query length before a search runs.',
        'data-default-query': 'Query the widget starts with.',
        'data-default-sort': 'Initial sort key.',
        'data-display-mode': 'Result layout: list, card or card-book.',
        'data-grid-columns': 'Columns in the card grid.',
        'data-query-append': 'Extra query string appended to every search.',
        'data-facets':
          '"false", "sidebar" or "horizontal". Drupal sends attributes as strings, so the literal "false" is read as boolean false.',
        'data-facets-target':
          'CSS selector of an element to portal the facets into.',
        'data-search-target':
          'CSS selector of an element to portal the search box into.',
        'data-show-search-box': '"false" to hide the search box.',
        'data-show-results-count': '"false" to hide the result count.',
        'data-show-facets': '"false" to hide the facets.',
        'data-show-active-filters': '"false" to hide the active-filter chips.',
        'data-show-pager': '"false" to hide the pager.',
        'data-show-search-metrics': '"true" to show search metrics.',
        'data-show-search-timer': '"true" to show the search timer.',
        'data-enable-hash-sync':
          '"auto" (default), "true" or "false". "auto" lets the Drupal wrapper switch hash sync off when more than one widget is on the page, so keep the literal string.',
        'data-require-image': '"true" to return only results with an image.',
        'data-default-filters':
          'JSON object of filters applied to every search.',
        'data-allowed-types': 'JSON array of content types to include.',
        'data-custom-filters': 'JSON array of extra filter definitions.',
        'data-custom-facets': 'JSON array of extra facet definitions.',
        'data-visible-teaser-fields':
          'JSON array of teaser fields to show on each result.',
        'data-interestingness-tiers': 'JSON tier configuration for ranking.',
        'data-longevity-tiers': 'JSON tier configuration for ranking.',
        'data-labels':
          'JSON object of translated UI strings. Label sets ship for ES, FR, JA, ZH (Simplified), AR and RU.',
      },
      events: [],
      example: hydrationExample({
        name: 'SyndicationSearchWidget',
        selector: '[data-mg-search-widget]',
        markup: `<div data-mg-search-widget
  data-search-endpoint="https://www.preventionweb.net/api/v1/search"
  data-results-per-page="10"
  data-display-mode="list"
  data-facets="sidebar"
  data-default-filters='{"type":["publication"]}'></div>`,
      }),
    },
  },

  // --- Data Viz (v1 prototypes) ---
  'components-dataviz-legend': {
    description:
      'Prototype. Map and chart data visualization legend supporting continuous ramps, stepped intervals, and categorical swatches. Rendered as a group named by its title.',
    cssClasses: [
      'mg-legend',
      'mg-legend__title',
      'mg-legend__label',
      'mg-legend__value',
      'mg-legend__tick-label',
      'mg-legend__bar-wrapper',
      'mg-legend__bar',
      'mg-legend__bar--stepped',
      'mg-legend__step',
      'mg-legend__ticks',
      'mg-legend__tick',
      'mg-legend__list',
      'mg-legend__item',
      'mg-legend__swatch',
      'mg-legend--vertical',
      'mg-legend--inline',
      'mg-legend--grid',
    ],
  },

  // --- Navigation ---
  'components-navigation-megamenu': {
    description:
      'Site-wide mega menu: a desktop nav strip with multi-column panels and a bounded progressive mobile overlay below 900px. The menu structure comes from a sections array, normally built server-side or fetched from an API. Below 900px the overlay is bounded (minimum 400px where space permits, maximum min(700px, 90dvh)) with Back above the title, a separate Close control and outside-click dismissal, nested groups, and section headings linked to their landing pages. Optional label props are menuLabel, backLabel, allSectionsLabel, closeLabel, overviewLabel and toggleMobileNavLabel. mg-mega-wrapper--js-active is added on mount, so pointer-events restrictions apply only once the sidebar is available; plain HTML nav markup and failed-hydration states stay clickable on mobile.',
    hydration: {
      note: 'MegaMenu needs React: open and close state, keyboard navigation and the mobile drill-down are all component behaviour, so renderedHtml is not a working menu. This is a complex-tier component — fromElement reads only timing, logo and an optional inline data-sections attribute, and most integrations pass sections from an API in a consumer wrapper instead. Plain nav markup stays clickable before hydration and if hydration fails; the mg-mega-wrapper--js-active class is added on mount, so pointer-events restrictions apply only once the sidebar exists.',
      selector: '[data-mg-mega-menu]',
      modules: hydrationModules('MegaMenu'),
      dataAttributes: {
        'data-mg-mega-menu': 'Marks the container to hydrate (required).',
        'data-sections':
          'JSON array of menu sections: [{ title, items: [{ title, url }] }]. Note the item keys are title and url, not label and href. Required unless a consumer wrapper passes the sections prop itself — sections has no default and is required, so hydrating with neither throws and leaves the container empty. Invalid JSON is swallowed and also leaves the container empty.',
        'data-delay':
          'Milliseconds before the menu closes on mouse leave (default 300).',
        'data-hover-delay':
          'Milliseconds before the menu opens on hover (default 180).',
        'data-logo-src': 'Logo image URL.',
        'data-logo-alt':
          "Alt text for the logo; also becomes the logo link's accessible name.",
        'data-logo-href':
          'Where the logo links to, e.g. /ar/ for a language-prefixed root (default /).',
        'data-logo-width': 'Explicit logo width, to avoid layout shift.',
        'data-logo-height': 'Explicit logo height, to avoid layout shift.',
      },
      events: [],
      example: hydrationExample({
        name: 'MegaMenu',
        selector: '[data-mg-mega-menu]',
        markup: `<div data-mg-mega-menu
  data-delay="300"
  data-hover-delay="180"
  data-logo-src="https://assets.undrr.org/logos/pw/pw-logo.svg"
  data-logo-alt="PreventionWeb"
  data-logo-href="/"
  data-sections='[
    {"title":"Knowledge base","items":[{"title":"Sendai Framework","url":"/sendai-framework"},{"title":"Terminology","url":"/terminology"}]},
    {"title":"News and events","items":[{"title":"Latest news","url":"/news"}]}
  ]'></div>`,
      }),
    },
  },
  'components-navigation-pager': {
    description:
      'Pagination for a result list: previous and next controls, numbered pages with ellipses, an optional result-range line and jump-to-page field, and a mini-pager when the total page count is unknown.',
    cssClasses: [
      'mg-pager',
      'mg-pager__list',
      'mg-pager__item',
      'mg-pager__item--ellipsis',
      'mg-pager__item--prev',
      'mg-pager__item--next',
      'mg-pager__link',
      'mg-pager__link--current',
      'mg-pager__link--disabled',
      'mg-pager__link--prev',
      'mg-pager__link--next',
      'mg-pager__icon',
      'mg-pager__text',
      'mg-pager__ellipsis',
      'mg-pager__bar',
      'mg-pager__range',
      'mg-pager__jump',
      'mg-pager__jump-label',
      'mg-pager__jump-input',
      'mg-pager__jump-btn',
      'mg-pager__notice',
      'mg-pager__notice-action',
    ],
    hydration: {
      note: 'renderedHtml shows a pager at a fixed page: its controls change nothing. Hydration does not give you navigation either — onPageChange is deliberately not read from the DOM, because paging is the consuming application\'s job. Do not hydrate Pager with createHydrator alone: onPageChange is a required prop, so a bare hydrated pager logs a PropTypes error and every page click, arrow key and jump-to-page submit throws "onPageChange is not a function". Wrap it: render Pager yourself in a consumer wrapper (a Drupal behavior that re-runs the AJAX view, for example) that reads these attributes and supplies onPageChange. For links that simply navigate, server-rendered <a href> markup is the better answer.',
      selector: '[data-mg-pager]',
      modules: hydrationModules('Pager'),
      dataAttributes: {
        'data-mg-pager': 'Marks the container to hydrate (required).',
        'data-page': 'Current page, 1-based (default 1).',
        'data-total-pages':
          'Total pages. Omit it for the mini-pager, which shows previous, the current page number and next.',
        'data-layout': '"centered" (default) or "bar".',
        'data-show-jump-to': '"true" to render the jump-to-page field.',
        'data-aria-label':
          'Accessible name of the pager nav (default "Pagination").',
        'data-range-label':
          'Template for the result range line, with {start} and {end} placeholders, e.g. "Showing {start}-{end} of 200". Bar layout only, and inert on its own: the line renders only when a range prop is also supplied, and no data attribute sets one — pass range from a consumer wrapper.',
        'data-jump-to-label': 'Label for the jump-to-page field.',
        'data-jump-to-action': 'Label for the jump-to-page submit button.',
        'data-prev-label': 'Visible "Previous" text.',
        'data-next-label': 'Visible "Next" text.',
        'data-go-prev-label': 'Accessible name of the previous control.',
        'data-go-next-label': 'Accessible name of the next control.',
        'data-page-label': 'Accessible name pattern for a page link.',
        'data-current-page-label':
          'Accessible name pattern for the current page.',
        'data-page-of-label': 'Pattern for the "page X of Y" text.',
      },
      events: [],
      example: hydrationExample({
        name: 'Pager',
        selector: '[data-mg-pager]',
        markup: `<div data-mg-pager
  data-page="3"
  data-total-pages="20"
  data-layout="bar"
  data-show-jump-to="true"
  data-aria-label="Pagination"></div>`,
      }),
    },
  },
  'components-navigation-drawer': {
    description:
      'Prototype. Slide-over off-canvas drawer and floating panel for secondary navigation, filters, or details. Modal dialog with focus management, backdrop and Escape dismissal; string content renders as text. Hydration via createHydrator with data-mg-drawer (container needs an id) and data-mg-drawer-trigger buttons; server-rendered body markup is sanitised.',
    cssClasses: [
      'mg-drawer',
      'mg-drawer--start',
      'mg-drawer--end',
      'mg-drawer--bottom',
      'is-open',
      'mg-drawer__backdrop',
      'mg-drawer__header',
      'mg-drawer__title',
      'mg-drawer__close',
      'mg-drawer__body',
      'mg-drawer__footer',
      'mg-floating-panel',
      'mg-floating-panel__header',
      'mg-floating-panel__title',
      'mg-floating-panel__close',
      'mg-floating-panel__body',
    ],
    hydration: {
      note: 'renderedHtml is a drawer that cannot open or close: nothing opens it, Escape does nothing and focus is not managed. Give the container an id, point one or more data-mg-drawer-trigger buttons at that id, and hydrate. The default export of components/Drawer.js is HydratedDrawer, which owns the open state; the named Drawer export is the controlled component. Body and footer markup inside .mg-drawer__body / .mg-drawer__footer is passed as bodyHtml / footerHtml and sanitised with DOMPurify; the title is read as text.',
      selector: '[data-mg-drawer]',
      modules: hydrationModules('Drawer'),
      dataAttributes: {
        id: 'Required, so data-mg-drawer-trigger buttons can find the drawer.',
        'data-mg-drawer': 'Marks the container to hydrate (required).',
        'data-position':
          '"start" (default), "end" or "bottom". start and end follow text direction and swap in RTL.',
        'data-title':
          'Header title text. Falls back to the text of a child .mg-drawer__title (or .mg-floating-panel__title).',
        'data-backdrop':
          '"false" to drop the backdrop. With a backdrop the drawer is a modal dialog with a focus trap.',
        'data-is-floating-panel':
          '"true" for a non-modal floating panel. The mg-floating-panel class on the container has the same effect.',
        'data-is-open':
          '"true" to start open. The is-open class on the container has the same effect.',
        'data-close-label': 'Translated close button label (default "Close").',
        'data-class-name': 'Extra class on the drawer.',
        'data-mg-drawer-trigger':
          'On a button elsewhere in the page: its value is the drawer container id. Clicking toggles the drawer, and the button gets aria-expanded and aria-controls.',
        '.mg-drawer__body':
          'Optional server-rendered body markup, sanitised on mount. The whole container innerHTML is used as the body only when there is no .mg-drawer__body, no .mg-drawer__title and no .mg-drawer__footer; with any one of those present, content outside .mg-drawer__body is dropped. Floating panels read .mg-floating-panel__body instead.',
        '.mg-drawer__footer':
          'Optional server-rendered footer markup, sanitised on mount. Floating panels read .mg-floating-panel__footer instead.',
      },
      events: [
        {
          name: 'mg-drawer:open',
          target: 'The data-mg-drawer container',
          bubbles: false,
          when: 'Dispatch it yourself to open the drawer from script.',
        },
        {
          name: 'mg-drawer:close',
          target: 'The data-mg-drawer container',
          bubbles: false,
          when: 'Dispatch it yourself to close the drawer from script.',
        },
        {
          name: 'mg-drawer:toggle',
          target: 'The data-mg-drawer container',
          bubbles: false,
          when: 'Dispatch it yourself to toggle the drawer from script.',
        },
      ],
      example: hydrationExample({
        name: 'Drawer',
        selector: '[data-mg-drawer]',
        markup: `<button type="button" data-mg-drawer-trigger="filters" class="mg-button mg-button-primary">
  Filter publications
</button>

<div id="filters"
  data-mg-drawer
  data-position="start"
  data-title="Filter publications"
  data-backdrop="true"
  data-is-open="false"
  data-close-label="Close">
  <div class="mg-drawer__body">
    <p>Narrow the publications list by hazard, region and year.</p>
  </div>
  <div class="mg-drawer__footer">
    <button type="button" class="mg-button mg-button-primary">Show 128 results</button>
  </div>
</div>`,
        extra: `

  // Open or close it from your own code:
  // document.getElementById('filters').dispatchEvent(new CustomEvent('mg-drawer:open'));`,
      }),
    },
  },
  'components-navigation-tree': {
    description:
      'Prototype. Accessible tree and nested hierarchy view conforming to the ARIA Treeview pattern. Supports roving tabindex, full keyboard navigation (arrows, Home, End, Enter, Space), guides, controlled/uncontrolled state, a configurable toggle icon (toggleIcon), and separate toggle buttons for linked parent sections. Requires React or hydration via createHydrator with data-mg-tree around a nested list; see the hydration field.',
    cssClasses: [
      'mg-tree',
      'mg-tree__group',
      'mg-tree--guides',
      'mg-tree__item',
      'mg-tree__item--selected',
      'mg-tree__label-container',
      'mg-tree__toggle',
      'mg-tree__icon',
      'is-expanded',
      'mg-tree__label',
    ],
    hydration: {
      note: 'renderedHtml has the tree roles but no keyboard support or expand/collapse. Render a plain nested <ul>/<li> list of links inside a data-mg-tree container and hydrate it; before JavaScript runs, the list still works as ordinary links. Theme classes (mg-theme-*) need the brand stylesheet or style-all.css.',
      selector: '[data-mg-tree]',
      modules: {
        hydrate:
          'https://assets.undrr.org/mangrove/{{version}}/components/hydrate.js',
        component:
          'https://assets.undrr.org/mangrove/{{version}}/components/Tree.js',
      },
      dataAttributes: {
        'data-mg-tree': 'Marks the container to hydrate (required).',
        'data-aria-label':
          'Accessible name for the tree. Set this or data-aria-labelledby.',
        'data-aria-labelledby': 'id of a visible heading that names the tree.',
        'data-toggle-icon':
          'Icon class for the expand toggles (default mg-icon-right).',
        'data-guides': 'Show indentation guides, "true" (default) or "false".',
        'data-selected-id':
          'Selected item id, used when no item is marked selected.',
        'data-class-name': 'Extra class on the tree.',
        'li data-id':
          'Item id. Must be unique in the tree; a repeated id gets a numeric suffix. Falls back to the li id, then its position (1-2).',
        'li > a[href]':
          'Link item, direct child or wrapped once (li > span > a). Its text is the label, or its aria-label or image alt if it has no text. javascript:, data: and vbscript: URLs are dropped.',
        'li data-expanded / aria-expanded="true"':
          'Starts expanded (items with children only).',
        'li data-selected / a[aria-current]':
          'Starts selected and its parent items start expanded. The first match wins. aria-current is kept on the rendered link.',
      },
      events: [],
      example: hydrationExample({
        name: 'Tree',
        selector: '[data-mg-tree]',
        markup: `<div data-mg-tree data-aria-label="Section navigation">
  <ul>
    <li data-id="about">
      <a href="/about">About</a>
      <ul>
        <li data-id="team"><a href="/about/team" aria-current="page">Team</a></li>
        <li data-id="history"><a href="/about/history">History</a></li>
      </ul>
    </li>
    <li data-id="topics">
      Topics
      <ul>
        <li data-id="floods"><a href="/topics/floods">Floods</a></li>
      </ul>
    </li>
  </ul>
</div>`,
      }),
    },
  },
};

export default COMPONENT_DATA;
