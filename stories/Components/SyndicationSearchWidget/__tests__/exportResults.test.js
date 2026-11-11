import { DEFAULT_CONFIG } from '../utils/constants';
import { buildQuery } from '../utils/queryBuilder';
import {
  EXPORT_COLUMNS,
  exportColumns,
  columnsForExportGroups,
  DEFAULT_EXPORT_GROUPS,
  buildExportQuery,
  exportRangeLimits,
  normalizeExportDefaultCount,
  requestedExportCount,
  exportRecord,
  exportCsv,
  exportJson,
  readExportResponse,
  EXPORT_SOURCE_FIELDS,
} from '../utils/exportResults';

const hit = {
  _id: 'entity:node/42:en',
  _source: {
    nid: [42],
    title: ['Risk &amp; resilience'],
    url: ['/publication/risk'],
    type: ['publication'],
    _language: ['en'],
    field_domain_access: ['www_preventionweb_net'],
    published_at: [1762732800],
    display_date: ['2024'],
    display_date_precision: ['year'],
    field_hazard: [1, 2],
    field_theme: ['7'],
    body: '<p>Internal payload</p>',
  },
};
const result = (total = 1) => ({
  hits: { total: { value: total, relation: 'eq' }, hits: total ? [hit] : [] },
});

test.each([
  [undefined, 100],
  [NaN, 100],
  [0, 100],
  [-1, 100],
  [Infinity, 100],
  [10.7, 10],
  [2000, 1000],
])('normalizes export limit %s', (input, expected) => {
  expect(normalizeExportDefaultCount(input)).toBe(expected);
});

test('reuses query constraints, facet post_filter and sort, starting from the first result', () => {
  const state = {
    query: 'flood',
    facets: {
      _language: ['en'],
      field_domain_access: ['www_preventionweb_net'],
      field_theme: ['7'],
    },
    facetOperators: { field_theme: 'AND' },
    customFacets: { period: [0] },
    sortBy: 'newest',
    page: 4,
  };
  const config = {
    ...DEFAULT_CONFIG,
    showFacets: false,
    exportDefaultCount: 10,
    customFilters: ['type:publication'],
    customFacets: [
      {
        id: 'period',
        options: [{ label: 'Recent', query: 'display_date:[2020 TO *]' }],
      },
    ],
  };
  const clock = jest.spyOn(Date, 'now').mockReturnValue(1794268800000);
  const normal = buildQuery(state, config, { highlight: false });
  const body = buildExportQuery(state, config);
  expect(body.query).toEqual(normal.query);
  expect(body.post_filter).toEqual(normal.post_filter);
  expect(JSON.stringify(body)).toContain('status');
  expect(JSON.stringify(body)).toContain('www_preventionweb_net');
  expect(JSON.stringify(body)).toContain('publication');
  expect(body.sort).toEqual(normal.sort);
  expect(body.from).toBe(0);
  expect(body.size).toBe(10);
  expect(body._source.includes).toEqual(EXPORT_SOURCE_FIELDS);
  expect(body.track_total_hits).toBe(true);
  expect(body.aggs).toBeUndefined();
  expect(body.highlight).toBeUndefined();
  clock.mockRestore();
});

test('projects only fixed metadata, with absolute URL, separate dates and taxonomy IDs', () => {
  expect(exportRecord(hit)).toEqual({
    id: 'entity:node/42:en',
    title: 'Risk & resilience',
    url: 'https://www.preventionweb.net/publication/risk',
    type: 'publication',
    language: 'en',
    posted_at: '2025-11-10T00:00:00.000Z',
    display_date: '2024',
    display_date_precision: 'year',
    country_region_ids: [],
    hazard_ids: ['1', '2'],
    theme_ids: ['7'],
  });
});

test('does not export unsafe URLs or invent missing dates', () => {
  const record = exportRecord({ _source: { url: 'javascript:alert(1)' } });
  expect(record.url).toBe('');
  expect(record.display_date).toBe('');
  expect(record.posted_at).toBe('');
});

test.each([
  '=SUM(A1)',
  '+1',
  '-2',
  '@command',
  '  =1',
  '\tplain',
  '\rplain',
  '\u0000=1',
  ' \u0000=1',
])('protects spreadsheet formula/control prefix %j', value => {
  const csv = exportCsv([{ ...exportRecord(hit), title: value }]);
  expect(csv).toContain(`"'${value}"`);
});

test('CSV preserves quotes, commas, newlines, Unicode and multi-value arrays', () => {
  const csv = exportCsv([
    { ...exportRecord(hit), title: 'Floods, "risk"\n日本語' },
  ]);
  expect(csv.startsWith('\ufeff')).toBe(true);
  expect(csv).toContain('"Floods, ""risk""\n日本語"');
  expect(csv).toContain('"[""1"",""2""]"');
  expect(csv.endsWith('\r\n')).toBe(true);
});

test('JSON preserves data and explicitly records partial scope', () => {
  const data = { records: [exportRecord(hit)], total: 25, limited: true };
  expect(JSON.parse(exportJson(data, 1))).toEqual({
    schemaVersion: 1,
    exportedAt: expect.any(String),
    scope: {
      limit: 1,
      from: 0,
      start: 1,
      end: 1,
      count: 1,
      total: 25,
      limited: true,
      fields: EXPORT_COLUMNS,
    },
    records: data.records,
  });
});

test('detects the agreed cap using the fresh export response', () => {
  expect(readExportResponse(result(25), 1)).toMatchObject({
    total: 25,
    limited: true,
  });
  expect(readExportResponse(result(0), 100)).toEqual({
    total: 0,
    from: 0,
    limited: false,
    records: [],
  });
});

test.each([
  {},
  { ...result(), timed_out: true },
  { ...result(), _shards: { failed: 1 } },
  { hits: { hits: [hit], total: { value: 1, relation: 'gte' } } },
  { hits: { hits: [], total: { value: 1, relation: 'eq' } } },
  { hits: { hits: [null], total: { value: 1, relation: 'eq' } } },
])(
  'rejects malformed or incomplete data instead of exporting a partial response',
  data => {
    expect(() => readExportResponse(data, 100)).toThrow(
      'Incomplete export response'
    );
  }
);

test('field choices are ordered, allowlisted and always retain record identity and URL', () => {
  expect(exportColumns(['body', 'title', 'title', '__proto__'])).toEqual([
    'id',
    'title',
    'url',
  ]);
  expect(exportColumns([])).toEqual(['id', 'url']);
  expect(exportColumns(null)).toEqual(['id', 'url']);
  expect(columnsForExportGroups([])).toEqual(['id', 'url']);
  expect(columnsForExportGroups(DEFAULT_EXPORT_GROUPS)).toEqual(EXPORT_COLUMNS);
});

test.each(['display_date', 'display_date_precision'])(
  'content date selection preserves precision when selecting %s',
  field => {
    expect(exportColumns([field])).toEqual([
      'id',
      'url',
      'display_date',
      'display_date_precision',
    ]);
  }
);

test.each(
  [[], ['title'], ['display_date'], ['theme_ids', 'title']].map(fields => [
    fields,
  ])
)('CSV and JSON use the same selected keys for %j', fields => {
  const result = { records: [exportRecord(hit)], total: 1, limited: false };
  const columns = exportColumns(fields);
  const csv = exportCsv(result.records, fields);
  const json = JSON.parse(exportJson(result, 100, fields));
  expect(csv.split('\r\n')[0]).toBe(
    '\ufeff' + columns.map(field => `"${field}"`).join(',')
  );
  expect(json.scope.fields).toEqual(columns);
  expect(Object.keys(json.records[0])).toEqual(columns);
  expect(json.records[0]).not.toHaveProperty('body');
  expect(json.records[0]).not.toHaveProperty('teaser');
});

test.each([
  '',
  ' ',
  'abc',
  'NaN',
  'Infinity',
  '0',
  '-1',
  '1.5',
  '1001',
  undefined,
  null,
])('rejects invalid requested quantity %s without a fallback', value => {
  expect(requestedExportCount(value)).toBeNull();
});

test.each([1, '1', '25', '1000', 1000])(
  'accepts valid requested whole quantity %s',
  value => {
    expect(requestedExportCount(value)).toBe(Number(value));
  }
);

test.each([
  [25, 'eq', '1', 25, 25],
  [25, 'eq', '21', 25, 5],
  [80000, 'eq', '1', 10000, 1000],
  [80000, 'eq', '9501', 10000, 500],
  [80000, 'eq', '10000', 10000, 1],
  [10000, 'gte', '1', 10000, 1000],
  [25, 'gte', '26', 10000, 1000],
])(
  'range bounds total%s/%s/start%s to window and exact remainder',
  (total, relation, value, maxStart, maxCount) => {
    expect(exportRangeLimits(total, relation, value)).toEqual({
      start: Number(value),
      maxStart,
      maxCount,
    });
  }
);
test.each(['', 'abc', '0', '-1', '1.5', '26', '10001'])(
  'rejects unavailable exact start %j without clamping',
  value => {
    expect(exportRangeLimits(25, 'eq', value)).toEqual({
      start: null,
      maxStart: 25,
      maxCount: null,
    });
  }
);
const rangeResponse = (total, from, count) => ({
  hits: {
    total: { value: total, relation: 'eq' },
    hits: Array.from(
      { length: Math.min(count, Math.max(0, total - from)) },
      (_, index) => ({ ...hit, _id: String(from + index + 1) })
    ),
  },
});
test.each([
  [25, 20, 5, 5],
  [22, 20, 5, 2],
  [20, 20, 5, 0],
  [0, 20, 5, 0],
  [80000, 9999, 1, 1],
])(
  'checks fresh total%s from%s count%s without mistaking end-of-set for failure',
  (total, from, count, returned) => {
    const result = readExportResponse(
      rangeResponse(total, from, count),
      count,
      from
    );
    expect(result.records).toHaveLength(returned);
    expect(JSON.parse(exportJson(result, count)).scope).toMatchObject({
      from,
      start: returned ? from + 1 : null,
      end: returned ? from + returned : null,
      limit: count,
      count: returned,
      total,
    });
  }
);
test('rejects partial slices and requests outside the result window', () => {
  const partial = rangeResponse(25, 20, 5);
  partial.hits.hits.pop();
  expect(() => readExportResponse(partial, 5, 20)).toThrow();
  expect(() =>
    readExportResponse(rangeResponse(80000, 9999, 2), 2, 9999)
  ).toThrow();
  expect(() =>
    readExportResponse(rangeResponse(80000, 10000, 1), 1, 10000)
  ).toThrow();
});
