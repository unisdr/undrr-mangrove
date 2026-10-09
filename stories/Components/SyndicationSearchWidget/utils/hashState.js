/**
 * @file hashState.js
 * @description Read and write search state in the URL hash.
 *
 * Format (URLSearchParams, repeated keys for multiple values):
 *
 *   #query=flood&page=2&sort=newest
 *    &f.field_hazard=12&f.field_hazard=34&op.field_hazard=AND
 *    &f.type=field_news_type:751
 *
 * Facet keys become Elasticsearch field names in queryBuilder, so only keys
 * of the active facet fields are accepted and values are checked before
 * they reach state. Custom facets are not stored: their selections are
 * option positions, which change meaning when an editor edits the options.
 *
 * @module SearchWidget/utils/hashState
 */

import { SORT_VALUES, SUBTYPE_FIELD_TO_PARENT } from './constants';

const FACET_PREFIX = 'f.';
const OPERATOR_PREFIX = 'op.';
const OPERATORS = ['OR', 'AND'];
const SEARCH_PARAMS = ['query', 'page', 'sort', 'label'];
export const MAX_VALUES_PER_FACET = 50;
export const MAX_VALUE_LENGTH = 200;

/**
 * Whether a hash holds search state at all. Fragments such as
 * `#main-content` (skip link) or table-of-contents anchors don't, and must
 * be left alone rather than read as "no filters".
 *
 * @param {string} hash - Hash, with or without the `#`
 * @returns {boolean} True when any search parameter is present
 */
export function isSearchHash(hash) {
  const raw = (hash || '').replace(/^#/, '');
  if (!raw) return false;
  for (const name of new URLSearchParams(raw).keys()) {
    if (
      SEARCH_PARAMS.includes(name) ||
      name.startsWith(FACET_PREFIX) ||
      name.startsWith(OPERATOR_PREFIX)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Whether a facet value from the hash is acceptable for its key.
 * @param {string} key - Facet key
 * @param {string} value - Value from the hash
 * @returns {boolean}
 */
function isValidFacetValue(key, value) {
  if (!value || value.length > MAX_VALUE_LENGTH) return false;
  if (key === 'year') return /^\d{4}$/.test(value);
  if (key === 'type' && value.includes(':')) {
    // Namespaced values pick the ES field; allow only known ones
    if (value.startsWith('vid:')) return value.length > 4;
    const [field, id, ...rest] = value.split(':');
    return rest.length === 0 && !!id && SUBTYPE_FIELD_TO_PARENT.has(field);
  }
  return true;
}

/**
 * Parse a URL hash into search state.
 *
 * @param {string} hash - `window.location.hash`, with or without the `#`
 * @param {Object} options
 * @param {Array<{key: string}>} options.facetFields - Active facet fields
 * @param {number} [options.maxPage] - Highest valid page; a larger `page`
 *   is ignored (treated as page 1)
 * @returns {{query: (string|null), page: (number|null), label: (string|null),
 *   sort: (string|null), facets: (Object|null), facetOperators: Object}}
 *   `facets` is null when the hash has no valid `f.*` params, meaning
 *   "use the configured defaults".
 */
export function parseHashState(hash, { facetFields, maxPage = Infinity }) {
  const raw = (hash || '').replace(/^#/, '');
  const params = new URLSearchParams(raw);
  const allowed = new Set(facetFields.map(field => field.key));

  const pageParam = parseInt(params.get('page'), 10);
  const sortParam = params.get('sort');

  const facets = {};
  const facetOperators = {};
  for (const name of new Set(params.keys())) {
    if (!name.startsWith(FACET_PREFIX)) continue;
    const key = name.slice(FACET_PREFIX.length);
    if (!allowed.has(key)) continue;
    const values = [
      ...new Set(
        params.getAll(name).filter(value => isValidFacetValue(key, value))
      ),
    ].slice(0, MAX_VALUES_PER_FACET);
    if (values.length > 0) facets[key] = values;
  }
  for (const key of Object.keys(facets)) {
    const operator = params.get(`${OPERATOR_PREFIX}${key}`);
    if (OPERATORS.includes(operator)) facetOperators[key] = operator;
  }

  return {
    query: params.get('query'),
    page:
      Number.isInteger(pageParam) && pageParam > 1 && pageParam <= maxPage
        ? pageParam
        : null,
    label: params.get('label'),
    sort: SORT_VALUES.includes(sortParam) ? sortParam : null,
    facets: Object.keys(facets).length > 0 ? facets : null,
    facetOperators,
  };
}

/**
 * Convert `defaultFilters` config into a facets object.
 * @param {Array<{key: string, value: string}>} defaultFilters
 * @returns {Object} `{ [key]: [values] }`
 */
export function facetsFromDefaults(defaultFilters) {
  const facets = {};
  (defaultFilters || []).forEach(filter => {
    if (filter && filter.key && filter.value) {
      if (!facets[filter.key]) facets[filter.key] = [];
      facets[filter.key].push(filter.value);
    }
  });
  return facets;
}

/**
 * Compare two facets objects, ignoring key order and empty arrays.
 * @param {Object} a
 * @param {Object} b
 * @returns {boolean}
 */
export function facetsEqual(a, b) {
  const entries = obj =>
    Object.entries(obj || {})
      .filter(([, values]) => Array.isArray(values) && values.length > 0)
      .map(([key, values]) => `${key}=${[...values].sort().join('\u0000')}`)
      .sort();
  const ea = entries(a);
  const eb = entries(b);
  return ea.length === eb.length && ea.every((entry, i) => entry === eb[i]);
}

/**
 * Build the hash (without `#`) for a search state.
 *
 * Facets are written only when they differ from the defaults, so a page in
 * its default state keeps a clean URL. When written, all facets are written,
 * including default ones, so the link reproduces the state exactly.
 *
 * @param {Object} state - `{ query, page, sortBy, facets, facetOperators }`
 * @param {Object} options
 * @param {Array<{key: string}>} options.facetFields - Active facet fields
 * @param {Object} options.defaultFacets - Facets from `defaultFilters`
 * @param {string} options.defaultSort - Configured default sort
 * @returns {string} Hash string
 */
export function buildHashString(
  { query, page, sortBy, facets, facetOperators },
  { facetFields, defaultFacets, defaultSort }
) {
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (page && page > 1) params.set('page', String(page));
  if (sortBy && sortBy !== (defaultSort || 'relevance')) {
    params.set('sort', sortBy);
  }

  if (!facetsEqual(facets, defaultFacets)) {
    for (const { key } of facetFields) {
      const values = facets?.[key];
      if (!values || values.length === 0) continue;
      values.forEach(value => params.append(`${FACET_PREFIX}${key}`, value));
      const operator = facetOperators?.[key];
      if (operator === 'AND' && values.length > 1) {
        params.set(`${OPERATOR_PREFIX}${key}`, operator);
      }
    }
  }

  return params.toString();
}
