/**
 * @file cta.js
 * @source manual (metadata + curated HTML)
 *
 * All content is manually maintained. Update the HTML examples
 * when the component markup changes. See scripts/README.md for
 * the entry schema and available fields.
 */

export default {
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
};
