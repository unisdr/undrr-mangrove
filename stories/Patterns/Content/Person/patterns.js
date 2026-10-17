/** Archetype and profile projections; layout does not select content. */
export const personPatterns = {
  id: 'person',
  name: 'Person',
  model: {
    status: 'provisional',
    intent:
      'A public profile that establishes a person’s identity, role, affiliations and relevant experience or contributions.',
    readerNeeds: [
      'Identify the person and understand their role, organization and expertise.',
      'Explore their biography, activities and contributions where published.',
      'Follow relevant public professional links while respecting the intended visibility of personal information.',
    ],
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
      status: 'experimental',
      intent:
        'Compact card selection; vertical and book are alternate layouts of this presentation.',
      reference: {
        kind: 'Patterns/Content card',
        story: 'Person',
        id: 'patterns-content-card--person',
      },
      layouts: ['vertical', 'book'],
      layoutReferences: {
        vertical: {
          kind: 'Patterns/Content card',
          story: 'Person',
          id: 'patterns-content-card--person',
        },
        book: {
          kind: 'Patterns/Content card',
          story: 'Person book',
          id: 'patterns-content-card--person-book',
        },
      },
      basis: 'audited-card-selection',
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
          fields: {
            before: [],
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
            story: 'Person',
            id: 'patterns-content-card--person',
          },
          fields: {
            media: 'photo',
            before: [],
            after: [],
          },
          layouts: ['vertical', 'book'],
          layoutReferences: {
            vertical: {
              kind: 'Patterns/Content card',
              story: 'Person',
              id: 'patterns-content-card--person',
            },
            book: {
              kind: 'Patterns/Content card',
              story: 'Person book',
              id: 'patterns-content-card--person-book',
            },
          },
          basis: 'audited-card-selection',
        },
      },
    },
  },
};
