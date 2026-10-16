/** Source-neutral patterns; see docs/CONTENT-TEASER-DRUPAL-AUDIT.md for provenance. */
import { CONTENT_FAMILIES } from '../Content/contentFamilies.js';

// Shared rendering consumes each family's teaser projection. Other presentations
// own their own content selection; this map is not a domain schema.
export const TEASER_PATTERNS = Object.fromEntries(
  CONTENT_FAMILIES.map(family => [
    family.id,
    family.presentations.teaser.layout,
  ])
);

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
