/** Source-neutral patterns; see docs/CONTENT-TEASER-DRUPAL-AUDIT.md for provenance. */
export const TEASER_PATTERNS = {
  news: {
    image: true,
    before: ['labels', 'published'],
    after: ['summary', 'sources', 'language'],
  },
  publication: {
    image: true,
    before: ['labels', 'published'],
    after: ['identifier', 'summary', 'sources', 'language'],
  },
  resource: {
    before: ['labels', 'location', 'delivery'],
    after: ['summary', 'sources', 'language'],
  },
  event: {
    before: ['labels', 'location', 'event', 'delivery'],
    after: ['summary', 'language'],
  },
  blog: {
    image: true,
    before: ['labels', 'published', 'authors'],
    after: ['summary'],
  },
  organization: {
    image: true,
    logo: true,
    before: ['location'],
    after: ['summary', 'organizationType'],
  },
  collection: {
    image: true,
    before: ['labels', 'freshness'],
    after: ['summary'],
  },
  vacancy: {
    before: ['labels', 'location', 'deadline', 'status'],
    after: ['summary'],
  },
  'hazard-profile': {
    before: ['classification', 'identifier'],
    after: ['summary'],
  },
  'conference-session': {
    image: true,
    before: ['bucket', 'schedule', 'exhibitions', 'room', 'format'],
    after: ['summary', 'topics'],
  },
  commitment: {
    image: true,
    before: ['scope', 'status', 'published'],
    after: ['summary'],
  },
  'landing-page': { image: true, before: ['labels'], after: ['summary'] },
  'national-platform': { before: ['labels'], after: ['summary'] },
  terminology: { before: ['labels'], after: ['summary'] },
  person: { before: [], after: ['summary'] },
};

// Explicit bundle mapping only: this does not extract fields or resolve URLs.
export const DRUPAL_TEASER_TYPES = {
  news: 'news',
  publication: 'publication',
  resource: 'resource',
  event: 'event',
  blog: 'blog',
  organization: 'organization',
  collections: 'collection',
  vacancy: 'vacancy',
  hazard_information_profile: 'hazard-profile',
  conference_event: 'conference-session',
  commitment: 'commitment',
  landing_page_gutenberg: 'landing-page',
  national_platform: 'national-platform',
  terminology: 'terminology',
  people: 'person',
};
