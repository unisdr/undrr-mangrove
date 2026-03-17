/**
 * @file utilities.js
 * @source manual (metadata + curated HTML)
 *
 * All content is manually maintained. Update the HTML examples
 * when the component markup changes. See scripts/ai-manifest/README.md for
 * the entry schema and available fields.
 */

export default {
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
  <a class="mg-button mg-button-primary mg-button-arrow" href="/">Return to homepage</a>
</div>`,
      },
    ],
  },
};
