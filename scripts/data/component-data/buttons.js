export default {
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
};
