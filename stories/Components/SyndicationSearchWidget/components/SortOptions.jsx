/**
 * @file SortOptions.jsx
 * @description Sort options component for search results.
 *
 * Renders a "Sort" dropdown so it visually matches the facet dropdowns
 * in both sidebar and horizontal-strip layouts. Wrapped in a fieldset
 * with a legend for accessibility (preserves the same a11y semantics as
 * the previous radio-group implementation).
 *
 * @module SearchWidget/components/SortOptions
 */

import React, { useCallback, useMemo } from 'react';
import { useSearchState, useSearchDispatch, useSearchLabels, actions } from '../context/SearchContext';
import { SelectDropdown } from './SelectDropdown';

/**
 * SortOptions component.
 *
 * @param {Object} props - Component props
 * @param {string} props.widgetId - Unique widget ID for accessibility
 */
export function SortOptions({ widgetId = 'search' }) {
  const { sortBy } = useSearchState();
  const dispatch = useSearchDispatch();
  const labels = useSearchLabels();

  const sortOptions = useMemo(() => [
    { value: 'relevance', label: labels.sortRelevance },
    { value: 'newest', label: labels.sortNewest },
    { value: 'oldest', label: labels.sortOldest },
  ], [labels.sortRelevance, labels.sortNewest, labels.sortOldest]);

  const handleChange = useCallback(
    value => {
      // Sort always has a value; falling back to 'relevance' guards
      // against the consumer clearing the selection (the SelectDropdown
      // emits '' when cleared).
      dispatch(actions.setSort(value || 'relevance'));
    },
    [dispatch]
  );

  const selectId = `sort-${widgetId}`;

  return (
    <fieldset className="mg-search__sort">
      <legend id={`${selectId}-label`}>{labels.sortLegend}</legend>
      <SelectDropdown
        id={selectId}
        label={labels.sortLegend}
        placeholder={labels.sortPlaceholder}
        options={sortOptions}
        value={sortBy || 'relevance'}
        onChange={handleChange}
        multiple={false}
      />
    </fieldset>
  );
}

export default SortOptions;
