/**
 * @file useTaxonomies.js
 * @description React hook for fetching taxonomy data from the UNDRR API.
 *
 * Fetches taxonomy terms for facet labels (countries, hazards, themes, etc.)
 * and caches them in state to avoid repeated requests.
 *
 * @module SearchWidget/hooks/useTaxonomies
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DOMAINS,
  CONTENT_TYPES,
  NEWS_TYPES,
  LANGUAGES,
  DOMAIN_MAP,
  CONTENT_TYPE_MAP,
  NEWS_TYPE_MAP,
  LANGUAGE_MAP,
  TAXONOMY_API_URL,
} from '../utils/constants';

/**
 * Hook for fetching and caching taxonomy data.
 *
 * @returns {Object} Taxonomy utilities
 * @returns {Object} returns.taxonomies - Map of vocabulary -> terms
 * @returns {boolean} returns.isLoading - Whether taxonomies are loading
 * @returns {string|null} returns.error - Error message if fetch failed
 * @returns {Function} returns.getLabel - Get label for a facet value
 * @returns {Function} returns.refresh - Re-fetch taxonomies
 */
export function useTaxonomies() {
  const [taxonomies, setTaxonomies] = useState({
    terms: null, // Combined terms from API (countries, hazards, themes)
    news_type: NEWS_TYPES, // Static from constants
    type: CONTENT_TYPES, // Static from constants
    languages: LANGUAGES, // Static from constants
    field_domain_access: DOMAINS, // Static from constants
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * Fetch taxonomy terms from API.
   */
  const fetchTaxonomies = useCallback(async () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(TAXONOMY_API_URL, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Taxonomy fetch failed: ${response.status}`);
      }

      const data = await response.json();
      const terms = data.results || [];

      setTaxonomies(prev => ({
        ...prev,
        terms,
      }));
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('useTaxonomies: Failed to fetch taxonomies:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch on mount.
   */
  useEffect(() => {
    fetchTaxonomies();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTaxonomies]);

  /**
   * Get human-readable label for a facet value.
   *
   * @param {string} fieldKey - The facet field key
   * @param {string|number} value - The value to look up
   * @param {string} vocabulary - The vocabulary to search in
   * @returns {string} The label or the raw value if not found
   */
  const getLabel = useCallback((fieldKey, value, vocabulary) => {
    const valueStr = String(value);

    // Special case: year is just a number
    if (fieldKey === 'year') {
      return valueStr;
    }

    // Check static lookups first (faster)
    if (vocabulary === 'field_domain_access' || fieldKey === 'field_domain_access') {
      const domain = DOMAIN_MAP.get(valueStr);
      return domain ? domain.name : valueStr;
    }

    if (vocabulary === 'type' || fieldKey === 'type') {
      const type = CONTENT_TYPE_MAP.get(valueStr);
      return type ? type.name : valueStr;
    }

    if (vocabulary === 'languages' || fieldKey === '_language') {
      const lang = LANGUAGE_MAP.get(valueStr);
      return lang ? lang.name : valueStr;
    }

    // Check news types (these come from field_news_type aggregation)
    if (fieldKey === 'field_news_type') {
      const newsType = NEWS_TYPE_MAP.get(valueStr);
      if (newsType) return newsType.name;
    }

    // Check fetched terms (countries, hazards, themes)
    if (taxonomies.terms) {
      const term = taxonomies.terms.find(t => String(t.id) === valueStr);
      if (term) return term.name;
    }

    // Fallback to raw value
    return valueStr;
  }, [taxonomies.terms]);

  /**
   * Get domain URL for link resolution.
   *
   * @param {string} domainId - The domain ID
   * @returns {string} The domain URL
   */
  const getDomainUrl = useCallback((domainId) => {
    const domain = DOMAIN_MAP.get(domainId);
    return domain ? domain.url : 'https://www.preventionweb.net';
  }, []);

  return {
    taxonomies,
    isLoading,
    error,
    getLabel,
    getDomainUrl,
    refresh: fetchTaxonomies,
  };
}

export default useTaxonomies;
