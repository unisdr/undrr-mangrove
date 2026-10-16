/** Content family and presentation status; stubs expose no renderable component. */
export const resourcePatterns = {
  id: 'resource',
  name: 'Resource',
  model: {
    status: 'provisional',
    intent:
      'A reusable resource with format, availability and source organisations.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full resource page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Resource',
        id: 'patterns-content-teaser--resource',
      },
      layout: {
        before: ['labels', 'location', 'delivery'],
        after: ['summary', 'sources', 'language'],
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact resource card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
