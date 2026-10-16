/** Archetype and profile projections; layout does not select content. */
export const commitmentPatterns = {
  id: 'commitment',
  name: 'Commitment',
  model: {
    status: 'provisional',
    intent:
      'A voluntary commitment with geographic scope, progress status and publication metadata.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full commitment page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search presentation. Profiles select editorial metadata; layout is shared. This input is not a canonical domain model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Commitment',
        id: 'patterns-content-teaser--commitment',
      },
    },
    card: {
      status: 'experimental',
      intent:
        'Compact card selection; vertical and book are alternate layouts of this presentation.',
      reference: {
        kind: 'Patterns/Content card',
        story: 'Commitment',
        id: 'patterns-content-card--commitment',
      },
      layouts: ['vertical', 'book'],
      layoutReferences: {
        vertical: {
          kind: 'Patterns/Content card',
          story: 'Commitment',
          id: 'patterns-content-card--commitment',
        },
        book: {
          kind: 'Patterns/Content card',
          story: 'Commitment book',
          id: 'patterns-content-card--commitment-book',
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
        'A voluntary commitment with geographic scope, progress status and publication metadata.',
      presentations: {
        teaser: {
          status: 'experimental',
          reference: {
            kind: 'Patterns/Content teaser',
            story: 'Commitment',
            id: 'patterns-content-teaser--commitment',
          },
          fields: {
            before: ['scope', 'status', 'published'],
            after: ['summary'],
            media: 'photo',
          },
        },
        card: {
          status: 'experimental',
          intent:
            'Compact card selection; vertical and book are alternate layouts of this presentation.',
          reference: {
            kind: 'Patterns/Content card',
            story: 'Commitment',
            id: 'patterns-content-card--commitment',
          },
          fields: {
            media: 'photo',
            before: [],
            after: [],
          },
          layouts: ['vertical', 'book'],
          layoutReferences: {
            vertical: {
              kind: 'Patterns/Content card',
              story: 'Commitment',
              id: 'patterns-content-card--commitment',
            },
            book: {
              kind: 'Patterns/Content card',
              story: 'Commitment book',
              id: 'patterns-content-card--commitment-book',
            },
          },
          basis: 'audited-card-selection',
        },
      },
    },
  },
};
