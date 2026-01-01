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
import { ALWAYS_OR_FACETS, FACET_SEARCH_THRESHOLD } from '../utils/constants';

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
   */
  const options = useMemo(() => {
    // Build options from buckets
    const bucketOptions = buckets
      .filter((bucket) => {
        // Filter by allowed types if configured
        if ((key === 'type' || key === 'field_news_type') && allowedTypes) {
          if (Array.isArray(allowedTypes)) {
            if (key === 'type') {
              return allowedTypes.includes(String(bucket.key));
            }
            // For news types, allow if 'news' is in allowed types
            if (key === 'field_news_type') {
              return allowedTypes.includes('news');
            }
          } else if (typeof allowedTypes === 'object') {
            if (key === 'type' && allowedTypes.types) {
              return allowedTypes.types.includes(String(bucket.key));
            }
            if (key === 'field_news_type' && allowedTypes.newsTypes) {
              return allowedTypes.newsTypes.includes(String(bucket.key));
            }
          }
        }
        return true;
      })
      .map((bucket) => {
        const optionLabel = getLabel(key, bucket.key, vocabulary);
        // Skip if label indicates disabled
        if (optionLabel === 'DISABLED') return null;

        return {
          value: String(bucket.key),
          label: optionLabel,
          count: bucket.doc_count,
          isSelected: selectedValues.includes(String(bucket.key)),
        };
      })
      .filter(Boolean);

    // Track which values we have from buckets
    const bucketValues = new Set(bucketOptions.map((o) => o.value));

    // Add selected values that aren't in buckets (so users can deselect them)
    const missingSelectedOptions = selectedValues
      .filter((v) => !bucketValues.has(v))
      .map((value) => ({
        value,
        label: getLabel(key, value, vocabulary),
        count: 0, // Not in current results
        isSelected: true,
      }));

    // Combine and sort: selected first, then by count
    return [...bucketOptions, ...missingSelectedOptions].sort((a, b) => {
      // Selected items float to top
      if (a.isSelected && !b.isSelected) return -1;
      if (!a.isSelected && b.isSelected) return 1;
      // Then sort by count
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
