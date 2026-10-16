/** Source-independent archetype; profiles own presentation projections, not CMS schemas. */
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
      status: 'stub',
      intent:
        'A compact publication presentation. Content selection and mapping to shared card primitives have not been designed.',
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
          layout: {
            image: true,
            before: ['labels', 'published'],
            after: ['identifier', 'summary', 'sources', 'language'],
          },
        },
      },
    },
  },
};
