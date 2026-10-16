/** Content family and presentation status; stubs expose no renderable component. */
export const publicationPatterns = {
  id: 'publication',
  name: 'Publication',
  model: {
    status: 'provisional',
    intent:
      'A published document with bibliographic identity, complete cover and source organisations.',
  },
  presentations: {
    fullPage: {
      status: 'reference',
      intent:
        'Existing report/publication page reference; it is not a complete bibliographic detail-page contract.',
      reference: {
        kind: 'Patterns/Landing pages',
        story: 'Report or publication',
        id: 'patterns-landing-pages--report-landing',
      },
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Publication',
        id: 'patterns-content-teaser--publication',
      },
      layout: {
        image: true,
        before: ['labels', 'published'],
        after: ['identifier', 'summary', 'sources', 'language'],
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact publication card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
