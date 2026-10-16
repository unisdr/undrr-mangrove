/** Content family and presentation status; stubs expose no renderable component. */
export const newsPatterns = {
  id: 'news',
  name: 'News',
  model: {
    status: 'provisional',
    intent: 'An editorial news item with release date, attribution and media.',
  },
  presentations: {
    fullPage: {
      status: 'reference',
      intent:
        'Existing article-page reference; a shared news domain contract and adapter are still provisional.',
      reference: {
        kind: 'Patterns/Article story',
        story: 'Large, prominent image',
        id: 'patterns-article-story--large-image',
      },
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'News',
        id: 'patterns-content-teaser--news',
      },
      layout: {
        image: true,
        before: ['labels', 'published'],
        after: ['summary', 'sources', 'language'],
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact news card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
