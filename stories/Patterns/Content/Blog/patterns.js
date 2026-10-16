/** Content family and presentation status; stubs expose no renderable component. */
export const blogPatterns = {
  id: 'blog',
  name: 'Blog',
  model: {
    status: 'provisional',
    intent:
      'An authored opinion or reflection with author attribution and publication date.',
  },
  presentations: {
    fullPage: {
      status: 'stub',
      intent:
        'A full blog page. Information hierarchy, content requirements, actions and responsive behaviour have not been designed.',
    },
    teaser: {
      status: 'experimental',
      intent:
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
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
    card: {
      status: 'stub',
      intent:
        'A compact blog card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
