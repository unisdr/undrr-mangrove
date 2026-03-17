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
    description: 'Page navigation with previous/next links and page number display.',
    cssClasses: ['pagination', 'disabled'],
    examples: [
      {
        name: 'Pagination',
        html: `<nav class="pagination" aria-label="Pagination" role="navigation">
  <ul>
    <li class="disabled" aria-disabled="true"><span>Previous</span></li>
    <li><a href="?page=1" role="button">1</a></li>
    <li><a href="?page=2" role="button">2</a></li>
    <li><a href="?page=3" role="button">3</a></li>
    <li><a href="?page=2" role="button">Next</a></li>
  </ul>
</nav>`,
      },
    ],
  },
};
