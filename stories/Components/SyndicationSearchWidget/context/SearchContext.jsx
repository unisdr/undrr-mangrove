/**
 * @file SearchContext.jsx
 * @description React Context and reducer for SearchWidget state management.
 *
 * Provides centralized state management using useReducer with React 19 patterns.
 * Separates configuration (static) from state (dynamic).
 *
 * @module SearchWidget/context/SearchContext
 */

import React, { createContext, useContext, useReducer, useMemo } from 'react';
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
        return {
          ...state,
          facets: remainingFacets,
          page: 1,
        };
      }

      // Remove specific value from facet
      const currentValues = state.facets[key] || [];
      const newValues = currentValues.filter(v => v !== value);

      if (newValues.length === 0) {
        const { [key]: removed, ...remainingFacets } = state.facets;
        return {
          ...state,
          facets: remainingFacets,
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
        customFacets: {},
        page: 1,
      };

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
        query: defaultQuery,
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
export function SearchProvider({ config: userConfig, children }) {
  // Merge user config with defaults
  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...userConfig,
  }), [userConfig]);

  // Initialize reducer with config-based initial state
  const [state, dispatch] = useReducer(searchReducer, initialState);

  // Memoize the state value to prevent unnecessary re-renders
  const stateValue = useMemo(() => state, [state]);

  return (
    <SearchConfigContext.Provider value={config}>
      <SearchStateContext.Provider value={stateValue}>
        <SearchDispatchContext.Provider value={dispatch}>
          {children}
        </SearchDispatchContext.Provider>
      </SearchStateContext.Provider>
    </SearchConfigContext.Provider>
  );
}

/**
 * Hook to access search configuration.
 * @returns {Object} Search configuration
 * @throws {Error} If used outside SearchProvider
 */
export function useSearchConfig() {
  const config = useContext(SearchConfigContext);
  if (config === null) {
    throw new Error('useSearchConfig must be used within a SearchProvider');
  }
  return config;
}

/**
 * Hook to access search state.
 * @returns {Object} Search state
 * @throws {Error} If used outside SearchProvider
 */
export function useSearchState() {
  const state = useContext(SearchStateContext);
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
  const dispatch = useContext(SearchDispatchContext);
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
