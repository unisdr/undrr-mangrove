/** Content family and presentation status; stubs expose no renderable component. */
export const vacancyPatterns = {
  id: 'vacancy',
  name: 'Vacancy',
  model: {
    status: 'provisional',
    intent:
      'A job opportunity with location, closing deadline and supplied status.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full vacancy page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Vacancy',
        id: 'patterns-content-teaser--vacancy',
      },
      layout: {
        before: ['labels', 'location', 'deadline', 'status'],
        after: ['summary'],
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact vacancy card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
