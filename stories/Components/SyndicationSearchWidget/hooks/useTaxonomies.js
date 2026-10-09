/**
 * @file useTaxonomies.js
 * @description React hook for fetching taxonomy data from the UNDRR API.
 *
 * Fetches taxonomy terms for facet labels (countries, hazards, themes) from
 * `config.taxonomyEndpoint`. Each endpoint URL has one shared store at
 * module level, so every component that calls the hook on a page (sidebar,
 * mobile drawer, active filter chips) shares one request and one result.
 * A successful load is kept for the page's lifetime; a failed or empty one
 * is retried the next time a consumer mounts or calls `refresh()`, and every
 * consumer sees the outcome.
 *
 * @module SearchWidget/hooks/useTaxonomies
 */

import { useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
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
 * Upper bound on pages fetched from a paged taxonomy response. A response
 * reporting more is treated as incomplete (a failure), not partially used.
 * @type {number}
 */
export const MAX_TAXONOMY_PAGES = 20;

/**
 * Build the URL for one page of a Drupal views REST response.
 * @param {string} url - Endpoint URL
 * @param {number} page - Zero-based page number
 * @returns {string} URL with `page` set
 */
function pageUrl(url, page) {
  const base = globalThis.location?.href;
  const parsed = new URL(url, base ?? 'http://relative.invalid');
  parsed.searchParams.set('page', String(page));
  if (base || /^[a-z][a-z0-9+.-]*:/i.test(url)) return parsed.href;
  // No page to resolve against (non-DOM): keep a relative URL relative
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

/**
 * Fetch one page and validate its shape.
 * @param {string} url - URL to fetch
 * @returns {Promise<Object>} Parsed response with a `results` array
 */
async function fetchTaxonomyPage(url) {
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
  return data;
}

/**
 * Fetch every page of taxonomy terms from an endpoint and normalise them.
 *
 * Term names are HTML-entity decoded here, once, so facet options, active
 * filter chips and dropdown search all see plain text. Any failure, an
 * empty list, or more pages than MAX_TAXONOMY_PAGES rejects: labels are
 * only trusted (and missing ones hidden) when the whole list arrived.
 *
 * @param {string} url - Taxonomy endpoint URL
 * @returns {Promise<{terms: Array<{id: string, name: string}>, termMap: Map<string, string>}>}
 */
async function fetchTaxonomyTerms(url) {
  const first = await fetchTaxonomyPage(url);
  const results = [...first.results];

  const pages = Number(first.pager?.pages) || 1;
  if (pages > MAX_TAXONOMY_PAGES) {
    throw new Error(
      `Taxonomy fetch failed: ${pages} pages exceeds the limit of ${MAX_TAXONOMY_PAGES}; raise items_per_page on ${url}`
    );
  }
  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) =>
        fetchTaxonomyPage(pageUrl(url, i + 1))
      )
    );
    rest.forEach(page => results.push(...page.results));
  }

  const terms = [];
  const termMap = new Map();
  for (const term of results) {
    if (!term || term.id === undefined || term.id === null) continue;
    const id = String(term.id);
    const name = decodeEntities(term.name);
    if (typeof name !== 'string' || name === '') continue;
    terms.push({ ...term, id, name });
    termMap.set(id, name);
  }

  if (terms.length === 0) {
    throw new Error('Taxonomy fetch failed: response contained no terms');
  }

  return { terms, termMap };
}

/**
 * Shared taxonomy stores, keyed by endpoint URL.
 * @type {Map<string, Object>}
 */
const taxonomyStores = new Map();

/**
 * Create the store for one endpoint. The snapshot object is replaced on
 * every change so it can be used directly with useSyncExternalStore.
 *
 * Snapshot fields: `terms`/`termMap` hold the last complete successful
 * load (kept while a refresh is in flight or after a failed refresh),
 * `isLoading`, and `error` from the latest attempt.
 *
 * @param {string} url - Taxonomy endpoint URL
 * @returns {Object} Store
 */
function createStore(url) {
  const listeners = new Set();
  let inFlight = null;
  const store = {
    snapshot: { terms: null, termMap: null, isLoading: true, error: null },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => store.snapshot,
    set(patch) {
      store.snapshot = { ...store.snapshot, ...patch };
      listeners.forEach(listener => listener());
    },
    /**
     * Load terms unless a complete load already succeeded.
     * @param {boolean} [force] - Re-fetch even after a success
     * @returns {Promise<void>} Settles when the load does; never rejects
     */
    load(force = false) {
      if (inFlight) return inFlight;
      if (!force && store.snapshot.termMap && !store.snapshot.error) {
        return Promise.resolve();
      }
      if (!store.snapshot.isLoading) store.set({ isLoading: true });
      inFlight = fetchTaxonomyTerms(url).then(
        ({ terms, termMap }) => {
          inFlight = null;
          store.set({ terms, termMap, isLoading: false, error: null });
        },
        err => {
          inFlight = null;
          console.error('useTaxonomies: Failed to fetch taxonomies:', err);
          store.set({ isLoading: false, error: err.message });
        }
      );
      return inFlight;
    },
  };
  return store;
}

/**
 * Get (or create) the shared store for an endpoint.
 * @param {string} url - Taxonomy endpoint URL
 * @returns {Object} Store
 */
function getStore(url) {
  let store = taxonomyStores.get(url);
  if (!store) {
    store = createStore(url);
    taxonomyStores.set(url, store);
  }
  return store;
}

/**
 * Load taxonomy terms for a URL, reusing an in-flight or completed request.
 * Failed or empty loads are not kept, so a later call retries.
 *
 * @param {string} url - Taxonomy endpoint URL
 * @returns {Promise<Object>} Resolves to the store snapshot once settled
 */
export function loadTaxonomies(url) {
  const store = getStore(url);
  return store.load().then(() => store.snapshot);
}

/**
 * Drop cached taxonomy data, for one URL or all of them. For tests: mounted
 * consumers keep the store they subscribed to.
 *
 * @param {string} [url] - Endpoint to clear; clears everything when omitted
 */
export function clearTaxonomyCache(url) {
  if (url === undefined) {
    taxonomyStores.clear();
  } else {
    taxonomyStores.delete(url);
  }
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
 * @returns {boolean} returns.isLoading - Whether a load is in flight
 * @returns {string|null} returns.error - Error from the latest load, if any
 * @returns {boolean} returns.taxonomiesReady - True when a complete,
 *   non-empty term list is loaded. Only then is a missing label evidence
 *   that a term does not exist. Stays true during a refresh, and after a
 *   failed refresh, when an earlier load succeeded.
 * @returns {Function} returns.getLabel - Get label for a facet value
 * @returns {Function} returns.getDomainUrl - Get the site URL for a domain
 * @returns {Function} returns.refresh - Re-fetch taxonomies; returns a
 *   promise that settles when the request does
 */
export function useTaxonomies(endpoint) {
  const config = useOptionalSearchConfig();
  const url = endpoint || config?.taxonomyEndpoint || TAXONOMY_API_URL;

  const store = getStore(url);
  const { terms, termMap, isLoading, error } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );

  useEffect(() => {
    store.load();
  }, [store]);

  const refresh = useCallback(() => store.load(true), [store]);

  const taxonomiesReady = Boolean(termMap) && termMap.size > 0;

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
