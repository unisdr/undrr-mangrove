/**
 * @file FacetsSidebar.jsx
 * @description Facets sidebar component with sort options and filters.
 *
 * Renders the right sidebar containing:
 * - Sort options (relevance, newest, oldest)
 * - Facet dropdowns for filtering (type, country, hazard, theme, etc.)
 * - Custom facets defined in configuration
 *
 * @module SearchWidget/components/FacetsSidebar
 */

import React, { useMemo } from 'react';
import { useSearchState, useSearchConfig, useSearchDispatch, actions } from '../context/SearchContext';
import { useTaxonomies } from '../hooks/useTaxonomies';
import {
  FACET_FIELDS,
  CONTENT_SUBTYPES,
  createSubtypeValue,
  isFilterVisible,
} from '../utils/constants';
import SortOptions from './SortOptions';
import FacetSelect from './FacetSelect';
import CustomFacetSelect from './CustomFacetSelect';

/**
 * FacetsSidebar component.
 * Container for sort options and all facet filters.
 *
 * @param {Object} props - Component props
 * @param {string} props.widgetId - Unique widget ID for accessibility
 */
export function FacetsSidebar({ widgetId = 'search' }) {
  const config = useSearchConfig();
  const { aggregations } = useSearchState();
  const { getLabel, isLoading: taxonomiesLoading } = useTaxonomies();

  const { visibleFilters, allowedTypes, customFacets = [], facetFields } = config;

  // Use config facet fields or default
  const fields = facetFields || FACET_FIELDS;

  /**
   * Merge content types with their subtypes for hierarchical display.
   * Parent types keep their original keys (e.g., "news").
   * Subtypes get namespaced keys (e.g., "field_news_type:751").
   *
   * Returns buckets organized as: parent types with their subtypes grouped after them.
   */
  const getMergedTypeBuckets = useMemo(() => {
    if (!aggregations) return [];

    const typeBuckets = aggregations.type?.buckets || [];

    // Build result with parent types and their subtypes interleaved
    const result = [];

    // Process each parent type bucket
    for (const parentBucket of typeBuckets) {
      // Add the parent type
      result.push({
        ...parentBucket,
        isSubtype: false,
        parentType: null,
      });

      // Check if this parent type has subtypes configured
      const subtypeConfig = CONTENT_SUBTYPES[parentBucket.key];
      if (subtypeConfig) {
        // Get subtype buckets from aggregations
        const subtypeBuckets = aggregations[subtypeConfig.field]?.buckets || [];

        // Add subtypes with namespaced keys, sorted by count
        const sortedSubtypes = [...subtypeBuckets].sort((a, b) => b.doc_count - a.doc_count);
        for (const subtypeBucket of sortedSubtypes) {
          result.push({
            key: createSubtypeValue(subtypeConfig.field, subtypeBucket.key),
            doc_count: subtypeBucket.doc_count,
            isSubtype: true,
            parentType: parentBucket.key,
          });
        }
      }
    }

    return result;
  }, [aggregations]);

  // Build set of subtype field names to skip (they're merged into type)
  const subtypeFields = useMemo(() => {
    return new Set(Object.values(CONTENT_SUBTYPES).map(config => config.field));
  }, []);

  /**
   * Render standard facets.
   */
  const renderFacets = useMemo(() => {
    return fields
      .filter((field) => {
        // Skip hidden filters
        if (!isFilterVisible(field.key, visibleFilters)) {
          return false;
        }
        // Skip subtype fields - they're merged into type dropdown
        if (subtypeFields.has(field.key)) {
          return false;
        }
        return true;
      })
      .map((field) => {
        // Special handling for merged type/news_type
        if (field.key === 'type') {
          return (
            <FacetSelect
              key={field.key}
              field={field}
              buckets={getMergedTypeBuckets}
              getLabel={getLabel}
              widgetId={widgetId}
              allowedTypes={allowedTypes}
            />
          );
        }

        // Standard facet
        const buckets = aggregations?.[field.key]?.buckets || [];
        return (
          <FacetSelect
            key={field.key}
            field={field}
            buckets={buckets}
            getLabel={getLabel}
            widgetId={widgetId}
            allowedTypes={allowedTypes}
          />
        );
      });
  }, [fields, aggregations, visibleFilters, allowedTypes, subtypeFields, getMergedTypeBuckets, getLabel, widgetId]);

  /**
   * Render custom facets (editor-defined dropdowns).
   */
  const renderCustomFacets = useMemo(() => {
    if (!customFacets || customFacets.length === 0) {
      return null;
    }

    // Sort by weight
    const sorted = [...customFacets].sort((a, b) => (a.weight || 50) - (b.weight || 50));

    return sorted.map((facet) => (
      <CustomFacetSelect
        key={facet.id}
        facet={facet}
        widgetId={widgetId}
      />
    ));
  }, [customFacets, widgetId]);

  return (
    <div className="mg-search__facets" data-mg-search-facets>
      {/* Sort options */}
      <SortOptions widgetId={widgetId} />

      {/* Loading indicator for taxonomies */}
      {taxonomiesLoading && (
        <div className="mg-search__facets-loading" aria-live="polite">
          Loading filters...
        </div>
      )}

      {/* Facet containers */}
      <div className="mg-search__facet-containers">
        {/* Custom facets (rendered first based on weight) */}
        {renderCustomFacets}

        {/* Standard facets */}
        {renderFacets}
      </div>
    </div>
  );
}

export default FacetsSidebar;
