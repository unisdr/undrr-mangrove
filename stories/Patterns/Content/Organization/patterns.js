/** Archetype and profile projections; layout does not select content. */
export const organizationPatterns = {
  id: 'organization',
  name: 'Organization',
  model: {
    status: 'provisional',
    intent:
      'An entity involved in disaster risk reduction, described through its identity, mandate, activities and relationships. A coordination platform emphasizes its country, remit and hosting body.',
    readerNeeds: [
      'Identify the organization, its role, geographic scope and areas of work.',
      'Understand relevant affiliations, partnerships and contributions; distinguish a coordination platform from its host.',
      'Find published websites, participation routes or appropriate public contact information.',
    ],
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full organization page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search presentation. Profiles select editorial metadata; layout is shared. This input is not a canonical domain model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Organization',
        id: 'patterns-content-teaser--organization',
      },
    },
    card: {
      status: 'experimental',
      intent:
        'Compact card selection; vertical and book are alternate layouts of this presentation.',
      reference: {
        kind: 'Patterns/Content card',
        story: 'Organization',
        id: 'patterns-content-card--organization',
      },
      layouts: ['vertical', 'book'],
      layoutReferences: {
        vertical: {
          kind: 'Patterns/Content card',
          story: 'Organization',
          id: 'patterns-content-card--organization',
        },
        book: {
          kind: 'Patterns/Content card',
          story: 'Organization book',
          id: 'patterns-content-card--organization-book',
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
        'An organization with identity, complete logo, locations and categories.',
      presentations: {
        teaser: {
          status: 'experimental',
          reference: {
            kind: 'Patterns/Content teaser',
            story: 'Organization',
            id: 'patterns-content-teaser--organization',
          },
          fields: {
            before: ['location'],
            after: ['summary', 'organizationType'],
            media: 'logo',
          },
        },
        card: {
          status: 'experimental',
          intent:
            'Compact card selection; vertical and book are alternate layouts of this presentation.',
          reference: {
            kind: 'Patterns/Content card',
            story: 'Organization',
            id: 'patterns-content-card--organization',
          },
          fields: {
            media: 'logo',
            before: ['organizationLabels'],
            after: [],
          },
          layouts: ['vertical', 'book'],
          layoutReferences: {
            vertical: {
              kind: 'Patterns/Content card',
              story: 'Organization',
              id: 'patterns-content-card--organization',
            },
            book: {
              kind: 'Patterns/Content card',
              story: 'Organization book',
              id: 'patterns-content-card--organization-book',
            },
          },
          basis: 'audited-card-selection',
        },
      },
    },
    'coordination-platform': {
      name: 'Coordination platform',
      intent:
        'A national coordination platform with its own identity and explanatory content.',
      presentations: {
        teaser: {
          status: 'experimental',
          reference: {
            kind: 'Patterns/Content teaser',
            story: 'National platform',
            id: 'patterns-content-teaser--national-platform',
          },
          fields: {
            before: ['labels'],
            after: ['summary'],
            media: 'none',
          },
        },
        card: {
          status: 'experimental',
          intent:
            'Mangrove proposal: no explicit Drupal card display exists for this profile. Vertical and book layouts share this compact selection.',
          reference: {
            kind: 'Patterns/Content card',
            story: 'Coordination platform',
            id: 'patterns-content-card--coordination-platform',
          },
          fields: {
            media: 'none',
            before: ['labels'],
            after: [],
          },
          layouts: ['vertical', 'book'],
          layoutReferences: {
            vertical: {
              kind: 'Patterns/Content card',
              story: 'Coordination platform',
              id: 'patterns-content-card--coordination-platform',
            },
            book: {
              kind: 'Patterns/Content card',
              story: 'Coordination platform book',
              id: 'patterns-content-card--coordination-platform-book',
            },
          },
          basis: 'proposed-card-selection',
        },
      },
    },
  },
};
