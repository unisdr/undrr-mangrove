/**
 * @file constants.js
 * @description Static configuration data for the UNDRR Search Widget.
 *
 * Contains domain mappings, content types, languages, and facet definitions.
 * Ported from vanilla JS SearchWidgetConfig.js.
 *
 * @module SearchWidget/utils/constants
 */

/**
 * Domain configuration - maps domain IDs to display info.
 * @type {Array<{id: string, name: string, url: string}>}
 */
export const DOMAINS = [
  { id: 'www_undrr_org', name: 'UNDRR.org', url: 'https://www.undrr.org' },
  { id: 'www_preventionweb_net', name: 'PreventionWeb', url: 'https://www.preventionweb.net' },
  { id: 'recovery_preventionweb_net', name: 'International Recovery Platform', url: 'https://recovery.preventionweb.net' },
  { id: 'gp_preventionweb_net', name: 'Global Platform', url: 'https://globalplatform.undrr.org' },
  { id: 'mcr2030_undrr_org', name: 'MCR2030', url: 'https://mcr2030.undrr.org' },
  { id: 'iddrr_undrr_org', name: 'IDDRR', url: 'https://iddrr.undrr.org' },
  { id: 'rp_americas_undrr_org', name: 'RP Americas', url: 'https://rp-americas.undrr.org' },
  { id: 'sendaiframework_mtr_undrr_org', name: 'MTR SF', url: 'https://sendaiframework-mtr.undrr.org' },
  { id: 'tsunamiday_undrr_org', name: 'World Tsunami Awareness Day', url: 'https://tsunamiday.undrr.org' },
  { id: 'rp_arabstates_undrr_org', name: 'RP Arab States', url: 'https://rp-arabstates.undrr.org' },
  { id: 'g20drrwg_preventionweb_net', name: 'G20 DRRWG', url: 'https://g20drrwg.preventionweb.net' },
  { id: 'afrp_undrr_org', name: 'Africa Regional Platform', url: 'https://afrp.undrr.org' },
  { id: 'efdrr_undrr_org', name: 'EFDRR', url: 'https://efdrr.undrr.org' },
  { id: 'apmcdrr_undrr_org', name: 'APMCDRR', url: 'https://apmcdrr.undrr.org' },
  { id: 'coecdr_preventionweb_net', name: 'Centre of Excellence', url: 'https://coecdr.preventionweb.net' },
  { id: 'ariseglobalnetwork_org', name: 'ARISE', url: 'https://arise.undrr.org' },
];

/**
 * Content type configuration - all available types with display names.
 * @type {Array<{id: string, name: string}>}
 */
export const CONTENT_TYPES = [
  { id: 'news', name: 'News' },
  { id: 'event', name: 'Event' },
  { id: 'landing', name: 'Landing pages' },
  { id: 'vacancy', name: 'Vacancy' },
  { id: 'resource', name: 'Resources and training' },
  { id: 'collections', name: 'Collection guide' },
  { id: 'publication', name: 'Publication' },
  { id: 'blog', name: 'DRR Voices' },
  { id: 'terminology', name: 'Term' },
  { id: 'organization', name: 'Organization' },
  { id: 'national_platform', name: 'National Platform' },
];

/**
 * News subtypes (merged into type filter via field_news_type).
 * @type {Array<{id: string, name: string}>}
 */
export const NEWS_TYPES = [
  { id: '751', name: 'Update' },
  { id: '752', name: 'Press release' },
  { id: '1', name: 'Statements and messages' },
  { id: '754', name: 'Feature' },
  { id: '797', name: 'Community announcement' },
  { id: '756', name: 'Op Ed' },
];

/**
 * Language configuration.
 * @type {Array<{id: string, name: string, default?: boolean}>}
 */
export const LANGUAGES = [
  { id: 'en', name: 'English', default: true },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'ja', name: 'Japanese' },
  { id: 'ar', name: 'Arabic' },
  { id: 'ko', name: 'Korean' },
  { id: 'zh-hans', name: 'Chinese' },
  { id: 'ru', name: 'Russian' },
  { id: 'pt-pt', name: 'Portuguese' },
];

/**
 * Facets that always use OR logic (no toggle shown).
 * These are facets where AND doesn't make semantic sense:
 * - Content can't be in multiple languages simultaneously
 * - Single website/domain selection
 * @type {Array<string>}
 */
export const ALWAYS_OR_FACETS = [
  '_language',
  'field_domain_access',
  'year', // A document can only have one publication year
];

/**
 * Number of options before showing search input in facet dropdowns.
 * @type {number}
 */
export const FACET_SEARCH_THRESHOLD = 8;

/**
 * Facet field definitions.
 * @type {Array<{key: string, label: string, vocabulary?: string, type: string}>}
 */
export const FACET_FIELDS = [
  { key: 'field_domain_access', label: 'Website', vocabulary: 'field_domain_access', type: 'select-single' },
  { key: 'type', label: 'Type', vocabulary: 'type', type: 'select-multiple' },
  { key: 'field_news_type', label: 'News type', vocabulary: 'terms', type: 'select-multiple' },
  { key: 'year', label: 'Year', type: 'select-multiple' },
  { key: 'field_country_region', label: 'Country and region', vocabulary: 'terms', type: 'select-multiple' },
  { key: 'field_hazard', label: 'Hazard', vocabulary: 'terms', type: 'select-multiple' },
  { key: 'field_theme', label: 'Theme', vocabulary: 'terms', type: 'select-multiple' },
  { key: '_language', label: 'Language', vocabulary: 'languages', type: 'select-single' },
];

/**
 * Default taxonomy API endpoint.
 * Always points to PreventionWeb as the canonical source for taxonomy terms.
 * @type {string}
 */
export const TAXONOMY_API_URL = 'https://www.preventionweb.net/api/v1/taxonomy?vid=news_type,prevention_web_regions,hazard,theme&items_per_page=1000&langcode=en';

/**
 * Search scoring configuration.
 * @type {Object}
 */
export const SCORING_CONFIG = {
  // Content type weights
  contentTypeBoosts: {
    landing: 5.0,
    terminology: 1.5,
  },
  // Field weights for query_string (main search)
  fieldWeights: {
    title: 9.0,
    teaser: 1.2,
    body: 1.0,
    saa_field_attachment: 0.1,
  },
  // Phrase boosting for exact and near-exact phrase matches
  // These boost documents where search terms appear together in order
  // - match: partial word matching
  // - exactPhrase: slop 0, words must be in exact order
  // - nearPhrase: slop 2, allows minor variations (missing articles, word swaps)
  phraseBoosts: {
    teaser: { match: 1, exactPhrase: 5, nearPhrase: 3 },
    title: { match: 2, exactPhrase: 15, nearPhrase: 10 },
    body: { exactPhrase: 10, nearPhrase: 8 },
    saa_field_attachment: { exactPhrase: 1, nearPhrase: 0.5 },
  },
  // Slop value for near-phrase matching (allows N word transpositions/gaps)
  nearPhraseSlop: 2,
  // Stop words to remove from queries for better phrase matching
  // These common words are stripped to improve exact phrase matching
  // e.g., "Draft Articles on the Protection" → "Draft Articles Protection"
  stopWords: [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
    'those', 'it', 'its',
  ],
  // Interestingness thresholds (field_interestingness)
  interestingness: {
    demoted: { max: 10, weight: 0.1 },
    deferred: { max: 30, weight: 0.3 },
    average: { max: 50, weight: 1.0 },
    promoted: { max: 75, weight: 1.5 },
    announced: { max: 100, weight: 3.0 },
  },
  // Longevity-based recency decay (field_longevity)
  longevity: {
    today: { max: 3, scale: 1 },
    days: { max: 20, scale: 5 },
    week: { max: 40, scale: 10 },
    month: { max: 65, scale: 45 },
    year: { max: 85, scale: 365 },
    longtime: { max: 95, scale: 3650 },
    always: { max: 100, scale: 99999 },
  },
  defaultLongevity: 80,
};

/**
 * Highlight configuration for search results.
 * @type {Object}
 */
export const HIGHLIGHT_CONFIG = {
  numberOfFragments: 3,
  fragmentSize: 350,
  preTags: ['<em>'],
  postTags: ['</em>'],
};

/**
 * Default configuration values.
 * @type {Object}
 */
export const DEFAULT_CONFIG = {
  // API Configuration
  searchEndpoint: 'https://www.undrr.org/search-endpoint',
  resultsPerPage: 5,
  facetCountToShow: 500,
  debounceDelay: 300, // Reduced from 750ms - React 19's useDeferredValue handles this better
  minSearchLength: 3,

  // URL Hash Sync
  enableHashSync: 'auto',

  // Default search query and sort
  defaultQuery: '',
  defaultSort: 'relevance',

  // UI element visibility
  showSearchBox: true,
  showResultsCount: true,
  showSearchTimer: false,
  showFacets: true,
  showActiveFilters: true,
  showSearchMetrics: false,

  // Default filter state
  defaultFilters: [{ key: '_language', value: 'en' }],
  visibleFilters: null,

  // Type restrictions
  allowedTypes: null,

  // Query modifications
  queryAppend: '',
  customFilters: [],
  customFacets: [],
};

/**
 * Lookup maps for fast access.
 */
export const DOMAIN_MAP = new Map(DOMAINS.map(d => [d.id, d]));
export const CONTENT_TYPE_MAP = new Map(CONTENT_TYPES.map(t => [t.id, t]));
export const NEWS_TYPE_MAP = new Map(NEWS_TYPES.map(t => [t.id, t]));
export const LANGUAGE_MAP = new Map(LANGUAGES.map(l => [l.id, l]));

/**
 * Get domain info by ID.
 * @param {string} domainId - The domain ID
 * @returns {Object|undefined} Domain info or undefined if not found
 */
export function getDomain(domainId) {
  return DOMAIN_MAP.get(domainId);
}

/**
 * Get content type info by ID.
 * @param {string} typeId - The content type ID
 * @returns {Object|undefined} Content type info or undefined if not found
 */
export function getContentType(typeId) {
  return CONTENT_TYPE_MAP.get(typeId);
}

/**
 * Get news type info by ID.
 * @param {string} newsTypeId - The news type ID
 * @returns {Object|undefined} News type info or undefined if not found
 */
export function getNewsType(newsTypeId) {
  return NEWS_TYPE_MAP.get(newsTypeId);
}

/**
 * Get language info by ID.
 * @param {string} langId - The language ID
 * @returns {Object|undefined} Language info or undefined if not found
 */
export function getLanguage(langId) {
  return LANGUAGE_MAP.get(langId);
}

/**
 * Check if a filter should be visible based on config.
 * @param {string} key - The filter key
 * @param {Object|null} visibleFilters - The visibility configuration
 * @returns {boolean} True if filter should be visible
 */
export function isFilterVisible(key, visibleFilters) {
  if (!visibleFilters) return true;
  return visibleFilters[key] !== false;
}
