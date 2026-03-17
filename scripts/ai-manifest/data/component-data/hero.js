/**
 * @file hero.js
 * @source manual (metadata + curated HTML)
 *
 * All content is manually maintained. Update the HTML examples
 * when the component markup changes. See scripts/README.md for
 * the entry schema and available fields.
 */

export default {
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
};
