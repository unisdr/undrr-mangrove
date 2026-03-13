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
 * Taxonomy vocabulary configuration for term results.
 * Maps vocabulary machine names (from ES `vid` field) to display info.
 * Only vocabularies that should appear in search results are listed here.
 *
 * @type {Array<{id: string, name: string, domain: string}>}
 */
export const TAXONOMY_VOCABULARIES = [
  { id: 'prevention_web_regions', name: 'Country', domain: 'www_preventionweb_net' },
  { id: 'hazard', name: 'Hazard', domain: 'www_preventionweb_net' },
  { id: 'theme', name: 'Theme', domain: 'www_preventionweb_net' },
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
  // Organization subtypes - field_organization_type indexed on org nodes (list field, string values)
  // Also available as org_type_ref (traversal) on content types that reference organizations
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
    rendered_item: 3.0,
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

  // Display mode
  displayMode: 'list', // 'list', 'card', 'card-book'
  gridColumns: null, // Grid columns for card modes (2-6). null = use resultsPerPage.

  // Teaser field visibility
  visibleTeaserFields: null, // {image: false, date: false, ...} — null = all visible

  // Require image — adds has_image:true filter to exclude results without images
  requireImage: false,

  // Tier filters — array of tier names to restrict results by editorial weight or freshness.
  // Tier boundaries are derived from SCORING_CONFIG so definitions aren't duplicated.
  // Interestingness tiers: 'demoted', 'deferred', 'average', 'promoted', 'announced'
  // Longevity tiers: 'today', 'days', 'week', 'month', 'year', 'longtime', 'always'
  // e.g., interestingnessTiers: ['promoted', 'announced'] only returns high-priority content
  interestingnessTiers: [],
  longevityTiers: [],

};

/**
 * Lookup maps for fast access.
 */
export const DOMAIN_MAP = new Map(DOMAINS.map(d => [d.id, d]));
export const CONTENT_TYPE_MAP = new Map(CONTENT_TYPES.map(t => [t.id, t]));
export const NEWS_TYPE_MAP = new Map(NEWS_TYPES.map(t => [t.id, t]));
export const LANGUAGE_MAP = new Map(LANGUAGES.map(l => [l.id, l]));
export const TAXONOMY_VOCABULARY_MAP = new Map(TAXONOMY_VOCABULARIES.map(v => [v.id, v]));

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
 * Get taxonomy vocabulary info by ID.
 * @param {string} vid - The vocabulary machine name
 * @returns {Object|undefined} Vocabulary info or undefined if not found
 */
export function getTaxonomyVocabulary(vid) {
  return TAXONOMY_VOCABULARY_MAP.get(vid);
}

/**
 * Check if a search result is a taxonomy term (vs a node).
 * Taxonomy terms have `vid` (vocabulary) but no `type` (content type).
 * @param {Object} source - Elasticsearch _source object
 * @returns {boolean} True if the result is a taxonomy term
 */
export function isTaxonomyTermResult(source) {
  return source?.vid !== undefined && source?.nid === undefined;
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
 * Toggleable teaser fields and the BEM selectors they control.
 * This is the single source of truth — the SCSS rules, buildHiddenFieldClasses(),
 * and story configs all derive from this list.
 *
 * Each entry maps a config key (used in `visibleTeaserFields`) to:
 * - `label` — human-readable name for Storybook / docs
 * - `selector` — CSS selector targeted by `mg-search--hide-{key}`
 *
 * Title (.mg-card__title) is intentionally not toggleable.
 *
 * @type {Object.<string, {label: string, selector: string}>}
 */
export const TEASER_FIELDS = {
  image:           { label: 'Image',            selector: '.mg-card__visual' },
  contentType:     { label: 'Content type',     selector: '.mg-card__tag' },
  publicationType: { label: 'Publication type', selector: '.mg-card__publication-type' },
  date:            { label: 'Date',             selector: '.mg-card__date' },
  summary:         { label: 'Summary',          selector: '.mg-card__description' },
  siteName:        { label: 'Site name',        selector: '.mg-search__result-site-name' },
  organization:    { label: 'Organization',     selector: '.mg-card__organization' },
};

/**
 * Build a visibleTeaserFields object with all fields set to `true`.
 * Useful as a starting point when you want to hide only specific fields.
 *
 * @returns {Object.<string, boolean>}
 * @example
 * const fields = allTeaserFieldsVisible();
 * // => { image: true, contentType: true, publicationType: true, date: true, summary: true, siteName: true, organization: true }
 */
export function allTeaserFieldsVisible() {
  return Object.fromEntries(Object.keys(TEASER_FIELDS).map(k => [k, true]));
}

/**
 * Build CSS modifier classes to hide teaser fields based on visibility config.
 *
 * The corresponding SCSS rules target standard mg-card__* BEM wrapper classes
 * (e.g., .mg-card__visual, .mg-card__date, .mg-card__description).
 * Drupal teaser templates add these classes (see web-backlog#2660), and
 * Elasticsearch indexes the pre-rendered markup with them intact.
 *
 * @param {Object|null} visibleTeaserFields - Map of field keys to booleans. null = all visible.
 * @returns {string} Space-separated CSS class string (e.g., 'mg-search--hide-image mg-search--hide-date')
 *
 * @example
 * buildHiddenFieldClasses(null) // => ''
 * buildHiddenFieldClasses({ image: false, date: false }) // => 'mg-search--hide-image mg-search--hide-date'
 * buildHiddenFieldClasses({ image: true }) // => ''
 */
export function buildHiddenFieldClasses(visibleTeaserFields) {
  if (!visibleTeaserFields) return '';
  return Object.entries(visibleTeaserFields)
    .filter(([, visible]) => visible === false)
    .map(([field]) => `mg-search--hide-${field}`)
    .join(' ');
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

  // Check for namespaced subtype or vocabulary (field:id pattern)
  if (valueStr.includes(':')) {
    // Check for taxonomy vocabulary (vid:hazard, vid:theme, etc.)
    if (valueStr.startsWith('vid:')) {
      const vocabId = valueStr.slice(4);
      const vocab = TAXONOMY_VOCABULARY_MAP.get(vocabId);
      return {
        field: 'vid',
        value: vocabId,
        label: vocab?.name || vocabId,
        isSubtype: false,
        isVocabulary: true,
        parentType: null,
      };
    }

    const subtype = SUBTYPE_MAP.get(valueStr);
    if (subtype) {
      return {
        field: subtype.field,
        value: subtype.id,
        label: subtype.name,
        isSubtype: true,
        isVocabulary: false,
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
      isVocabulary: false,
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
    isVocabulary: false,
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

/**
 * Convert scoring tier config (cumulative max values) to filter ranges (min/max).
 *
 * SCORING_CONFIG stores tiers as `{ tierName: { max, weight|scale } }` where each
 * tier's min is implicitly the previous tier's max + 1. This function derives
 * explicit `{ min, max }` ranges for use in ES query_string range filters.
 *
 * @param {Object} tiers - Tier config from SCORING_CONFIG (e.g., SCORING_CONFIG.interestingness)
 * @returns {Object} Map of tier name → { min, max }
 */
export function buildTierRanges(tiers) {
  // Sort by max to guarantee correct min/max derivation regardless of
  // Object.entries() iteration order.
  const entries = Object.entries(tiers).sort((a, b) => a[1].max - b[1].max);
  const ranges = {};
  let prevMax = -1;
  for (const [name, tier] of entries) {
    ranges[name] = { min: prevMax + 1, max: tier.max };
    prevMax = tier.max;
  }
  return ranges;
}

/**
 * Build an Elasticsearch filter for selected tier names.
 * Returns a `range` query (single tier) or `bool.should` of `range` queries
 * (multiple tiers) — avoids query_string parsing overhead and escaping risks.
 *
 * @param {string} field - ES field name (e.g., 'field_meta_interestingness')
 * @param {Array<string>} tierNames - Selected tier keys (e.g., ['promoted', 'announced'])
 * @param {Object} tierRanges - Tier ranges with { min, max } per key (from buildTierRanges)
 * @returns {Object|null} ES filter clause or null
 */
export function buildTierFilter(field, tierNames, tierRanges) {
  if (!Array.isArray(tierNames) || tierNames.length === 0) return null;

  const rangeFilters = tierNames
    .filter(name => tierRanges[name])
    .map(name => ({ range: { [field]: { gte: tierRanges[name].min, lte: tierRanges[name].max } } }));

  if (rangeFilters.length === 0) return null;
  if (rangeFilters.length === 1) return rangeFilters[0];
  return { bool: { should: rangeFilters, minimum_should_match: 1 } };
}
