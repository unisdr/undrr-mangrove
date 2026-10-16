/** Source-independent archetype; profiles own presentation projections, not CMS schemas. */
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
        'Horizontal listing/search presentation. Profiles select editorial metadata; layout is shared. This input is not a canonical domain model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Event',
        id: 'patterns-content-teaser--event',
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact event presentation. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
  defaultProfile: 'general',
  profiles: {
    general: {
      name: 'General',
      intent:
        'An event with occurrence dates, location and participation information.',
      presentations: {
        teaser: {
          status: 'experimental',
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
      },
    },
    'programme-session': {
      name: 'Programme session',
      intent:
        'A programme session with schedules, exhibition dates, room hierarchy and distinct taxonomies.',
      presentations: {
        teaser: {
          status: 'experimental',
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
      },
    },
  },
};
