/** Content family and presentation status; stubs expose no renderable component. */
export const organizationPatterns = {
  id: 'organization',
  name: 'Organisation',
  model: {
    status: 'provisional',
    intent:
      'An organisation with identity, complete logo, locations and categories.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full organisation page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Organisation',
        id: 'patterns-content-teaser--organization',
      },
      layout: {
        image: true,
        logo: true,
        before: ['location'],
        after: ['summary', 'organizationType'],
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact organisation card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
