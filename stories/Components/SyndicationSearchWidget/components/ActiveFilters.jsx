/**
 * @file ActiveFilters.jsx
 * @description Active filter chips component with removal functionality.
 *
 * @module SearchWidget/components/ActiveFilters
 */

import React, { useCallback, useMemo, useId } from 'react';
import { useSearchState, useSearchConfig, useSearchDispatch, actions } from '../context/SearchContext';
import { useTaxonomies } from '../hooks/useTaxonomies';
import {
  getDomain,
  getLanguage,
  getContentType,
  FACET_FIELDS,
  isFilterVisible,
  parseTypeValue,
} from '../utils/constants';

/**
 * ActiveFilters component.
 * Displays removable chips for active filters.
 */
export function ActiveFilters() {
  const state = useSearchState();
  const config = useSearchConfig();
  const dispatch = useSearchDispatch();
  const labelId = useId();
  const { getLabel: getTaxonomyLabel } = useTaxonomies();

  const { facets, facetOperators, customFacets: customFacetSelections } = state;
  const {
    showActiveFilters,
    visibleFilters,
    defaultFilters,
    customFacets: customFacetConfigs,
    facetFields,
  } = config;

  // Build list of chips from active filters
  const chips = useMemo(() => {
    const result = [];

    // Process standard facets
    for (const [key, values] of Object.entries(facets)) {
      if (!values || values.length === 0) continue;

      // Find field config
      const fieldConfig = (facetFields || FACET_FIELDS).find(f => f.key === key);
      if (!fieldConfig) continue;

      // Skip hidden filters
      if (!isFilterVisible(key, visibleFilters)) continue;

      // Skip if matches default value
      const defaultFilter = defaultFilters?.find(f => f.key === key);
      if (defaultFilter && values.length === 1 && values[0] === defaultFilter.value) {
        continue;
      }

      // Get operator for this facet (OR is default)
      const operator = facetOperators[key] || 'OR';

      // Add chip for each value
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        const label = getLabelForValue(key, value, fieldConfig.vocabulary, getTaxonomyLabel);
        result.push({
          key,
          value,
          label,
          fieldLabel: fieldConfig.label,
          isCustomFacet: false,
          operator,
          // Track position within the facet group for AND connectors
          isFirstInGroup: i === 0,
          isLastInGroup: i === values.length - 1,
          groupSize: values.length,
        });
      }
    }

    // Process custom facets
    if (customFacetSelections && customFacetConfigs) {
      for (const [facetId, selectedIndices] of Object.entries(customFacetSelections)) {
        if (!selectedIndices || selectedIndices.length === 0) continue;

        const customFacet = customFacetConfigs.find(f => f.id === facetId);
        if (!customFacet) continue;

        for (const indexStr of selectedIndices) {
          const index = parseInt(indexStr, 10);
          const option = customFacet.options?.[index];
          if (!option) continue;

          result.push({
            key: facetId,
            value: indexStr,
            label: option.label,
            fieldLabel: customFacet.title,
            isCustomFacet: true,
          });
        }
      }
    }

    return result;
  }, [facets, facetOperators, customFacetSelections, facetFields, visibleFilters, defaultFilters, customFacetConfigs, getTaxonomyLabel]);

  // Handle chip removal
  const handleRemove = useCallback((chip) => {
    if (chip.isCustomFacet) {
      dispatch(actions.removeCustomFacet(chip.key));
    } else {
      dispatch(actions.removeFacet(chip.key, chip.value));
    }
  }, [dispatch]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    dispatch(actions.clearFacets());
  }, [dispatch]);

  // Don't render if disabled or no chips
  if (!showActiveFilters || chips.length === 0) {
    return null;
  }

  return (
    <div
      className="mg-search__active-filters"
      role="region"
      aria-label="Active filters"
    >
      <span className="mg-search__active-filters-label" id={labelId}>
        Filtered by:
      </span>

      <ul
        className="mg-search__active-filters-list"
        aria-labelledby={labelId}
        role="list"
      >
        {chips.map((chip, index) => (
          <li key={`${chip.key}-${chip.value}-${index}`} role="listitem">
            {/* Show "and" connector between AND-grouped chips (not before first) */}
            {chip.operator === 'AND' &&
              chip.groupSize > 1 &&
              !chip.isFirstInGroup && (
                <span
                  className="mg-search__filter-chip-connector"
                  aria-hidden="true"
                >
                  and
                </span>
              )}
            <button
              type="button"
              className="mg-search__filter-chip"
              onClick={() => handleRemove(chip)}
              aria-label={`Remove filter: ${chip.fieldLabel} is ${chip.label}`}
            >
              <span className="mg-search__filter-chip-label">{chip.label}</span>
              <span className="mg-search__filter-chip-remove" aria-hidden="true">
                &times;
              </span>
            </button>
          </li>
        ))}
      </ul>

      {chips.length > 1 && (
        <button
          type="button"
          className="mg-search__clear-all"
          onClick={handleClearAll}
          aria-label={`Clear all ${chips.length} active filters`}
        >
          Clear all filters
        </button>
      )}

      {/* Screen reader announcement */}
      <span className="mg-u-sr-only" role="status" aria-live="polite">
        {chips.length} active filter{chips.length !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

/**
 * Get human-readable label for a facet value.
 * @param {string} key - Facet key
 * @param {string} value - Facet value
 * @param {string} vocabulary - Vocabulary type
 * @param {Function} getTaxonomyLabel - Function to look up taxonomy term labels
 * @returns {string} Human-readable label
 */
function getLabelForValue(key, value, vocabulary, getTaxonomyLabel) {
  // Year is just the numeric value
  if (key === 'year') {
    return String(value);
  }

  // Check vocabulary-specific lookups
  switch (vocabulary) {
    case 'field_domain_access': {
      const domain = getDomain(value);
      return domain?.name || value;
    }
    case 'type': {
      // Use parseTypeValue to handle both content types and namespaced subtypes
      const parsed = parseTypeValue(value);
      // For subtypes, prefix with parent type name for context
      if (parsed.isSubtype && parsed.parentType) {
        const parentInfo = getContentType(parsed.parentType);
        if (parentInfo) {
          return `${parentInfo.name}: ${parsed.label}`;
        }
      }
      return parsed.label;
    }
    case 'languages': {
      const language = getLanguage(value);
      return language?.name || value;
    }
    default:
      // For taxonomy terms (hazards, themes, countries), use taxonomy lookup
      if (getTaxonomyLabel) {
        return getTaxonomyLabel(key, value, vocabulary);
      }
      return value;
  }
}

export default ActiveFilters;
