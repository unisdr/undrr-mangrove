/**
 * @file FacetSelect.jsx
 * @description Individual facet dropdown component.
 *
 * Renders a custom select dropdown for a single facet with options from
 * Elasticsearch aggregations and labels from taxonomy data.
 *
 * Uses the lightweight SelectDropdown component instead of Chosen.js,
 * making it work in any environment (Drupal, Storybook, standalone).
 *
 * @module SearchWidget/components/FacetSelect
 */

import React, { useMemo, useCallback } from 'react';
import { useSearchState, useSearchDispatch, actions } from '../context/SearchContext';
import { SelectDropdown } from './SelectDropdown';
import {
  ALWAYS_OR_FACETS,
  FACET_SEARCH_THRESHOLD,
  parseTypeValue,
  isSubtypeValue,
  getContentType,
} from '../utils/constants';

/**
 * FacetSelect component.
 * Renders a custom dropdown for a facet field.
 *
 * @param {Object} props - Component props
 * @param {Object} props.field - Facet field config { key, label, vocabulary, type }
 * @param {Array} props.buckets - Elasticsearch aggregation buckets
 * @param {Function} props.getLabel - Function to get label for a value
 * @param {string} props.widgetId - Unique widget ID for accessibility
 * @param {Object} props.allowedTypes - Optional type restrictions
 */
export function FacetSelect({
  field,
  buckets = [],
  getLabel,
  widgetId = 'search',
  allowedTypes = null,
}) {
  const { facets, facetOperators } = useSearchState();
  const dispatch = useSearchDispatch();

  const { key, label, vocabulary, type } = field;
  const isMultiple = type === 'select-multiple';
  const selectedValues = facets[key] || [];

  // Determine if operator toggle should be shown
  // Only show for multi-select facets with 2+ values that aren't in ALWAYS_OR_FACETS
  const showOperatorToggle =
    isMultiple &&
    selectedValues.length >= 2 &&
    !ALWAYS_OR_FACETS.includes(key);

  const currentOperator = facetOperators[key] || 'OR';

  /**
   * Handle operator toggle change.
   */
  const handleOperatorChange = useCallback(
    (newOperator) => {
      dispatch(actions.setFacetOperator(key, newOperator));
    },
    [dispatch, key]
  );

  /**
   * Filter and map buckets to options with labels.
   * Ensures selected values are always visible even if not in aggregation results.
   *
   * For the type facet, options may include subtypes with namespaced keys
   * (e.g., "field_news_type:751") that are rendered indented under their parent.
   */
  const options = useMemo(() => {
    const isTypeFacet = key === 'type';

    // Build options from buckets
    const bucketOptions = buckets
      .filter((bucket) => {
        // Filter by allowed types if configured
        if (isTypeFacet && allowedTypes) {
          const bucketKey = String(bucket.key);
          // For subtypes, check if parent type is allowed
          if (bucket.isSubtype && bucket.parentType) {
            if (Array.isArray(allowedTypes)) {
              return allowedTypes.includes(bucket.parentType);
            }
            if (typeof allowedTypes === 'object' && allowedTypes.types) {
              return allowedTypes.types.includes(bucket.parentType);
            }
          }
          // For parent types, check if type is allowed
          if (Array.isArray(allowedTypes)) {
            return allowedTypes.includes(bucketKey);
          }
          if (typeof allowedTypes === 'object' && allowedTypes.types) {
            return allowedTypes.types.includes(bucketKey);
          }
        }
        return true;
      })
      .map((bucket) => {
        const bucketKey = String(bucket.key);
        const isSelected = selectedValues.includes(bucketKey);

        // For type facet, use parseTypeValue for unified label resolution
        let optionLabel;
        let isSubtype = false;
        let parentType = bucket.parentType || null;
        if (isTypeFacet) {
          const parsed = parseTypeValue(bucketKey);
          optionLabel = parsed.label;
          isSubtype = parsed.isSubtype;
          parentType = parsed.parentType || parentType;

          // When subtype is selected, prefix with parent type for context
          // e.g., "Research briefs" → "News: Research briefs"
          if (isSubtype && isSelected && parentType) {
            const parentInfo = getContentType(parentType);
            if (parentInfo) {
              optionLabel = `${parentInfo.name}: ${optionLabel}`;
            }
          }
        } else {
          optionLabel = getLabel(key, bucket.key, vocabulary);
        }

        // Skip if label indicates disabled
        if (optionLabel === 'DISABLED') return null;

        return {
          value: bucketKey,
          label: optionLabel,
          count: bucket.doc_count,
          isSelected,
          isSubtype: isSubtype || bucket.isSubtype || false,
          parentType,
        };
      })
      .filter(Boolean);

    // Track which values we have from buckets
    const bucketValues = new Set(bucketOptions.map((o) => o.value));

    // Add selected values that aren't in buckets (so users can deselect them)
    const missingSelectedOptions = selectedValues
      .filter((v) => !bucketValues.has(v))
      .map((value) => {
        // For type facet, use parseTypeValue
        let optionLabel;
        let isSubtype = false;
        let parentType = null;
        if (isTypeFacet) {
          const parsed = parseTypeValue(value);
          optionLabel = parsed.label;
          isSubtype = parsed.isSubtype;
          parentType = parsed.parentType;

          // When subtype is selected, prefix with parent type for context
          if (isSubtype && parentType) {
            const parentInfo = getContentType(parentType);
            if (parentInfo) {
              optionLabel = `${parentInfo.name}: ${optionLabel}`;
            }
          }
        } else {
          optionLabel = getLabel(key, value, vocabulary);
        }

        return {
          value,
          label: optionLabel,
          count: 0, // Not in current results
          isSelected: true,
          isSubtype,
          parentType,
        };
      });

    // Combine options
    const allOptions = [...bucketOptions, ...missingSelectedOptions];

    // For type facet, preserve hierarchical order (parent-child grouping)
    // Only float selected items to top, don't re-sort by count
    if (isTypeFacet) {
      return allOptions.sort((a, b) => {
        // Selected items float to top
        if (a.isSelected && !b.isSelected) return -1;
        if (!a.isSelected && b.isSelected) return 1;
        // Keep original hierarchical order for same selection state
        return 0;
      });
    }

    // For other facets, sort selected first, then by count
    return allOptions.sort((a, b) => {
      if (a.isSelected && !b.isSelected) return -1;
      if (!a.isSelected && b.isSelected) return 1;
      return b.count - a.count;
    });
  }, [buckets, key, vocabulary, getLabel, allowedTypes, selectedValues]);

  /**
   * Handle selection change from SelectDropdown.
   */
  const handleChange = useCallback(
    (newValue) => {
      if (isMultiple) {
        // newValue is an array for multi-select
        const values = Array.isArray(newValue) ? newValue : [newValue];
        if (values.length === 0) {
          dispatch(actions.removeFacet(key));
        } else {
          dispatch(actions.setFacet(key, values, true));
        }
      } else {
        // newValue is a single value for single-select
        if (newValue === null || newValue === undefined || newValue === '') {
          dispatch(actions.removeFacet(key));
        } else {
          dispatch(actions.setFacet(key, newValue, true));
        }
      }
    },
    [dispatch, key, isMultiple]
  );

  // Don't render if no options
  if (options.length === 0) {
    return null;
  }

  const selectId = `facet-${key}-${widgetId}`;

  return (
    <fieldset className="mg-search__facet" data-facet-key={key}>
      <legend id={`${selectId}-label`}>{label}</legend>
      <SelectDropdown
        id={selectId}
        label={label}
        placeholder={`Select ${label.toLowerCase()}`}
        options={options}
        value={isMultiple ? selectedValues : selectedValues[0] || ''}
        onChange={handleChange}
        multiple={isMultiple}
        searchThreshold={FACET_SEARCH_THRESHOLD}
      />
      {showOperatorToggle && (
        <div className="mg-search__facet-operator">
          <div className="mg-search__facet-operator-row">
            <span className="mg-search__facet-operator-label">Match:</span>
            <div
              className="mg-search__facet-operator-toggle"
              role="radiogroup"
              aria-label={`Match mode for ${label}`}
            >
              <label
                className={`mg-search__facet-operator-option ${
                  currentOperator === 'OR'
                    ? 'mg-search__facet-operator-option--active'
                    : ''
                }`}
              >
                <input
                  type="radio"
                  name={`${key}-operator`}
                  value="OR"
                  checked={currentOperator === 'OR'}
                  onChange={() => handleOperatorChange('OR')}
                />
                <span>Any of these</span>
              </label>
              <label
                className={`mg-search__facet-operator-option ${
                  currentOperator === 'AND'
                    ? 'mg-search__facet-operator-option--active'
                    : ''
                }`}
              >
                <input
                  type="radio"
                  name={`${key}-operator`}
                  value="AND"
                  checked={currentOperator === 'AND'}
                  onChange={() => handleOperatorChange('AND')}
                />
                <span>All of these</span>
              </label>
            </div>
          </div>
          <p className="mg-search__facet-operator-hint">
            {currentOperator === 'OR'
              ? `Results include any of the ${selectedValues.length} selected`
              : `Results must match all ${selectedValues.length} selected`}
          </p>
        </div>
      )}
    </fieldset>
  );
}

export default FacetSelect;
