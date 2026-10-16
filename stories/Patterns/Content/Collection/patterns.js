/** Archetype and profile projections; layout does not select content. */
export const collectionPatterns = {
  id: 'collection',
  name: 'Collection',
  model: {
    status: 'provisional',
    intent: 'A curated collection whose freshness reflects its linked content.',
  },
  presentations: {
    fullPage: {
      additionalReferences: [
        {
          kind: 'Patterns/Content/Collection/Full page/Collection index',
          story: 'Collection index',
          id: 'patterns-landing-pages--index-landing',
          intent:
            'A directory into several grouped collections, distinct from a curated single-collection page.',
        },
      ],
      status: 'reference',
      intent:
        'Existing collection-page reference with listing behaviour; canonical content-contract alignment remains open.',
      reference: {
        kind: 'Patterns/Content/Collection/Full page/Curated collection',
        story: 'Collection page',
        id: 'patterns-collection-page--typical',
      },
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search presentation. Profiles select editorial metadata; layout is shared. This input is not a canonical domain model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Collection',
        id: 'patterns-content-teaser--collection',
      },
    },
    card: {
      status: 'experimental',
      intent:
        'Compact card selection; vertical and book are alternate layouts of this presentation.',
      reference: {
        kind: 'Patterns/Content card',
        story: 'Collection',
        id: 'patterns-content-card--collection',
      },
      layouts: ['vertical', 'book'],
      layoutReferences: {
        vertical: {
          kind: 'Patterns/Content card',
          story: 'Collection',
          id: 'patterns-content-card--collection',
        },
        book: {
          kind: 'Patterns/Content card',
          story: 'Collection book',
          id: 'patterns-content-card--collection-book',
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
        'A curated collection whose freshness reflects its linked content.',
      presentations: {
        teaser: {
          status: 'experimental',
          reference: {
            kind: 'Patterns/Content teaser',
            story: 'Collection',
            id: 'patterns-content-teaser--collection',
          },
          fields: {
            before: ['labels', 'freshness'],
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
            story: 'Collection',
            id: 'patterns-content-card--collection',
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
              story: 'Collection',
              id: 'patterns-content-card--collection',
            },
            book: {
              kind: 'Patterns/Content card',
              story: 'Collection book',
              id: 'patterns-content-card--collection-book',
            },
          },
          basis: 'audited-card-selection',
        },
      },
    },
  },
};
