/**
 * @file taxonomyHelpers.test.js
 * @description Tests for taxonomy-related helpers in constants.js and facetUtils.js.
 */

import {
  isTaxonomyTermResult,
  getTaxonomyVocabulary,
  parseTypeValue,
} from '../utils/constants';
import { getMergedTypeBuckets } from '../utils/facetUtils';

describe('taxonomy helpers (constants.js)', () => {
  describe('isTaxonomyTermResult', () => {
    it('returns true for term (has vid, no nid)', () => {
      expect(isTaxonomyTermResult({ vid: 'hazard', tid: '1' })).toBe(true);
    });

    it('returns false for node (has nid)', () => {
      expect(isTaxonomyTermResult({ nid: '123', type: 'news' })).toBe(false);
    });

    it('returns false for node with both nid and vid', () => {
      expect(isTaxonomyTermResult({ nid: '1', vid: 'x' })).toBe(false);
    });

    it('returns false for null/undefined', () => {
      expect(isTaxonomyTermResult(null)).toBe(false);
      expect(isTaxonomyTermResult(undefined)).toBe(false);
    });
  });

  describe('getTaxonomyVocabulary', () => {
    it('returns vocab info for known vocabulary', () => {
      expect(getTaxonomyVocabulary('hazard')).toEqual({
        id: 'hazard',
        name: 'Hazard',
        domain: 'www_preventionweb_net',
      });
    });

    it('returns undefined for unknown vocabulary', () => {
      expect(getTaxonomyVocabulary('unknown')).toBeUndefined();
    });
  });

  describe('parseTypeValue with vid: prefix', () => {
    it('parses vid:hazard as vocabulary', () => {
      const result = parseTypeValue('vid:hazard');
      expect(result.field).toBe('vid');
      expect(result.value).toBe('hazard');
      expect(result.isVocabulary).toBe(true);
      expect(result.isSubtype).toBe(false);
    });

    it('returns vocabulary label', () => {
      const result = parseTypeValue('vid:prevention_web_regions');
      expect(result.label).toBe('Country');
    });

    it('falls back to raw id for unknown vocabulary', () => {
      const result = parseTypeValue('vid:unknown_vocab');
      expect(result.label).toBe('unknown_vocab');
      expect(result.isVocabulary).toBe(true);
    });
  });

});

describe('getMergedTypeBuckets (facetUtils.js)', () => {
  it('returns empty array for null aggregations', () => {
    expect(getMergedTypeBuckets(null)).toEqual([]);
  });

  it('returns type buckets with isSubtype false', () => {
    const aggregations = {
      type: {
        buckets: [
          { key: 'news', doc_count: 100 },
          { key: 'event', doc_count: 50 },
        ],
      },
    };

    const result = getMergedTypeBuckets(aggregations);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ key: 'news', isSubtype: false, parentType: null });
    expect(result[1]).toMatchObject({ key: 'event', isSubtype: false, parentType: null });
  });

  it('appends vocabulary buckets with vid: prefix', () => {
    const aggregations = {
      type: { buckets: [{ key: 'news', doc_count: 100 }] },
      vid: {
        buckets: [
          { key: 'hazard', doc_count: 30 },
          { key: 'theme', doc_count: 20 },
        ],
      },
    };

    const result = getMergedTypeBuckets(aggregations);
    const vocabBuckets = result.filter(b => b.isVocabulary);
    expect(vocabBuckets).toHaveLength(2);
    expect(vocabBuckets[0]).toMatchObject({ key: 'vid:hazard', isVocabulary: true });
    expect(vocabBuckets[1]).toMatchObject({ key: 'vid:theme', isVocabulary: true });
  });

  it('interleaves subtypes after their parent type', () => {
    const aggregations = {
      type: {
        buckets: [
          { key: 'news', doc_count: 100 },
          { key: 'event', doc_count: 50 },
        ],
      },
      // news has subtypes via field_news_type
      field_news_type: {
        buckets: [
          { key: '751', doc_count: 40 },
          { key: '752', doc_count: 20 },
        ],
      },
    };

    const result = getMergedTypeBuckets(aggregations);
    // news → subtypes → event
    expect(result[0]).toMatchObject({ key: 'news', isSubtype: false });
    expect(result[1]).toMatchObject({ key: 'field_news_type:751', isSubtype: true, parentType: 'news' });
    expect(result[2]).toMatchObject({ key: 'field_news_type:752', isSubtype: true, parentType: 'news' });
    expect(result[3]).toMatchObject({ key: 'event', isSubtype: false });
  });

  it('excludes unconfigured vocabularies', () => {
    const aggregations = {
      type: { buckets: [] },
      vid: {
        buckets: [
          { key: 'hazard', doc_count: 30 },
          { key: 'internal_vocab', doc_count: 5 },
        ],
      },
    };

    const result = getMergedTypeBuckets(aggregations);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('vid:hazard');
  });
});
