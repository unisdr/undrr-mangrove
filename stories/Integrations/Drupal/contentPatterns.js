/** Drupal is a major Mangrove consumer. Keep its explicit bindings here, outside rendering.
 * Bundle selection only: field extraction, eligibility and URL policy remain adapter work.
 * National platform provisionally uses an institutional coordination-platform profile;
 * an activity-led portal may instead map to landing-page after consumer review.
 */
export const DRUPAL_CONTENT_PATTERNS = {
  news: {
    type: 'article',
    profile: 'news',
  },
  publication: {
    type: 'publication',
    profile: 'default',
  },
  resource: {
    type: 'resource',
    profile: 'default',
  },
  event: {
    type: 'event',
    profile: 'general',
  },
  blog: {
    type: 'article',
    profile: 'commentary',
  },
  organization: {
    type: 'organization',
    profile: 'general',
  },
  collections: {
    type: 'collection',
    profile: 'default',
  },
  vacancy: {
    type: 'opportunity',
    profile: 'job',
  },
  hazard_information_profile: {
    type: 'reference-entry',
    profile: 'hazard-profile',
  },
  conference_event: {
    type: 'event',
    profile: 'programme-session',
  },
  commitment: {
    type: 'commitment',
    profile: 'default',
  },
  landing_page_gutenberg: {
    type: 'landing-page',
    profile: 'default',
  },
  national_platform: {
    type: 'organization',
    profile: 'coordination-platform',
  },
  terminology: {
    type: 'reference-entry',
    profile: 'definition',
  },
  people: {
    type: 'person',
    profile: 'default',
  },
};
