/** Content family and presentation status; stubs expose no renderable component. */
export const hazardProfilePatterns = {
  id: 'hazard-profile',
  name: 'Hazard profile',
  model: {
    status: 'provisional',
    intent:
      'A reference hazard definition with classification and stable notation.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full hazard profile page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Hazard profile',
        id: 'patterns-content-teaser--hazard-profile',
      },
      layout: {
        before: ['classification', 'identifier'],
        after: ['summary'],
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact hazard profile card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
