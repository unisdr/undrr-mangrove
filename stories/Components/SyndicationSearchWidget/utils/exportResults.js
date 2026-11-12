import { exportSummary } from './exportMetadata';
import { decodeEntities } from './decodeEntities';
import { buildQuery } from './queryBuilder';
import {
  DOMAIN_MAP,
  MAX_RESULT_WINDOW,
  getTaxonomyVocabulary,
  isTaxonomyTermResult,
} from './constants';
import { toDate } from './dateUtils';

export const MAX_EXPORT_LIMIT = 1000;
export const DEFAULT_EXPORT_COUNT = 100;
export const EXPORT_SOURCE_FIELDS = [
  'nid',
  'title',
  'url',
  'type',
  'vid',
  '_language',
  'field_domain_access',
  'published_at',
  'display_date',
  'display_date_precision',
  'field_country_region',
  'field_hazard',
  'field_theme',
];
export const EXPORT_COLUMNS = [
  'id',
  'title',
  'summary',
  'url',
  'type',
  'language',
  'posted_at',
  'display_date',
  'display_date_precision',
  'country_region_ids',
  'country_region_names',
  'hazard_ids',
  'hazard_names',
  'theme_ids',
  'theme_names',
];

export const EXPORT_FIELD_GROUPS = [
  { id: 'title', label: 'exportFieldTitle', columns: ['title'] },
  { id: 'summary', label: 'exportFieldSummary', columns: ['summary'] },
  { id: 'type', label: 'exportFieldType', columns: ['type'] },
  { id: 'language', label: 'exportFieldLanguage', columns: ['language'] },
  { id: 'posted', label: 'exportFieldPosted', columns: ['posted_at'] },
  {
    id: 'readerDate',
    label: 'exportFieldReaderDate',
    columns: ['display_date', 'display_date_precision'],
  },
  {
    id: 'country',
    label: 'exportFieldCountry',
    columns: ['country_region_ids', 'country_region_names'],
  },
  {
    id: 'hazard',
    label: 'exportFieldHazard',
    columns: ['hazard_ids', 'hazard_names'],
  },
  {
    id: 'theme',
    label: 'exportFieldTheme',
    columns: ['theme_ids', 'theme_names'],
  },
];
export const DEFAULT_EXPORT_GROUPS = EXPORT_FIELD_GROUPS.filter(
  group => group.id !== 'summary'
).map(group => group.id);

export function exportColumns(fields = EXPORT_COLUMNS) {
  const selected = new Set(Array.isArray(fields) ? fields : []);
  selected.add('id');
  selected.add('url');
  if (selected.has('display_date') || selected.has('display_date_precision')) {
    selected.add('display_date');
    selected.add('display_date_precision');
  }
  for (const key of ['country_region', 'hazard', 'theme']) {
    if (selected.has(`${key}_ids`) || selected.has(`${key}_names`)) {
      selected.add(`${key}_ids`);
      selected.add(`${key}_names`);
    }
  }
  return EXPORT_COLUMNS.filter(key => selected.has(key));
}

export function availableExportGroups(fields) {
  const columns = fields == null ? EXPORT_COLUMNS : exportColumns(fields);
  return EXPORT_FIELD_GROUPS.filter(group =>
    group.columns.every(column => columns.includes(column))
  );
}

export function columnsForExportGroups(groups) {
  return exportColumns(
    EXPORT_FIELD_GROUPS.filter(group => groups.includes(group.id)).flatMap(
      group => group.columns
    )
  );
}

const first = value => (Array.isArray(value) ? value[0] : value);
const values = value => [].concat(value ?? []).map(String);
const text = value => String(first(value) ?? '');

export function normalizeExportDefaultCount(value) {
  return Number.isFinite(value) && value >= 1
    ? Math.min(Math.floor(value), MAX_EXPORT_LIMIT)
    : DEFAULT_EXPORT_COUNT;
}

export function requestedExportCount(value, maximum = MAX_EXPORT_LIMIT) {
  if (
    !['string', 'number'].includes(typeof value) ||
    String(value).trim() === ''
  )
    return null;
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 1 && count <= maximum
    ? count
    : null;
}

export function exportRangeLimits(total, relation, value) {
  const maxStart = Math.max(
    1,
    Math.min(MAX_RESULT_WINDOW, relation === 'eq' ? total : MAX_RESULT_WINDOW)
  );
  const start = requestedExportCount(value, maxStart);
  const maxCount =
    start === null
      ? null
      : Math.max(
          0,
          Math.min(
            MAX_EXPORT_LIMIT,
            MAX_RESULT_WINDOW - start + 1,
            relation === 'eq' ? total - start + 1 : MAX_RESULT_WINDOW
          )
        );
  return { start, maxStart, maxCount };
}

export function buildExportQuery(state, config) {
  const body = buildQuery(
    { ...state, page: 1 },
    {
      ...config,
      resultsPerPage: normalizeExportDefaultCount(config.exportDefaultCount),
      sourceFields: EXPORT_SOURCE_FIELDS,
    },
    { highlight: false }
  );
  delete body.aggs;
  delete body.aggregations;
  body.track_total_hits = true;
  return body;
}

function recordUrl(source) {
  const type = text(source.type);
  const domain = isTaxonomyTermResult(source)
    ? getTaxonomyVocabulary(first(source.vid))?.domain
    : type === 'organization'
      ? 'www_preventionweb_net'
      : first(source.field_domain_access);
  const base = DOMAIN_MAP.get(domain)?.url || 'https://www.preventionweb.net';
  const raw =
    text(source.url) || (first(source.nid) ? `/node/${first(source.nid)}` : '');
  if (!raw) return '';
  try {
    const url = new URL(raw, base);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

export function exportRecord(hit, document) {
  const source = hit._source || {};
  const precision = text(source.display_date_precision);
  const displayDate = toDate(source.display_date, { allowBeforeEpoch: true });
  return {
    id: String(hit._id ?? first(source.nid) ?? ''),
    title: decodeEntities(text(source.title)),
    summary: exportSummary(source.teaser, document),
    url: recordUrl(source),
    type: text(source.type) || text(source.vid),
    language: text(source._language),
    posted_at: toDate(source.published_at)?.toISOString() || '',
    display_date: displayDate
      ? displayDate.toISOString().slice(0, precision === 'year' ? 4 : 10)
      : '',
    display_date_precision: precision,
    country_region_ids: values(source.field_country_region),
    country_region_names: [],
    hazard_ids: values(source.field_hazard),
    hazard_names: [],
    theme_ids: values(source.field_theme),
    theme_names: [],
  };
}

export function readExportResponse(data, limit, from = 0, document) {
  const hits = data?.hits?.hits;
  const total = data?.hits?.total;
  if (
    requestedExportCount(limit) === null ||
    !Number.isSafeInteger(from) ||
    from < 0 ||
    from + limit > MAX_RESULT_WINDOW ||
    data?.timed_out ||
    data?._shards?.failed > 0 ||
    !Array.isArray(hits) ||
    total?.relation !== 'eq' ||
    !Number.isSafeInteger(total.value) ||
    total.value < 0 ||
    hits.length !== Math.min(Math.max(total.value - from, 0), limit) ||
    hits.some(
      hit => !hit || typeof hit._source !== 'object' || hit._source === null
    )
  ) {
    throw new Error('Incomplete export response');
  }
  return {
    records: hits.map(hit => exportRecord(hit, document)),
    total: total.value,
    from,
    limited: from > 0 || total.value > limit,
  };
}

function csvCell(value) {
  let cell = Array.isArray(value) ? JSON.stringify(value) : String(value ?? '');
  if (
    /^[=+@-]/.test(cell.trimStart()) ||
    cell.trimStart().charCodeAt(0) < 32 ||
    /^[\t\r\n]/.test(cell)
  )
    cell = `'${cell}`;
  return `"${cell.replace(/"/g, '""')}"`;
}

export function exportCsv(records, fields = EXPORT_COLUMNS) {
  const columns = exportColumns(fields);
  return (
    '\ufeff' +
    [columns, ...records.map(record => columns.map(key => record[key]))]
      .map(row => row.map(csvCell).join(','))
      .join('\r\n') +
    '\r\n'
  );
}

export function exportJson(result, limit, fields = EXPORT_COLUMNS) {
  const columns = exportColumns(fields);
  const from = result.from ?? 0;
  return (
    JSON.stringify(
      {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        scope: {
          limit,
          from,
          start: result.records.length ? from + 1 : null,
          end: result.records.length ? from + result.records.length : null,
          count: result.records.length,
          total: result.total,
          limited: result.limited,
          fields: columns,
        },
        records: result.records.map(record =>
          Object.fromEntries(columns.map(key => [key, record[key]]))
        ),
      },
      null,
      2
    ) + '\n'
  );
}
