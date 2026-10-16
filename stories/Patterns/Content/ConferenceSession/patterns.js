/** Content family and presentation status; stubs expose no renderable component. */
export const conferenceSessionPatterns = {
  id: 'conference-session',
  name: 'Conference session',
  model: {
    status: 'provisional',
    intent:
      'A programme session with schedules, exhibition dates, room hierarchy and distinct taxonomies.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full conference session page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Conference session',
        id: 'patterns-content-teaser--conference-session',
      },
      layout: {
        image: true,
        before: ['bucket', 'schedule', 'exhibitions', 'room', 'format'],
        after: ['summary', 'topics'],
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact conference session card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
