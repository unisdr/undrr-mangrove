/**
 * @file typography.js
 * @source manual (metadata + curated HTML)
 *
 * All content is manually maintained. Update the HTML examples
 * when the component markup changes. See scripts/ai-manifest/README.md for
 * the entry schema and available fields.
 */

export default {
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
};
