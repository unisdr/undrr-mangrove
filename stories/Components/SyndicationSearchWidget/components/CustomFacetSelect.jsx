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

import React, { useCallback, useMemo } from 'react';
import { useSearchState, useSearchDispatch, actions } from '../context/SearchContext';
import { SelectDropdown } from './SelectDropdown';
import { FACET_SEARCH_THRESHOLD } from '../utils/constants';

/**
 * CustomFacetSelect component.
 * Renders a custom SelectDropdown for a custom (editor-defined) facet.
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
   * Transform options to SelectDropdown format.
   * Custom facets use index as value (query is looked up by queryBuilder).
   */
  const dropdownOptions = useMemo(() => {
    return options
      .map((option, index) => {
        if (!option.label) return null;
        return {
          value: String(index),
          label: option.label,
        };
      })
      .filter(Boolean);
  }, [options]);

  /**
   * Handle selection change from SelectDropdown.
   * Custom facets store option indices (not query strings) in state.
   * The query builder looks up the actual query strings from config.
   */
  const handleChange = useCallback((newValue) => {
    if (multiSelect) {
      // newValue is an array for multi-select
      const values = Array.isArray(newValue) ? newValue : [newValue];
      if (values.length === 0) {
        dispatch(actions.removeCustomFacet(id));
      } else {
        dispatch(actions.setCustomFacet(id, values));
      }
    } else {
      // newValue is a single value for single-select
      if (!newValue || newValue === '') {
        dispatch(actions.removeCustomFacet(id));
      } else {
        dispatch(actions.setCustomFacet(id, [newValue]));
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
      <legend id={`${selectId}-label`}>{title}</legend>
      <SelectDropdown
        id={selectId}
        label={title}
        placeholder={`Select ${title.toLowerCase()}`}
        options={dropdownOptions}
        value={multiSelect ? selectedValues : (selectedValues[0] || '')}
        onChange={handleChange}
        multiple={multiSelect}
        searchThreshold={FACET_SEARCH_THRESHOLD}
      />
    </fieldset>
  );
}

export default CustomFacetSelect;
