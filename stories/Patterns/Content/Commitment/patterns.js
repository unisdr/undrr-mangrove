/** Source-independent archetype; profiles own presentation projections, not CMS schemas. */
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
      status: 'stub',
      intent:
        'A compact commitment presentation. Content selection and mapping to shared card primitives have not been designed.',
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
          layout: {
            image: true,
            before: ['scope', 'status', 'published'],
            after: ['summary'],
          },
        },
      },
    },
  },
};
