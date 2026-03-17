/**
 * @file layout.js
 * @source manual (metadata + curated HTML)
 *
 * All content is manually maintained. Update the HTML examples
 * when the component markup changes. See scripts/README.md for
 * the entry schema and available fields.
 */

export default {
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
};
