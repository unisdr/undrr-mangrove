/**
 * @file buttons.js
 * @source manual (metadata + curated HTML)
 *
 * All content is manually maintained. Update the HTML examples
 * when the component markup changes. See scripts/ai-manifest/README.md for
 * the entry schema and available fields.
 */

export default {
  'components-buttons-buttons': {
    vanillaHtml: true,
    description: 'Primary and secondary CTA buttons. Arrow and disabled variants.',
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
        html: `<a class="mg-button mg-button-primary mg-button-arrow" href="/take-action">Take action</a>`,
      },
      {
        name: 'Primary button without arrow',
        html: `<a class="mg-button mg-button-primary mg-button-without-arrow" href="/subscribe">Subscribe</a>`,
      },
      {
        name: 'Secondary button',
        html: `<a class="mg-button mg-button-secondary" href="/learn-more">Learn more</a>`,
      },
      {
        name: 'Disabled button',
        html: `<a class="mg-button mg-button-primary disabled" aria-disabled="true">Unavailable</a>`,
      },
    ],
  },

  'components-buttons-chips': {
    vanillaHtml: true,
    description: 'Small interactive tag-like buttons for filters and selections. Optional dismiss (X) variant. Uses legacy class names without the mg- prefix.',
    cssClasses: ['chip', 'chip__cross'],
    examples: [
      {
        name: 'Default chip',
        html: `<a class="chip" href="/topics/flood">Flood</a>`,
      },
      {
        name: 'Chip with dismiss',
        html: `<button class="chip chip__cross" type="button" aria-label="Remove filter: Active filter">Active filter</button>`,
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
        html: `<a class="cta__link cta--arrow" href="/explore">Explore our resources <i aria-hidden="true"></i></a>`,
      },
      {
        name: 'CTA link with space',
        html: `<a class="cta__link cta--space" href="/resources">View all resources <i aria-hidden="true"></i></a>`,
      },
      {
        name: 'Inline CTA (span)',
        html: `<span class="cta__link cta--arrow">Read more <i aria-hidden="true"></i></span>`,
      },
    ],
  },
};
