/** Source-independent archetype; profiles own presentation projections, not CMS schemas. */
export const landingPagePatterns = {
  id: 'landing-page',
  name: 'Landing page',
  model: {
    status: 'provisional',
    intent:
      'An editorial entry point that introduces a subject and offers routes to related material.',
  },
  presentations: {
    fullPage: {
      status: 'reference',
      intent:
        'Existing topic/initiative landing-page reference; family-specific contract alignment remains open.',
      reference: {
        kind: 'Patterns/Landing pages',
        story: 'Topic or initiative',
        id: 'patterns-landing-pages--topic-landing',
      },
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search presentation. Profiles select editorial metadata; layout is shared. This input is not a canonical domain model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Landing page',
        id: 'patterns-content-teaser--landing-page',
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact landing page presentation. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
  defaultProfile: 'default',
  profiles: {
    default: {
      name: 'Default',
      intent:
        'An editorial entry point that introduces a subject and offers routes to related material.',
      presentations: {
        teaser: {
          status: 'experimental',
          reference: {
            kind: 'Patterns/Content teaser',
            story: 'Landing page',
            id: 'patterns-content-teaser--landing-page',
          },
          layout: {
            image: true,
            before: ['labels'],
            after: ['summary'],
          },
        },
      },
    },
  },
};
