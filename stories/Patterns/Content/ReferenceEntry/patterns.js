/** Archetype and profile projections; layout does not select content. */
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
      status: 'experimental',
      intent:
        'Mangrove proposal: no explicit Drupal card display exists for this profile. Vertical and book layouts share this compact selection.',
      reference: {
        kind: 'Patterns/Content card',
        story: 'Definition',
        id: 'patterns-content-card--definition',
      },
      layouts: ['vertical', 'book'],
      layoutReferences: {
        vertical: {
          kind: 'Patterns/Content card',
          story: 'Definition',
          id: 'patterns-content-card--definition',
        },
        book: {
          kind: 'Patterns/Content card',
          story: 'Definition book',
          id: 'patterns-content-card--definition-book',
        },
      },
      basis: 'proposed-card-selection',
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
          fields: {
            before: ['labels'],
            after: ['summary'],
            media: 'none',
          },
        },
        card: {
          status: 'experimental',
          intent:
            'Mangrove proposal: no explicit Drupal card display exists for this profile. Vertical and book layouts share this compact selection.',
          reference: {
            kind: 'Patterns/Content card',
            story: 'Definition',
            id: 'patterns-content-card--definition',
          },
          fields: {
            media: 'none',
            before: ['labels'],
            after: ['summary'],
          },
          layouts: ['vertical', 'book'],
          layoutReferences: {
            vertical: {
              kind: 'Patterns/Content card',
              story: 'Definition',
              id: 'patterns-content-card--definition',
            },
            book: {
              kind: 'Patterns/Content card',
              story: 'Definition book',
              id: 'patterns-content-card--definition-book',
            },
          },
          basis: 'proposed-card-selection',
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
          fields: {
            before: ['classification', 'identifier'],
            after: ['summary'],
            media: 'none',
          },
        },
        card: {
          status: 'experimental',
          intent:
            'Mangrove proposal: no explicit Drupal card display exists for this profile. Vertical and book layouts share this compact selection.',
          reference: {
            kind: 'Patterns/Content card',
            story: 'Hazard profile',
            id: 'patterns-content-card--hazard-profile',
          },
          fields: {
            media: 'none',
            before: ['classification', 'identifier'],
            after: [],
          },
          layouts: ['vertical', 'book'],
          layoutReferences: {
            vertical: {
              kind: 'Patterns/Content card',
              story: 'Hazard profile',
              id: 'patterns-content-card--hazard-profile',
            },
            book: {
              kind: 'Patterns/Content card',
              story: 'Hazard profile book',
              id: 'patterns-content-card--hazard-profile-book',
            },
          },
          basis: 'proposed-card-selection',
        },
      },
    },
  },
};
