/** Content family and presentation status; stubs expose no renderable component. */
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
        'Horizontal listing/search projection, with audited metadata hierarchy and media rules. This input is not the canonical content model.',
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
    card: {
      status: 'stub',
      intent:
        'A compact landing page card. Content selection and mapping to shared card primitives have not been designed.',
    },
  },
};
