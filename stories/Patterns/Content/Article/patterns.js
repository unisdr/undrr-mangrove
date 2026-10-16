/** Archetype and profile projections; layout does not select content. */
export const articlePatterns = {
  id: 'article',
  name: 'Article',
  model: {
    status: 'provisional',
    intent:
      'An editorial article, including reported news and attributed commentary. Profiles describe editorial purpose rather than a source CMS bundle.',
  },
  presentations: {
    fullPage: {
      status: 'reference',
      intent:
        'Existing article-page reference; a shared article domain contract and adapter are still provisional.',
      reference: {
        kind: 'Patterns/Content/Article/Full page',
        story: 'Large, prominent image',
        id: 'patterns-article-story--large-image',
      },
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search presentation. Profiles select editorial metadata; layout is shared. This input is not a canonical domain model.',
      reference: {
        kind: 'Patterns/Content teaser',
        story: 'News',
        id: 'patterns-content-teaser--news',
      },
    },
    card: {
      status: 'experimental',
      intent:
        'Compact card selection; vertical and book are alternate layouts of this presentation.',
      reference: {
        kind: 'Patterns/Content card',
        story: 'News',
        id: 'patterns-content-card--news',
      },
      layouts: ['vertical', 'book'],
      layoutReferences: {
        vertical: {
          kind: 'Patterns/Content card',
          story: 'News',
          id: 'patterns-content-card--news',
        },
        book: {
          kind: 'Patterns/Content card',
          story: 'News book',
          id: 'patterns-content-card--news-book',
        },
      },
      basis: 'audited-card-selection',
    },
  },
  defaultProfile: 'news',
  profiles: {
    news: {
      name: 'News',
      intent:
        'An editorial news item with release date, attribution and media.',
      presentations: {
        teaser: {
          status: 'experimental',
          reference: {
            kind: 'Patterns/Content teaser',
            story: 'News',
            id: 'patterns-content-teaser--news',
          },
          fields: {
            before: ['labels', 'published'],
            after: ['summary', 'sources', 'language'],
            useShortTitle: true,
            media: 'photo',
          },
        },
        card: {
          status: 'experimental',
          intent:
            'Compact card selection; vertical and book are alternate layouts of this presentation.',
          reference: {
            kind: 'Patterns/Content card',
            story: 'News',
            id: 'patterns-content-card--news',
          },
          fields: {
            media: 'photo',
            before: ['labels'],
            after: [],
            useShortTitle: true,
          },
          layouts: ['vertical', 'book'],
          layoutReferences: {
            vertical: {
              kind: 'Patterns/Content card',
              story: 'News',
              id: 'patterns-content-card--news',
            },
            book: {
              kind: 'Patterns/Content card',
              story: 'News book',
              id: 'patterns-content-card--news-book',
            },
          },
          basis: 'audited-card-selection',
        },
      },
    },
    commentary: {
      name: 'Commentary',
      intent:
        'An authored opinion or reflection with author attribution and publication date.',
      presentations: {
        teaser: {
          status: 'experimental',
          reference: {
            kind: 'Patterns/Content teaser',
            story: 'Blog',
            id: 'patterns-content-teaser--blog',
          },
          fields: {
            before: ['labels', 'published', 'authors'],
            after: ['summary'],
            media: 'photo',
          },
        },
        card: {
          status: 'experimental',
          intent:
            'Compact card selection; vertical and book are alternate layouts of this presentation.',
          reference: {
            kind: 'Patterns/Content card',
            story: 'Commentary',
            id: 'patterns-content-card--commentary',
          },
          fields: {
            media: 'photo',
            before: ['labels'],
            after: [],
          },
          layouts: ['vertical', 'book'],
          layoutReferences: {
            vertical: {
              kind: 'Patterns/Content card',
              story: 'Commentary',
              id: 'patterns-content-card--commentary',
            },
            book: {
              kind: 'Patterns/Content card',
              story: 'Commentary book',
              id: 'patterns-content-card--commentary-book',
            },
          },
          basis: 'audited-card-selection',
        },
      },
    },
  },
};
