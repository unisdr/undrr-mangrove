/** Source-independent archetype; profiles own presentation projections, not CMS schemas. */
export const opportunityPatterns = {
  id: 'opportunity',
  name: 'Opportunity',
  model: {
    status: 'provisional',
    intent:
      'An opportunity to participate or apply; the initial job profile preserves location, deadline and application status.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full opportunity page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search presentation. Profiles select editorial metadata; layout is shared. This input is not a canonical domain model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'Vacancy',
        id: 'patterns-content-teaser--vacancy',
      },
    },
    card: {
      status: 'stub',
      intent:
        'A compact opportunity presentation. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
  defaultProfile: 'job',
  profiles: {
    job: {
      name: 'Job',
      intent:
        'A job opportunity with location, closing deadline and supplied status.',
      presentations: {
        teaser: {
          status: 'experimental',
          reference: {
            kind: 'Patterns/Content teaser',
            story: 'Vacancy',
            id: 'patterns-content-teaser--vacancy',
          },
          layout: {
            before: ['labels', 'location', 'deadline', 'status'],
            after: ['summary'],
          },
        },
      },
    },
  },
};
