/** Family catalogue. Presentation projections are distinct from canonical domain contracts. */
import { newsPatterns } from './News/patterns.js';
import { publicationPatterns } from './Publication/patterns.js';
import { resourcePatterns } from './Resource/patterns.js';
import { eventPatterns } from './Event/patterns.js';
import { blogPatterns } from './Blog/patterns.js';
import { organizationPatterns } from './Organization/patterns.js';
import { collectionPatterns } from './Collection/patterns.js';
import { vacancyPatterns } from './Vacancy/patterns.js';
import { hazardProfilePatterns } from './HazardProfile/patterns.js';
import { conferenceSessionPatterns } from './ConferenceSession/patterns.js';
import { commitmentPatterns } from './Commitment/patterns.js';
import { landingPagePatterns } from './LandingPage/patterns.js';
import { nationalPlatformPatterns } from './NationalPlatform/patterns.js';
import { terminologyPatterns } from './Terminology/patterns.js';
import { personPatterns } from './Person/patterns.js';

export const CONTENT_FAMILIES = [
  newsPatterns,
  publicationPatterns,
  resourcePatterns,
  eventPatterns,
  blogPatterns,
  organizationPatterns,
  collectionPatterns,
  vacancyPatterns,
  hazardProfilePatterns,
  conferenceSessionPatterns,
  commitmentPatterns,
  landingPagePatterns,
  nationalPlatformPatterns,
  terminologyPatterns,
  personPatterns,
];

// Literal IDs keep component PropTypes discoverable through react-docgen.
export const CONTENT_FAMILY_IDS = [
  'news',
  'publication',
  'resource',
  'event',
  'blog',
  'organization',
  'collection',
  'vacancy',
  'hazard-profile',
  'conference-session',
  'commitment',
  'landing-page',
  'national-platform',
  'terminology',
  'person',
];
