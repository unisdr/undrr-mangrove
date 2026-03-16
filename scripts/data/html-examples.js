/**
 * html-examples.js
 *
 * Curated rendered HTML examples for each Mangrove component, keyed by
 * Storybook component ID. Used by generate-ai-manifest.js to add
 * renderedHtml fields to per-component JSON files.
 *
 * Maintenance: update examples here when a component's markup changes.
 * The manifest script warns if a key here does not match any component ID
 * in the Storybook manifest.
 *
 * Each entry can have:
 *   vanillaHtml     {boolean}  true if the component works as static HTML/CSS
 *   requiresReact   {boolean}  true if the component needs React to function
 *   reactNote       {string}   why React is required
 *   description     {string}   fallback description when Storybook manifest has none
 *   examples        {Array<{name: string, html: string}>}  rendered HTML snippets
 *   cssClasses      {string[]} BEM classes the component uses
 *   vanillaHtmlEmbed {object}  embed instructions (for syndication components)
 */

export default {
  // ===================================================================
  // LAYOUT PRIMITIVES
  // ===================================================================

  'design-decisions-container': {
    vanillaHtml: true,
    description: 'Centered responsive container with breakpoint-driven max-widths (480/900/1164/1440px). Variants for padding and vertical spacing.',
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
  <section>
    <h2>First section</h2>
    <p>The spacer modifier adds consistent vertical gaps between children.</p>
  </section>
  <section>
    <h2>Second section</h2>
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
    vanillaHtml: true,
    description: 'Responsive CSS grid system. 1-6 column layouts with column and row spanning. Flexbox fallback for older browsers.',
    cssClasses: [
      'mg-grid',
      'mg-grid__col-1',
      'mg-grid__col-2',
      'mg-grid__col-3',
      'mg-grid__col-4',
      'mg-grid__col-5',
      'mg-grid__col-6',
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

  // ===================================================================
  // CARDS
  // ===================================================================

  'components-cards-vertical-card': {
    vanillaHtml: true,
    description: 'Card with stacked image, labels, title, summary, and optional CTA button. Four color variants.',
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
    <img src="https://picsum.photos/600/400" alt="" class="mg-card__image" />
  </div>
  <div class="mg-card__content">
    <header class="mg-card__title">
      <a href="/reports/gar-2024">Global Assessment Report 2024</a>
    </header>
    <p class="mg-card__summary">The flagship report on global efforts to reduce disaster risk.</p>
    <a class="mg-button mg-button-primary mg-button-arrow" role="button" href="/reports/gar-2024">Read the report</a>
  </div>
</article>`,
      },
      {
        name: 'Three vertical cards in a grid',
        html: `<div class="mg-grid mg-grid__col-3">
  <article class="mg-card mg-card__vc">
    <div class="mg-card__visual">
      <img src="https://picsum.photos/600/400?1" alt="" class="mg-card__image" />
    </div>
    <div class="mg-card__content">
      <header class="mg-card__title"><a href="#">Card one</a></header>
      <p class="mg-card__summary">Summary text for the first card.</p>
    </div>
  </article>
  <article class="mg-card mg-card__vc">
    <div class="mg-card__visual">
      <img src="https://picsum.photos/600/400?2" alt="" class="mg-card__image" />
    </div>
    <div class="mg-card__content">
      <header class="mg-card__title"><a href="#">Card two</a></header>
      <p class="mg-card__summary">Summary text for the second card.</p>
    </div>
  </article>
  <article class="mg-card mg-card__vc">
    <div class="mg-card__visual">
      <img src="https://picsum.photos/600/400?3" alt="" class="mg-card__image" />
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
    vanillaHtml: true,
    description: 'Side-by-side card with image left and content right. Labels, title, summary, and CTA button.',
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
    vanillaHtml: true,
    cssClasses: [
      'mg-card',
      'mg-card__icon',
      'mg-card__icon--centered',
      'mg-card__icon--negative',
      'mg-card__visual',
      'mg-card__image',
      'mg-card__image--small',
      'mg-card__image--medium',
      'mg-card__image--large',
      'mg-card__image--full',
      'mg-card__icon-wrap',
      'mg-card__content',
      'mg-card__meta',
      'mg-card__label',
      'mg-card__title',
      'mg-card__summary',
      'mg-card__cta',
      'mg-card__link',
    ],
    examples: [
      {
        name: 'Icon card with CSS icon',
        html: `<article class="mg-card mg-card__icon">
  <div class="mg-card__visual">
    <span class="mg-card__icon-wrap mg-card__icon-wrap--medium">
      <span class="mg-icon mg-icon-globe"></span>
    </span>
  </div>
  <div class="mg-card__content">
    <header class="mg-card__title">Global network</header>
    <p class="mg-card__summary">Connect with disaster risk reduction practitioners worldwide.</p>
    <p class="mg-card__link"><a href="/network">Learn more</a></p>
  </div>
</article>`,
      },
      {
        name: 'Centered icon card with image and button',
        html: `<article class="mg-card mg-card__icon mg-card__icon--centered">
  <div class="mg-card__visual">
    <img src="https://www.undrr.org/sites/default/files/inline-images/icon.svg" alt="Recovery" class="mg-card__image mg-card__image--medium" />
  </div>
  <div class="mg-card__content">
    <header class="mg-card__title">Recovery planning</header>
    <p class="mg-card__summary">Access resources and guidance for post-disaster recovery.</p>
    <div class="mg-card__cta">
      <a class="mg-button mg-button-primary mg-button-arrow" role="button" href="/recovery">Get started</a>
    </div>
  </div>
</article>`,
      },
      {
        name: 'Icon cards in a three-column grid',
        html: `<div class="mg-grid mg-grid__col-3">
  <article class="mg-card mg-card__icon mg-card__icon--centered">
    <div class="mg-card__visual">
      <span class="mg-card__icon-wrap mg-card__icon-wrap--medium">
        <span class="mg-icon mg-icon-chart-bar"></span>
      </span>
    </div>
    <div class="mg-card__content">
      <header class="mg-card__title">Analytics</header>
      <p class="mg-card__summary">Data-driven analysis for disaster risk reduction.</p>
    </div>
  </article>
  <article class="mg-card mg-card__icon mg-card__icon--centered">
    <div class="mg-card__visual">
      <span class="mg-card__icon-wrap mg-card__icon-wrap--medium">
        <span class="mg-icon mg-icon-globe"></span>
      </span>
    </div>
    <div class="mg-card__content">
      <header class="mg-card__title">Monitoring</header>
      <p class="mg-card__summary">Continuous tracking of hazardous events and their impacts.</p>
    </div>
  </article>
  <article class="mg-card mg-card__icon mg-card__icon--centered">
    <div class="mg-card__visual">
      <span class="mg-card__icon-wrap mg-card__icon-wrap--medium">
        <span class="mg-icon mg-icon-file-alt"></span>
      </span>
    </div>
    <div class="mg-card__content">
      <header class="mg-card__title">Documentation</header>
      <p class="mg-card__summary">Comprehensive guides and reference materials.</p>
    </div>
  </article>
</div>`,
      },
      {
        name: 'Negative variant (for dark backgrounds)',
        html: `<div class="mg-u-background-color--blue-900" style="padding: 2rem;">
  <article class="mg-card mg-card__icon mg-card__icon--negative">
    <div class="mg-card__visual">
      <span class="mg-card__icon-wrap mg-card__icon-wrap--medium">
        <span class="mg-icon mg-icon-lightbulb"></span>
      </span>
    </div>
    <div class="mg-card__content">
      <header class="mg-card__title">Innovation</header>
      <p class="mg-card__summary">New approaches to building resilient communities.</p>
    </div>
  </article>
</div>`,
      },
    ],
  },

  'components-cards-book-card': {
    vanillaHtml: true,
    description: 'Minimal card for publications: cover image and title only.',
    cssClasses: [
      'mg-card',
      'mg-card__vc',
      'mg-card__book',
      'mg-card__visual',
      'mg-card__image',
      'mg-card__content',
      'mg-card__title',
    ],
    examples: [
      {
        name: 'Book card',
        html: `<article class="mg-card mg-card__vc mg-card__book">
  <div class="mg-card__visual">
    <img src="https://picsum.photos/300/400" alt="Global Assessment Report cover" class="mg-card__image" />
  </div>
  <div class="mg-card__content">
    <header class="mg-card__title">
      <a href="/publications/gar-2024">Global Assessment Report on Disaster Risk Reduction 2024</a>
    </header>
  </div>
</article>`,
      },
    ],
  },

  'components-cards-horizontal-book-card': {
    vanillaHtml: true,
    description: 'Horizontal card for publications: cover image left, title and summary right.',
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
    vanillaHtml: true,
    description: 'Grid of numeric statistics with optional icons, labels, and descriptions. Variants: default, compact, highlighted, negative.',
    cssClasses: [
      'mg-stats-card',
      'mg-stats-card--compact',
      'mg-stats-card--highlighted',
      'mg-stats-card--negative',
      'mg-stats-card-item',
      'mg-stats-card-item--linked',
      'mg-stats-card-item__icon',
      'mg-stats-card-item__label',
      'mg-stats-card-item__value',
      'mg-stats-card-item__bottom-label',
      'mg-stats-card-item__summary',
    ],
    examples: [
      {
        name: 'Stats card with three items',
        html: `<section class="mg-stats-card" aria-label="Disaster statistics">
  <h2>Key figures</h2>
  <div class="mg-grid mg-grid__col-3">
    <article class="mg-card mg-stats-card-item">
      <data class="mg-stats-card-item__value" value="1.23">1.23 million</data>
      <strong class="mg-stats-card-item__bottom-label">People affected</strong>
    </article>
    <article class="mg-card mg-stats-card-item">
      <data class="mg-stats-card-item__value" value="195">195</data>
      <strong class="mg-stats-card-item__bottom-label">Countries reporting</strong>
    </article>
    <article class="mg-card mg-stats-card-item mg-stats-card-item--linked">
      <a href="/data/losses" class="mg-stats-card-item__value">$2.8 trillion</a>
      <strong class="mg-stats-card-item__bottom-label">Economic losses (2000-2024)</strong>
    </article>
  </div>
</section>`,
      },
      {
        name: 'Compact stats card with icons',
        html: `<section class="mg-stats-card mg-stats-card--compact" aria-label="Quick stats">
  <div class="mg-grid mg-grid__col-2">
    <article class="mg-card mg-stats-card-item">
      <span class="mg-stats-card-item__icon" aria-hidden="true">
        <span class="mg-icon mg-icon-globe"></span>
      </span>
      <span class="mg-stats-card-item__label">Regions</span>
      <data class="mg-stats-card-item__value" value="5">5</data>
    </article>
    <article class="mg-card mg-stats-card-item">
      <span class="mg-stats-card-item__icon" aria-hidden="true">
        <span class="mg-icon mg-icon-cubes"></span>
      </span>
      <span class="mg-stats-card-item__label">Partners</span>
      <data class="mg-stats-card-item__value" value="142">142</data>
    </article>
  </div>
</section>`,
      },
    ],
  },

  // ===================================================================
  // BUTTONS
  // ===================================================================

  'components-buttons-buttons': {
    vanillaHtml: true,
    description: 'Primary and secondary CTA buttons. Rendered as anchor elements with role="button". Arrow and disabled variants.',
    cssClasses: [
      'mg-button',
      'mg-button-primary',
      'mg-button-secondary',
      'mg-button-arrow',
      'mg-button-without-arrow',
      'disabled',
    ],
    examples: [
      {
        name: 'Primary button with arrow',
        html: `<a class="mg-button mg-button-primary mg-button-arrow" role="button" href="/take-action">Take action</a>`,
      },
      {
        name: 'Primary button without arrow',
        html: `<a class="mg-button mg-button-primary mg-button-without-arrow" role="button" href="/subscribe">Subscribe</a>`,
      },
      {
        name: 'Secondary button',
        html: `<a class="mg-button mg-button-secondary" role="button" href="/learn-more">Learn more</a>`,
      },
      {
        name: 'Disabled button',
        html: `<a class="mg-button mg-button-primary disabled" role="button" aria-disabled="true">Unavailable</a>`,
      },
    ],
  },

  'components-buttons-chips': {
    vanillaHtml: true,
    description: 'Small interactive tag-like buttons for filters and selections. Optional dismiss (X) variant.',
    cssClasses: ['chip', 'chip__cross'],
    examples: [
      {
        name: 'Default chip',
        html: `<a class="chip" href="/topics/flood" role="button">Flood</a>`,
      },
      {
        name: 'Chip with dismiss',
        html: `<a class="chip chip__cross" href="#" role="button">Active filter</a>`,
      },
    ],
  },

  'components-buttons-cta-link': {
    vanillaHtml: true,
    description: 'Inline call-to-action link with arrow or spacing icon. Can render as anchor or span.',
    cssClasses: ['cta__link', 'cta--arrow', 'cta--space'],
    examples: [
      {
        name: 'CTA link with arrow',
        html: `<a class="cta__link cta--arrow" href="/explore">Explore our resources <i></i></a>`,
      },
      {
        name: 'CTA link with space',
        html: `<a class="cta__link cta--space" href="/resources">View all resources <i></i></a>`,
      },
      {
        name: 'Inline CTA (span)',
        html: `<span class="cta__link cta--arrow">Read more <i></i></span>`,
      },
    ],
  },

  // ===================================================================
  // TAGS
  // ===================================================================

  'atom-tag': {
    vanillaHtml: true,
    description: 'Small label for categorization. Variants: default, secondary, outline, accent. Can be span or link.',
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

  // ===================================================================
  // TYPOGRAPHY AND LINKS
  // ===================================================================

  'components-typography': {
    vanillaHtml: true,
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
    vanillaHtml: true,
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

  // ===================================================================
  // TABLE
  // ===================================================================

  'components-table': {
    vanillaHtml: true,
    description: 'Styled HTML table with size (small/large), variant (striped/bordered), and responsive (stacked/scroll) options.',
    cssClasses: [
      'mg-table',
      'mg-table--small',
      'mg-table--medium',
      'mg-table--large',
      'mg-table--striped',
      'mg-table--bordered',
      'mg-table--scroll',
    ],
    examples: [
      {
        name: 'Default table',
        html: `<table class="mg-table">
  <thead>
    <tr>
      <th>Country</th>
      <th>Hazard type</th>
      <th>People affected</th>
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
      <th>Year</th>
      <th>Events</th>
      <th>Deaths</th>
      <th>Economic losses (USD)</th>
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

  // ===================================================================
  // TABS
  // ===================================================================

  'components-tabs': {
    vanillaHtml: true,
    description: 'Tabbed content with stacked or horizontal variants. Requires tabs.js vanilla JS for interactivity.',
    cssClasses: [
      'mg-tabs',
      'mg-tabs--stacked',
      'mg-tabs--horizontal',
      'mg-tabs__list',
      'mg-tabs__item',
      'mg-tabs__link',
      'mg-tabs-content',
      'mg-tabs__section',
    ],
    examples: [
      {
        name: 'Stacked tabs (requires tabs.js for interactivity)',
        html: `<article class="mg-tabs" data-mg-js-tabs data-mg-js-tabs-variant="stacked">
  <ul class="mg-tabs__list">
    <li class="mg-tabs__item">
      <a class="mg-tabs__link" href="#mg-tabs__section-overview" data-mg-js-tabs-default="true">Overview</a>
    </li>
    <li class="mg-tabs__item">
      <a class="mg-tabs__link" href="#mg-tabs__section-details">Details</a>
    </li>
  </ul>
  <li class="mg-tabs-content" data-mg-js-tabs-content>
    <section class="mg-tabs__section" id="mg-tabs__section-overview">
      <p>Overview content goes here.</p>
    </section>
    <section class="mg-tabs__section" id="mg-tabs__section-details">
      <p>Detailed information goes here.</p>
    </section>
  </li>
</article>`,
      },
    ],
  },

  // ===================================================================
  // CALLOUT / BLOCKQUOTE
  // ===================================================================

  'components-callout': {
    vanillaHtml: true,
    description: 'Styled blockquote with optional color accent (yellow, red, green, blue) and citation.',
    cssClasses: ['blockquote', 'yellow', 'red', 'green', 'blue'],
    examples: [
      {
        name: 'Default blockquote',
        html: `<blockquote>
  Disasters are not natural. They result from the failure to manage risk.
  <cite>UNDRR</cite>
</blockquote>`,
      },
      {
        name: 'Colored blockquote',
        html: `<div class="blockquote blue">
  <blockquote>
    Investing in disaster risk reduction saves lives and livelihoods.
    <cite>Sendai Framework</cite>
  </blockquote>
</div>`,
      },
    ],
  },

  // ===================================================================
  // HIGHLIGHT BOX
  // ===================================================================

  'components-highlightbox': {
    vanillaHtml: true,
    description: 'Highlighted content box. Tones: default, primary, secondary. Layouts: centered, float-start, float-end. Supports embedded video.',
    cssClasses: [
      'mg-highlight-box',
      'mg-highlight-box--primary',
      'mg-highlight-box--secondary',
      'mg-highlight-box--centered',
      'mg-highlight-box--float-start',
      'mg-highlight-box--float-end',
    ],
    examples: [
      {
        name: 'Default highlight box',
        html: `<div class="mg-highlight-box">
  <h3>Key finding</h3>
  <p>Economic losses from disasters have increased by 250% in the last 20 years.</p>
</div>`,
      },
      {
        name: 'Primary centered highlight box',
        html: `<div class="mg-highlight-box mg-highlight-box--primary mg-highlight-box--centered">
  <h3>Did you know?</h3>
  <p>For every $1 invested in disaster risk reduction, up to $15 is saved in post-disaster recovery.</p>
</div>`,
      },
      {
        name: 'Float-start highlight box',
        html: `<div class="mg-highlight-box mg-highlight-box--secondary mg-highlight-box--float-start">
  <h4>Related statistic</h4>
  <p>90% of recorded major disasters caused by weather-related events.</p>
</div>
<p>The surrounding paragraph text will wrap around this floated highlight box. In RTL layouts, float-start floats to the right instead of the left.</p>`,
      },
      {
        name: 'Highlight box with embedded video',
        html: `<div class="mg-highlight-box mg-highlight-box--primary mg-highlight-box--centered">
  <figure>
    <h3>Related video</h3>
    <div class="mg-embed-container">
      <iframe src="https://www.youtube.com/embed/VIDEO_ID" title="Video title" allowfullscreen></iframe>
    </div>
    <figcaption>Video caption text</figcaption>
  </figure>
</div>`,
      },
    ],
  },

  // ===================================================================
  // QUOTE HIGHLIGHT
  // ===================================================================

  'components-quotehighlight': {
    vanillaHtml: true,
    cssClasses: [
      'mg-quote-highlight',
      'mg-quote-highlight--light',
      'mg-quote-highlight--dark',
      'mg-quote-highlight--bright',
      'mg-quote-highlight--line',
      'mg-quote-highlight--image',
      'mg-quote-highlight--full',
      'mg-quote-highlight--left',
      'mg-quote-highlight--right',
      'mg-quote-highlight--has-image',
      'mg-quote-highlight__content',
      'mg-quote-highlight__quote',
      'mg-quote-highlight__separator',
      'mg-quote-highlight__attribution',
      'mg-quote-highlight__attribution-wrapper',
      'mg-quote-highlight__portrait-container',
      'mg-quote-highlight__portrait',
      'mg-quote-highlight__attribution-text',
      'mg-quote-highlight__attribution-name',
      'mg-quote-highlight__attribution-title',
      'mg-quote-highlight__image-container',
      'mg-quote-highlight__image',
    ],
    examples: [
      {
        name: 'Quote with line separator and attribution',
        html: `<section class="mg-quote-highlight mg-quote-highlight--light mg-quote-highlight--line mg-quote-highlight--full">
  <div class="mg-quote-highlight__content">
    <blockquote class="mg-quote-highlight__quote">
      <p>Prevention is not a cost. It is an investment in our common future.</p>
    </blockquote>
    <div class="mg-quote-highlight__separator"></div>
    <div class="mg-quote-highlight__attribution">
      <div class="mg-quote-highlight__attribution-wrapper">
        <div class="mg-quote-highlight__attribution-text">
          <p class="mg-quote-highlight__attribution-name">Mami Mizutori</p>
          <p class="mg-quote-highlight__attribution-title">Special Representative of the Secretary-General for Disaster Risk Reduction</p>
        </div>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        name: 'Quote with portrait image',
        html: `<section class="mg-quote-highlight mg-quote-highlight--light mg-quote-highlight--line mg-quote-highlight--full mg-quote-highlight--has-image">
  <div class="mg-quote-highlight__content">
    <blockquote class="mg-quote-highlight__quote">
      <p>Building resilience requires a whole-of-society approach.</p>
    </blockquote>
    <div class="mg-quote-highlight__separator"></div>
    <div class="mg-quote-highlight__attribution">
      <div class="mg-quote-highlight__attribution-wrapper">
        <div class="mg-quote-highlight__portrait-container">
          <img src="https://picsum.photos/100/100" alt="Speaker portrait" class="mg-quote-highlight__portrait" />
        </div>
        <div class="mg-quote-highlight__attribution-text">
          <p class="mg-quote-highlight__attribution-name">Speaker name</p>
          <p class="mg-quote-highlight__attribution-title">Role, Organization</p>
        </div>
      </div>
    </div>
  </div>
</section>`,
      },
    ],
  },

  // ===================================================================
  // HERO
  // ===================================================================

  'components-hero-hero': {
    vanillaHtml: true,
    description: 'Full-width hero banner with background image, overlay, title, summary, and CTA buttons. Four color variants.',
    cssClasses: [
      'mg-hero',
      'mg-hero--secondary',
      'mg-hero--tertiary',
      'mg-hero--quaternary',
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
        name: 'Default hero',
        html: `<section class="mg-hero" style="background-image: url('https://picsum.photos/1600/600')">
  <div class="mg-hero__overlay">
    <article class="mg-hero__content">
      <div class="mg-hero__meta">
        <span class="mg-hero__label">Featured</span>
      </div>
      <header class="mg-hero__title">
        <h1 class="text-xxl"><span>Reducing disaster risk for a resilient future</span></h1>
      </header>
      <div class="mg-hero__summaryText">
        <span>The Sendai Framework guides global efforts to substantially reduce disaster risk and losses.</span>
      </div>
      <div class="mg-hero__buttons">
        <a class="mg-button mg-button-primary mg-button-arrow" role="button" href="/sendai-framework">Learn more</a>
        <a class="mg-button mg-button-secondary" role="button" href="/get-involved">Get involved</a>
      </div>
    </article>
  </div>
</section>`,
      },
      {
        name: 'Hero with linked title',
        html: `<section class="mg-hero mg-hero--secondary" style="background-image: url('https://picsum.photos/1600/600')">
  <div class="mg-hero__overlay">
    <article class="mg-hero__content">
      <header class="mg-hero__title">
        <a href="/event/global-platform" class="text-xxl"><span>Global Platform for Disaster Risk Reduction 2025</span></a>
      </header>
      <div class="mg-hero__summaryText">
        <span>28 June - 2 July 2025, Geneva, Switzerland</span>
      </div>
      <div class="mg-hero__buttons">
        <a class="mg-button mg-button-primary mg-button-arrow" role="button" href="/register">Register now</a>
      </div>
    </article>
  </div>
</section>`,
      },
    ],
  },

  'components-hero-hero-child': {
    vanillaHtml: true,
    description: 'Smaller hero banner for child/section pages. Single CTA button, linked label.',
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
        html: `<section class="mg-hero mg-hero--child" style="background-image: url('https://picsum.photos/1600/400')">
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
        <a class="mg-button mg-button-primary mg-button-arrow" role="button" href="/early-warning">Read more</a>
      </div>
    </article>
  </div>
</section>`,
      },
    ],
  },

  // ===================================================================
  // FOOTER (with syndication)
  // ===================================================================

  'components-footer': {
    vanillaHtml: true,
    description: 'Site footer with optional UNDRR syndication. Loads global footer content from PreventionWeb via a widget script. Works with or without React.',
    cssClasses: ['mg-footer'],
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
    examples: [
      {
        name: 'Footer with syndicated content',
        html: `<footer class="mg-footer">
  <nav aria-label="Footer navigation">
    <ul>
      <li><a href="/about">About</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>
  <div class="pw-widget-footer"></div>
</footer>`,
      },
    ],
  },

  // ===================================================================
  // PAGE HEADER
  // ===================================================================

  'components-pageheader': {
    vanillaHtml: true,
    description: 'UNDRR page header with colored decoration stripe, logo, user account link, and language selector dropdown.',
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
  <div class="mg-page-header__decoration"></div>
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

  // ===================================================================
  // NAVIGATION
  // ===================================================================

  'components-navigation-breadcrumbs': {
    vanillaHtml: true,
    description: 'Breadcrumb navigation trail. White variant available for dark backgrounds.',
    cssClasses: ['mg-breadcrumb', 'mg-breadcrumb--white'],
    examples: [
      {
        name: 'Breadcrumbs',
        html: `<nav aria-label="breadcrumbs" class="mg-breadcrumb">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/publications">Publications</a></li>
    <li aria-current="page">Global Assessment Report 2024</li>
  </ul>
</nav>`,
      },
    ],
  },

  'components-navigation-pagination': {
    vanillaHtml: true,
    description: 'Page navigation with previous/next links and page number display.',
    cssClasses: ['pagination', 'disabled'],
    examples: [
      {
        name: 'Pagination',
        html: `<nav class="pagination" aria-label="Pagination" role="navigation">
  <ul>
    <li class="disabled" aria-disabled="true"><span>Previous</span></li>
    <li><a href="?page=1" role="button">1</a></li>
    <li><a href="?page=2" role="button">2</a></li>
    <li><a href="?page=3" role="button">3</a></li>
    <li><a href="?page=2" role="button">Next</a></li>
  </ul>
</nav>`,
      },
    ],
  },

  // ===================================================================
  // FORMS
  // ===================================================================

  'components-forms-text-input': {
    vanillaHtml: true,
    description: 'Text input field with label, help text, required indicator, and error state.',
    cssClasses: [
      'mg-form-field',
      'mg-form-label',
      'mg-form-label--required',
      'mg-form-label--disabled',
      'mg-form-input',
      'mg-form-input--error',
      'mg-form-input--disabled',
      'mg-form-help',
      'mg-form-error',
    ],
    examples: [
      {
        name: 'Text input with label and help text',
        html: `<div class="mg-form-field">
  <label class="mg-form-label mg-form-label--required" for="org-name">Organization name</label>
  <input class="mg-form-input" type="text" id="org-name" name="org-name" required />
  <p class="mg-form-help">Enter the full legal name of your organization.</p>
</div>`,
      },
      {
        name: 'Text input with error',
        html: `<div class="mg-form-field">
  <label class="mg-form-label mg-form-label--required" for="email">Email address</label>
  <input class="mg-form-input mg-form-input--error" type="email" id="email" name="email" aria-describedby="email-error" required />
  <p class="mg-form-error" id="email-error" role="alert">Enter a valid email address.</p>
</div>`,
      },
    ],
  },

  'components-forms-select': {
    vanillaHtml: true,
    description: 'Dropdown select field with label, placeholder, help text, and error state.',
    cssClasses: [
      'mg-form-field',
      'mg-form-label',
      'mg-form-select',
      'mg-form-select--error',
      'mg-form-select--disabled',
      'mg-form-help',
      'mg-form-error',
    ],
    examples: [
      {
        name: 'Select input',
        html: `<div class="mg-form-field">
  <label class="mg-form-label" for="country">Country</label>
  <select class="mg-form-select" id="country" name="country">
    <option value="" disabled selected>Select a country</option>
    <option value="JP">Japan</option>
    <option value="NP">Nepal</option>
    <option value="PH">Philippines</option>
  </select>
</div>`,
      },
    ],
  },

  'components-forms-checkbox': {
    vanillaHtml: true,
    description: 'Styled checkbox with label. Error and disabled states available.',
    cssClasses: [
      'mg-form-check',
      'mg-form-check__input',
      'mg-form-check__input--checkbox',
      'mg-form-check__input--error',
      'mg-form-check__input--disabled',
      'mg-form-check__label',
      'mg-form-error',
    ],
    examples: [
      {
        name: 'Checkbox',
        html: `<div class="mg-form-check">
  <input class="mg-form-check__input mg-form-check__input--checkbox" type="checkbox" id="terms" name="terms" />
  <label class="mg-form-check__label" for="terms">I agree to the terms and conditions</label>
</div>`,
      },
    ],
  },

  'components-forms-radio': {
    vanillaHtml: true,
    description: 'Styled radio button with label. Error and disabled states available.',
    cssClasses: [
      'mg-form-check',
      'mg-form-check__input',
      'mg-form-check__input--radio',
      'mg-form-check__label',
      'mg-form-error',
    ],
    examples: [
      {
        name: 'Radio group',
        html: `<div class="mg-form-check">
  <input class="mg-form-check__input mg-form-check__input--radio" type="radio" id="role-gov" name="role" value="government" />
  <label class="mg-form-check__label" for="role-gov">Government</label>
</div>
<div class="mg-form-check">
  <input class="mg-form-check__input mg-form-check__input--radio" type="radio" id="role-ngo" name="role" value="ngo" />
  <label class="mg-form-check__label" for="role-ngo">NGO / Civil society</label>
</div>`,
      },
    ],
  },

  'components-forms-textarea': {
    vanillaHtml: true,
    description: 'Multi-line text input with label, help text, and error state.',
    cssClasses: [
      'mg-form-field',
      'mg-form-label',
      'mg-form-textarea',
      'mg-form-textarea--error',
      'mg-form-textarea--disabled',
      'mg-form-help',
      'mg-form-error',
    ],
    examples: [
      {
        name: 'Textarea',
        html: `<div class="mg-form-field">
  <label class="mg-form-label" for="message">Message</label>
  <textarea class="mg-form-textarea" id="message" name="message" rows="5"></textarea>
  <p class="mg-form-help">Max 500 characters.</p>
</div>`,
      },
    ],
  },

  'components-forms-formgroup': {
    vanillaHtml: true,
    description: 'Fieldset wrapper for grouping related form controls with a legend. Error and disabled states.',
    cssClasses: [
      'mg-form-group',
      'mg-form-group--error',
      'mg-form-group--disabled',
      'mg-form-group__legend',
      'mg-form-error',
    ],
    examples: [
      {
        name: 'Form group with radio buttons',
        html: `<fieldset class="mg-form-group">
  <legend class="mg-form-group__legend">What is your role?</legend>
  <div class="mg-form-check">
    <input class="mg-form-check__input mg-form-check__input--radio" type="radio" id="role-1" name="role" value="researcher" />
    <label class="mg-form-check__label" for="role-1">Researcher</label>
  </div>
  <div class="mg-form-check">
    <input class="mg-form-check__input mg-form-check__input--radio" type="radio" id="role-2" name="role" value="practitioner" />
    <label class="mg-form-check__label" for="role-2">Practitioner</label>
  </div>
</fieldset>`,
      },
    ],
  },

  'components-forms-formerrorsummary': {
    vanillaHtml: true,
    description: 'Error summary box listing all form validation errors with anchor links to each field.',
    cssClasses: [
      'mg-form-error-summary',
      'mg-form-error-summary__title',
      'mg-form-error-summary__list',
    ],
    examples: [
      {
        name: 'Form error summary',
        html: `<div class="mg-form-error-summary" role="alert" tabindex="-1">
  <h2 class="mg-form-error-summary__title">There is a problem</h2>
  <ul class="mg-form-error-summary__list">
    <li><a href="#email">Enter a valid email address</a></li>
    <li><a href="#org-name">Organization name is required</a></li>
  </ul>
</div>`,
      },
    ],
  },

  // ===================================================================
  // CTA
  // ===================================================================

  'components-cta': {
    vanillaHtml: true,
    description: 'Text-based call-to-action section with heading, paragraph, and button.',
    cssClasses: [],
    examples: [
      {
        name: 'Text CTA section',
        html: `<div class="mg-container">
  <h2>Partner with us</h2>
  <p>Join the global effort to reduce disaster risk and build resilient communities.</p>
  <a class="mg-button mg-button-primary mg-button-arrow" role="button" href="/partner">Become a partner</a>
</div>`,
      },
    ],
  },

  // ===================================================================
  // IMAGES
  // ===================================================================

  'components-images-author-image': {
    vanillaHtml: true,
    description: 'Circular author portrait with optional hover color accent (yellow, green, red, blue) and size variant.',
    cssClasses: ['author__img'],
    examples: [
      {
        name: 'Author image',
        html: `<div class="author__img large blue">
  <img src="https://picsum.photos/150/150" alt="Author name" title="Author name" />
</div>`,
      },
    ],
  },

  'components-images-image-with-credit-caption': {
    vanillaHtml: true,
    description: 'Figure element with image, caption, and photo credit.',
    cssClasses: ['image-figcaption', 'image-figcaption__cart', 'scale-up'],
    examples: [
      {
        name: 'Image with caption and credit',
        html: `<figure class="image-figcaption">
  <div class="image-figcaption__cart">
    <img src="https://picsum.photos/800/450" alt="Disaster preparedness training exercise" />
  </div>
  <figcaption>
    Disaster preparedness training in the Philippines.
    <span class="image-credit">Photo: UNDRR / John Smith</span>
  </figcaption>
</figure>`,
      },
    ],
  },

  // ===================================================================
  // LOGOS
  // ===================================================================

  'components-logos': {
    vanillaHtml: true,
    description: 'Logo images for UNDRR, PreventionWeb, IRP, and partner organizations.',
    cssClasses: [],
    examples: [
      {
        name: 'Logo',
        html: `<img src="https://assets.undrr.org/static/logos/undrr/undrr-logo-blue.svg" alt="UNDRR" />`,
      },
    ],
  },

  // ===================================================================
  // ICONS
  // ===================================================================

  'components-icons': {
    vanillaHtml: true,
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

  // ===================================================================
  // UTILITIES (as components)
  // ===================================================================

  'utilities-embedcontainer': {
    vanillaHtml: true,
    description: 'Responsive aspect-ratio wrapper for iframes and embeds. Default 16:9 with 4:3, 1:1, and 21:9 variants.',
    cssClasses: [
      'mg-embed-container',
      'mg-embed-container--4x3',
      'mg-embed-container--1x1',
      'mg-embed-container--21x9',
    ],
    examples: [
      {
        name: '16:9 embed container',
        html: `<div class="mg-embed-container">
  <iframe src="https://www.youtube.com/embed/VIDEO_ID" title="Video title" allowfullscreen></iframe>
</div>`,
      },
      {
        name: '4:3 embed container',
        html: `<div class="mg-embed-container mg-embed-container--4x3">
  <iframe src="https://example.org/map-embed" title="Map"></iframe>
</div>`,
      },
    ],
  },

  'components-fullwidth': {
    vanillaHtml: true,
    description: 'Makes content break out of its container to span the full viewport width. RTL-safe.',
    cssClasses: ['mg-container-full-width'],
    examples: [
      {
        name: 'Full-width section',
        html: `<div class="mg-container-full-width mg-u-background-color--blue-50">
  <div class="mg-container mg-container--padded">
    <h2>Full-bleed background section</h2>
    <p>The background extends to the viewport edges while content stays centered in the container.</p>
  </div>
</div>`,
      },
    ],
  },

  'components-showmore': {
    vanillaHtml: true,
    description: 'Collapse long content behind a gradient fade with a toggle button. Height customizable via CSS variable.',
    cssClasses: ['mg-show-more--collapsed', 'mg-show-more--button'],
    examples: [
      {
        name: 'Show more / collapse pattern',
        html: `<div class="mg-show-more--collapsed" data-mg-show-more style="--mg-show-more-height: 150px;">
  <p>This is long content that will be collapsed behind a gradient fade. Only the first 150px is visible initially.</p>
  <p>Additional content hidden until the user clicks the button.</p>
  <p>More content here...</p>
</div>
<button class="mg-show-more--button" data-mg-show-more-toggle>Show more</button>`,
      },
    ],
  },

  'components-loader': {
    vanillaHtml: true,
    description: 'Animated loading spinner. 40px on mobile, 96px on desktop.',
    cssClasses: ['loader'],
    examples: [
      {
        name: 'Loading spinner',
        html: `<div class="loader" role="status" aria-label="Loading">
  <span class="mg-u-sr-only">Loading...</span>
</div>`,
      },
    ],
  },

  'components-error-pages': {
    vanillaHtml: true,
    description: 'Error page templates (404, 500, etc.) with heading, message, and return link.',
    cssClasses: [],
    examples: [
      {
        name: '404 error page',
        html: `<div class="mg-container mg-container--padded" style="text-align: center;">
  <h1>404</h1>
  <p>Page not found. The page you requested could not be located.</p>
  <a class="mg-button mg-button-primary mg-button-arrow" role="button" href="/">Return to homepage</a>
</div>`,
      },
    ],
  },

  // ===================================================================
  // FULL-PAGE EXAMPLES
  // ===================================================================

  'example-page-template-example': {
    vanillaHtml: true,
    description: 'Complete page layout showing how to compose PageHeader, Hero, container, card grid, and Footer into a working page.',
    examples: [
      {
        name: 'Full page in vanilla HTML',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>UNDRR - Disaster Risk Reduction</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@undrr/undrr-mangrove@latest/dist/css/style.css" />
</head>
<body>
  <!-- Page header -->
  <header id="header" class="mg-page-header mg-page-header--default">
    <div class="mg-page-header__decoration">
      <div></div><div></div><div></div><div></div>
    </div>
    <div class="mg-page-header__toolbar-wrapper">
      <div class="mg-page-header__container mg-container">
        <div class="mg-page-header__region mg-page-header__region--toolbar">
          <section class="mg-page-header__block mg-page-header__block--logo">
            <a href="/">
              <img class="mg-page-header__logo-img" src="https://assets.undrr.org/static/logos/undrr/undrr-logo-horizontal.svg" alt="UNDRR" width="324" height="47" />
            </a>
          </section>
        </div>
      </div>
    </div>
  </header>

  <!-- Hero banner -->
  <section class="mg-hero" style="background-image: url('https://picsum.photos/1600/600')">
    <div class="mg-hero__overlay">
      <article class="mg-hero__content">
        <header class="mg-hero__title">
          <h1 class="text-xxl"><span>Building resilience for a sustainable future</span></h1>
        </header>
        <div class="mg-hero__summaryText">
          <span>The Sendai Framework guides global efforts to reduce disaster risk and losses.</span>
        </div>
        <div class="mg-hero__buttons">
          <a class="mg-button mg-button-primary mg-button-arrow" role="button" href="/sendai-framework">Learn more</a>
        </div>
      </article>
    </div>
  </section>

  <!-- Main content -->
  <div class="mg-container mg-container--padded mg-container--spacer">
    <!-- Breadcrumbs -->
    <nav aria-label="breadcrumbs" class="mg-breadcrumb">
      <ul>
        <li><a href="/">Home</a></li>
        <li aria-current="page">Disaster risk reduction</li>
      </ul>
    </nav>

    <!-- Card grid -->
    <h2>Latest publications</h2>
    <div class="mg-grid mg-grid__col-3">
      <article class="mg-card mg-card__vc">
        <div class="mg-card__visual">
          <img src="https://picsum.photos/600/400?1" alt="" class="mg-card__image" />
        </div>
        <div class="mg-card__content">
          <div class="mg-card__meta">
            <a href="/topics/early-warning" class="mg-card__label mg-card__label--active">Early warning</a>
          </div>
          <header class="mg-card__title"><a href="/report-1">Global Assessment Report 2024</a></header>
          <p class="mg-card__summary">The flagship report on disaster risk reduction.</p>
        </div>
      </article>
      <article class="mg-card mg-card__vc">
        <div class="mg-card__visual">
          <img src="https://picsum.photos/600/400?2" alt="" class="mg-card__image" />
        </div>
        <div class="mg-card__content">
          <header class="mg-card__title"><a href="/report-2">Sendai Framework progress report</a></header>
          <p class="mg-card__summary">Tracking implementation across 195 countries.</p>
        </div>
      </article>
      <article class="mg-card mg-card__vc">
        <div class="mg-card__visual">
          <img src="https://picsum.photos/600/400?3" alt="" class="mg-card__image" />
        </div>
        <div class="mg-card__content">
          <header class="mg-card__title"><a href="/report-3">Making cities resilient</a></header>
          <p class="mg-card__summary">Urban resilience strategies for local governments.</p>
        </div>
      </article>
    </div>

    <!-- Highlight box -->
    <div class="mg-highlight-box mg-highlight-box--primary mg-highlight-box--centered">
      <h3>Key statistic</h3>
      <p>For every $1 invested in disaster risk reduction, up to $15 is saved in post-disaster recovery.</p>
    </div>
  </div>

  <!-- Footer with syndication -->
  <footer class="mg-footer">
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
  </script>
</body>
</html>`,
      },
    ],
  },

  // ===================================================================
  // REACT-ONLY COMPONENTS
  // ===================================================================

  'components-charts-barchart': {
    requiresReact: true,
    reactNote:
      'BarChart uses D3 for rendering. It requires React and the D3 library. Import via npm: import { BarChart } from "@undrr/undrr-mangrove".',
  },

  'components-charts-connectedscatterplot': {
    requiresReact: true,
    reactNote:
      'ConnectedScatterPlot uses D3 for rendering. Requires React and D3. Import via npm.',
  },

  'components-charts-histogram': {
    requiresReact: true,
    reactNote:
      'Histogram uses D3 for rendering. Requires React and D3. Import via npm.',
  },

  'components-charts-indexchart': {
    requiresReact: true,
    reactNote:
      'IndexChart uses D3 for rendering. Requires React and D3. Import via npm.',
  },

  'components-maps-mapcomponent': {
    requiresReact: true,
    reactNote:
      'MapComponent uses Leaflet for interactive maps. Requires React and Leaflet. Import via npm.',
  },

  'components-syndicationsearchwidget': {
    requiresReact: true,
    reactNote:
      'SyndicationSearchWidget is a complex search interface querying an Elasticsearch API. Requires React 19. Can be hydrated on a vanilla HTML page using the createHydrator pattern with data-mg-search-widget attributes. See the hydration documentation.',
  },

  'components-megamenu': {
    requiresReact: true,
    reactNote:
      'MegaMenu manages complex open/close state and keyboard navigation. Requires React. Can be hydrated via createHydrator.',
  },

  'components-fetcher': {
    requiresReact: true,
    reactNote:
      'Fetcher is a generic data-fetching wrapper component. Requires React for state management.',
  },

  'components-gallery': {
    requiresReact: true,
    reactNote:
      'Gallery provides a lightbox image viewer. Requires React for modal state and keyboard navigation. Can be hydrated via createHydrator.',
  },

  'components-pager': {
    requiresReact: true,
    reactNote:
      'Pager manages pagination state. Requires React. Import via npm.',
  },

  'components-cookieconsentbanner': {
    requiresReact: true,
    reactNote:
      'CookieConsentBanner manages consent state and cookie storage. Requires React.',
  },

  'components-snackbar': {
    requiresReact: true,
    reactNote:
      'Snackbar manages auto-dismiss timing and state. Requires React.',
  },

  'components-scrollcontainer': {
    requiresReact: true,
    reactNote:
      'ScrollContainer manages horizontal scroll state with navigation buttons. Requires React. Can be hydrated via createHydrator.',
  },

  'components-buttons-sharebuttons': {
    requiresReact: true,
    reactNote:
      'ShareButtons manages share URLs and clipboard state. Requires React. Can be hydrated via createHydrator with data-mg-share-buttons.',
  },

  'components-table-of-contents': {
    requiresReact: true,
    reactNote:
      'TableOfContents inspects the DOM for heading elements and manages scroll-spy state. Requires React.',
  },
};
