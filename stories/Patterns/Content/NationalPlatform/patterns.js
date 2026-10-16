/** Content family and presentation status; stubs expose no renderable component. */
export const nationalPlatformPatterns = {
  id: 'national-platform',
  name: 'National platform',
  model: {
    status: 'provisional',
    intent:
      'A national coordination platform with its own identity and explanatory content.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full national platform page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'National platform',
        id: 'patterns-content-teaser--national-platform',
      },
      layout: {
        before: ['labels'],
        after: ['summary'],
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact national platform card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
