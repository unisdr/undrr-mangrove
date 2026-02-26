/**
 * @file facetUtils.js
 * @description Pure data transformations for facet aggregation buckets.
 *
 * @module SearchWidget/utils/facetUtils
 */

import {
  CONTENT_SUBTYPES,
  TAXONOMY_VOCABULARY_MAP,
  createSubtypeValue,
} from './constants';

/**
 * Merge content types, subtypes, and taxonomy vocabularies into a flat list
 * for the unified Type dropdown.
 *
 * Parent types keep their original keys (e.g., "news").
 * Subtypes get namespaced keys (e.g., "field_news_type:751").
 * Vocabularies get namespaced keys (e.g., "vid:hazard").
 *
 * Returns buckets organized as:
 * 1. Content types with their subtypes grouped after them
 * 2. Taxonomy vocabularies (Countries, Hazards, Themes) appended at the end
 *
 * @param {Object} aggregations - Elasticsearch aggregation results
 * @returns {Array} Merged bucket list for the Type dropdown
 */
export function getMergedTypeBuckets(aggregations) {
  if (!aggregations) return [];

  const typeBuckets = aggregations.type?.buckets || [];
  const result = [];

  // Process each parent type bucket
  for (const parentBucket of typeBuckets) {
    result.push({
      ...parentBucket,
      isSubtype: false,
      parentType: null,
    });

    // Check if this parent type has subtypes configured
    const subtypeConfig = CONTENT_SUBTYPES[parentBucket.key];
    if (subtypeConfig) {
      const subtypeBuckets = aggregations[subtypeConfig.field]?.buckets || [];
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

  // Append taxonomy vocabulary buckets from the vid aggregation.
  // Only include vocabularies that are configured in TAXONOMY_VOCABULARIES.
  const vidBuckets = aggregations.vid?.buckets || [];
  for (const vidBucket of vidBuckets) {
    const vocab = TAXONOMY_VOCABULARY_MAP.get(vidBucket.key);
    if (vocab) {
      result.push({
        key: `vid:${vidBucket.key}`,
        doc_count: vidBucket.doc_count,
        isSubtype: false,
        isVocabulary: true,
        parentType: null,
      });
    }
  }

  return result;
}
