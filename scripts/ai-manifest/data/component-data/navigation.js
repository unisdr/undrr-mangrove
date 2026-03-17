/**
 * @file navigation.js
 * @source manual (metadata + curated HTML)
 *
 * All content is manually maintained. Update the HTML examples
 * when the component markup changes. See scripts/ai-manifest/README.md for
 * the entry schema and available fields.
 */

export default {
  'components-navigation-breadcrumbs': {
    vanillaHtml: true,
    description: 'Breadcrumb navigation trail. White variant available for dark backgrounds.',
    cssClasses: ['mg-breadcrumb', 'mg-breadcrumb--white'],
    examples: [
      {
        name: 'Breadcrumbs',
        html: `<nav aria-label="breadcrumbs" class="mg-breadcrumb">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/publications">Publications</a></li>
    <li aria-current="page">Global Assessment Report 2024</li>
  </ul>
</nav>`,
      },
    ],
  },

  'components-navigation-pagination': {
    vanillaHtml: true,
    description: 'Page navigation with previous/next links and page number display. Uses legacy class names without the mg- prefix.',
    cssClasses: ['pagination'],
    examples: [
      {
        name: 'Pagination',
        html: `<nav class="pagination" aria-label="Pagination">
  <ul>
    <li><a aria-disabled="true" aria-label="Previous page">Previous</a></li>
    <li><a href="?page=1" aria-current="page" aria-label="Page 1">1</a></li>
    <li><a href="?page=2" aria-label="Page 2">2</a></li>
    <li><a href="?page=3" aria-label="Page 3">3</a></li>
    <li><a href="?page=2" aria-label="Next page">Next</a></li>
  </ul>
</nav>`,
      },
    ],
  },
};
