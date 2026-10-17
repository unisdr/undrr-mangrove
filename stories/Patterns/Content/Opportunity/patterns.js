/** Archetype and profile projections; layout does not select content. */
export const opportunityPatterns = {
  id: 'opportunity',
  name: 'Opportunity',
  model: {
    status: 'provisional',
    intent:
      'An invitation to apply, contribute or take part, with conditions and a decision window. Jobs are the initial editorial profile.',
    readerNeeds: [
      'Assess the role or opportunity, offering organization, location and participation conditions.',
      'Understand eligibility, deadlines and current availability before investing in an application.',
      'Find application instructions and supporting details; distinguish a closing deadline from a publication date.',
    ],
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full opportunity page. The full-page information hierarchy, detailed content selection, actions and responsive behaviour have not been designed.',
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
      status: 'experimental',
      intent:
        'Compact card selection; vertical and book are alternate layouts of this presentation.',
      reference: {
        kind: 'Patterns/Content card',
        story: 'Job',
        id: 'patterns-content-card--job',
      },
      layouts: ['vertical', 'book'],
      layoutReferences: {
        vertical: {
          kind: 'Patterns/Content card',
          story: 'Job',
          id: 'patterns-content-card--job',
        },
        book: {
          kind: 'Patterns/Content card',
          story: 'Job book',
          id: 'patterns-content-card--job-book',
        },
      },
      basis: 'audited-card-selection',
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
          fields: {
            before: ['labels', 'location', 'deadline', 'status'],
            after: ['summary'],
            media: 'none',
          },
        },
        card: {
          status: 'experimental',
          intent:
            'Compact card selection; vertical and book are alternate layouts of this presentation.',
          reference: {
            kind: 'Patterns/Content card',
            story: 'Job',
            id: 'patterns-content-card--job',
          },
          fields: {
            media: 'none',
            before: [],
            after: [],
          },
          layouts: ['vertical', 'book'],
          layoutReferences: {
            vertical: {
              kind: 'Patterns/Content card',
              story: 'Job',
              id: 'patterns-content-card--job',
            },
            book: {
              kind: 'Patterns/Content card',
              story: 'Job book',
              id: 'patterns-content-card--job-book',
            },
          },
          basis: 'audited-card-selection',
        },
      },
    },
  },
};
