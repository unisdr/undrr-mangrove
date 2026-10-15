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

import React, { memo, useCallback, useMemo } from 'react';
import {
  useSearchState,
  useSearchDispatch,
  useSearchConfig,
  useSearchLabels,
  actions,
} from '../context/SearchContext';
import { EVENT_SORT_VALUES } from '../utils/constants';
import { SelectDropdown } from './SelectDropdown';

/**
 * SortOptions component.
 *
 * @param {Object} props - Component props
 * @param {string} props.widgetId - Unique widget ID for accessibility
 */
export function SortOptions({ widgetId = 'search' }) {
  const { sortBy, hasEventSorts } = useSearchState();
  const { defaultSort } = useSearchConfig();
  const dispatch = useSearchDispatch();
  const labels = useSearchLabels();

  // Event date sorts put every result without an event date last, so they
  // are offered only on listings set up for events: when the configured
  // default sort, or a sort seen during this session (e.g. from a shared
  // link), is an event date sort. Switching away must not remove the choice.
  const showEventSorts =
    hasEventSorts ||
    EVENT_SORT_VALUES.includes(defaultSort) ||
    EVENT_SORT_VALUES.includes(sortBy);

  const sortOptions = useMemo(() => {
    const options = [
      { value: 'relevance', label: labels.sortRelevance },
      { value: 'newest', label: labels.sortNewest },
      { value: 'oldest', label: labels.sortOldest },
    ];
    if (showEventSorts) {
      options.push(
        { value: 'eventDateAsc', label: labels.sortEventDateAsc },
        { value: 'eventDateDesc', label: labels.sortEventDateDesc }
      );
    }
    return options;
  }, [
    showEventSorts,
    labels.sortRelevance,
    labels.sortNewest,
    labels.sortOldest,
    labels.sortEventDateAsc,
    labels.sortEventDateDesc,
  ]);

  const handleChange = useCallback(
    value => {
      // Sort always has a value; falling back to 'relevance' guards
      // against the consumer clearing the selection (the SelectDropdown
      // emits '' when cleared).
      dispatch(actions.setSort(value || 'relevance'));
    },
    [dispatch]
  );

  return (
    <SortSelect
      widgetId={widgetId}
      legend={labels.sortLegend}
      placeholder={labels.sortPlaceholder}
      options={sortOptions}
      value={sortBy || 'relevance'}
      onChange={handleChange}
    />
  );
}

/**
 * The rendered dropdown, memoised: SortOptions reads the whole search state
 * and re-renders on every keystroke, but the dropdown only needs to when the
 * sort or its options change.
 */
const SortSelect = memo(function SortSelect({
  widgetId,
  legend,
  placeholder,
  options,
  value,
  onChange,
}) {
  const selectId = `sort-${widgetId}`;

  return (
    <fieldset className="mg-search__sort">
      <legend id={`${selectId}-label`}>{legend}</legend>
      <SelectDropdown
        id={selectId}
        label={legend}
        placeholder={placeholder}
        options={options}
        value={value}
        onChange={onChange}
        multiple={false}
      />
    </fieldset>
  );
});

export default SortOptions;
