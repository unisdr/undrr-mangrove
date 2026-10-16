/** Source-independent archetype; profiles own presentation projections, not CMS schemas. */
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
      status: 'stub',
      intent:
        'A compact resource presentation. Content selection and mapping to shared card primitives have not been designed.',
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
          layout: {
            before: ['labels', 'location', 'delivery'],
            after: ['summary', 'sources', 'language'],
          },
        },
      },
    },
  },
};
