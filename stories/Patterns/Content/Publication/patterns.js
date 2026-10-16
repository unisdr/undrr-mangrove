/** Archetype and profile projections; layout does not select content. */
export const publicationPatterns = {
  id: 'publication',
  name: 'Publication',
  model: {
    status: 'provisional',
    intent:
      'A published document with bibliographic identity, complete cover and source organizations.',
  },
  presentations: {
    fullPage: {
      status: 'reference',
      intent:
        'Existing report/publication page reference; it is not a complete bibliographic detail-page contract.',
      reference: {
        kind: 'Patterns/Content/Publication/Full page',
        story: 'Report or publication',
        id: 'patterns-landing-pages--report-landing',
      },
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search presentation. Profiles select editorial metadata; layout is shared. This input is not a canonical domain model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Publication',
        id: 'patterns-content-teaser--publication',
      },
    },
    card: {
      status: 'experimental',
      intent:
        'Compact card selection; vertical and book are alternate layouts of this presentation.',
      reference: {
        kind: 'Patterns/Content card',
        story: 'Publication',
        id: 'patterns-content-card--publication',
      },
      layouts: ['vertical', 'book'],
      layoutReferences: {
        vertical: {
          kind: 'Patterns/Content card',
          story: 'Publication',
          id: 'patterns-content-card--publication',
        },
        book: {
          kind: 'Patterns/Content card',
          story: 'Publication book',
          id: 'patterns-content-card--publication-book',
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
        'A published document with bibliographic identity, complete cover and source organizations.',
      presentations: {
        teaser: {
          status: 'experimental',
          reference: {
            kind: 'Patterns/Content teaser',
            story: 'Publication',
            id: 'patterns-content-teaser--publication',
          },
          fields: {
            before: ['labels', 'published'],
            after: ['identifier', 'summary', 'sources', 'language'],
            media: 'cover',
          },
        },
        card: {
          status: 'experimental',
          intent:
            'Compact card selection; vertical and book are alternate layouts of this presentation.',
          reference: {
            kind: 'Patterns/Content card',
            story: 'Publication',
            id: 'patterns-content-card--publication',
          },
          fields: {
            media: 'cover',
            before: ['labels'],
            after: [],
          },
          layouts: ['vertical', 'book'],
          layoutReferences: {
            vertical: {
              kind: 'Patterns/Content card',
              story: 'Publication',
              id: 'patterns-content-card--publication',
            },
            book: {
              kind: 'Patterns/Content card',
              story: 'Publication book',
              id: 'patterns-content-card--publication-book',
            },
          },
          basis: 'audited-card-selection',
        },
      },
    },
  },
};
