/** Source-independent archetypes. CMS bindings live in Integrations/Drupal. */
import { articlePatterns } from './Article/patterns.js';
import { publicationPatterns } from './Publication/patterns.js';
import { resourcePatterns } from './Resource/patterns.js';
import { eventPatterns } from './Event/patterns.js';
import { organizationPatterns } from './Organization/patterns.js';
import { collectionPatterns } from './Collection/patterns.js';
import { opportunityPatterns } from './Opportunity/patterns.js';
import { referenceEntryPatterns } from './ReferenceEntry/patterns.js';
import { commitmentPatterns } from './Commitment/patterns.js';
import { landingPagePatterns } from './LandingPage/patterns.js';
import { personPatterns } from './Person/patterns.js';

export const CONTENT_FAMILIES = [
  articlePatterns,
  publicationPatterns,
  resourcePatterns,
  eventPatterns,
  organizationPatterns,
  collectionPatterns,
  opportunityPatterns,
  referenceEntryPatterns,
  commitmentPatterns,
  landingPagePatterns,
  personPatterns,
];

// Literal IDs keep PropTypes discoverable through react-docgen.
export const CONTENT_FAMILY_IDS = [
  'article',
  'publication',
  'resource',
  'event',
  'organization',
  'collection',
  'opportunity',
  'reference-entry',
  'commitment',
  'landing-page',
  'person',
];
