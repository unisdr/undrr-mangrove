/** Content family and presentation status; stubs expose no renderable component. */
export const commitmentPatterns = {
  id: 'commitment',
  name: 'Commitment',
  model: {
    status: 'provisional',
    intent:
      'A voluntary commitment with geographic scope, progress status and publication metadata.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full commitment page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Commitment',
        id: 'patterns-content-teaser--commitment',
      },
      layout: {
        image: true,
        before: ['scope', 'status', 'published'],
        after: ['summary'],
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact commitment card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
