/**
 * @file hashState.test.js
 * @description Tests for reading and writing search state in the URL hash.
 */

import {
  parseHashState,
  buildHashString,
  facetsFromDefaults,
  facetsEqual,
  isSearchHash,
  MAX_VALUES_PER_FACET,
  MAX_VALUE_LENGTH,
} from '../utils/hashState';
import { FACET_FIELDS } from '../utils/constants';

const opts = { facetFields: FACET_FIELDS };

describe('parseHashState', () => {
  it('reads query, page, sort and repeated facet values', () => {
    const state = parseHashState(
      '#query=flood+risk&page=2&sort=newest&f.field_hazard=12&f.field_hazard=34&op.field_hazard=AND',
      opts
    );
    expect(state.query).toBe('flood risk');
    expect(state.page).toBe(2);
    expect(state.sort).toBe('newest');
    expect(state.facets).toEqual({ field_hazard: ['12', '34'] });
    expect(state.facetOperators).toEqual({ field_hazard: 'AND' });
  });

  it('keeps values containing colons and spaces', () => {
    const state = parseHashState(
      'f.type=field_news_type%3A751&f.type=vid:hazard&f._language=en',
      opts
    );
    expect(state.facets.type).toEqual(['field_news_type:751', 'vid:hazard']);
  });

  it('does not decode twice: a literal % survives', () => {
    const hash = new URLSearchParams({ query: '100% renewable' }).toString();
    expect(() => parseHashState(hash, opts)).not.toThrow();
    expect(parseHashState(hash, opts).query).toBe('100% renewable');
  });

  it('ignores facet keys that are not active facet fields', () => {
    const state = parseHashState(
      'f.foo=1&f.status=false&op.foo=AND&f.field_theme=5',
      opts
    );
    expect(state.facets).toEqual({ field_theme: ['5'] });
    expect(state.facetOperators).toEqual({});
  });

  it('respects a custom facetFields list', () => {
    const state = parseHashState('f.field_hazard=12&f.custom_key=x', {
      facetFields: [{ key: 'custom_key' }],
    });
    expect(state.facets).toEqual({ custom_key: ['x'] });
  });

  it('returns null facets when no valid f.* params are present', () => {
    expect(parseHashState('query=x&f.foo=1', opts).facets).toBeNull();
    expect(parseHashState('', opts).facets).toBeNull();
  });

  it('rejects invalid operators, sorts and pages', () => {
    const state = parseHashState(
      'f.field_hazard=1&f.field_hazard=2&op.field_hazard=XOR&sort=random&page=-3',
      opts
    );
    expect(state.facetOperators).toEqual({});
    expect(state.sort).toBeNull();
    expect(state.page).toBeNull();
  });

  it('validates year and namespaced type values', () => {
    const state = parseHashState(
      'f.year=2024&f.year=20x4&f.type=news&f.type=status:true&f.type=field_news_type:751',
      opts
    );
    expect(state.facets.year).toEqual(['2024']);
    expect(state.facets.type).toEqual(['news', 'field_news_type:751']);
  });

  it('drops empty and duplicate values', () => {
    const state = parseHashState(
      'f.field_hazard=&f.field_hazard=1&f.field_hazard=1',
      opts
    );
    expect(state.facets).toEqual({ field_hazard: ['1'] });
  });
});

describe('parseHashState limits', () => {
  it(`keeps at most ${MAX_VALUES_PER_FACET} values per facet`, () => {
    const params = new URLSearchParams();
    for (let i = 0; i < MAX_VALUES_PER_FACET + 5; i++) {
      params.append('f.field_hazard', String(i));
    }
    const state = parseHashState(params.toString(), opts);
    expect(state.facets.field_hazard).toHaveLength(MAX_VALUES_PER_FACET);
  });

  it(`rejects values longer than ${MAX_VALUE_LENGTH} characters`, () => {
    const params = new URLSearchParams();
    params.append('f.field_hazard', 'x'.repeat(MAX_VALUE_LENGTH + 1));
    params.append('f.field_hazard', 'y'.repeat(MAX_VALUE_LENGTH));
    const state = parseHashState(params.toString(), opts);
    expect(state.facets.field_hazard).toEqual(['y'.repeat(MAX_VALUE_LENGTH)]);
  });

  it('rejects an empty vid: type value', () => {
    const state = parseHashState('f.type=vid:&f.type=vid:hazard', opts);
    expect(state.facets.type).toEqual(['vid:hazard']);
  });

  it('ignores a page beyond maxPage', () => {
    expect(parseHashState('page=2000', { ...opts, maxPage: 2000 }).page).toBe(
      2000
    );
    expect(
      parseHashState('page=999999', { ...opts, maxPage: 2000 }).page
    ).toBeNull();
  });
});

describe('isSearchHash', () => {
  it.each([
    ['query=x', true],
    ['#page=2', true],
    ['sort=newest', true],
    ['label=Title', true],
    ['f.field_hazard=1', true],
    ['op.field_hazard=AND', true],
    ['f.foo=1', true],
    ['', false],
    ['#main-content', false],
    ['section-2', false],
    ['heading=1', false],
  ])('%p -> %p', (hash, expected) => {
    expect(isSearchHash(hash)).toBe(expected);
  });
});

describe('buildHashString', () => {
  const defaults = {
    facetFields: FACET_FIELDS,
    defaultFacets: facetsFromDefaults([{ key: '_language', value: 'en' }]),
    defaultSort: 'relevance',
  };

  it('omits facets equal to the defaults, and the default sort', () => {
    expect(
      buildHashString(
        {
          query: 'flood',
          page: 1,
          sortBy: 'relevance',
          facets: { _language: ['en'] },
          facetOperators: {},
        },
        defaults
      )
    ).toBe('query=flood');
  });

  it('writes every facet when they differ from the defaults', () => {
    const hash = buildHashString(
      {
        query: '',
        page: 3,
        sortBy: 'newest',
        facets: {
          _language: ['en'],
          field_hazard: ['12', '34'],
          type: ['field_news_type:751'],
        },
        facetOperators: { field_hazard: 'AND' },
      },
      defaults
    );
    const params = new URLSearchParams(hash);
    expect(params.get('page')).toBe('3');
    expect(params.get('sort')).toBe('newest');
    expect(params.getAll('f.field_hazard')).toEqual(['12', '34']);
    expect(params.get('op.field_hazard')).toBe('AND');
    expect(params.getAll('f._language')).toEqual(['en']);
    expect(params.getAll('f.type')).toEqual(['field_news_type:751']);
  });

  it('round-trips through parseHashState', () => {
    const state = {
      query: '50% & more',
      page: 2,
      sortBy: 'oldest',
      facets: { field_theme: ['1', '2'], year: ['2024'] },
      facetOperators: { field_theme: 'AND' },
    };
    const parsed = parseHashState(buildHashString(state, defaults), opts);
    expect(parsed.query).toBe(state.query);
    expect(parsed.page).toBe(2);
    expect(parsed.sort).toBe('oldest');
    expect(parsed.facets).toEqual(state.facets);
    expect(parsed.facetOperators).toEqual(state.facetOperators);
  });

  it('does not write OR (the default) or an operator for one value', () => {
    const hash = buildHashString(
      {
        facets: { field_hazard: ['1'], field_theme: ['1', '2'] },
        facetOperators: { field_hazard: 'AND', field_theme: 'OR' },
      },
      defaults
    );
    expect(hash).not.toContain('op.');
  });
});

describe('facetsEqual', () => {
  it('ignores key order, value order and empty arrays', () => {
    expect(facetsEqual({ a: ['1', '2'], b: [] }, { a: ['2', '1'] })).toBe(true);
    expect(facetsEqual({ a: ['1'] }, { a: ['1'], b: ['2'] })).toBe(false);
  });
});
