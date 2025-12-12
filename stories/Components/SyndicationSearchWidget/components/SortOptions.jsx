/**
 * @file SortOptions.jsx
 * @description Sort options component for search results.
 *
 * Provides radio buttons to sort by relevance, newest, or oldest.
 *
 * @module SearchWidget/components/SortOptions
 */

import React from 'react';
import { useSearchState, useSearchDispatch, actions } from '../context/SearchContext';

/**
 * Sort options configuration.
 */
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

/**
 * SortOptions component.
 * Radio button group for sorting search results.
 *
 * @param {Object} props - Component props
 * @param {string} props.widgetId - Unique widget ID for accessibility
 */
export function SortOptions({ widgetId = 'search' }) {
  const { sortBy } = useSearchState();
  const dispatch = useSearchDispatch();

  const handleChange = (e) => {
    dispatch(actions.setSort(e.target.value));
  };

  return (
    <fieldset className="mg-search__sort">
      <legend id={`sort-heading-${widgetId}`}>Sort</legend>
      {SORT_OPTIONS.map((option) => (
        <div key={option.value} className="mg-search__sort-option">
          <input
            type="radio"
            name={`sort-${widgetId}`}
            value={option.value}
            id={`sort-${option.value}-${widgetId}`}
            checked={sortBy === option.value}
            onChange={handleChange}
          />
          <label htmlFor={`sort-${option.value}-${widgetId}`}>
            {option.label}
          </label>
        </div>
      ))}
    </fieldset>
  );
}

export default SortOptions;
