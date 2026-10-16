/** Archetype and profile projections; layout does not select content. */
export const resourcePatterns = {
  id: 'resource',
  name: 'Resource',
  model: {
    status: 'provisional',
    intent:
      'A reusable resource with format, availability and source organizations.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full resource page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search presentation. Profiles select editorial metadata; layout is shared. This input is not a canonical domain model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Resource',
        id: 'patterns-content-teaser--resource',
      },
    },
    card: {
      status: 'experimental',
      intent:
        'Compact card selection; vertical and book are alternate layouts of this presentation.',
      reference: {
        kind: 'Patterns/Content card',
        story: 'Resource',
        id: 'patterns-content-card--resource',
      },
      layouts: ['vertical', 'book'],
      layoutReferences: {
        vertical: {
          kind: 'Patterns/Content card',
          story: 'Resource',
          id: 'patterns-content-card--resource',
        },
        book: {
          kind: 'Patterns/Content card',
          story: 'Resource book',
          id: 'patterns-content-card--resource-book',
        },
      },
      basis: 'audited-card-selection',
    },
  },
  defaultProfile: 'default',
  profiles: {
    default: {
      name: 'Default',
      intent:
        'A reusable resource with format, availability and source organizations.',
      presentations: {
        teaser: {
          status: 'experimental',
          reference: {
            kind: 'Patterns/Content teaser',
            story: 'Resource',
            id: 'patterns-content-teaser--resource',
          },
          fields: {
            before: ['labels', 'resourceType', 'location', 'delivery'],
            after: ['summary', 'sources', 'language'],
            media: 'none',
          },
        },
        card: {
          status: 'experimental',
          intent:
            'Compact card selection; vertical and book are alternate layouts of this presentation.',
          reference: {
            kind: 'Patterns/Content card',
            story: 'Resource',
            id: 'patterns-content-card--resource',
          },
          fields: {
            media: 'photo',
            before: ['resourceType'],
            after: [],
          },
          layouts: ['vertical', 'book'],
          layoutReferences: {
            vertical: {
              kind: 'Patterns/Content card',
              story: 'Resource',
              id: 'patterns-content-card--resource',
            },
            book: {
              kind: 'Patterns/Content card',
              story: 'Resource book',
              id: 'patterns-content-card--resource-book',
            },
          },
          basis: 'audited-card-selection',
        },
      },
    },
  },
};
