/**
 * @file utilities.js
 * @source manual (metadata + curated HTML for showmore/error-pages) + auto-rendered (HTML)
 *
 * Embed container, full-width, and loader use auto-rendered HTML from
 * dist/components/*.js. Show more and error pages are manually curated
 * (show more uses document, error pages have no React component).
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
    // renderedHtml auto-generated from dist/components/EmbedContainer.js
  },

  'components-fullwidth': {
    vanillaHtml: true,
    description: 'Makes content break out of its container to span the full viewport width. RTL-safe.',
    cssClasses: ['mg-container-full-width'],
    // renderedHtml auto-generated from dist/components/FullWidth.js
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
    // renderedHtml auto-generated from dist/components/Loader.js
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
