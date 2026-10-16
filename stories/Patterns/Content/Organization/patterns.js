/** Source-independent archetype; profiles own presentation projections, not CMS schemas. */
export const organizationPatterns = {
  id: 'organization',
  name: 'Organisation',
  model: {
    status: 'provisional',
    intent:
      'An organisation with identity, complete logo, locations and categories.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full organisation page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search presentation. Profiles select editorial metadata; layout is shared. This input is not a canonical domain model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Organisation',
        id: 'patterns-content-teaser--organization',
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact organisation presentation. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
  defaultProfile: 'general',
  profiles: {
    general: {
      name: 'General',
      intent:
        'An organisation with identity, complete logo, locations and categories.',
      presentations: {
        teaser: {
          status: 'experimental',
          reference: {
            kind: 'Patterns/Content teaser',
            story: 'Organisation',
            id: 'patterns-content-teaser--organization',
          },
          layout: {
            image: true,
            logo: true,
            before: ['location'],
            after: ['summary', 'organizationType'],
          },
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
          layout: {
            before: ['labels'],
            after: ['summary'],
          },
        },
      },
    },
  },
};
