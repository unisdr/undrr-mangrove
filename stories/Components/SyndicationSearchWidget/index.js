/**
 * @file index.js
 * @description Entry point for SyndicationSearchWidget component.
 *
 * Exports all public components and utilities.
 *
 * @module SyndicationSearchWidget
 */

// Main component
export { SyndicationSearchWidget, SearchWidget, default } from './SyndicationSearchWidget';

// Context and hooks
export {
  SearchProvider,
  useSearchConfig,
  useSearchState,
  useSearchDispatch,
  useSearch,
  actions,
  ActionTypes,
} from './context/SearchContext';

export { useSearch as useSearchHook, useOptimisticSearch } from './hooks/useSearch';
export { useTaxonomies } from './hooks/useTaxonomies';
export { useHashSync } from './hooks/useHashSync';

// Sub-components (for custom implementations)
export { SearchForm } from './components/SearchForm';
export { SearchResults } from './components/SearchResults';
export { ResultItem } from './components/ResultItem';
export { ActiveFilters } from './components/ActiveFilters';
export { FacetsSidebar } from './components/FacetsSidebar';
export { FacetSelect } from './components/FacetSelect';
export { CustomFacetSelect } from './components/CustomFacetSelect';
export { SortOptions } from './components/SortOptions';
export { Pager } from './components/Pager';

// Utilities
export { buildQuery } from './utils/queryBuilder';
export * from './utils/constants';
