/** Content family and presentation status; stubs expose no renderable component. */
export const personPatterns = {
  id: 'person',
  name: 'Person',
  model: {
    status: 'provisional',
    intent:
      'A person with identity and biographical content; individual presentations choose which profile fields to expose.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full person page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Person',
        id: 'patterns-content-teaser--person',
      },
      layout: {
        before: [],
        after: ['summary'],
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact person card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
