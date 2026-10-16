/** Source-independent archetype; profiles own presentation projections, not CMS schemas. */
export const collectionPatterns = {
  id: 'collection',
  name: 'Collection',
  model: {
    status: 'provisional',
    intent: 'A curated collection whose freshness reflects its linked content.',
  },
  presentations: {
    fullPage: {
      status: 'reference',
      intent:
        'Existing collection-page reference with listing behaviour; canonical content-contract alignment remains open.',
      reference: {
        kind: 'Patterns/Collection page',
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
      status: 'stub',
      intent:
        'A compact collection presentation. Content selection and mapping to shared card primitives have not been designed.',
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
          layout: {
            image: true,
            before: ['labels', 'freshness'],
            after: ['summary'],
          },
        },
      },
    },
  },
};
