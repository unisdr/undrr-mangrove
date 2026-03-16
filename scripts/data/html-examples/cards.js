export default {
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
};
