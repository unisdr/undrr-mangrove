/**
 * @file FacetSelect.jsx
 * @description Individual facet dropdown component.
 *
 * Renders a select element for a single facet with options from
 * Elasticsearch aggregations and labels from taxonomy data.
 *
 * @module SearchWidget/components/FacetSelect
 */

import React, { useMemo, useCallback } from 'react';
import { useSearchState, useSearchDispatch, useSearchConfig, actions } from '../context/SearchContext';

/**
 * FacetSelect component.
 * Renders a select dropdown for a facet field.
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
  const { facets } = useSearchState();
  const dispatch = useSearchDispatch();
  const config = useSearchConfig();

  const { key, label, vocabulary, type } = field;
  const isMultiple = type === 'select-multiple';
  const selectedValues = facets[key] || [];

  /**
   * Filter and map buckets to options with labels.
   */
  const options = useMemo(() => {
    return buckets
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
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [buckets, key, vocabulary, getLabel, allowedTypes]);

  /**
   * Handle select change.
   */
  const handleChange = useCallback((e) => {
    if (isMultiple) {
      const values = Array.from(e.target.selectedOptions)
        .map((opt) => opt.value)
        .filter((v) => v !== 'null');

      if (values.length === 0) {
        dispatch(actions.removeFacet(key));
      } else {
        dispatch(actions.setFacet(key, values, true));
      }
    } else {
      const value = e.target.value;
      if (value === 'null' || value === '') {
        dispatch(actions.removeFacet(key));
      } else {
        dispatch(actions.setFacet(key, value, true));
      }
    }
  }, [dispatch, key, isMultiple]);

  // Don't render if no options
  if (options.length === 0) {
    return null;
  }

  const selectId = `facet-${key}-${widgetId}`;

  return (
    <fieldset
      className="mg-search__facet"
      data-facet-key={key}
    >
      <legend>{label}</legend>
      <label htmlFor={selectId} className="mg-u-sr-only">
        {label}
      </label>
      <select
        id={selectId}
        name={key}
        className="mg-search__facet-select"
        multiple={isMultiple}
        value={isMultiple ? selectedValues : (selectedValues[0] || 'null')}
        onChange={handleChange}
        data-placeholder={`Select ${label.toLowerCase()}`}
      >
        {!isMultiple && (
          <option value="null">
            Select {label.toLowerCase()}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            data-count={option.count}
          >
            {option.label} ({option.count.toLocaleString()})
          </option>
        ))}
      </select>
    </fieldset>
  );
}

export default FacetSelect;
