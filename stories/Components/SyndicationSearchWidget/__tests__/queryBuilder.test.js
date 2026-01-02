/**
 * @file queryBuilder.test.js
 * @description Tests for Elasticsearch query builder utility.
 */

import { buildQuery, getAggregationBuckets } from '../utils/queryBuilder';
import { DEFAULT_CONFIG, SCORING_CONFIG } from '../utils/constants';

describe('queryBuilder', () => {
  const defaultState = {
    query: '',
    facets: {},
    facetOperators: {},
    customFacets: {},
    sortBy: 'relevance',
  };

  describe('buildQuery', () => {
    it('builds a basic query with defaults', () => {
      const result = buildQuery(defaultState, DEFAULT_CONFIG);

      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('sort');
      expect(result).toHaveProperty('query');
      expect(result).toHaveProperty('highlight');
      expect(result).toHaveProperty('aggs');
    });

    it('uses configured resultsPerPage', () => {
      const config = { ...DEFAULT_CONFIG, resultsPerPage: 25 };
      const result = buildQuery(defaultState, config);

      expect(result.size).toBe(25);
    });

    it('includes status filter in base query', () => {
      const result = buildQuery(defaultState, DEFAULT_CONFIG);

      // The status filter should be in the bool.filter array
      const filters = result.query.function_score.query.bool.filter;
      expect(filters).toContainEqual({ term: { status: 'true' } });
    });
  });

  describe('sort configuration', () => {
    it('sorts by _score for relevance', () => {
      const result = buildQuery(
        { ...defaultState, sortBy: 'relevance' },
        DEFAULT_CONFIG
      );

      expect(result.sort).toEqual([{ _score: { order: 'desc' } }]);
    });

    it('sorts by published_at desc for newest', () => {
      const result = buildQuery(
        { ...defaultState, sortBy: 'newest' },
        DEFAULT_CONFIG
      );

      expect(result.sort).toEqual([{ published_at: { order: 'desc' } }]);
    });

    it('sorts by published_at asc for oldest', () => {
      const result = buildQuery(
        { ...defaultState, sortBy: 'oldest' },
        DEFAULT_CONFIG
      );

      expect(result.sort).toEqual([{ published_at: { order: 'asc' } }]);
    });
  });

  describe('query building', () => {
    it('uses wildcard for empty query', () => {
      const result = buildQuery(defaultState, DEFAULT_CONFIG);

      const must = result.query.function_score.query.bool.must;
      expect(must.query_string.query).toBe('*');
    });

    it('includes field weights for non-empty query', () => {
      const result = buildQuery(
        { ...defaultState, query: 'disaster risk' },
        DEFAULT_CONFIG
      );

      const must = result.query.function_score.query.bool.must;
      expect(must.query_string.fields).toBeDefined();
      expect(must.query_string.fields.length).toBeGreaterThan(0);
    });

    it('adds fuzziness to query terms', () => {
      const result = buildQuery(
        { ...defaultState, query: 'earthquake' },
        DEFAULT_CONFIG
      );

      const must = result.query.function_score.query.bool.must;
      expect(must.query_string.query).toContain('~');
    });

    it('does not add fuzziness to quoted phrases', () => {
      const result = buildQuery(
        { ...defaultState, query: '"disaster risk reduction"' },
        DEFAULT_CONFIG
      );

      const must = result.query.function_score.query.bool.must;
      // Quoted phrases should not have fuzziness added
      expect(must.query_string.query).not.toMatch(/~\d/);
    });

    it('removes stop words from query', () => {
      const config = {
        ...DEFAULT_CONFIG,
        scoring: SCORING_CONFIG,
      };
      const result = buildQuery(
        { ...defaultState, query: 'the disaster and risk' },
        config
      );

      const must = result.query.function_score.query.bool.must;
      // Stop words like 'the', 'and' should be removed
      expect(must.query_string.query).not.toContain('the~');
      expect(must.query_string.query).not.toContain('and~');
    });

    it('preserves stop words in quoted phrases', () => {
      const config = {
        ...DEFAULT_CONFIG,
        scoring: SCORING_CONFIG,
      };
      const result = buildQuery(
        { ...defaultState, query: '"the disaster"' },
        config
      );

      const must = result.query.function_score.query.bool.must;
      expect(must.query_string.query).toContain('"the disaster"');
    });

    it('sanitizes unclosed quotes', () => {
      const result = buildQuery(
        { ...defaultState, query: 'disaster "risk' },
        DEFAULT_CONFIG
      );

      const must = result.query.function_score.query.bool.must;
      // Query should not have an odd number of quotes
      const quoteCount = (must.query_string.query.match(/"/g) || []).length;
      expect(quoteCount % 2).toBe(0);
    });

    it('removes trailing boolean operators', () => {
      const result = buildQuery(
        { ...defaultState, query: 'disaster AND' },
        DEFAULT_CONFIG
      );

      const must = result.query.function_score.query.bool.must;
      expect(must.query_string.query).not.toMatch(/AND\s*$/);
    });
  });

  describe('phrase boosting', () => {
    it('adds should clauses for phrase boosting', () => {
      const config = {
        ...DEFAULT_CONFIG,
        scoring: SCORING_CONFIG,
      };
      const result = buildQuery(
        { ...defaultState, query: 'disaster risk reduction' },
        config
      );

      const should = result.query.function_score.query.bool.should;
      expect(should).toBeDefined();
      expect(should.length).toBeGreaterThan(0);
    });

    it('does not add phrase boosting for empty query', () => {
      const config = {
        ...DEFAULT_CONFIG,
        scoring: SCORING_CONFIG,
      };
      const result = buildQuery(defaultState, config);

      const should = result.query.function_score.query.bool.should;
      expect(should).toBeUndefined();
    });
  });

  describe('facet filters (post_filter)', () => {
    it('does not include post_filter when no facets', () => {
      const result = buildQuery(defaultState, DEFAULT_CONFIG);

      expect(result.post_filter).toBeUndefined();
    });

    it('adds term filter for single facet value', () => {
      const result = buildQuery(
        {
          ...defaultState,
          facets: { type: ['news'] },
        },
        DEFAULT_CONFIG
      );

      expect(result.post_filter).toEqual({ term: { type: 'news' } });
    });

    it('adds terms filter for multiple facet values (OR)', () => {
      const result = buildQuery(
        {
          ...defaultState,
          facets: { type: ['news', 'event'] },
        },
        DEFAULT_CONFIG
      );

      expect(result.post_filter).toEqual({
        terms: { type: ['news', 'event'] },
      });
    });

    it('adds bool must for multiple values with AND operator', () => {
      const result = buildQuery(
        {
          ...defaultState,
          facets: { field_theme: ['climate', 'resilience'] },
          facetOperators: { field_theme: 'AND' },
        },
        DEFAULT_CONFIG
      );

      expect(result.post_filter.bool.must).toEqual([
        { term: { field_theme: 'climate' } },
        { term: { field_theme: 'resilience' } },
      ]);
    });

    it('combines multiple facets in bool must', () => {
      const result = buildQuery(
        {
          ...defaultState,
          facets: {
            type: ['news'],
            _language: ['en'],
          },
        },
        DEFAULT_CONFIG
      );

      expect(result.post_filter.bool.must).toContainEqual({
        term: { type: 'news' },
      });
      expect(result.post_filter.bool.must).toContainEqual({
        term: { _language: 'en' },
      });
    });

    it('uses script filter for year facet', () => {
      const result = buildQuery(
        {
          ...defaultState,
          facets: { year: ['2024'] },
        },
        DEFAULT_CONFIG
      );

      expect(result.post_filter.script).toBeDefined();
      expect(result.post_filter.script.script.params.years).toContain(2024);
    });
  });

  describe('custom facet filters', () => {
    it('adds query_string filter for custom facet', () => {
      const config = {
        ...DEFAULT_CONFIG,
        customFacets: [
          {
            id: 'resourceType',
            title: 'Resource type',
            options: [
              { label: 'Reports', query: 'type:publication' },
              { label: 'Training', query: 'type:resource' },
            ],
          },
        ],
      };

      const result = buildQuery(
        {
          ...defaultState,
          customFacets: { resourceType: ['0'] },
        },
        config
      );

      expect(result.post_filter).toEqual({
        query_string: { query: 'type:publication' },
      });
    });

    it('combines multiple custom facet selections with OR', () => {
      const config = {
        ...DEFAULT_CONFIG,
        customFacets: [
          {
            id: 'resourceType',
            title: 'Resource type',
            options: [
              { label: 'Reports', query: 'type:publication' },
              { label: 'Training', query: 'type:resource' },
            ],
          },
        ],
      };

      const result = buildQuery(
        {
          ...defaultState,
          customFacets: { resourceType: ['0', '1'] },
        },
        config
      );

      expect(result.post_filter.bool.should).toHaveLength(2);
      expect(result.post_filter.bool.minimum_should_match).toBe(1);
    });
  });

  describe('custom filters (config.customFilters)', () => {
    it('adds custom filters to base query', () => {
      const config = {
        ...DEFAULT_CONFIG,
        customFilters: ['type:news', 'field_domain_access:www_undrr_org'],
      };

      const result = buildQuery(defaultState, config);
      const filters = result.query.function_score.query.bool.filter;

      expect(filters).toContainEqual({
        query_string: { query: 'type:news' },
      });
      expect(filters).toContainEqual({
        query_string: { query: 'field_domain_access:www_undrr_org' },
      });
    });
  });

  describe('queryAppend', () => {
    it('appends query terms from config', () => {
      const config = {
        ...DEFAULT_CONFIG,
        queryAppend: 'field_featured:true',
      };

      const result = buildQuery(
        { ...defaultState, query: 'disaster' },
        config
      );

      const must = result.query.function_score.query.bool.must;
      expect(must.query_string.query).toContain('field_featured:true');
    });

    it('uses queryAppend alone when query is empty', () => {
      const config = {
        ...DEFAULT_CONFIG,
        queryAppend: 'type:landing',
      };

      const result = buildQuery(defaultState, config);

      const must = result.query.function_score.query.bool.must;
      // With just queryAppend, it should be included in the query
      expect(must.query_string.query).toContain('type:landing');
    });
  });

  describe('aggregations', () => {
    it('builds aggregations for facet fields', () => {
      const result = buildQuery(defaultState, DEFAULT_CONFIG);

      expect(result.aggs).toBeDefined();
      expect(result.aggs.type).toBeDefined();
      expect(result.aggs.field_country_region).toBeDefined();
      expect(result.aggs.field_hazard).toBeDefined();
    });

    it('uses script aggregation for year', () => {
      const result = buildQuery(defaultState, DEFAULT_CONFIG);

      expect(result.aggs.year.terms.script).toBeDefined();
      expect(result.aggs.year.terms.script.lang).toBe('painless');
    });

    it('respects facetCountToShow config', () => {
      const config = { ...DEFAULT_CONFIG, facetCountToShow: 100 };
      const result = buildQuery(defaultState, config);

      expect(result.aggs.type.terms.size).toBe(100);
    });
  });

  describe('highlight configuration', () => {
    it('includes highlight configuration', () => {
      const result = buildQuery(defaultState, DEFAULT_CONFIG);

      expect(result.highlight).toBeDefined();
      expect(result.highlight.fields.body).toBeDefined();
      expect(result.highlight.fields.title).toBeDefined();
    });

    it('uses configured fragment size', () => {
      const config = {
        ...DEFAULT_CONFIG,
        highlight: {
          fragmentSize: 500,
          numberOfFragments: 5,
          preTags: ['<mark>'],
          postTags: ['</mark>'],
        },
      };

      const result = buildQuery(defaultState, config);

      expect(result.highlight.fragment_size).toBe(500);
      expect(result.highlight.number_of_fragments).toBe(5);
    });
  });

  describe('function_score', () => {
    it('includes scoring functions', () => {
      const result = buildQuery(defaultState, DEFAULT_CONFIG);

      expect(result.query.function_score).toBeDefined();
      expect(result.query.function_score.functions).toBeDefined();
      expect(result.query.function_score.functions.length).toBeGreaterThan(0);
    });

    it('includes content type boost for landing pages', () => {
      const result = buildQuery(defaultState, DEFAULT_CONFIG);

      const landingBoost = result.query.function_score.functions.find(
        f => f.filter?.terms?.type?.includes('landing')
      );
      expect(landingBoost).toBeDefined();
    });

    it('includes recency boost with script_score', () => {
      const result = buildQuery(defaultState, DEFAULT_CONFIG);

      const recencyBoost = result.query.function_score.functions.find(
        f => f.script_score?.script?.source?.includes('published_at')
      );
      expect(recencyBoost).toBeDefined();
    });
  });
});

describe('getAggregationBuckets', () => {
  it('returns empty array for missing aggregations', () => {
    expect(getAggregationBuckets(null, 'type')).toEqual([]);
    expect(getAggregationBuckets(undefined, 'type')).toEqual([]);
    expect(getAggregationBuckets({}, 'type')).toEqual([]);
  });

  it('extracts buckets from direct format', () => {
    const aggs = {
      type: {
        buckets: [
          { key: 'news', doc_count: 100 },
          { key: 'event', doc_count: 50 },
        ],
      },
    };

    const result = getAggregationBuckets(aggs, 'type');

    expect(result).toEqual([
      { key: 'news', doc_count: 100 },
      { key: 'event', doc_count: 50 },
    ]);
  });

  it('extracts buckets from global+filter format', () => {
    const aggs = {
      type: {
        filtered: {
          values: {
            buckets: [
              { key: 'news', doc_count: 100 },
              { key: 'event', doc_count: 50 },
            ],
          },
        },
      },
    };

    const result = getAggregationBuckets(aggs, 'type');

    expect(result).toEqual([
      { key: 'news', doc_count: 100 },
      { key: 'event', doc_count: 50 },
    ]);
  });

  it('returns empty array when field has no buckets', () => {
    const aggs = {
      type: {},
    };

    expect(getAggregationBuckets(aggs, 'type')).toEqual([]);
  });
});
