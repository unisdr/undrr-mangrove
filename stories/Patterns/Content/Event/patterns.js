/** Content family and presentation status; stubs expose no renderable component. */
export const eventPatterns = {
  id: 'event',
  name: 'Event',
  model: {
    status: 'provisional',
    intent:
      'An event with occurrence dates, location and participation information.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full event page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Event',
        id: 'patterns-content-teaser--event',
      },
      layout: {
        before: ['labels', 'location', 'event', 'delivery'],
        after: ['summary', 'language'],
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact event card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
