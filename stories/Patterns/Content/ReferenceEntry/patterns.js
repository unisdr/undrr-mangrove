/** Source-independent archetype; profiles own presentation projections, not CMS schemas. */
export const referenceEntryPatterns = {
  id: 'reference-entry',
  name: 'Reference entry',
  model: {
    status: 'provisional',
    intent:
      'An explanatory reference entry, including a term definition or a classified hazard profile.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full reference-entry page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search presentation. Profiles select editorial metadata; layout is shared. This input is not a canonical domain model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Terminology',
        id: 'patterns-content-teaser--terminology',
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact reference entry presentation. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
  defaultProfile: 'definition',
  profiles: {
    definition: {
      name: 'Definition',
      intent: 'A reference term with a definition and stable identity.',
      presentations: {
        teaser: {
          status: 'experimental',
          reference: {
            kind: 'Patterns/Content teaser',
            story: 'Terminology',
            id: 'patterns-content-teaser--terminology',
          },
          layout: {
            before: ['labels'],
            after: ['summary'],
          },
        },
      },
    },
    'hazard-profile': {
      name: 'Hazard profile',
      intent:
        'A reference hazard definition with classification and stable notation.',
      presentations: {
        teaser: {
          status: 'experimental',
          reference: {
            kind: 'Patterns/Content teaser',
            story: 'Hazard profile',
            id: 'patterns-content-teaser--hazard-profile',
          },
          layout: {
            before: ['classification', 'identifier'],
            after: ['summary'],
          },
        },
      },
    },
  },
};
