/**
 * @file cards.js
 * @source manual (metadata + curated HTML for DOMPurify cards) + auto-rendered (HTML for book-card)
 *
 * Vertical card, horizontal card, and horizontal book card use DOMPurify which
 * fails in Node — their examples are manually curated. Book card and other
 * cards use auto-rendered HTML from dist/components/*.js.
 */

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
    <a class="mg-button mg-button-primary mg-button-arrow" href="/reports/gar-2024">Read the report</a>
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

  // renderedHtml auto-generated from dist/components/IconCard.js
  'components-cards-icon-card': {
    vanillaHtml: true,
    description: 'Card with icon or image, title, summary, and optional CTA. Variants: default, centered, negative (dark background). Image scale options: small, medium, large, full.',
    cssClasses: [
      'mg-card',
      'mg-card__icon',
      'mg-card__icon--centered',
      'mg-card__icon--negative',
      'mg-card__icon--bordered',
      'mg-card__visual',
      'mg-card__visual-link',
      'mg-card__image',
      'mg-card__image--small',
      'mg-card__image--medium',
      'mg-card__image--large',
      'mg-card__image--full',
      'mg-card__icon-wrap',
      'mg-card__icon-wrap--small',
      'mg-card__icon-wrap--medium',
      'mg-card__icon-wrap--large',
      'mg-card__icon-wrap--full',
      'mg-card__icon-wrap--colored',
      'mg-card__content',
      'mg-card__meta',
      'mg-card__label',
      'mg-card__title',
      'mg-card__summary',
      'mg-card__cta',
      'mg-card__link',
      'mg-u-sr-only',
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
    // renderedHtml auto-generated from dist/components/BookCard.js
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

  // renderedHtml auto-generated from dist/components/StatsCard.js
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
  },
};
