/**
 * @file CustomFacetSelect.jsx
 * @description Custom facet dropdown component for editor-defined filters.
 *
 * Custom facets are defined in the Gutenberg block configuration and
 * provide predefined query options that are applied as Elasticsearch
 * query_string filters.
 *
 * @module SearchWidget/components/CustomFacetSelect
 */

import React, { useCallback } from 'react';
import { useSearchState, useSearchDispatch, actions } from '../context/SearchContext';

/**
 * CustomFacetSelect component.
 * Renders a select dropdown for a custom (editor-defined) facet.
 *
 * @param {Object} props - Component props
 * @param {Object} props.facet - Custom facet config
 * @param {string} props.facet.id - Unique facet ID
 * @param {string} props.facet.title - Display title
 * @param {Array} props.facet.options - Array of {label, query} options
 * @param {boolean} props.facet.multiSelect - Allow multiple selections
 * @param {number} props.facet.weight - Sort weight for ordering
 * @param {string} props.widgetId - Unique widget ID for accessibility
 */
export function CustomFacetSelect({ facet, widgetId = 'search' }) {
  const { customFacets } = useSearchState();
  const dispatch = useSearchDispatch();

  const { id, title, options = [], multiSelect = false } = facet;
  const selectedValues = customFacets?.[id] || [];

  /**
   * Handle select change.
   * Custom facets store option indices (not query strings) in state.
   * The query builder looks up the actual query strings from config.
   */
  const handleChange = useCallback((e) => {
    if (multiSelect) {
      const values = Array.from(e.target.selectedOptions)
        .map((opt) => opt.value)
        .filter((v) => v !== '');

      if (values.length === 0) {
        dispatch(actions.removeCustomFacet(id));
      } else {
        dispatch(actions.setCustomFacet(id, values));
      }
    } else {
      const value = e.target.value;
      if (value === '') {
        dispatch(actions.removeCustomFacet(id));
      } else {
        dispatch(actions.setCustomFacet(id, [value]));
      }
    }
  }, [dispatch, id, multiSelect]);

  // Don't render if no options
  if (!options || options.length === 0) {
    return null;
  }

  const selectId = `custom-facet-${id}-${widgetId}`;

  return (
    <fieldset
      className="mg-search__facet mg-search__facet--custom"
      data-custom-facet={id}
    >
      <legend>{title}</legend>
      <label htmlFor={selectId} className="mg-u-sr-only">
        {title}
      </label>
      <select
        id={selectId}
        name={id}
        className="mg-search__facet-select"
        multiple={multiSelect}
        value={multiSelect ? selectedValues : (selectedValues[0] || '')}
        onChange={handleChange}
        data-placeholder={`Select ${title.toLowerCase()}`}
      >
        {!multiSelect && (
          <option value="">
            Select {title.toLowerCase()}
          </option>
        )}
        {options.map((option, index) => {
          // Skip options without labels
          if (!option.label) return null;

          return (
            <option key={index} value={String(index)}>
              {option.label}
            </option>
          );
        })}
      </select>
    </fieldset>
  );
}

export default CustomFacetSelect;
