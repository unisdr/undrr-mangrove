/**
 * @file queryBuilder.test.js
 * @description Tests for Elasticsearch query builder utility.
 */

import { buildQuery, getAggregationBuckets } from '../utils/queryBuilder';
import { DEFAULT_CONFIG, SCORING_CONFIG, buildTierRanges, buildTierFilter } from '../utils/constants';

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

    it('includes status filter in base query that also allows taxonomy terms', () => {
      const result = buildQuery(defaultState, DEFAULT_CONFIG);

      // The status filter should allow published nodes OR documents without
      // a status field (taxonomy terms don't have status in the index)
      const filters = result.query.function_score.query.bool.filter;
      expect(filters).toContainEqual({
        bool: {
          should: [
            { term: { status: 'true' } },
            { bool: { must_not: { exists: { field: 'status' } } } },
          ],
          minimum_should_match: 1,
        },
      });
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

    it('routes vid: prefixed type values to the vid field', () => {
      const result = buildQuery(
        {
          ...defaultState,
          facets: { type: ['news', 'vid:hazard'] },
        },
        DEFAULT_CONFIG
      );

      const postFilter = result.post_filter;
      expect(postFilter.bool.should).toContainEqual({ term: { type: 'news' } });
      expect(postFilter.bool.should).toContainEqual({ term: { vid: 'hazard' } });
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

    it('includes vid aggregation for taxonomy vocabularies', () => {
      const result = buildQuery(defaultState, DEFAULT_CONFIG);
      expect(result.aggs.vid).toBeDefined();
      expect(result.aggs.vid.terms.field).toBe('vid');
    });
  });

  describe('requireImage filter', () => {
    it('adds term filter for has_image when requireImage is true', () => {
      const config = { ...DEFAULT_CONFIG, requireImage: true };
      const result = buildQuery(defaultState, config);
      const filters = result.query.function_score.query.bool.filter;

      expect(filters).toContainEqual({ term: { has_image: 'true' } });
    });

    it('does not add image filter when requireImage is false', () => {
      const config = { ...DEFAULT_CONFIG, requireImage: false };
      const result = buildQuery(defaultState, config);
      const filters = result.query.function_score.query.bool.filter;

      const hasImageFilter = filters.find(f => f.term?.has_image);
      expect(hasImageFilter).toBeUndefined();
    });
  });

  describe('tier filters', () => {
    it('adds interestingness range filter to base query', () => {
      const config = {
        ...DEFAULT_CONFIG,
        interestingnessTiers: ['promoted', 'announced'],
      };
      const result = buildQuery(defaultState, config);
      const filters = result.query.function_score.query.bool.filter;

      const tierFilter = filters.find(
        f => f.bool?.should?.some(s => s.range?.field_meta_interestingness)
      );
      expect(tierFilter).toBeDefined();
      expect(tierFilter.bool.should).toHaveLength(2);
    });

    it('adds longevity range filter to base query', () => {
      const config = {
        ...DEFAULT_CONFIG,
        longevityTiers: ['today', 'days'],
      };
      const result = buildQuery(defaultState, config);
      const filters = result.query.function_score.query.bool.filter;

      const tierFilter = filters.find(
        f => f.bool?.should?.some(s => s.range?.field_meta_longevity)
      );
      expect(tierFilter).toBeDefined();
      expect(tierFilter.bool.should).toHaveLength(2);
    });

    it('adds single range filter (no bool wrapper) for one tier', () => {
      const config = {
        ...DEFAULT_CONFIG,
        interestingnessTiers: ['promoted'],
      };
      const result = buildQuery(defaultState, config);
      const filters = result.query.function_score.query.bool.filter;

      const tierFilter = filters.find(f => f.range?.field_meta_interestingness);
      expect(tierFilter).toBeDefined();
      expect(tierFilter.range.field_meta_interestingness).toHaveProperty('gte');
      expect(tierFilter.range.field_meta_interestingness).toHaveProperty('lte');
    });

    it('does not add tier filters when arrays are empty', () => {
      const config = {
        ...DEFAULT_CONFIG,
        interestingnessTiers: [],
        longevityTiers: [],
      };
      const result = buildQuery(defaultState, config);
      const filters = result.query.function_score.query.bool.filter;

      const hasTierFilter = filters.some(
        f =>
          f.range?.field_meta_interestingness ||
          f.range?.field_meta_longevity ||
          f.bool?.should?.some(s => s.range?.field_meta_interestingness || s.range?.field_meta_longevity)
      );
      expect(hasTierFilter).toBe(false);
    });
  });

  describe('aggregation skip (showFacets: false)', () => {
    it('omits aggs when showFacets is false', () => {
      const config = { ...DEFAULT_CONFIG, showFacets: false };
      const result = buildQuery(defaultState, config);

      expect(result.aggs).toBeUndefined();
    });

    it('includes aggs when showFacets is true', () => {
      const config = { ...DEFAULT_CONFIG, showFacets: true };
      const result = buildQuery(defaultState, config);

      expect(result.aggs).toBeDefined();
    });

    it('omits post_filter when showFacets is false even with facet state', () => {
      const config = { ...DEFAULT_CONFIG, showFacets: false };
      const result = buildQuery(
        { ...defaultState, facets: { type: ['news'] } },
        config
      );

      expect(result.post_filter).toBeUndefined();
    });
  });

  describe('highlight skip in card mode', () => {
    it('omits highlight in card mode when summary is hidden', () => {
      const config = {
        ...DEFAULT_CONFIG,
        displayMode: 'card',
        visibleTeaserFields: { summary: false },
      };
      const result = buildQuery(defaultState, config);

      expect(result.highlight).toBeUndefined();
    });

    it('includes highlight in card mode when summary is visible', () => {
      const config = {
        ...DEFAULT_CONFIG,
        displayMode: 'card',
        visibleTeaserFields: { summary: true },
      };
      const result = buildQuery(defaultState, config);

      expect(result.highlight).toBeDefined();
    });

    it('includes highlight in list mode even when summary is hidden', () => {
      const config = {
        ...DEFAULT_CONFIG,
        displayMode: 'list',
        visibleTeaserFields: { summary: false },
      };
      const result = buildQuery(defaultState, config);

      expect(result.highlight).toBeDefined();
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

describe('buildTierRanges', () => {
  it('derives min/max ranges from cumulative tier config', () => {
    const tiers = {
      low: { max: 10, weight: 0.1 },
      mid: { max: 50, weight: 1.0 },
      high: { max: 100, weight: 3.0 },
    };
    const ranges = buildTierRanges(tiers);

    expect(ranges.low).toEqual({ min: 0, max: 10 });
    expect(ranges.mid).toEqual({ min: 11, max: 50 });
    expect(ranges.high).toEqual({ min: 51, max: 100 });
  });

  it('handles SCORING_CONFIG.interestingness correctly', () => {
    const ranges = buildTierRanges(SCORING_CONFIG.interestingness);

    expect(ranges.demoted).toEqual({ min: 0, max: 10 });
    expect(ranges.deferred).toEqual({ min: 11, max: 30 });
    expect(ranges.average).toEqual({ min: 31, max: 50 });
    expect(ranges.promoted).toEqual({ min: 51, max: 75 });
    expect(ranges.announced).toEqual({ min: 76, max: 100 });
  });

  it('sorts by max for robustness regardless of input order', () => {
    // Intentionally out of order
    const tiers = {
      high: { max: 100, weight: 3.0 },
      low: { max: 10, weight: 0.1 },
      mid: { max: 50, weight: 1.0 },
    };
    const ranges = buildTierRanges(tiers);

    expect(ranges.low).toEqual({ min: 0, max: 10 });
    expect(ranges.mid).toEqual({ min: 11, max: 50 });
    expect(ranges.high).toEqual({ min: 51, max: 100 });
  });
});

describe('buildTierFilter', () => {
  const ranges = {
    low: { min: 0, max: 10 },
    mid: { min: 11, max: 50 },
    high: { min: 51, max: 100 },
  };

  it('returns null for empty array', () => {
    expect(buildTierFilter('field', [], ranges)).toBeNull();
  });

  it('returns null for null/undefined input', () => {
    expect(buildTierFilter('field', null, ranges)).toBeNull();
    expect(buildTierFilter('field', undefined, ranges)).toBeNull();
  });

  it('returns null for non-array truthy input', () => {
    expect(buildTierFilter('field', 'promoted', ranges)).toBeNull();
    expect(buildTierFilter('field', true, ranges)).toBeNull();
  });

  it('returns single range query for one tier', () => {
    const result = buildTierFilter('score', ['mid'], ranges);
    expect(result).toEqual({ range: { score: { gte: 11, lte: 50 } } });
  });

  it('returns bool.should of range queries for multiple tiers', () => {
    const result = buildTierFilter('score', ['mid', 'high'], ranges);
    expect(result).toEqual({
      bool: {
        should: [
          { range: { score: { gte: 11, lte: 50 } } },
          { range: { score: { gte: 51, lte: 100 } } },
        ],
        minimum_should_match: 1,
      },
    });
  });

  it('ignores unknown tier names', () => {
    const result = buildTierFilter('score', ['mid', 'unknown'], ranges);
    expect(result).toEqual({ range: { score: { gte: 11, lte: 50 } } });
  });

  it('returns null when all tier names are unknown', () => {
    expect(buildTierFilter('score', ['foo', 'bar'], ranges)).toBeNull();
  });
});
