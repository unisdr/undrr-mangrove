import { decodeEntities } from './decodeEntities';
import { buildQuery } from './queryBuilder';
import {
  DOMAIN_MAP,
  getTaxonomyVocabulary,
  isTaxonomyTermResult,
} from './constants';
import { toDate } from './dateUtils';

export const MAX_EXPORT_LIMIT = 1000;
export const DEFAULT_EXPORT_LIMIT = 100;
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
  'url',
  'type',
  'language',
  'posted_at',
  'display_date',
  'display_date_precision',
  'country_region_ids',
  'hazard_ids',
  'theme_ids',
];

const first = value => (Array.isArray(value) ? value[0] : value);
const values = value => [].concat(value ?? []).map(String);
const text = value => String(first(value) ?? '');

export function exportLimit(value) {
  return Number.isFinite(value) && value >= 1
    ? Math.min(Math.floor(value), MAX_EXPORT_LIMIT)
    : DEFAULT_EXPORT_LIMIT;
}

export function buildExportQuery(state, config) {
  const body = buildQuery(
    { ...state, page: 1 },
    {
      ...config,
      resultsPerPage: exportLimit(config.exportLimit),
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

export function exportRecord(hit) {
  const source = hit._source || {};
  const precision = text(source.display_date_precision);
  const displayDate = toDate(source.display_date, { allowBeforeEpoch: true });
  return {
    id: String(hit._id ?? first(source.nid) ?? ''),
    title: decodeEntities(text(source.title)),
    url: recordUrl(source),
    type: text(source.type) || text(source.vid),
    language: text(source._language),
    posted_at: toDate(source.published_at)?.toISOString() || '',
    display_date: displayDate
      ? displayDate.toISOString().slice(0, precision === 'year' ? 4 : 10)
      : '',
    display_date_precision: precision,
    country_region_ids: values(source.field_country_region),
    hazard_ids: values(source.field_hazard),
    theme_ids: values(source.field_theme),
  };
}

export function readExportResponse(data, limit) {
  const hits = data?.hits?.hits;
  const total = data?.hits?.total;
  if (
    data?.timed_out ||
    data?._shards?.failed > 0 ||
    !Array.isArray(hits) ||
    total?.relation !== 'eq' ||
    !Number.isSafeInteger(total.value) ||
    total.value < 0 ||
    hits.length !== Math.min(total.value, limit) ||
    hits.some(
      hit => !hit || typeof hit._source !== 'object' || hit._source === null
    )
  ) {
    throw new Error('Incomplete export response');
  }
  return {
    records: hits.map(exportRecord),
    total: total.value,
    limited: total.value > limit,
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

export function exportCsv(records) {
  return (
    '\ufeff' +
    [
      EXPORT_COLUMNS,
      ...records.map(record => EXPORT_COLUMNS.map(key => record[key])),
    ]
      .map(row => row.map(csvCell).join(','))
      .join('\r\n') +
    '\r\n'
  );
}

export function exportJson(result, limit) {
  return (
    JSON.stringify(
      {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        scope: {
          limit,
          count: result.records.length,
          total: result.total,
          limited: result.limited,
        },
        records: result.records,
      },
      null,
      2
    ) + '\n'
  );
}
