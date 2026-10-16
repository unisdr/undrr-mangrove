/** Source-independent archetype; profiles own presentation projections, not CMS schemas. */
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
        kind: 'Patterns/Article story',
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
      status: 'stub',
      intent:
        'A compact article presentation. Content selection and mapping to shared card primitives have not been designed.',
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
          layout: {
            image: true,
            before: ['labels', 'published'],
            after: ['summary', 'sources', 'language'],
            useShortTitle: true,
          },
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
          layout: {
            image: true,
            before: ['labels', 'published', 'authors'],
            after: ['summary'],
          },
        },
      },
    },
  },
};
