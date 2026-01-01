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
  { id: 'conference_event', name: 'Conference event' },
  { id: 'landing_page_gutenberg', name: 'Landing pages' },
  { id: 'landing', name: 'Landing and thematic pages' },
  { id: 'vacancy', name: 'Vacancy' },
  { id: 'resource', name: 'Resources and training' },
  { id: 'collections', name: 'Collection guide' },
  { id: 'publication', name: 'Publication' },
  { id: 'blog', name: 'DRR Voices' },
  { id: 'terminology', name: 'Term' },
  { id: 'organization', name: 'Organization' },
  { id: 'national_platform', name: 'National Platform' },
  { id: 'hazard_information_profile', name: 'Hazard information profile' },
  { id: 'conference', name: 'Conference' },
  { id: 'commitment', name: 'Commitment' },
  { id: 'focal_point', name: 'Focal point' },
  { id: 'people', name: 'People' },
];

/**
 * Content subtype configuration.
 * Maps parent content types to their subtype fields and options.
 * Subtypes appear as indented children under parent types in the Type dropdown.
 *
 * @type {Object.<string, {field: string, options: Array<{id: string, name: string}>}>}
 */
export const CONTENT_SUBTYPES = {
  // Only field_news_type is currently indexed in Elasticsearch.
  // Other subtype fields need to be added to the search_api index before enabling.
  news: {
    field: 'field_news_type',
    options: [
      { id: '751', name: 'Update' },
      { id: '752', name: 'Press release' },
      { id: '1', name: 'Statements and messages' },
      { id: '754', name: 'Feature' },
      { id: '755', name: 'Research briefs' },
      { id: '797', name: 'Community announcement' },
      { id: '756', name: 'Op Ed' },
    ],
  },
  // Blog subtypes - field_blog_type indexed in ES
  blog: {
    field: 'field_blog_type',
    options: [
      { id: '822', name: 'Blog' },
      { id: '880', name: 'Interview' },
    ],
  },
  // Publication subtypes - undrr_publication_type IS indexed
  publication: {
    field: 'undrr_publication_type',
    options: [
      { id: '744', name: 'Fact sheet' },
      { id: '749', name: 'Newsletter' },
      { id: '750', name: 'Other' },
      { id: '1027', name: 'Policy brief' },
      { id: '746', name: 'Reports' },
      { id: '743', name: 'Tool kit' },
      { id: '745', name: 'UNDRR Document' },
      { id: '747', name: 'Words into Action' },
      { id: '748', name: 'Working paper' },
    ],
  },
  // Resource subtypes - field_resource_type indexed in ES
  resource: {
    field: 'field_resource_type',
    options: [
      { id: '61', name: 'Academic programme' },
      { id: '1181', name: 'Case study' },
      { id: '62', name: 'Training course' },
    ],
  },
  // Organization subtypes - field_organization_type NOT YET indexed (list field, string values)
  organization: {
    field: 'field_organization_type',
    options: [
      { id: 'academicscientific', name: 'Academic & scientific' },
      { id: 'governments', name: 'Governments' },
      { id: 'nongovernmentalorganizations', name: 'Non-governmental organizations' },
      { id: 'newsandmedia', name: 'News & media' },
      { id: 'privatesector', name: 'Private sector' },
      { id: 'networksandothers', name: 'Networks & others' },
      { id: 'arise_member', name: 'ARISE member' },
      { id: 'uninternationalorganizations', name: 'UN & international organizations' },
      { id: 'regionalintergovernmentalorganizations', name: 'Regional intergovernmental organizations' },
      { id: 'arise_network', name: 'ARISE network' },
    ],
  },
  // Policy subtypes - field_policy_type indexed in ES (used by publications)
  // Note: This may overlap with publication subtypes - consider if both are needed
  // policy: {
  //   field: 'field_policy_type',
  //   options: [
  //     { id: '946', name: 'Intergovernmental declarations' },
  //     { id: '821', name: 'Local policies and plans' },
  //     { id: '819', name: 'National legal frameworks' },
  //     { id: '818', name: 'National policies and plans' },
  //     { id: '820', name: 'Regional policies and plans' },
  //   ],
  // },
  //
  // ----- NOT YET INDEXED IN ES -----
  // Event subtypes - field_event_type_term needs to be added to search_api index
  // event: {
  //   field: 'field_event_type_term',
  //   options: [
  //     { id: '783', name: 'Meetings and conferences' },
  //     { id: '784', name: 'Training event' },
  //   ],
  // },
};

/**
 * News subtypes (merged into type filter via field_news_type).
 * @deprecated Use CONTENT_SUBTYPES.news.options instead
 * @type {Array<{id: string, name: string}>}
 */
export const NEWS_TYPES = CONTENT_SUBTYPES.news.options;

/**
 * Language configuration.
 * @type {Array<{id: string, name: string, default?: boolean}>}
 */
export const LANGUAGES = [
  { id: 'en', name: 'English', default: true },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
  { id: 'ja', name: 'Japanese' },
  { id: 'ar', name: 'Arabic' },
  { id: 'ko', name: 'Korean' },
  { id: 'zh-hans', name: 'Chinese' },
  { id: 'ru', name: 'Russian' },
  { id: 'pt-pt', name: 'Portuguese' },
  { id: 'und', name: 'Undetermined' },
  // ISO 639-2 `zxx` means "No linguistic content; Not applicable".
  // Ref: https://www.loc.gov/standards/iso639-2/php/langcodes_name.php?code_ID=504
  { id: 'zxx', name: 'No language specified' },
];

/**
 * Facets that always use OR logic (no toggle shown).
 * These are facets where AND doesn't make semantic sense:
 * - Content can't be in multiple languages simultaneously
 * - Single website/domain selection
 * - Content can only have one type
 * @type {Array<string>}
 */
export const ALWAYS_OR_FACETS = [
  '_language',
  'field_domain_access',
  'year', // A document can only have one publication year
  'type', // Content can only have one content type
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
  // Subtype fields - merged into the type dropdown but need aggregations
  // These are indexed in ES (field names differ from Drupal field names)
  { key: 'field_news_type', label: 'News type', vocabulary: 'terms', type: 'select-multiple' },
  { key: 'field_blog_type', label: 'Blog type', vocabulary: 'terms', type: 'select-multiple' },
  { key: 'undrr_publication_type', label: 'Publication type', vocabulary: 'terms', type: 'select-multiple' },
  { key: 'field_resource_type', label: 'Resource type', vocabulary: 'terms', type: 'select-multiple' },
  { key: 'field_organization_type', label: 'Organization type', vocabulary: 'list', type: 'select-multiple' },
  // field_policy_type is indexed but not used as subtypes currently (see CONTENT_SUBTYPES)
  // { key: 'field_policy_type', label: 'Policy type', vocabulary: 'terms', type: 'select-multiple' },
  // Not indexed yet - needs to be added to search_api.index.multidomain.yml:
  // { key: 'field_event_type_term', label: 'Event type', vocabulary: 'terms', type: 'select-multiple' },
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
  // TODO: Revert to production endpoint after testing
  searchEndpoint: 'https://www.undrr.org/search-endpoint',
  // searchEndpoint: 'https://novarnish.preventionweb.ddev.site/search-endpoint',
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
  showPager: true,

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
 * Build a map of all subtype options across all parent types.
 * Key format: "field:id" (e.g., "field_news_type:751")
 * @type {Map<string, {id: string, name: string, field: string, parentType: string}>}
 */
export const SUBTYPE_MAP = new Map(
  Object.entries(CONTENT_SUBTYPES).flatMap(([parentType, config]) =>
    config.options.map(option => [
      `${config.field}:${option.id}`,
      { ...option, field: config.field, parentType },
    ])
  )
);

/**
 * Map of subtype field names to their parent content type.
 * @type {Map<string, string>}
 */
export const SUBTYPE_FIELD_TO_PARENT = new Map(
  Object.entries(CONTENT_SUBTYPES).map(([parentType, config]) => [config.field, parentType])
);

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

/**
 * Parse a type value that may be namespaced (e.g., "field_news_type:751").
 * Used for unified handling of content types and their subtypes.
 *
 * @param {string} value - The type value (plain like "news" or namespaced like "field_news_type:751")
 * @returns {{field: string, value: string, label: string, isSubtype: boolean, parentType: string|null}}
 *
 * @example
 * parseTypeValue('news')
 * // => { field: 'type', value: 'news', label: 'News', isSubtype: false, parentType: null }
 *
 * parseTypeValue('field_news_type:751')
 * // => { field: 'field_news_type', value: '751', label: 'Update', isSubtype: true, parentType: 'news' }
 */
export function parseTypeValue(value) {
  const valueStr = String(value);

  // Check for namespaced subtype (field:id pattern)
  if (valueStr.includes(':')) {
    const subtype = SUBTYPE_MAP.get(valueStr);
    if (subtype) {
      return {
        field: subtype.field,
        value: subtype.id,
        label: subtype.name,
        isSubtype: true,
        parentType: subtype.parentType,
      };
    }
    // Unknown namespaced value - parse it anyway
    const [field, id] = valueStr.split(':');
    return {
      field,
      value: id,
      label: id,
      isSubtype: true,
      parentType: SUBTYPE_FIELD_TO_PARENT.get(field) || null,
    };
  }

  // Plain content type
  const contentType = CONTENT_TYPE_MAP.get(valueStr);
  return {
    field: 'type',
    value: valueStr,
    label: contentType?.name || valueStr,
    isSubtype: false,
    parentType: null,
  };
}

/**
 * Create a namespaced type value for a subtype.
 *
 * @param {string} field - The ES field name (e.g., "field_news_type")
 * @param {string} id - The subtype ID (e.g., "751")
 * @returns {string} Namespaced value (e.g., "field_news_type:751")
 */
export function createSubtypeValue(field, id) {
  return `${field}:${id}`;
}

/**
 * Check if a value represents a subtype (namespaced format).
 *
 * @param {string} value - The value to check
 * @returns {boolean} True if value is a namespaced subtype
 */
export function isSubtypeValue(value) {
  return String(value).includes(':');
}

/**
 * Get the parent content type for a subtype field.
 *
 * @param {string} field - The subtype field name (e.g., "field_news_type")
 * @returns {string|null} Parent type ID or null if not found
 */
export function getParentTypeForField(field) {
  return SUBTYPE_FIELD_TO_PARENT.get(field) || null;
}

/**
 * Get subtype configuration for a parent content type.
 *
 * @param {string} parentType - The parent type ID (e.g., "news")
 * @returns {{field: string, options: Array}|null} Subtype config or null if none
 */
export function getSubtypesForType(parentType) {
  return CONTENT_SUBTYPES[parentType] || null;
}
