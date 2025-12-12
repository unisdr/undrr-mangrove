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
import { FACET_FIELDS, isFilterVisible } from '../utils/constants';
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
   * Merge type and news_type buckets for combined display.
   * News type options are marked with data-news-type for proper state routing.
   */
  const getMergedTypeBuckets = useMemo(() => {
    if (!aggregations) return [];

    const typeBuckets = aggregations.type?.buckets || [];
    const newsTypeBuckets = aggregations.field_news_type?.buckets || [];

    // Combine and sort by count
    const merged = [
      ...typeBuckets.map(b => ({ ...b, isNewsType: false })),
      ...newsTypeBuckets.map(b => ({ ...b, isNewsType: true })),
    ];

    return merged.sort((a, b) => b.doc_count - a.doc_count);
  }, [aggregations]);

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
        // Skip news_type - it's merged into type
        if (field.key === 'field_news_type') {
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
  }, [fields, aggregations, visibleFilters, allowedTypes, getMergedTypeBuckets, getLabel, widgetId]);

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
