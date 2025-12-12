/**
 * @file useHashSync.js
 * @description React hook for URL hash synchronization.
 *
 * Syncs search state (query, filters) to/from the URL hash fragment,
 * enabling bookmarkable search results and browser history navigation.
 *
 * @module SearchWidget/hooks/useHashSync
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSearchState, useSearchDispatch, useSearchConfig, actions } from '../context/SearchContext';

/**
 * Hook for synchronizing search state with URL hash.
 *
 * Supports:
 * - #query=<search term> - Search query
 * - #label=<page title> - Optional page title override
 * - Legacy ?text=<query> parameter migration
 *
 * @param {Object} options - Hook options
 * @param {boolean} options.enabled - Whether hash sync is enabled
 * @returns {Object} Hash sync utilities
 */
export function useHashSync({ enabled = true } = {}) {
  const config = useSearchConfig();
  const state = useSearchState();
  const dispatch = useSearchDispatch();
  const isInitializedRef = useRef(false);
  const lastHashRef = useRef('');

  const { query, isInitialized } = state;
  const { enableHashSync } = config;

  // Determine if hash sync should be active
  const isEnabled = enabled && (
    enableHashSync === true ||
    (enableHashSync === 'auto' && typeof window !== 'undefined')
  );

  /**
   * Parse URL hash into state object.
   */
  const parseHash = useCallback(() => {
    if (typeof window === 'undefined') return {};

    const hash = window.location.hash.substring(1);
    if (!hash) return {};

    const params = new URLSearchParams(hash);
    return {
      query: params.get('query'),
      label: params.get('label'),
    };
  }, []);

  /**
   * Update URL hash from current query.
   */
  const updateHash = useCallback((searchQuery) => {
    if (!isEnabled || typeof window === 'undefined') return;

    const encodedQuery = encodeURIComponent(searchQuery || '');
    const newHash = searchQuery ? `query=${encodedQuery}` : '';

    // Avoid unnecessary updates
    if (newHash === lastHashRef.current) return;

    lastHashRef.current = newHash;

    if (newHash) {
      window.history.replaceState(null, '', `#${newHash}`);
    } else {
      // Clear hash without causing a scroll jump
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [isEnabled]);

  /**
   * Handle initial URL state on mount.
   * Migrates legacy ?text= param and reads hash state.
   */
  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined' || isInitializedRef.current) {
      return;
    }

    // Migrate legacy ?text= parameter
    const urlParams = new URLSearchParams(window.location.search);
    const textParam = urlParams.get('text');

    if (textParam) {
      // Update URL to use hash format
      const newHash = `query=${encodeURIComponent(textParam)}`;
      const newUrl = window.location.origin + window.location.pathname + '#' + newHash;
      window.history.replaceState(null, '', newUrl);

      // Set query in state
      dispatch(actions.setQuery(textParam));
      lastHashRef.current = newHash;
      isInitializedRef.current = true;
      return;
    }

    // Read from hash
    const hashState = parseHash();
    if (hashState.query) {
      const decodedQuery = decodeURIComponent(hashState.query);
      dispatch(actions.setQuery(decodedQuery));
      lastHashRef.current = window.location.hash.substring(1);

      // Update page title if specified
      if (hashState.label && typeof document !== 'undefined') {
        const h1 = document.querySelector('h1');
        if (h1) {
          h1.textContent = decodeURIComponent(hashState.label);
        }
      }
    }

    isInitializedRef.current = true;
  }, [isEnabled, dispatch, parseHash]);

  /**
   * Update hash when query changes.
   */
  useEffect(() => {
    if (!isEnabled || !isInitialized) return;

    updateHash(query);
  }, [isEnabled, isInitialized, query, updateHash]);

  /**
   * Handle browser back/forward navigation.
   */
  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return;

    const handleHashChange = () => {
      const hashState = parseHash();
      const currentHash = window.location.hash.substring(1);

      // Avoid loops
      if (currentHash === lastHashRef.current) return;

      lastHashRef.current = currentHash;

      if (hashState.query !== undefined) {
        const decodedQuery = decodeURIComponent(hashState.query || '');
        if (decodedQuery !== query) {
          dispatch(actions.setQuery(decodedQuery));
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isEnabled, query, dispatch, parseHash]);

  return {
    isEnabled,
    parseHash,
    updateHash,
  };
}

export default useHashSync;
