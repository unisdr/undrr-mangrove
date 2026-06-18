/**
 * @file SearchContext.jsx
 * @description React Context and reducer for SearchWidget state management.
 *
 * Provides centralized state management using useReducer with React 19 patterns.
 * Separates configuration (static) from state (dynamic).
 *
 * @module SearchWidget/context/SearchContext
 */

import React, { createContext, use, useReducer, useMemo } from 'react';

/**
 * Default English UI labels for the search widget.
 * Pass a partial object via the `labels` prop to SyndicationSearchWidget to
 * override any subset of keys. Unspecified keys fall back to these defaults.
 *
 * String keys may contain `{token}` placeholders; pass `vars` to
 * `interpolateLabel(key, vars)` to substitute values at render time.
 *
 * Function keys receive a `vars` object and return a string. Use this form for
 * languages with plural rules requiring more than two forms (Russian, Arabic).
 * NOTE: function-valued keys cannot be serialized to JSON and are therefore
 * not usable via the `data-labels` HTML attribute — they must be provided as
 * a React prop or bundled JS module.
 *
 * @type {Object<string, string|function(Object): string>}
 */
export const DEFAULT_LABELS = {
  // SearchForm
  searchFormLabel: 'Search content',
  searchLabel: 'Search',
  searchPlaceholder: 'Search...',
  searchHint: 'Enter search terms',
  searchHintMin: 'Enter at least {min} characters to search',
  clearSearch: 'Clear search',
  submitSearch: 'Submit search',
  submitSearchText: 'Search',

  // SearchResults — status messages
  initializing: 'Loading search…',
  searchError: 'Search could not be completed.',
  searchErrorRetry: 'Please try again or use different search terms.',
  enterSearchTerm: 'Enter a search term to begin searching.',
  minimumCharacters: 'Minimum {min} characters required.',
  noResults: 'No results found for “{query}”.',
  noResultsHint: 'Try different search terms or adjust your filters.',

  // SearchResults — visible count
  showingResults: 'Showing {start}–{end} of {total} results',
  forQuery: 'for “{query}”',

  // SearchResults — screen-reader live region announcements
  // srSearching fires while a search is in progress (between submit and results)
  srSearching: 'Searching…',
  srNoResults: 'No results found',
  srNoResultsForQuery: 'No results found for {query}',
  // count === 1 uses srResultsFound; count !== 1 uses srResultsFoundPlural
  srResultsFound: '{count} result found',
  srResultsFoundPlural: '{count} results found',
  // count === 1 uses srResultsFoundForQuery; count !== 1 uses srResultsFoundPluralForQuery
  srResultsFoundForQuery: '{count} result found for {query}',
  srResultsFoundPluralForQuery: '{count} results found for {query}',

  // SearchResults — mobile filter button
  filtersButton: 'Filters',
  // filtersButtonActive always receives {count}; no separate singular key (count is inline)
  filtersButtonActive: 'Filters, {count} active',
  searchResultsLabel: 'Search results',
  searchResultsPaginationLabel: 'Search results pagination',

  // ActiveFilters
  filteredBy: 'Filtered by:',
  activeFiltersRegion: 'Active filters',
  andConnector: 'and',
  removeFilter: 'Remove filter: {field} is {value}',
  clearAllFilters: 'Clear all filters',
  clearAllFiltersLabel: 'Clear all {count} active filters',
  // count === 1 uses activeFiltersCount; count !== 1 uses activeFiltersCountPlural
  activeFiltersCount: '{count} active filter',
  activeFiltersCountPlural: '{count} active filters',

  // MobileFilterDrawer
  drawerTitle: 'Filters',
  closeFilters: 'Close filters',
  viewResults: 'View results',
  // count === 1 uses filtersApplied; count !== 1 uses filtersAppliedPlural
  filtersApplied: '{count} filter applied',
  filtersAppliedPlural: '{count} filters applied',

  // FacetSelect — boolean operator (any/all) for multi-select filters
  selectPlaceholder: 'Select {label}',
  matchModeLabel: 'Search type for {label}',
  matchModeGroupLabel: 'Search type:',
  matchModeAny: 'Match any of these',
  matchModeAll: 'Match all of these',

  // SelectDropdown internals (passed as props)
  dropdownSearchPlaceholder: 'Search...',
  dropdownNoOptions: 'No matches found',

  // SortOptions
  sortLegend: 'Sort',
  sortPlaceholder: 'Sort by',
  sortRelevance: 'Relevance',
  sortNewest: 'Newest',
  sortOldest: 'Oldest',

  // FacetsSidebar
  loadingFilters: 'Loading filters…',

  // Pager (prev/next/page labels passed to PagerList via SearchPager)
  pagerPrevious: 'Previous',
  pagerNext: 'Next',
  pagerGoToPrevious: 'Go to previous page',
  pagerGoToNext: 'Go to next page',
  pagerPage: 'Page {page}',
  pagerCurrentPage: 'Page {page}, current page',
  // Used in the sr-only live region: 'Page {page} of {total}'
  pagerPageOf: 'Page {page} of {total}',

  // ResultItem — content unavailable (no domain assignment in CMS)
  // This is an admin/configuration error state; end users see a friendly message.
  // The {nid} token is available for debug builds but omit it in production labels.
  domainAccessError: 'This content is currently unavailable.',
  reportErrorLink: 'Report this issue',
};

/**
 * Resolve a label value and substitute `{key}` tokens.
 *
 * `template` may be:
 *   - A plain string with optional `{key}` tokens — tokens are substituted from `vars`.
 *   - A function `(vars) => string` — called with `vars` and expected to return a
 *     fully resolved string. Use this for languages with complex plural rules (Russian,
 *     Arabic, etc.) where two static keys are not enough.
 *
 * @param {string|Function} template
 * @param {Object} [vars={}]
 * @returns {string}
 *
 * @example — static string
 *   interpolateLabel('{count} results found', { count: 5 }) // '5 results found'
 *
 * @example — function for Russian plurals
 *   interpolateLabel(
 *     ({ count }) => {
 *       const form = new Intl.PluralRules('ru').select(count);
 *       const forms = { one: 'результат', few: 'результата', other: 'результатов' };
 *       return `Найдено ${count} ${forms[form] ?? forms.other}`;
 *     },
 *     { count: 3 }
 *   ) // 'Найдено 3 результата'
 */
export function interpolateLabel(template, vars = {}) {
  if (typeof template === 'function') {
    return String(template(vars));
  }
  return String(template).replace(/\{(\w+)\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : `{${key}}`
  );
}
import { DEFAULT_CONFIG } from '../utils/constants';

/**
 * Initial state for the search widget.
 * @type {Object}
 */
const initialState = {
  // Search query
  query: '',

  // Active facet filters: { [key]: [values] }
  facets: {},

  // Operator per facet: 'OR' (default) or 'AND'
  facetOperators: {},

  // Custom facet selections: { [facetId]: [selectedOptionIndices] }
  customFacets: {},

  // Sort order: 'relevance', 'newest', 'oldest'
  sortBy: 'relevance',

  // Pagination (future use)
  page: 1,

  // Search results from Elasticsearch
  results: null,

  // Aggregations from Elasticsearch (for facet counts)
  aggregations: null,

  // Total result count
  totalResults: 0,

  // Loading state
  isLoading: false,

  // Error state
  error: null,

  // Search timing (ms)
  searchTime: null,

  // Widget initialized flag
  isInitialized: false,
};

/**
 * Action types for the reducer.
 * @enum {string}
 */
export const ActionTypes = {
  SET_QUERY: 'SET_QUERY',
  SET_FACET: 'SET_FACET',
  REMOVE_FACET: 'REMOVE_FACET',
  CLEAR_FACETS: 'CLEAR_FACETS',
  SET_FACET_OPERATOR: 'SET_FACET_OPERATOR',
  SET_CUSTOM_FACET: 'SET_CUSTOM_FACET',
  REMOVE_CUSTOM_FACET: 'REMOVE_CUSTOM_FACET',
  SET_SORT: 'SET_SORT',
  SET_PAGE: 'SET_PAGE',
  SET_RESULTS: 'SET_RESULTS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  INITIALIZE: 'INITIALIZE',
  RESET: 'RESET',
};

/**
 * Reducer function for search state.
 * @param {Object} state - Current state
 * @param {Object} action - Action to perform
 * @returns {Object} New state
 */
function searchReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_QUERY:
      return {
        ...state,
        query: action.payload,
        page: 1, // Reset to first page on new query
      };

    case ActionTypes.SET_FACET: {
      const { key, value, replace = true } = action.payload;
      const currentValues = state.facets[key] || [];
      const valueArray = Array.isArray(value) ? value : [value];

      let newValues;
      if (replace) {
        newValues = valueArray;
      } else {
        // Add to existing values (for multi-select)
        newValues = [...new Set([...currentValues, ...valueArray])];
      }

      return {
        ...state,
        facets: {
          ...state.facets,
          [key]: newValues,
        },
        page: 1,
      };
    }

    case ActionTypes.REMOVE_FACET: {
      const { key, value } = action.payload;

      // If no value specified, remove entire facet
      if (value === undefined) {
        const { [key]: removed, ...remainingFacets } = state.facets;
        const { [key]: removedOp, ...remainingOperators } = state.facetOperators;
        return {
          ...state,
          facets: remainingFacets,
          facetOperators: remainingOperators,
          page: 1,
        };
      }

      // Remove specific value from facet
      const currentValues = state.facets[key] || [];
      const newValues = currentValues.filter(v => v !== value);

      if (newValues.length === 0) {
        const { [key]: removed, ...remainingFacets } = state.facets;
        const { [key]: removedOp, ...remainingOperators } = state.facetOperators;
        return {
          ...state,
          facets: remainingFacets,
          facetOperators: remainingOperators,
          page: 1,
        };
      }

      return {
        ...state,
        facets: {
          ...state.facets,
          [key]: newValues,
        },
        page: 1,
      };
    }

    case ActionTypes.CLEAR_FACETS:
      return {
        ...state,
        facets: {},
        facetOperators: {},
        customFacets: {},
        page: 1,
      };

    case ActionTypes.SET_FACET_OPERATOR: {
      const { key, operator } = action.payload;
      return {
        ...state,
        facetOperators: {
          ...state.facetOperators,
          [key]: operator,
        },
        page: 1,
      };
    }

    case ActionTypes.SET_CUSTOM_FACET: {
      const { facetId, value } = action.payload;
      const valueArray = Array.isArray(value) ? value : [value];

      return {
        ...state,
        customFacets: {
          ...state.customFacets,
          [facetId]: valueArray,
        },
        page: 1,
      };
    }

    case ActionTypes.REMOVE_CUSTOM_FACET: {
      const { facetId } = action.payload;
      const { [facetId]: removed, ...remainingCustomFacets } = state.customFacets;

      return {
        ...state,
        customFacets: remainingCustomFacets,
        page: 1,
      };
    }

    case ActionTypes.SET_SORT:
      return {
        ...state,
        sortBy: action.payload,
        page: 1,
      };

    case ActionTypes.SET_PAGE:
      return {
        ...state,
        page: action.payload,
      };

    case ActionTypes.SET_RESULTS:
      return {
        ...state,
        results: action.payload.hits?.hits || [],
        aggregations: action.payload.aggregations || null,
        totalResults: action.payload.hits?.total?.value || 0,
        searchTime: action.payload.took || null,
        isLoading: false,
        error: null,
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error,
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case ActionTypes.INITIALIZE: {
      const { defaultFilters = [], defaultQuery = '', defaultSort = 'relevance' } = action.payload;

      // Convert defaultFilters array to facets object
      const facets = {};
      defaultFilters.forEach(filter => {
        if (filter.key && filter.value) {
          if (!facets[filter.key]) {
            facets[filter.key] = [];
          }
          facets[filter.key].push(filter.value);
        }
      });

      return {
        ...state,
        // Preserve query if already set (e.g., from URL params via useHashSync)
        query: state.query || defaultQuery,
        sortBy: defaultSort,
        facets,
        isInitialized: true,
      };
    }

    case ActionTypes.RESET:
      return {
        ...initialState,
        isInitialized: true,
      };

    default:
      return state;
  }
}

/**
 * Context for search configuration (static).
 */
const SearchConfigContext = createContext(null);

/**
 * Context for UI labels (static, merged with DEFAULT_LABELS).
 */
const SearchLabelsContext = createContext(DEFAULT_LABELS);

/**
 * Context for search state (dynamic).
 */
const SearchStateContext = createContext(null);

/**
 * Context for search dispatch (actions).
 */
const SearchDispatchContext = createContext(null);

/**
 * SearchProvider component.
 * Provides search context to child components.
 *
 * @param {Object} props - Component props
 * @param {Object} props.config - Search widget configuration
 * @param {React.ReactNode} props.children - Child components
 */
export function SearchProvider({ config: userConfig, labels: userLabels, children }) {
  // Merge user config with defaults
  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...userConfig,
  }), [userConfig]);

  // Merge user labels with defaults
  const labels = useMemo(() => ({
    ...DEFAULT_LABELS,
    ...userLabels,
  }), [userLabels]);

  // Initialize reducer with config-based initial state
  const [state, dispatch] = useReducer(searchReducer, initialState);

  // Memoize the state value to prevent unnecessary re-renders
  const stateValue = useMemo(() => state, [state]);

  return (
    <SearchConfigContext.Provider value={config}>
      <SearchLabelsContext.Provider value={labels}>
        <SearchStateContext.Provider value={stateValue}>
          <SearchDispatchContext.Provider value={dispatch}>
            {children}
          </SearchDispatchContext.Provider>
        </SearchStateContext.Provider>
      </SearchLabelsContext.Provider>
    </SearchConfigContext.Provider>
  );
}

/**
 * Hook to access search configuration.
 * @returns {Object} Search configuration
 * @throws {Error} If used outside SearchProvider
 */
export function useSearchConfig() {
  const config = use(SearchConfigContext);
  if (config === null) {
    throw new Error('useSearchConfig must be used within a SearchProvider');
  }
  return config;
}

/**
 * Hook to access UI labels (merged with DEFAULT_LABELS).
 * @returns {Object} Labels object
 */
export function useSearchLabels() {
  return use(SearchLabelsContext);
}

/**
 * Hook to access search state.
 * @returns {Object} Search state
 * @throws {Error} If used outside SearchProvider
 */
export function useSearchState() {
  const state = use(SearchStateContext);
  if (state === null) {
    throw new Error('useSearchState must be used within a SearchProvider');
  }
  return state;
}

/**
 * Hook to access search dispatch.
 * @returns {Function} Dispatch function
 * @throws {Error} If used outside SearchProvider
 */
export function useSearchDispatch() {
  const dispatch = use(SearchDispatchContext);
  if (dispatch === null) {
    throw new Error('useSearchDispatch must be used within a SearchProvider');
  }
  return dispatch;
}

/**
 * Hook combining state and dispatch for convenience.
 * @returns {[Object, Function]} [state, dispatch]
 */
export function useSearch() {
  return [useSearchState(), useSearchDispatch()];
}

/**
 * Action creators for common operations.
 */
export const actions = {
  setQuery: (query) => ({
    type: ActionTypes.SET_QUERY,
    payload: query,
  }),

  setFacet: (key, value, replace = true) => ({
    type: ActionTypes.SET_FACET,
    payload: { key, value, replace },
  }),

  removeFacet: (key, value) => ({
    type: ActionTypes.REMOVE_FACET,
    payload: { key, value },
  }),

  clearFacets: () => ({
    type: ActionTypes.CLEAR_FACETS,
  }),

  setFacetOperator: (key, operator) => ({
    type: ActionTypes.SET_FACET_OPERATOR,
    payload: { key, operator },
  }),

  setCustomFacet: (facetId, value) => ({
    type: ActionTypes.SET_CUSTOM_FACET,
    payload: { facetId, value },
  }),

  removeCustomFacet: (facetId) => ({
    type: ActionTypes.REMOVE_CUSTOM_FACET,
    payload: { facetId },
  }),

  setSort: (sortBy) => ({
    type: ActionTypes.SET_SORT,
    payload: sortBy,
  }),

  setPage: (page) => ({
    type: ActionTypes.SET_PAGE,
    payload: page,
  }),

  setResults: (results) => ({
    type: ActionTypes.SET_RESULTS,
    payload: results,
  }),

  setLoading: (isLoading) => ({
    type: ActionTypes.SET_LOADING,
    payload: isLoading,
  }),

  setError: (error) => ({
    type: ActionTypes.SET_ERROR,
    payload: error,
  }),

  initialize: (config) => ({
    type: ActionTypes.INITIALIZE,
    payload: config,
  }),

  reset: () => ({
    type: ActionTypes.RESET,
  }),
};

export default SearchProvider;
