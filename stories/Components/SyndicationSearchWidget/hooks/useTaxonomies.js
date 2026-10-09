/**
 * @file useTaxonomies.js
 * @description React hook for fetching taxonomy data from the UNDRR API.
 *
 * Fetches taxonomy terms for facet labels (countries, hazards, themes) from
 * `config.taxonomyEndpoint`. Requests are shared through a module-level
 * cache keyed by URL, so every component that calls the hook on a page
 * (sidebar, mobile drawer, active filter chips) uses a single fetch.
 *
 * @module SearchWidget/hooks/useTaxonomies
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DOMAINS,
  CONTENT_TYPES,
  NEWS_TYPES,
  LANGUAGES,
  DOMAIN_MAP,
  NEWS_TYPE_MAP,
  LANGUAGE_MAP,
  TAXONOMY_VOCABULARY_MAP,
  TAXONOMY_API_URL,
  parseTypeValue,
} from '../utils/constants';
import { useOptionalSearchConfig } from '../context/SearchContext';
import { decodeEntities } from '../utils/decodeEntities';

/**
 * Shared taxonomy requests, keyed by endpoint URL.
 * Each entry is `{ promise, data }`; `data` is set once the promise settles
 * successfully so components mounted later start with labels in hand.
 * @type {Map<string, {promise: Promise<Object>, data: Object|null}>}
 */
const taxonomyCache = new Map();

/**
 * Fetch and normalise taxonomy terms from an endpoint.
 *
 * Term names are HTML-entity decoded here, once, so facet options, active
 * filter chips and dropdown search all see plain text.
 *
 * @param {string} url - Taxonomy endpoint URL
 * @returns {Promise<{terms: Array<{id: string, name: string}>, termMap: Map<string, string>}>}
 */
async function fetchTaxonomyTerms(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Taxonomy fetch failed: ${response.status}`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    // e.g. a Cloudflare challenge page served with a 200
    throw new Error('Taxonomy fetch failed: response was not JSON');
  }

  if (!data || !Array.isArray(data.results)) {
    throw new Error('Taxonomy fetch failed: response has no results array');
  }

  const pages = Number(data.pager?.pages);
  if (pages > 1) {
    console.warn(
      `useTaxonomies: taxonomy endpoint reports ${pages} pages but only the first was fetched, so some facet values may be hidden. Raise items_per_page on ${url}.`
    );
  }

  const terms = [];
  const termMap = new Map();
  for (const term of data.results) {
    if (!term || term.id === undefined || term.id === null) continue;
    const id = String(term.id);
    const name = decodeEntities(term.name);
    if (typeof name !== 'string' || name === '') continue;
    terms.push({ ...term, id, name });
    termMap.set(id, name);
  }

  return { terms, termMap };
}

/**
 * Load taxonomy terms for a URL, reusing an in-flight or completed request.
 * Failed requests are evicted so a later call can retry.
 *
 * @param {string} url - Taxonomy endpoint URL
 * @returns {Promise<{terms: Array, termMap: Map<string, string>}>}
 */
export function loadTaxonomies(url) {
  const cached = taxonomyCache.get(url);
  if (cached) return cached.promise;

  const entry = { promise: null, data: null };
  entry.promise = fetchTaxonomyTerms(url).then(
    data => {
      entry.data = data;
      return data;
    },
    err => {
      if (taxonomyCache.get(url) === entry) taxonomyCache.delete(url);
      throw err;
    }
  );
  taxonomyCache.set(url, entry);
  return entry.promise;
}

/**
 * Drop cached taxonomy data, for one URL or all of them.
 * Used by `refresh()` and by tests.
 *
 * @param {string} [url] - Endpoint to clear; clears everything when omitted
 */
export function clearTaxonomyCache(url) {
  if (url === undefined) {
    taxonomyCache.clear();
  } else {
    taxonomyCache.delete(url);
  }
}

/**
 * Build hook state for a URL from whatever is already cached.
 * @param {string} url - Taxonomy endpoint URL
 * @returns {Object} Hook state
 */
function stateFromCache(url) {
  const data = taxonomyCache.get(url)?.data;
  return {
    url,
    terms: data ? data.terms : null,
    termMap: data ? data.termMap : null,
    isLoading: !data,
    error: null,
  };
}

/**
 * Hook for fetching and caching taxonomy data.
 *
 * Inside a SearchProvider the endpoint comes from `config.taxonomyEndpoint`.
 * The hook is also exported for standalone use, so it works without a
 * provider and accepts the endpoint as an argument (which takes precedence).
 *
 * @param {string} [endpoint] - Taxonomy endpoint URL override
 * @returns {Object} Taxonomy utilities
 * @returns {Object} returns.taxonomies - Map of vocabulary -> terms
 * @returns {boolean} returns.isLoading - Whether taxonomies are loading
 * @returns {string|null} returns.error - Error message if fetch failed
 * @returns {boolean} returns.taxonomiesReady - True once terms loaded
 *   successfully and the list is non-empty. Only then is a missing label
 *   evidence that a term does not exist.
 * @returns {Function} returns.getLabel - Get label for a facet value
 * @returns {Function} returns.getDomainUrl - Get the site URL for a domain
 * @returns {Function} returns.refresh - Re-fetch taxonomies
 */
export function useTaxonomies(endpoint) {
  const config = useOptionalSearchConfig();
  const url = endpoint || config?.taxonomyEndpoint || TAXONOMY_API_URL;

  const [state, setState] = useState(() => stateFromCache(url));
  const [reloadToken, setReloadToken] = useState(0);

  // Reset when the endpoint changes (render-phase update, no extra commit).
  if (state.url !== url) {
    setState(stateFromCache(url));
  }

  useEffect(() => {
    let cancelled = false;
    loadTaxonomies(url).then(
      data => {
        if (cancelled) return;
        setState({
          url,
          terms: data.terms,
          termMap: data.termMap,
          isLoading: false,
          error: null,
        });
      },
      err => {
        if (cancelled) return;
        console.error('useTaxonomies: Failed to fetch taxonomies:', err);
        setState({
          url,
          terms: null,
          termMap: null,
          isLoading: false,
          error: err.message,
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [url, reloadToken]);

  const refresh = useCallback(() => {
    clearTaxonomyCache(url);
    setState({ ...stateFromCache(url), isLoading: true });
    setReloadToken(token => token + 1);
  }, [url]);

  const { terms, termMap, isLoading, error } = state;
  const taxonomiesReady =
    !isLoading && !error && Array.isArray(terms) && terms.length > 0;

  /**
   * Get human-readable label for a facet value.
   *
   * @param {string} fieldKey - The facet field key
   * @param {string|number} value - The value to look up
   * @param {string} vocabulary - The vocabulary to search in
   * @param {Object} [options] - Lookup options
   * @param {*} [options.fallback] - Returned when no label is found. Defaults
   *   to the raw value; pass `null` to ask whether a value is resolvable.
   * @returns {string|*} The label, or the fallback if not found
   */
  const getLabel = useCallback(
    (fieldKey, value, vocabulary, options) => {
      const valueStr = String(value);
      const miss =
        options && 'fallback' in options ? options.fallback : valueStr;

      // Special case: year is just a number
      if (fieldKey === 'year') {
        return valueStr;
      }

      // Check static lookups first (faster)
      if (
        vocabulary === 'field_domain_access' ||
        fieldKey === 'field_domain_access'
      ) {
        const domain = DOMAIN_MAP.get(valueStr);
        return domain ? domain.name : miss;
      }

      if (vocabulary === 'type' || fieldKey === 'type') {
        // Use parseTypeValue to handle both content types and namespaced subtypes
        const parsed = parseTypeValue(valueStr);
        return parsed.label;
      }

      if (vocabulary === 'languages' || fieldKey === '_language') {
        const lang = LANGUAGE_MAP.get(valueStr);
        return lang ? lang.name : miss;
      }

      // Check vocabulary names (for taxonomy term results)
      if (vocabulary === 'vid' || fieldKey === 'vid') {
        const vocab = TAXONOMY_VOCABULARY_MAP.get(valueStr);
        return vocab ? vocab.name : miss;
      }

      // News types are static (NEWS_TYPES), so the endpoint needn't return them
      if (fieldKey === 'field_news_type') {
        const newsType = NEWS_TYPE_MAP.get(valueStr);
        if (newsType) return newsType.name;
      }

      // Check fetched terms (countries, hazards, themes)
      const termName = termMap?.get(valueStr);
      if (termName) return termName;

      return miss;
    },
    [termMap]
  );

  /**
   * Get domain URL for link resolution.
   *
   * @param {string} domainId - The domain ID
   * @returns {string} The domain URL
   */
  const getDomainUrl = useCallback(domainId => {
    const domain = DOMAIN_MAP.get(domainId);
    return domain ? domain.url : 'https://www.preventionweb.net';
  }, []);

  const taxonomies = useMemo(
    () => ({
      terms, // Combined terms from API (countries, hazards, themes), names decoded
      news_type: NEWS_TYPES, // Static from constants
      type: CONTENT_TYPES, // Static from constants
      languages: LANGUAGES, // Static from constants
      field_domain_access: DOMAINS, // Static from constants
    }),
    [terms]
  );

  return {
    taxonomies,
    isLoading,
    error,
    taxonomiesReady,
    getLabel,
    getDomainUrl,
    refresh,
  };
}

export default useTaxonomies;
