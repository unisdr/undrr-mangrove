/** Content family and presentation status; stubs expose no renderable component. */
export const terminologyPatterns = {
  id: 'terminology',
  name: 'Terminology',
  model: {
    status: 'provisional',
    intent: 'A reference term with a definition and stable identity.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full terminology page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Terminology',
        id: 'patterns-content-teaser--terminology',
      },
      layout: {
        before: ['labels'],
        after: ['summary'],
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact terminology card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
