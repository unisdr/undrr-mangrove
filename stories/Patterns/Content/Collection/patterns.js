/** Content family and presentation status; stubs expose no renderable component. */
export const collectionPatterns = {
  id: 'collection',
  name: 'Collection',
  model: {
    status: 'provisional',
    intent: 'A curated collection whose freshness reflects its linked content.',
  },
  presentations: {
    fullPage: {
      status: 'reference',
      intent:
        'Existing collection-page reference with listing behaviour; canonical content-contract alignment remains open.',
      reference: {
        kind: 'Patterns/Collection page',
        story: 'Collection page',
        id: 'patterns-collection-page--typical',
      },
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Collection',
        id: 'patterns-content-teaser--collection',
      },
      layout: {
        image: true,
        before: ['labels', 'freshness'],
        after: ['summary'],
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact collection card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
