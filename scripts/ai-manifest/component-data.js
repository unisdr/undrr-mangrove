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
  'components-charts-barchart': 'BarChart uses D3 for rendering. It requires React and the D3 library. Import via npm: import { BarChart } from "@undrr/undrr-mangrove".',
  'components-charts-connectedscatterplot': 'ConnectedScatterPlot uses D3 for rendering. Requires React and D3. Import via npm.',
  'components-charts-histogram': 'Histogram uses D3 for rendering. Requires React and D3. Import via npm.',
  'components-charts-indexchart': 'IndexChart uses D3 for rendering. Requires React and D3. Import via npm.',
  'components-maps-mapcomponent': 'MapComponent uses Leaflet for interactive maps. Requires React and Leaflet. Import via npm.',
  'components-syndicationsearchwidget': 'SyndicationSearchWidget is a complex search interface querying an Elasticsearch API. Requires React 19. Can be hydrated on a vanilla HTML page using the createHydrator pattern with data-mg-search-widget attributes. See the hydration documentation.',
  'components-megamenu': 'MegaMenu manages complex open/close state and keyboard navigation. Requires React. Can be hydrated via createHydrator. Adds mg-mega-wrapper--js-active on mount so pointer-events restrictions only apply when the sidebar is available; plain HTML nav markup and failed-hydration states remain fully clickable on mobile.',
  'components-fetcher': 'Fetcher is a generic data-fetching wrapper component. Requires React for state management.',
  'components-gallery': 'Gallery provides a lightbox image viewer. Requires React for modal state and keyboard navigation. Can be hydrated via createHydrator.',
  'components-pager': 'Pager manages pagination state. Requires React. Import via npm.',
  'components-cookieconsentbanner': 'CookieConsentBanner manages consent state and cookie storage. Requires React.',
  'components-snackbar': 'Snackbar manages auto-dismiss timing and state. Requires React.',
  'components-scrollcontainer': 'ScrollContainer manages horizontal scroll state with navigation buttons. Requires React. Can be hydrated via createHydrator.',
  'components-buttons-sharebuttons': 'ShareButtons manages share URLs and clipboard state. Requires React. Can be hydrated via createHydrator with data-mg-share-buttons.',
  'components-table-of-contents': 'TableOfContents inspects the DOM for heading elements and manages scroll-spy state. React component available, or use the vanilla JS at js/table-of-contents.js with data-mg-table-of-contents.',
};

// ---------------------------------------------------------------------------
// Curated component data (descriptions, HTML examples, flags)
// ---------------------------------------------------------------------------

export default {
  // --- Layout ---
  'design-decisions-container': {
    description: 'Centered responsive container with breakpoint-driven max-widths (480/900/1164/1440px). Variants for padding and vertical spacing.',
    cssClasses: [
      'mg-container', 'mg-container--slim', 'mg-container--padded', 'mg-container--spacer',
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
    description: 'Responsive CSS grid system. 1-6 column layouts with column and row spanning. Flexbox fallback for older browsers.',
    cssClasses: [
      'mg-grid', 'mg-grid__col-1', 'mg-grid__col-2', 'mg-grid__col-3',
      'mg-grid__col-4', 'mg-grid__col-5', 'mg-grid__col-6',
      'mg-grid__col--span-2', 'mg-grid__col--span-3', 'mg-grid__col--span-all',
      'mg-grid__row--span-2', 'mg-grid__row--span-all',
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
  'components-buttons-buttons': { description: 'Primary and secondary CTA buttons with disabled variant. Themed via design tokens. WCAG AA contrast on both light and dark backgrounds.' },
  'components-buttons-chips': { description: 'Small interactive tag-like buttons for filters and selections. Optional dismiss (X) variant.' },

  // --- Cards ---
  'components-cards-vertical-card': {
    description: 'Card with stacked image, labels, title, summary, and optional CTA button. Four color variants.',
    cssClasses: [
      'mg-card', 'mg-card__vc', 'mg-card--secondary', 'mg-card--tertiary', 'mg-card--quaternary',
      'mg-card__visual', 'mg-card__image', 'mg-card__content', 'mg-card__meta',
      'mg-card__label', 'mg-card__label--active', 'mg-card__title', 'mg-card__summary',
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
    description: 'Side-by-side card with image left and content right. Labels, title, summary, and CTA button.',
    cssClasses: [
      'mg-card', 'mg-card__hc', 'mg-card--secondary', 'mg-card__visual', 'mg-card__image',
      'mg-card__content', 'mg-card__meta', 'mg-card__label', 'mg-card__label--active',
      'mg-card__title', 'mg-card__summary',
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

  'components-cards-icon-card': { description: 'Card with icon or image, title, summary, and optional CTA. Variants: default, centered, negative (dark background). Image scale options: small, medium, large, full. Supports custom icon background/foreground colors (iconColor, iconFgColor), border color, and label position (top or content area).' },
  'components-cards-book-card': { description: 'Minimal card for publications: cover image and title only.' },

  'components-cards-horizontal-book-card': {
    description: 'Horizontal card for publications: cover image left, title and summary right.',
    cssClasses: [
      'mg-card', 'mg-card__hc', 'mg-card-book__hc', 'mg-card__visual', 'mg-card__image',
      'mg-card__content', 'mg-card__meta', 'mg-card__label', 'mg-card__title', 'mg-card__summary',
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

  'components-cards-stats-card': { description: 'Grid of numeric statistics with optional icons, labels, and descriptions. Variants: default, compact, highlighted, negative.' },

  // --- Tags ---
  'components-tag': {
    description: 'Small label for categorization. Variants: default, secondary, outline, accent. Can be span or link.',
    cssClasses: ['mg-tag', 'mg-tag--secondary', 'mg-tag--outline', 'mg-tag--accent', 'mg-tag-container'],
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
    description: 'Base typography styles applied to standard HTML heading and body elements. No extra classes needed.',
    cssClasses: [],
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
    ],
  },

  'components-typography-links': {
    description: 'Link styles applied to standard anchor elements. Underlined by default with interactive color.',
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
    description: 'Styled HTML table with size (small), variant (striped/border), and responsive (stacked/scroll) options.',
    cssClasses: ['mg-table', 'mg-table--small', 'mg-table--striped', 'mg-table--border', 'mg-table--stacked', 'mg-table--scroll'],
    examples: [
      {
        name: 'Default table',
        html: `<table class="mg-table">
  <thead>
    <tr>
      <th scope="col">Country</th>
      <th scope="col">Hazard type</th>
      <th scope="col">People affected</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Nepal</td>
      <td>Earthquake</td>
      <td>2.8 million</td>
    </tr>
    <tr>
      <td>Philippines</td>
      <td>Typhoon</td>
      <td>4.1 million</td>
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

  // --- On this page nav ---
  'components-on-this-page-nav': {
    description: 'Sticky horizontal "On this page" navigation bar with IntersectionObserver scroll-spy. Two modes: auto-detect (scans h2/h3/h4 headings) or explicit (author-provided links). Optional CTA button. Vanilla JS — requires on-this-page-nav.js.',
    cssClasses: [
      'mg-on-this-page-nav', 'mg-on-this-page-nav--hidden',
      'mg-on-this-page-nav--has-left-overflow',
      'mg-on-this-page-nav__list', 'mg-on-this-page-nav__item',
      'mg-on-this-page-nav__link', 'mg-on-this-page-nav__link--active',
      'mg-on-this-page-nav__cta', 'mg-on-this-page-nav--exclude',
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
  'components-tabs': { description: 'Tabbed content with stacked or horizontal variants. Requires tabs.js vanilla JS for interactivity. The script adds ARIA roles (tablist, tab, tabpanel) and keyboard navigation at runtime — do not omit the script or tabs will be inaccessible.' },

  // --- Highlight box (auto-rendered) ---
  'components-highlightbox': { description: 'Highlighted content box. Tones: default, primary, secondary. Layouts: centered, float-start, float-end. Supports embedded video.' },

  // --- Quote highlight (auto-rendered) ---
  'components-quotehighlight': { description: 'Testimonial or pull quote with attribution, portrait, and optional large image. Background: light, dark, bright. Variants: line separator or image. Alignment: full, left, right.' },

  // --- Hero ---
  'components-hero-hero': {
    description: 'Full-width hero banner with title, summary, and CTA buttons. Four color variants. Two layouts: `background` (full-bleed image with overlay, default) and `split` (solid theme-colour background with a content column plus a media column). Split layout supports 2/3, 1/2, and 1/3 content-to-media ratios, a configurable heading level (h1–h3), and three media types: `image` (default), `video` (iframe embed — provide the provider embed URL and a `title` for accessibility), or `html` (pre-sanitized HTML string for custom embeds; consumer must sanitize).',
    cssClasses: [
      'mg-hero', 'mg-hero--secondary', 'mg-hero--tertiary', 'mg-hero--quaternary',
      'mg-hero--split', 'mg-hero--split-2-3', 'mg-hero--split-1-2', 'mg-hero--split-1-3',
      'mg-hero__overlay', 'mg-hero__split-grid', 'mg-hero__content',
      'mg-hero__meta', 'mg-hero__label', 'mg-hero__title', 'mg-hero__summaryText', 'mg-hero__buttons',
      'mg-hero__media', 'mg-hero__media--video', 'mg-hero__media--html',
      'mg-hero__media-img', 'mg-hero__media-iframe',
    ],
  },

  'components-hero-hero-child': {
    description: 'DEPRECATED — planned for removal by end of 2026. Never adopted in production across UNDRR sites; do not use in new work. Migrate to the main Hero component (`headingLevel="h2"`/`"h3"` or `layout="split"`), which covers the same use cases. Kept available for reference only. Smaller hero banner for child/section pages. Single CTA button, linked label.',
    deprecated: true,
    deprecationNotice: 'Planned for removal by end of 2026. Migrate to `components-hero-hero`.',
    cssClasses: [
      'mg-hero', 'mg-hero--child', 'mg-hero__overlay', 'mg-hero__content',
      'mg-hero__meta', 'mg-hero__label', 'mg-hero__title', 'mg-hero__summaryText', 'mg-hero__buttons',
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

  // --- Footer (auto-rendered + embed) ---
  'components-footer': {
    description: 'Site footer with optional UNDRR syndication. Loads global footer content from PreventionWeb via a widget script. Works with or without React.',
    doNotModify: 'The Footer structure is a UNDRR branding requirement. Use the documented markup exactly as shown. Do not simplify, reorganize, or omit elements.',
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
        includecss: 'Whether to include PreventionWeb default styles (set false when using Mangrove CSS)',
        suffixID: 'Unique suffix for the widget container class (creates pw-widget-{suffixID})',
        activedomain: 'Domain for absolute URLs in syndicated content',
      },
    },
  },

  // --- Page header (auto-rendered) ---
  'components-pageheader': {
    description: 'UNDRR page header with colored decoration stripe, logo, user account link, and language selector dropdown.',
    doNotModify: 'The PageHeader structure (decoration stripe, toolbar wrapper, logo section) is a UNDRR branding requirement. Use the documented markup exactly as shown. The four empty divs inside mg-page-header__decoration are intentional — they render the colored stripe segments.',
  },

  // --- Navigation (auto-rendered) ---
  'components-navigation-breadcrumbs': { description: 'Breadcrumb navigation trail. White variant available for dark backgrounds.' },
  'components-navigation-pagination': { description: 'Page navigation with previous/next links and page number display. Uses legacy class names without the mg- prefix.' },

  // --- Forms (auto-rendered) ---
  'components-forms-text-input': { description: 'Text input field with label, help text, required indicator, and error state.' },
  'components-forms-select': { description: 'Dropdown select field with label, placeholder, help text, and error state.' },
  'components-forms-checkbox': { description: 'Styled checkbox with label. Error and disabled states available.' },
  'components-forms-radio': { description: 'Styled radio button with label. Error and disabled states available.' },
  'components-forms-textarea': { description: 'Multi-line text input with label, help text, and error state.' },
  'components-forms-formgroup': { description: 'Fieldset wrapper for grouping related form controls with a legend. Error and disabled states.' },
  'components-forms-formerrorsummary': { description: 'Error summary box listing all form validation errors with anchor links to each field.' },

  // --- CTA ---
  'components-cta': {
    description: 'Call-to-action banner with heading, rich text body, action buttons, and optional image. Four color variants (primary, secondary, tertiary, quaternary) plus custom backgroundColor override. Supports centered and side-by-side (with image) layouts.',
    cssClasses: [
      'mg-cta', 'mg-cta--primary', 'mg-cta--secondary', 'mg-cta--tertiary', 'mg-cta--quaternary',
      'mg-cta--centered', 'mg-cta--with-image',
      'mg-cta__inner', 'mg-cta__body', 'mg-cta__headline', 'mg-cta__text', 'mg-cta__actions', 'mg-cta__image',
    ],
  },

  // --- Images ---
  'components-images-author-image': {
    description: 'Circular author portrait with optional hover color accent (yellow, green, red, blue) and size variant.',
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
    description: 'Logo images for UNDRR, PreventionWeb, IRP, and partner organizations.',
    cssClasses: [],
    examples: [
      {
        name: 'Logo',
        html: `<img src="https://assets.undrr.org/static/logos/undrr/undrr-logo-blue.svg" alt="UNDRR" />`,
      },
    ],
  },

  // --- Icons ---
  'components-icons': {
    description: 'Mangrove icon font. Use span elements with mg-icon and mg-icon-{name} classes.',
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
  'components-embedcontainer': { description: 'Responsive aspect-ratio wrapper for iframes and embeds. Default 16:9 with 4:3, 1:1, and 21:9 variants.' },
  'components-fullwidth': { description: 'Makes content break out of its container to span the full viewport width. RTL-safe.' },
  'components-loader': { description: 'Animated loading spinner. 40px on mobile, 96px on desktop.' },

  'components-showmore': {
    description: 'Collapse long content behind a gradient fade with a toggle button. Height customizable via CSS variable.',
    cssClasses: ['mg-show-more--collapsed', 'mg-show-more--button'],
    examples: [
      {
        name: 'Show more / collapse pattern',
        html: `<div class="mg-show-more--collapsed" data-mg-show-more id="extra-content" style="--mg-show-more-height: 150px;">
  <p>This is long content that will be collapsed behind a gradient fade. Only the first 150px is visible initially.</p>
  <p>Additional content hidden until the user clicks the button.</p>
  <p>More content here...</p>
</div>
<button class="mg-show-more--button" data-mg-show-more-toggle aria-expanded="false" aria-controls="extra-content">Show more</button>`,
      },
    ],
  },

  'components-error-pages': {
    description: 'Error page templates (404, 500, etc.) with heading, message, and return link.',
    cssClasses: [],
    examples: [
      {
        name: '404 error page',
        html: `<div class="mg-container mg-container--padded" style="text-align: center;">
  <h1>404</h1>
  <p>Page not found. The page you requested could not be located.</p>
  <a class="mg-button mg-button-primary" href="/">Return to homepage</a>
</div>`,
      },
    ],
  },

  // --- CSS utilities and documentation pages ---
  'components-font-size-utilities': {
    description: 'Font size utility classes (mg-font-size-*) for overriding typography scale.',
  },
  'components-normalize': {
    description: 'CSS normalize/reset layer applied globally before component styles.',
  },
  'components-typography-typography-integration-example': {
    description: 'Integration example showing Mangrove typography classes in a page context.',
  },
  'components-utility-css': {
    description: 'CSS utility class reference (spacing, visibility, text alignment, floats).',
  },

  // --- Page templates ---
  'example-page-template-example': {
    description: 'Complete page templates showing how to compose Mangrove components into working UNDRR-branded pages with all required scripts and assets.',
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
  <link rel="stylesheet" href="https://assets.undrr.org/static/mangrove/{{version}}/css/style.css" />
  <!-- Cookie consent CSS (required if using cookie banner) -->
  <link rel="stylesheet" href="https://assets.undrr.org/static/cookie-banner/v1/cookieconsent.css" />
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
              <img class="mg-page-header__logo-img" src="https://assets.undrr.org/static/logos/undrr/undrr-logo-horizontal.svg" alt="UNDRR" width="324" height="47" />
            </a>
          </div>
          <a title="My account" href="/user">
            <i class="mg-icon mg-icon-user" aria-hidden="true"></i>
            <span class="mg-page-header__label">My account</span>
          </a>
          <div class="mg-page-header__block mg-page-header__block--language">
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
  <script src="https://assets.undrr.org/static/analytics/v1.0.0/google_analytics_enhancements.js" defer></script>
  <!-- UNDRR critical messaging -->
  <script src="https://messaging.undrr.org/src/undrr-messaging.js" defer></script>
  <!-- Cookie consent JS (UMD) -->
  <script src="https://assets.undrr.org/static/cookie-banner/v1/cookieconsent.umd.js"></script>
  <!-- Cookie consent UNDRR config -->
  <script src="https://assets.undrr.org/static/cookie-banner/v1/cookieconsent-undrr.js"></script>
</body>
</html>`,
      },
      {
        name: 'Listing page (card grid with pagination)',
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

  <!-- Pagination (legacy class names without mg- prefix) -->
  <nav class="pagination" aria-label="Pagination">
    <ul>
      <li><span class="pagination__disabled" aria-disabled="true">Previous</span></li>
      <li><a href="?page=1" aria-current="page" aria-label="Page 1">1</a></li>
      <li><a href="?page=2" aria-label="Page 2">2</a></li>
      <li><a href="?page=3" aria-label="Page 3">3</a></li>
      <li><a href="?page=2" aria-label="Next page">Next</a></li>
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
};
