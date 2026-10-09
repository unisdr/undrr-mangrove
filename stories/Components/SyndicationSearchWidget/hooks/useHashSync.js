/**
 * @file useHashSync.js
 * @description React hook for URL hash synchronization.
 *
 * Syncs search state (query, page, sort order and facet filters) to and
 * from the URL hash fragment, so filtered views can be bookmarked and
 * shared, and browser back/forward moves between them.
 *
 * @module SearchWidget/hooks/useHashSync
 */

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import {
  useSearchState,
  useSearchDispatch,
  useSearchConfig,
  actions,
} from '../context/SearchContext';
import { FACET_FIELDS, MAX_RESULT_WINDOW } from '../utils/constants';
import {
  isSearchHash,
  parseHashState,
  buildHashString,
  facetsFromDefaults,
} from '../utils/hashState';

/**
 * Whether the current URL carries a legacy `?text=` / `?query=` parameter.
 * @returns {string|null} The query to migrate, if any
 */
function getLegacyQueryParam() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('text') || urlParams.get('query');
}

/**
 * Hook for synchronizing search state with URL hash.
 *
 * Supports:
 * - #query=<search term> - Search query
 * - #page=<number> - Page number (1-based)
 * - #sort=<relevance|newest|oldest> - Sort order, when not the default
 * - #f.<facet key>=<value> - Selected facet value (repeat for several)
 * - #op.<facet key>=<AND|OR> - Match mode for a multi-value facet
 * - #label=<page title> - Optional page title override (read once)
 * - ?text=<query> or ?query=<query> parameter migration (converted to hash format; ?text= takes precedence)
 *
 * Facet keys are checked against the active facet fields, so unknown keys
 * never reach the query builder. If the hash has any valid `f.*` param, it
 * replaces `defaultFilters` entirely; otherwise the defaults apply.
 *
 * Committed changes (facets, match mode, page, sort) add a history entry;
 * typing a query replaces the current one. Back/forward restores the state
 * for that entry.
 *
 * Custom facets are not synced: their selections are option positions,
 * which change meaning when an editor edits the options.
 *
 * @param {Object} options - Hook options
 * @param {boolean} options.enabled - Whether hash sync is enabled
 * @returns {Object} Hash sync utilities, including `initialHashState`
 *   (state read from the hash on mount, for INITIALIZE; null when disabled
 *   or when the hash has nothing beyond query/page)
 */
export function useHashSync({ enabled = true } = {}) {
  const config = useSearchConfig();
  const state = useSearchState();
  const dispatch = useSearchDispatch();
  const isInitializedRef = useRef(false);
  const lastHashRef = useRef('');
  // The first write after initialisation (and any canonicalisation) replaces
  // the current history entry instead of adding one.
  const replaceNextRef = useRef(true);
  const prevQueryRef = useRef(null);
  // Set when the page loads on a non-search fragment (e.g. #main-content):
  // the first write must not replace that anchor.
  const keepLoadAnchorRef = useRef(false);

  const { query, page, sortBy, facets, facetOperators, isInitialized } = state;
  const {
    enableHashSync,
    facetFields,
    defaultFilters,
    defaultSort,
    defaultQuery,
    resultsPerPage,
  } = config;
  const fields = facetFields || FACET_FIELDS;
  // Pages past Elasticsearch's result window can only return an error
  const maxPage = Math.max(
    1,
    Math.floor(MAX_RESULT_WINDOW / (resultsPerPage || 50))
  );

  // Determine if hash sync should be active.
  // Accept both boolean true and string 'true': when the value is forwarded
  // through Drupal data attributes (data-enable-hash-sync) it always arrives
  // as a string, so a strict === true check would silently disable hash sync
  // for editors who pick "Always enabled" in the Gutenberg block.
  const isEnabled =
    enabled &&
    (enableHashSync === true ||
      enableHashSync === 'true' ||
      (enableHashSync === 'auto' && typeof window !== 'undefined'));

  const defaultFacets = useMemo(
    () => facetsFromDefaults(defaultFilters),
    [defaultFilters]
  );

  const hashOptions = useMemo(
    () => ({ facetFields: fields, defaultFacets, defaultSort }),
    [fields, defaultFacets, defaultSort]
  );

  /**
   * Parse URL hash into state object.
   */
  const parseHash = useCallback(() => {
    if (typeof window === 'undefined') return {};
    return parseHashState(window.location.hash, {
      facetFields: fields,
      maxPage,
    });
  }, [fields, maxPage]);

  // Facets and sort read from the hash on mount, passed to INITIALIZE by
  // the widget so the defaults don't overwrite them. Read during the first
  // render because INITIALIZE runs in an effect right after this hook's.
  const [initialHashState] = useState(() => {
    if (!isEnabled || typeof window === 'undefined') return null;
    if (getLegacyQueryParam()) return null;
    const parsed = parseHashState(window.location.hash, {
      facetFields: fields,
      maxPage,
    });
    if (!parsed.facets && !parsed.sort) return null;
    return {
      facets: parsed.facets,
      facetOperators: parsed.facetOperators,
      sort: parsed.sort,
    };
  });

  /**
   * Write a hash to the URL.
   * @param {string} newHash - Hash without `#`
   * @param {boolean} replace - Replace the current entry instead of pushing
   */
  const writeHash = useCallback((newHash, replace) => {
    lastHashRef.current = newHash;
    const url = newHash
      ? `#${newHash}`
      : // Clear hash without causing a scroll jump
        window.location.pathname + window.location.search;
    if (replace) {
      window.history.replaceState(null, '', url);
    } else {
      window.history.pushState(null, '', url);
    }
  }, []);

  /**
   * Replace the URL hash with the given query and page, keeping the rest
   * of the current state. Kept for consumers of the exported hook.
   */
  const updateHash = useCallback(
    (searchQuery, searchPage) => {
      if (!isEnabled || typeof window === 'undefined') return;
      const newHash = buildHashString(
        {
          query: searchQuery,
          page: searchPage,
          sortBy,
          facets,
          facetOperators,
        },
        hashOptions
      );
      if (newHash === lastHashRef.current) return;
      writeHash(newHash, true);
    },
    [isEnabled, sortBy, facets, facetOperators, hashOptions, writeHash]
  );

  /**
   * Handle initial URL state on mount.
   * Migrates legacy ?text= param and reads query, page and label from the
   * hash. Facets and sort go through INITIALIZE (see initialHashState).
   */
  useEffect(() => {
    if (
      !isEnabled ||
      typeof window === 'undefined' ||
      isInitializedRef.current
    ) {
      return;
    }

    // Migrate query string parameters (?text= or ?query=) to hash format
    const queryParam = getLegacyQueryParam();

    if (queryParam) {
      const urlParams = new URLSearchParams(window.location.search);
      // Update URL to use hash format (strip query param, add hash)
      const newHash = `query=${encodeURIComponent(queryParam)}`;
      urlParams.delete('text');
      urlParams.delete('query');
      const remainingParams = urlParams.toString();
      const newUrl =
        window.location.origin +
        window.location.pathname +
        (remainingParams ? '?' + remainingParams : '') +
        '#' +
        newHash;
      window.history.replaceState(null, '', newUrl);

      // Set query in state
      dispatch(actions.setQuery(queryParam));
      lastHashRef.current = newHash;
      isInitializedRef.current = true;
      return;
    }

    // Read from hash. URLSearchParams has already decoded the values, so
    // they are used as-is (decoding again breaks on a literal "%").
    const hashState = parseHash();
    if (hashState.query) {
      dispatch(actions.setQuery(hashState.query));

      // Update page title if specified
      if (hashState.label && typeof document !== 'undefined') {
        const h1 = document.querySelector('h1');
        if (h1) {
          h1.textContent = hashState.label;
        }
      }
    }

    // Restore page from hash
    if (hashState.page && hashState.page > 1) {
      dispatch(actions.setPage(hashState.page));
    }

    const loadHash = window.location.hash.substring(1);
    if (loadHash && !isSearchHash(loadHash)) {
      // An in-page anchor, not search state: leave it in the URL
      keepLoadAnchorRef.current = true;
    }
    lastHashRef.current = loadHash;
    isInitializedRef.current = true;
  }, [isEnabled, dispatch, parseHash]);

  /**
   * Update hash when the URL-backed state changes.
   */
  useEffect(() => {
    if (!isEnabled || !isInitialized || typeof window === 'undefined') return;

    const newHash = buildHashString(
      { query, page, sortBy, facets, facetOperators },
      hashOptions
    );
    const queryChanged =
      prevQueryRef.current !== null && prevQueryRef.current !== query;
    prevQueryRef.current = query;

    if (newHash === lastHashRef.current) {
      replaceNextRef.current = false;
      return;
    }

    // The page loaded on an anchor and the state is still the initial one:
    // keep the anchor until the reader changes something.
    if (keepLoadAnchorRef.current) {
      keepLoadAnchorRef.current = false;
      if (replaceNextRef.current) {
        replaceNextRef.current = false;
        lastHashRef.current = newHash;
        return;
      }
    }

    // Typing a query replaces the entry; committed changes add one.
    const replace = replaceNextRef.current || queryChanged;
    replaceNextRef.current = false;
    writeHash(newHash, replace);
  }, [
    isEnabled,
    isInitialized,
    query,
    page,
    sortBy,
    facets,
    facetOperators,
    hashOptions,
    writeHash,
  ]);

  /**
   * Handle browser back/forward navigation and manual hash edits.
   * Both events can fire for one navigation; the lastHashRef check makes
   * the second a no-op.
   */
  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return;

    const handleNavigation = () => {
      const currentHash = window.location.hash.substring(1);

      // Avoid loops: our own writes and already-handled navigations
      if (currentHash === lastHashRef.current) return;

      // In-page anchors (skip links, table of contents) are not search
      // state: leave both the state and the fragment alone. An empty hash
      // is still handled, so Back to the clean entry restores the defaults.
      if (currentHash && !isSearchHash(currentHash)) return;

      const hashState = parseHashState(currentHash, {
        facetFields: fields,
        maxPage,
      });
      const restored = {
        query: hashState.query ?? (defaultQuery || ''),
        page: hashState.page || 1,
        sortBy: hashState.sort || defaultSort || 'relevance',
        facets: hashState.facets || defaultFacets,
        facetOperators: hashState.facets ? hashState.facetOperators : {},
      };

      // Record the canonical hash for this state so the write effect sees
      // no change and doesn't add a history entry. If the URL differs from
      // the canonical form (e.g. unknown keys), tidy it in place.
      const canonical = buildHashString(restored, hashOptions);
      if (canonical !== currentHash) {
        writeHash(canonical, true);
      } else {
        lastHashRef.current = canonical;
      }
      prevQueryRef.current = restored.query;

      dispatch(actions.restoreState(restored));
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, [
    isEnabled,
    dispatch,
    fields,
    maxPage,
    defaultQuery,
    defaultSort,
    defaultFacets,
    hashOptions,
    writeHash,
  ]);

  return {
    isEnabled,
    parseHash,
    updateHash,
    initialHashState,
  };
}

export default useHashSync;
