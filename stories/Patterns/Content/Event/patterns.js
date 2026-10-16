/** Archetype and profile projections; layout does not select content. */
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
      status: 'experimental',
      intent:
        'Compact card selection; vertical and book are alternate layouts of this presentation.',
      reference: {
        kind: 'Patterns/Content card',
        story: 'Event',
        id: 'patterns-content-card--event',
      },
      layouts: ['vertical', 'book'],
      layoutReferences: {
        vertical: {
          kind: 'Patterns/Content card',
          story: 'Event',
          id: 'patterns-content-card--event',
        },
        book: {
          kind: 'Patterns/Content card',
          story: 'Event book',
          id: 'patterns-content-card--event-book',
        },
      },
      basis: 'audited-card-selection',
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
          fields: {
            before: ['labels', 'eventLocation', 'event', 'delivery'],
            after: ['summary', 'language'],
            media: 'none',
          },
        },
        card: {
          status: 'experimental',
          intent:
            'Compact card selection; vertical and book are alternate layouts of this presentation.',
          reference: {
            kind: 'Patterns/Content card',
            story: 'Event',
            id: 'patterns-content-card--event',
          },
          fields: {
            media: 'photo',
            before: ['labels'],
            after: [],
          },
          layouts: ['vertical', 'book'],
          layoutReferences: {
            vertical: {
              kind: 'Patterns/Content card',
              story: 'Event',
              id: 'patterns-content-card--event',
            },
            book: {
              kind: 'Patterns/Content card',
              story: 'Event book',
              id: 'patterns-content-card--event-book',
            },
          },
          basis: 'audited-card-selection',
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
          fields: {
            before: ['bucket', 'schedule', 'exhibitions', 'room', 'format'],
            after: ['summary', 'topics'],
            media: 'photo',
          },
        },
        card: {
          status: 'experimental',
          intent:
            'Compact card selection; vertical and book are alternate layouts of this presentation.',
          reference: {
            kind: 'Patterns/Content card',
            story: 'Programme session',
            id: 'patterns-content-card--programme-session',
          },
          fields: {
            media: 'photo',
            before: ['sessionBucket', 'sessionTypes'],
            after: [],
          },
          layouts: ['vertical', 'book'],
          layoutReferences: {
            vertical: {
              kind: 'Patterns/Content card',
              story: 'Programme session',
              id: 'patterns-content-card--programme-session',
            },
            book: {
              kind: 'Patterns/Content card',
              story: 'Programme session book',
              id: 'patterns-content-card--programme-session-book',
            },
          },
          basis: 'audited-card-selection',
        },
      },
    },
  },
};
