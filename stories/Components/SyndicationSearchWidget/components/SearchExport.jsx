import React, { useEffect, useMemo, useRef, useState, useId } from 'react';
import PropTypes from 'prop-types';
import {
  useSearchConfig,
  useSearchState,
  useSearchLabels,
  interpolateLabel,
} from '../context/SearchContext';
import { isQueryTooShortToSearch } from '../utils/constants';
import {
  buildExportQuery,
  exportLimit,
  readExportResponse,
  exportCsv,
  exportJson,
} from '../utils/exportResults';

export default function SearchExport({ isStale = false }) {
  const config = useSearchConfig();
  const state = useSearchState();
  const labels = useSearchLabels();
  const requestRef = useRef(null);
  const [status, setStatus] = useState(null);
  const helpId = useId();
  const limit = exportLimit(config.exportLimit);
  const { query, facets, facetOperators, customFacets, sortBy } = state;
  const body = useMemo(
    () =>
      buildExportQuery(
        { query, facets, facetOperators, customFacets, sortBy },
        config
      ),
    [config, query, facets, facetOperators, customFacets, sortBy]
  );
  const requestKey = JSON.stringify(
    { endpoint: config.searchEndpoint, body },
    (key, value) => (key === 'now' ? undefined : value)
  );
  const currentStatus =
    !isStale &&
    status?.key === requestKey &&
    !(
      status.pending &&
      (!requestRef.current || requestRef.current.signal.aborted)
    )
      ? status
      : null;
  const busy = !!currentStatus?.pending;
  const unavailable =
    isStale ||
    state.isLoading ||
    !state.isInitialized ||
    state.results === null ||
    !!state.error ||
    state.totalResults === 0 ||
    isQueryTooShortToSearch(state, config.minSearchLength);

  useEffect(() => () => requestRef.current?.abort(), [requestKey, isStale]);

  async function download(format, document) {
    if (
      unavailable ||
      (requestRef.current && !requestRef.current.signal.aborted)
    )
      return;
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus({
      key: requestKey,
      pending: true,
      message: labels.exportLoading,
    });
    try {
      const response = await fetch(config.searchEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Export request failed');
      const result = readExportResponse(await response.json(), limit);
      if (controller.signal.aborted) return;
      if (!result.records.length) {
        setStatus({ key: requestKey, message: labels.exportEmpty });
        return;
      }
      const view = document.defaultView;
      const file = new view.Blob(
        [
          format === 'csv'
            ? exportCsv(result.records)
            : exportJson(result, limit),
        ],
        {
          type:
            format === 'csv'
              ? 'text/csv;charset=utf-8'
              : 'application/json;charset=utf-8',
        }
      );
      const url = view.URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `search-results-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
        view.setTimeout(() => view.URL.revokeObjectURL(url), 1000);
      }
      setStatus({
        key: requestKey,
        message: interpolateLabel(
          result.limited ? labels.exportLimited : labels.exportComplete,
          { count: result.records.length, total: result.total }
        ),
      });
    } catch (error) {
      if (!controller.signal.aborted)
        setStatus({
          key: requestKey,
          error: true,
          message: labels.exportError,
        });
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }

  const contactUrl = /^(https?:\/\/|\/(?!\/))/.test(
    config.exportContactUrl || ''
  )
    ? config.exportContactUrl
    : 'https://www.preventionweb.net/contact';

  return (
    <section className="mg-search__export" aria-label={labels.exportRegion}>
      <p id={helpId}>{interpolateLabel(labels.exportScope, { limit })}</p>
      <div className="mg-search__export-actions" aria-busy={busy}>
        <button
          type="button"
          className={`mg-button mg-button-secondary${unavailable || busy ? ' disabled' : ''}`}
          aria-describedby={helpId}
          disabled={unavailable}
          aria-disabled={busy || undefined}
          onClick={event => download('csv', event.currentTarget.ownerDocument)}
        >
          {labels.exportCsv}
        </button>
        <button
          type="button"
          className={`mg-button mg-button-secondary${unavailable || busy ? ' disabled' : ''}`}
          aria-describedby={helpId}
          disabled={unavailable}
          aria-disabled={busy || undefined}
          onClick={event => download('json', event.currentTarget.ownerDocument)}
        >
          {labels.exportJson}
        </button>
      </div>
      <p role="status" aria-live="polite">
        {!currentStatus?.error && currentStatus?.message}
      </p>
      {currentStatus?.error && <p role="alert">{currentStatus.message}</p>}
      <p>
        {labels.exportContact}{' '}
        <a href={contactUrl}>{labels.exportContactLink}</a>
      </p>
    </section>
  );
}

SearchExport.propTypes = { isStale: PropTypes.bool };
