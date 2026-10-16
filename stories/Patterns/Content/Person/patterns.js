/** Source-independent archetype; profiles own presentation projections, not CMS schemas. */
export const personPatterns = {
  id: 'person',
  name: 'Person',
  model: {
    status: 'provisional',
    intent:
      'A person with identity and biographical content; individual presentations choose which profile fields to expose.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full person page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search presentation. Profiles select editorial metadata; layout is shared. This input is not a canonical domain model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Person',
        id: 'patterns-content-teaser--person',
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact person presentation. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
  defaultProfile: 'default',
  profiles: {
    default: {
      name: 'Default',
      intent:
        'A person with identity and biographical content; individual presentations choose which profile fields to expose.',
      presentations: {
        teaser: {
          status: 'experimental',
          reference: {
            kind: 'Patterns/Content teaser',
            story: 'Person',
            id: 'patterns-content-teaser--person',
          },
          layout: {
            before: [],
            after: ['summary'],
          },
        },
      },
    },
  },
};
