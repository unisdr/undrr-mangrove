/**
 * @file queryBuilder.js
 * @description Elasticsearch query builder for the UNDRR Search Widget.
 *
 * Ported from vanilla JS SearchWidgetQuery.js for React 19 integration.
 * Builds Elasticsearch Query DSL from widget state and configuration.
 *
 * @module SearchWidget/utils/queryBuilder
 */

import { SCORING_CONFIG, HIGHLIGHT_CONFIG, FACET_FIELDS } from './constants';

/**
 * Build a complete Elasticsearch query from state and config.
 *
 * Uses post_filter pattern for disjunctive faceting:
 * - Facet filters are applied via post_filter (after aggregations)
 * - This allows each facet dropdown to show ALL available options
 * - Non-facet filters (status, customFilters) remain in the main query
 *
 * @param {Object} params - Query parameters
 * @param {string} params.query - Search query string
 * @param {Object} params.facets - Active facet filters { [key]: [values] }
 * @param {Object} params.facetOperators - Operator per facet { [key]: 'OR' | 'AND' }
 * @param {Object} params.customFacets - Custom facet selections { [facetId]: [indices] }
 * @param {string} params.sortBy - Sort order: 'newest', 'oldest', 'relevance'
 * @param {Object} config - Widget configuration
 * @returns {Object} Elasticsearch query body
 */
export function buildQuery({ query, facets, facetOperators, customFacets, sortBy }, config) {
  const scoring = config.scoring || SCORING_CONFIG;
  const highlight = config.highlight || HIGHLIGHT_CONFIG;
  const resultsPerPage = config.resultsPerPage || 50;
  const facetCountToShow = config.facetCountToShow || 500;
  const facetFields = config.facetFields || FACET_FIELDS;

  // Build the main query (excludes facet filters for disjunctive faceting)
  const mainQuery = buildMainQuery(query, scoring, config);

  // Build post_filter with all facet filters (applied after aggregations)
  const postFilter = buildPostFilter(facets, facetOperators, customFacets, config);

  const result = {
    size: resultsPerPage,
    sort: buildSort(sortBy),
    query: mainQuery,
    highlight: buildHighlight(highlight),
    aggs: buildAggregations(facetFields, facetCountToShow),
  };

  // Only add post_filter if there are active facet filters
  if (postFilter) {
    result.post_filter = postFilter;
  }

  return result;
}

/**
 * Build sort configuration.
 * @param {string} sortBy - Sort order
 * @returns {Array} Elasticsearch sort array
 */
function buildSort(sortBy) {
  switch (sortBy) {
    case 'newest':
      return [{ published_at: { order: 'desc' } }];
    case 'oldest':
      return [{ published_at: { order: 'asc' } }];
    case 'relevance':
    default:
      return [{ _score: { order: 'desc' } }];
  }
}

/**
 * Build the main query structure with function_score.
 * Excludes facet filters (those go in post_filter for disjunctive faceting).
 * @private
 */
function buildMainQuery(searchQuery, scoring, config) {
  const boolQuery = {
    must: buildMustClause(searchQuery, scoring, config),
    filter: buildBaseFilters(config),
  };

  // Add phrase boosting for relevance
  const should = buildPhraseBoosting(searchQuery, scoring);
  if (should.length > 0) {
    boolQuery.should = should;
  }

  return {
    function_score: {
      query: { bool: boolQuery },
      functions: buildScoringFunctions(scoring),
      score_mode: 'multiply',
      boost_mode: 'multiply',
    },
  };
}

/**
 * Build base filters that are NOT facet filters.
 * These stay in the main query (not moved to post_filter).
 * @private
 */
function buildBaseFilters(config) {
  const filters = [];

  // Always filter by published status
  filters.push({
    term: { status: 'true' },
  });

  // Add custom filters from config (e.g., ["type:news", "year:[2020 TO 2024]"])
  const customFilterStrings = config.customFilters || [];
  for (const filterString of customFilterStrings) {
    if (filterString && filterString.trim()) {
      filters.push({
        query_string: {
          query: filterString.trim(),
        },
      });
    }
  }

  return filters;
}

/**
 * Build post_filter containing all facet filters.
 * Applied after aggregations for disjunctive faceting.
 * @private
 */
function buildPostFilter(facets, facetOperators, customFacets, config) {
  const filters = [];

  // Add custom facet filters (editor-defined dropdowns)
  const customFacetFilters = buildCustomFacetFilters(customFacets, config);
  filters.push(...customFacetFilters);

  // Get custom facet IDs to skip them in regular facet processing
  const customFacetConfigs = config.customFacets || [];
  const customFacetIds = new Set(customFacetConfigs.map(f => f.id));

  // Add standard facet filters
  for (const [key, values] of Object.entries(facets)) {
    if (!values || values.length === 0) continue;
    if (customFacetIds.has(key)) continue; // Custom facets handled separately

    const operator = facetOperators[key] || 'OR';

    // Year uses script filter because published_at is a date
    if (key === 'year') {
      const years = values.map(y => parseInt(y, 10));
      if (operator === 'AND' && years.length > 1) {
        // AND for year is semantically impossible (one doc can't have multiple years)
        // but we include it for completeness - will return no results
        filters.push({
          bool: {
            must: years.map(y => ({
              script: {
                script: {
                  source: `
                    if (doc.containsKey('published_at') && doc['published_at'].size() != 0) {
                      return doc['published_at'].value.getYear() == params.year;
                    }
                    return false;
                  `,
                  lang: 'painless',
                  params: { year: y },
                },
              },
            })),
          },
        });
      } else {
        // OR: match any of the selected years
        filters.push({
          script: {
            script: {
              source: `
                if (doc.containsKey('published_at') && doc['published_at'].size() != 0) {
                  int docYear = doc['published_at'].value.getYear();
                  for (int y : params.years) {
                    if (docYear == y) return true;
                  }
                }
                return false;
              `,
              lang: 'painless',
              params: { years },
            },
          },
        });
      }
      continue;
    }

    // Standard facet filters
    if (values.length === 1) {
      // Single value - always use term query
      filters.push({
        term: { [key]: values[0] },
      });
    } else if (operator === 'AND') {
      // AND: must match ALL selected values
      filters.push({
        bool: {
          must: values.map(v => ({ term: { [key]: v } })),
        },
      });
    } else {
      // OR: match ANY selected value (default behavior)
      filters.push({
        terms: { [key]: values },
      });
    }
  }

  // Return null if no filters, otherwise wrap in bool.must
  if (filters.length === 0) {
    return null;
  }

  if (filters.length === 1) {
    return filters[0];
  }

  return {
    bool: {
      must: filters,
    },
  };
}

/**
 * Build the must clause for the query.
 * Includes queryAppend (hidden terms added to all searches).
 * Removes stop words from the query for more consistent results.
 * @private
 */
function buildMustClause(searchQuery, scoring, config) {
  const queryAppend = config.queryAppend || '';
  const stopWords = scoring.stopWords || [];

  // Sanitize query to prevent Elasticsearch errors (unclosed quotes, trailing operators)
  const sanitizedQuery = sanitizeQuery(searchQuery || '');

  // Combine user query with appended terms
  let combinedQuery = sanitizedQuery;
  if (queryAppend) {
    combinedQuery = combinedQuery
      ? `${combinedQuery} ${queryAppend}`
      : queryAppend;
  }

  const fieldWeights = scoring.fieldWeights;

  // For empty queries, use wildcard "*" to match all documents
  // Note: match_all doesn't work with the UNDRR search endpoint proxy
  if (!combinedQuery || combinedQuery.length === 0) {
    return {
      query_string: {
        query: '*',
        analyze_wildcard: true,
      },
    };
  }

  // Remove stop words for more consistent matching
  // e.g., "The Draft Articles on the Protection" and "Draft Articles on Protection"
  // will both search for the same core terms
  const cleanedQuery = removeStopWords(combinedQuery, stopWords);

  return {
    query_string: {
      query: addFuzziness(cleanedQuery),
      fields: Object.entries(fieldWeights).map(
        ([field, weight]) => `${field}^${weight}`
      ),
      default_operator: 'AND',
      analyze_wildcard: true,
    },
  };
}

/**
 * Sanitize a query string to prevent Elasticsearch errors.
 * Handles common issues like unclosed quotes and trailing operators.
 *
 * @param {string} query - Raw query string
 * @returns {string} Sanitized query string
 */
function sanitizeQuery(query) {
  if (!query) return query;

  let sanitized = query.trim();

  // Balance unclosed quotes by removing the lone quote or closing it
  const quoteCount = (sanitized.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    // Odd number of quotes - remove the last one to prevent syntax error
    const lastQuoteIndex = sanitized.lastIndexOf('"');
    sanitized =
      sanitized.slice(0, lastQuoteIndex) + sanitized.slice(lastQuoteIndex + 1);
  }

  // Remove trailing boolean operators (AND, OR, NOT) that would cause errors
  sanitized = sanitized.replace(/\s+(AND|OR|NOT)\s*$/i, '');

  // Remove leading boolean operators
  sanitized = sanitized.replace(/^\s*(AND|OR|NOT)\s+/i, '');

  // Remove standalone boolean operators
  if (/^(AND|OR|NOT)$/i.test(sanitized.trim())) {
    return '';
  }

  // Remove trailing special characters that cause issues
  sanitized = sanitized.replace(/[\-\+]+$/, '');

  return sanitized.trim();
}

/**
 * Remove common stop words from query for better phrase matching.
 * e.g., Draft Articles on the Protection → Draft Articles Protection
 *
 * IMPORTANT: If the query contains quotes (explicit phrase search),
 * stop words are NOT removed to preserve user intent.
 * e.g., "The Draft Articles" stays as "The Draft Articles"
 *
 * @param {string} query - Search query
 * @param {Array<string>} stopWords - List of stop words to remove
 * @returns {string} Query with stop words removed (unless quoted)
 */
function removeStopWords(query, stopWords = []) {
  if (!stopWords || stopWords.length === 0 || !query) {
    return query;
  }

  // If query contains quotes, user wants exact phrase - don't remove stop words
  if (query.includes('"')) {
    return query;
  }

  const words = query.split(/\s+/);
  const filtered = words.filter(
    word => !stopWords.includes(word.toLowerCase())
  );
  // Return original if all words were stop words
  return filtered.length > 0 ? filtered.join(' ') : query;
}

/**
 * Add fuzziness to search query for typo tolerance.
 * @param {string} query - Search query
 * @param {number} fuzzinessLevel - Fuzziness level (default: 1)
 * @returns {string} Query with fuzziness
 */
function addFuzziness(query, fuzzinessLevel = 1) {
  // Don't add fuzziness to quoted phrases (user wants exact match)
  if (query.includes('"')) {
    return query;
  }

  // Don't add fuzziness to queries with other special characters
  const specialCharacters = /[:~^/+\-!(){}[\]~*?:\\&|<>=@]/;
  if (specialCharacters.test(query)) {
    return query;
  }

  const terms = query.split(/\s+/);
  return terms.map(term => `${term}~${fuzzinessLevel}`).join(' ');
}

/**
 * Build phrase boosting clauses for relevance.
 * Improves relevance when search terms appear together in order.
 * Uses three tiers of matching (all with stop words removed):
 * - match: partial word matching
 * - exactPhrase: slop 0, words must be in exact order
 * - nearPhrase: slop 2, allows minor word order variations
 *
 * @param {string} searchQuery - The search query
 * @param {Object} scoring - Scoring configuration
 * @returns {Array} Array of should clauses for phrase boosting
 * @private
 */
function buildPhraseBoosting(searchQuery, scoring) {
  const should = [];

  if (!searchQuery || searchQuery.trim().length === 0) {
    return should;
  }

  const phraseBoosts = scoring.phraseBoosts || {};
  const nearPhraseSlop = scoring.nearPhraseSlop ?? 2;
  const stopWords = scoring.stopWords || [];

  // Sanitize, strip quotes, then remove stop words
  const sanitizedQuery = sanitizeQuery(searchQuery);
  const unquotedQuery = stripQuotes(sanitizedQuery);
  const cleanedQuery = removeStopWords(unquotedQuery, stopWords);

  // Skip if query is empty after sanitization
  if (!cleanedQuery || cleanedQuery.trim().length === 0) {
    return should;
  }

  // Helper to add phrase boost clauses for a field
  const addPhraseBoosts = (field, config) => {
    if (!config) return;

    // Partial match (cleaned query)
    if (config.match) {
      should.push({
        match: {
          [field]: {
            query: cleanedQuery,
            boost: config.match,
          },
        },
      });
    }

    // Exact phrase (slop: 0, cleaned query)
    if (config.exactPhrase) {
      should.push({
        match_phrase: {
          [field]: {
            query: cleanedQuery,
            slop: 0,
            boost: config.exactPhrase,
          },
        },
      });
    }

    // Near-exact phrase (slop: 2, cleaned query)
    if (config.nearPhrase) {
      should.push({
        match_phrase: {
          [field]: {
            query: cleanedQuery,
            slop: nearPhraseSlop,
            boost: config.nearPhrase,
          },
        },
      });
    }
  };

  // Add phrase boosts for each configured field
  addPhraseBoosts('teaser', phraseBoosts.teaser);
  addPhraseBoosts('title', phraseBoosts.title);
  addPhraseBoosts('body', phraseBoosts.body);
  addPhraseBoosts('saa_field_attachment', phraseBoosts.saa_field_attachment);

  return should;
}

/**
 * Build filter clauses from custom facet selections.
 * Custom facets store option indices in state; we look up query strings from config.
 * @private
 */
function buildCustomFacetFilters(customFacets, config) {
  const filters = [];
  const customFacetConfigs = config.customFacets || [];

  if (customFacetConfigs.length === 0 || !customFacets) return filters;

  // Check each custom facet for selections
  for (const customFacet of customFacetConfigs) {
    const selectedIndices = customFacets[customFacet.id];
    if (!selectedIndices || selectedIndices.length === 0) continue;

    // Get query strings for selected options
    const queries = [];
    for (const indexStr of selectedIndices) {
      const index = parseInt(indexStr, 10);
      const option = customFacet.options?.[index];
      if (option && option.query && option.query.trim()) {
        queries.push(option.query.trim());
      }
    }

    if (queries.length === 0) continue;

    // For single selection, use simple query_string
    if (queries.length === 1) {
      filters.push({
        query_string: {
          query: queries[0],
        },
      });
    } else {
      // Multiple selections - use bool should (OR)
      filters.push({
        bool: {
          should: queries.map(q => ({
            query_string: { query: q },
          })),
          minimum_should_match: 1,
        },
      });
    }
  }

  return filters;
}

/**
 * Strip quotes from a query string.
 * @param {string} query - Query that may contain quotes
 * @returns {string} Query with quotes removed
 */
function stripQuotes(query) {
  return query ? query.replace(/"/g, '') : query;
}

/**
 * Build scoring functions for relevance tuning.
 * @private
 */
function buildScoringFunctions(scoring) {
  return [
    buildContentTypeBoost(scoring),
    buildTerminologyBoost(scoring),
    buildRecencyBoost(scoring),
    buildInterestingnessBoost(scoring),
  ];
}

/**
 * Build content type boost function (boost landing pages).
 * @private
 */
function buildContentTypeBoost(scoring) {
  const landingWeight = scoring.contentTypeBoosts?.landing || 5.0;
  return {
    filter: {
      terms: {
        type: ['landing'],
      },
    },
    weight: landingWeight,
  };
}

/**
 * Build terminology boost function.
 * @private
 */
function buildTerminologyBoost(scoring) {
  const terminologyWeight = scoring.contentTypeBoosts?.terminology || 1.5;
  return {
    filter: {
      terms: {
        type: ['terminology'],
      },
    },
    weight: terminologyWeight,
  };
}

/**
 * Build recency boost with longevity-based decay.
 * Documents with higher longevity values decay slower.
 * @private
 */
function buildRecencyBoost(scoring) {
  const longevity = scoring.longevity;
  const defaultLongevity = scoring.defaultLongevity;

  return {
    script_score: {
      script: {
        source: `
          double baseScale = 5000; // Default decay ~15 years

          double longevity = (doc.containsKey('field_meta_longevity') && doc['field_meta_longevity'].size() > 0)
                              ? doc['field_meta_longevity'].value
                              : params.defaultLongevity;

          if (longevity <= params.today) baseScale = params.todayScale;
          else if (longevity <= params.days) baseScale = params.daysScale;
          else if (longevity <= params.week) baseScale = params.weekScale;
          else if (longevity <= params.month) baseScale = params.monthScale;
          else if (longevity <= params.year) baseScale = params.yearScale;
          else if (longevity <= params.longtime) baseScale = params.longtimeScale;
          else baseScale = params.alwaysScale;

          if (!doc.containsKey('published_at') || doc['published_at'].empty) return 1.0;
          return Math.exp((doc['published_at'].value.toInstant().toEpochMilli() - params.now) / (baseScale * 86400000));
        `,
        params: {
          now: Date.now(),
          defaultLongevity,
          today: longevity.today.max,
          todayScale: longevity.today.scale,
          days: longevity.days.max,
          daysScale: longevity.days.scale,
          week: longevity.week.max,
          weekScale: longevity.week.scale,
          month: longevity.month.max,
          monthScale: longevity.month.scale,
          year: longevity.year.max,
          yearScale: longevity.year.scale,
          longtime: longevity.longtime.max,
          longtimeScale: longevity.longtime.scale,
          alwaysScale: longevity.always.scale,
        },
      },
    },
  };
}

/**
 * Build interestingness boost.
 * Documents with higher interestingness values rank higher.
 * @private
 */
function buildInterestingnessBoost(scoring) {
  const interest = scoring.interestingness;

  return {
    script_score: {
      script: {
        source: `
          double interestingness = 1.0; // default
          if (doc.containsKey('field_meta_interestingness') && doc['field_meta_interestingness'].size() > 0) {
            double value = doc['field_meta_interestingness'].value;
            if (value <= params.demoted) interestingness = params.demotedWeight;
            else if (value <= params.deferred) interestingness = params.deferredWeight;
            else if (value <= params.average) interestingness = params.averageWeight;
            else if (value <= params.promoted) interestingness = params.promotedWeight;
            else interestingness = params.announcedWeight;
          }
          return interestingness;
        `,
        params: {
          demoted: interest.demoted.max,
          demotedWeight: interest.demoted.weight,
          deferred: interest.deferred.max,
          deferredWeight: interest.deferred.weight,
          average: interest.average.max,
          averageWeight: interest.average.weight,
          promoted: interest.promoted.max,
          promotedWeight: interest.promoted.weight,
          announcedWeight: interest.announced.weight,
        },
      },
    },
  };
}

/**
 * Build highlight configuration.
 * @private
 */
function buildHighlight(highlight) {
  return {
    order: 'desc',
    number_of_fragments: highlight.numberOfFragments,
    fragment_size: highlight.fragmentSize,
    fields: {
      body: {
        pre_tags: highlight.preTags,
        post_tags: highlight.postTags,
      },
      title: { number_of_fragments: 0 },
    },
  };
}

/**
 * Build aggregations for facets.
 * Uses simple aggregations scoped to the main query.
 * Selected values are preserved in dropdowns via the UI component.
 * @private
 */
function buildAggregations(facetFields, facetCount) {
  const aggs = {};

  // Standard field aggregations
  for (const field of facetFields) {
    if (field.key === 'year') continue; // Year handled separately

    aggs[field.key] = {
      terms: {
        field: field.key,
        size: facetCount,
      },
    };
  }

  // Year aggregation uses script to extract year from date
  aggs.year = {
    terms: {
      script: {
        source: `
          if (doc.containsKey('published_at') && doc['published_at'].size() != 0) {
            return doc['published_at'].value.getYear();
          }
        `,
        lang: 'painless',
      },
      size: facetCount,
    },
  };

  return aggs;
}

/**
 * Extract buckets from aggregation response.
 * Handles both old format (aggs.field.buckets) and new global+filter format
 * (aggs.field.filtered.values.buckets).
 *
 * @param {Object} aggregations - Elasticsearch aggregations response
 * @param {string} fieldKey - The field key to extract buckets for
 * @returns {Array} Array of bucket objects with key and doc_count
 */
export function getAggregationBuckets(aggregations, fieldKey) {
  if (!aggregations || !aggregations[fieldKey]) {
    return [];
  }

  const agg = aggregations[fieldKey];

  // New format: global + filter structure
  if (agg.filtered?.values?.buckets) {
    return agg.filtered.values.buckets;
  }

  // Old format: direct buckets
  if (agg.buckets) {
    return agg.buckets;
  }

  return [];
}

export default buildQuery;
