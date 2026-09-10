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
  'components-megamenu':
    'MegaMenu manages complex open/close state and keyboard navigation. Below 900px it provides bounded progressive navigation (minimum 400px where space permits, maximum min(700px, 90dvh)) with Back above the title, a separate Close control and outside-click dismissal, nested groups, section headings linked to their landing pages and immediately visible authored banner content. Existing sections and hydration attributes remain supported; additional optional labels are menuLabel, backLabel, allSectionsLabel, closeLabel, overviewLabel and toggleMobileNavLabel. Requires React. Can be hydrated via createHydrator. Adds mg-mega-wrapper--js-active on mount so pointer-events restrictions only apply when the sidebar is available; plain HTML nav markup and failed-hydration states remain fully clickable on mobile.',
  'components-gallery':
    'Gallery provides a lightbox image viewer. Requires React for modal state and keyboard navigation. Can be hydrated via createHydrator.',
  'components-pager':
    'Pager manages pagination state. Requires React. Import via npm. Supports translated labels via props: prevLabel, nextLabel, goPrevLabel, goNextLabel, pageLabel, currentPageLabel, pageOfLabel (all string or function). Can be hydrated via createHydrator using data-prev-label, data-next-label, etc. attributes.',
  'components-cookieconsentbanner':
    'CookieConsentBanner manages consent state and cookie storage. Requires React.',
  'components-snackbar':
    'Snackbar manages auto-dismiss timing and state. Requires React.',
  'components-scrollcontainer':
    'ScrollContainer manages horizontal scroll state with navigation buttons. Requires React. Can be hydrated via createHydrator.',
  'components-user-feedback':
    'UserFeedback manages a binary page response, confirmation state and focus. Requires React for button behavior and can be hydrated via createHydrator with data-mg-user-feedback. Place it as a separate sibling immediately before Footer when the pattern is used.',
  'components-buttons-sharebuttons':
    'ShareButtons manages share URLs and clipboard state. Requires React. Can be hydrated via createHydrator with data-mg-share-buttons.',
  'components-table-of-contents':
    'TableOfContents inspects the DOM for heading elements and manages scroll-spy state. React component available, or use the vanilla JS at js/table-of-contents.js with data-mg-table-of-contents.',
  'components-buttons-sharebuttons-translations':
    'ShareButtons translation label sets for ES, FR, JA, ZH, AR, RU. Pass via the labels prop.',
  'components-gallery-translations':
    'Gallery translation label sets for ES, FR, JA, ZH, AR, RU. Pass galleryAriaLabel, prevLabel, nextLabel, loadingLabel props.',
  'components-megamenu-translations':
    'MegaMenu translation label sets for ES, FR, JA, ZH, AR, RU. Pass navLabel, closeMobileNavLabel props.',
  'components-snackbar-translations':
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
// Curated component data (descriptions, HTML examples, flags)
// ---------------------------------------------------------------------------

export default {
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
      'Responsive CSS grid system. 1-12 column layouts with column and row spanning, plus a single-row auto-fit fallback. Flexbox fallback for older browsers.',
    cssClasses: [
      'mg-grid',
      'mg-grid--auto-fit',
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
  },

  // --- Status and empty states ---
  'components-status-label': {
    name: 'Status label',
    description:
      'Status of a record or event, as a coloured indicator dot plus the status name in text. Variants: draft, waiting-validation, waiting-information, published, plus a neutral default with no modifier. The dot is decorative: the status name is always present as text, so meaning never depends on colour. Wrap several in mg-status-label-group.',
    cssClasses: [
      'mg-status-label',
      'mg-status-label__indicator',
      'mg-status-label--draft',
      'mg-status-label--waiting-validation',
      'mg-status-label--waiting-information',
      'mg-status-label--published',
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
        name: 'Neutral status (no modifier)',
        html: '<span class="mg-status-label">\n  <span class="mg-status-label__indicator"></span>\n  Archived\n</span>',
      },
    ],
  },
  'components-empty-state': {
    name: 'Empty state',
    description:
      'Message shown where a collection, table or panel has no content. Optional media slot for a glyph, a title, a description and an optional actions slot. Variants: panel, compact, start-aligned. Inside a table, place it in a single td with colspan so the row structure and column headers survive for screen readers.',
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
  'components-on-this-page-nav': {
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
      'Tabbed content with centred, softly filled horizontal tabs that scroll at every viewport width, or explicit stacked disclosures. Opt into disclosures below 480px with stackOnMobile (React) or the presence-based data-mg-js-tabs-stack-on-mobile attribute (HTML); horizontal scrolling remains the default. Only the horizontal rail scrolls; panels sit outside the tablist. Requires tabs.js as an ES module for ARIA semantics, keyboard navigation, selection and overflow indicators. Without JavaScript, panel content remains visible. Set labels.tabListLabel (React) or data-mg-js-tabs-label (HTML) to name the tablist. Existing interleaved HTML is enhanced at runtime. Use mgTabsDestroy(scope) before removing dynamically initialised markup.',
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
      'Styled checkbox with label. Error and disabled states available.',
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
    description:
      'Error page templates (404, 500, etc.) with heading, message, and return link.',
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
      'Reading column for a long page: constrains the article to a readable measure, and with mg-reading--with-contents places a table of contents in a sticky sidebar from 48rem up, stacking it above the article below that.',
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
            <span class="mg-icon mg-icon-user" aria-hidden="true"></span>
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
};
