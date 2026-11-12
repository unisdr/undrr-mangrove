import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from '../../Forms/Checkbox/Checkbox';
import { TextInput } from '../../Forms/TextInput/TextInput';
import { lockDialogScroll } from '../../../assets/js/dialog-scroll-lock';
import { useWidgetRootRef } from '../context/WidgetRootContext';
import {
  useSearchConfig,
  useSearchState,
  useSearchLabels,
  interpolateLabel,
  DEFAULT_LABELS,
} from '../context/SearchContext';
import {
  analyticsRegion,
  isQueryTooShortToSearch,
  MAX_RESULT_WINDOW,
} from '../utils/constants';
import { searchRequestKey } from '../utils/searchRequestKey';
import { loadTaxonomies } from '../hooks/useTaxonomies';
import {
  ExportTaxonomyError,
  needsExportTaxonomies,
  withExportTaxonomyNames,
} from '../utils/exportMetadata';
import { saveFile } from '../utils/saveFile';
import {
  availableExportGroups,
  DEFAULT_EXPORT_GROUPS,
  columnsForExportGroups,
  buildExportQuery,
  normalizeExportDefaultCount,
  requestedExportCount,
  exportRangeLimits,
  MAX_EXPORT_LIMIT,
  readExportResponse,
  exportCsv,
  exportJson,
} from '../utils/exportResults';

export default function SearchExport({ isStale = false }) {
  const config = useSearchConfig();
  const state = useSearchState();
  const labels = useSearchLabels();
  const fieldGroups = useMemo(
    () => availableExportGroups(config.exportFields),
    [config.exportFields]
  );
  const availableGroupIds = fieldGroups.map(group => group.id);
  const availableGroupSet = new Set(availableGroupIds);
  const requestRef = useRef(null);
  const exportRef = useRef(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const outsideRef = useRef(false);
  const modalHadFocusRef = useRef(false);
  const rootRef = useWidgetRootRef();
  const [openKey, setOpenKey] = useState(null);
  const [status, setStatus] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState(DEFAULT_EXPORT_GROUPS);
  const selectedGroupSet = new Set(selectedGroups);
  const [countValue, setCountValue] = useState(() =>
    String(normalizeExportDefaultCount(config.exportDefaultCount))
  );
  const [startValue, setStartValue] = useState('1');
  const helpId = useId();
  const titleId = useId();
  const fieldsHelpId = useId();
  const countId = useId();
  const startId = useId();
  const formatTitleId = useId();
  const formatHelpId = useId();
  const previewId = useId();
  const defaultCount = normalizeExportDefaultCount(config.exportDefaultCount);
  const exportEndpoint = config.exportEndpoint || config.searchEndpoint;
  const region = analyticsRegion(config, 'download');

  // Bubbling events for site analytics. They carry the download's shape, never
  // the visitor's search text or filter values.
  function emit(action, detail) {
    const target = exportRef.current;
    if (!target) return;
    const EventClass =
      target.ownerDocument?.defaultView?.CustomEvent || CustomEvent;
    target.dispatchEvent(
      new EventClass(`mg-search-export:${action}`, {
        bubbles: true,
        composed: true,
        detail: { region, ...detail },
      })
    );
  }
  const { query, facets, facetOperators, customFacets, sortBy } = state;
  const body = useMemo(
    () =>
      buildExportQuery(
        { query, facets, facetOperators, customFacets, sortBy },
        config
      ),
    [config, query, facets, facetOperators, customFacets, sortBy]
  );
  const requestKey = JSON.stringify([
    searchRequestKey(exportEndpoint, body),
    availableGroupIds,
  ]);
  const isOpen = openKey === requestKey && !isStale;
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

  const offerOffset = state.totalResults >= MAX_EXPORT_LIMIT;
  const range = exportRangeLimits(
    state.totalResults,
    state.totalResultsRelation,
    offerOffset ? startValue : '1'
  );
  const initialMaximum = exportRangeLimits(
    state.totalResults,
    state.totalResultsRelation,
    '1'
  ).maxCount;
  const countHelp =
    !unavailable && offerOffset && range.maxCount > 0
      ? interpolateLabel(labels.exportCountHelp, {
          max: range.maxCount,
          fromStart: range.start > 1,
          perDownload: range.maxCount === MAX_EXPORT_LIMIT,
        })
      : null;

  const availability = !unavailable
    ? interpolateLabel(
        state.totalResultsRelation === 'gte'
          ? labels.exportAvailableAtLeast
          : labels.exportAvailable,
        { count: state.totalResults }
      )
    : null;

  const previewCount =
    !unavailable && range.start !== null
      ? requestedExportCount(countValue, range.maxCount)
      : null;
  const previewWindow = state.totalResultsRelation === 'gte';
  const previewScale = previewWindow ? MAX_RESULT_WINDOW : state.totalResults;

  useEffect(() => {
    if (offerOffset) return;
    if (startValue !== '1') {
      requestRef.current?.abort();
      setStartValue('1');

      setStatus(null);
    }
    const doc = dialogRef.current?.ownerDocument;
    if (doc && modalHadFocusRef.current && doc.activeElement === doc.body) {
      doc.getElementById(countId)?.focus({ preventScroll: true });
    }
  }, [offerOffset, startValue, countId]);

  const closeModal = useCallback(() => {
    requestRef.current?.abort();
    setOpenKey(null);
    setStatus(null);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const dialog = dialogRef.current;
    const doc = dialog.ownerDocument;
    const trigger = triggerRef.current;
    dialog.showModal();
    const release = lockDialogScroll(doc);
    titleRef.current?.focus({ preventScroll: true });
    return () => {
      const hadFocus =
        dialog.contains(doc.activeElement) ||
        (modalHadFocusRef.current && doc.activeElement === doc.body);
      modalHadFocusRef.current = false;
      requestRef.current?.abort();
      if (dialog.open) dialog.close();
      release();
      setOpenKey(null);
      setStatus(null);
      if (!hadFocus) return;
      if (trigger?.isConnected && !trigger.disabled) {
        trigger.focus({ preventScroll: true });
      }
      if (doc.activeElement !== trigger && rootRef.current?.isConnected) {
        const fallback = rootRef.current.querySelector('.mg-search__main');
        if (fallback) {
          const hadTabIndex = fallback.hasAttribute('tabindex');
          if (!hadTabIndex) fallback.tabIndex = -1;
          fallback.focus({ preventScroll: true });
          if (!hadTabIndex) fallback.removeAttribute('tabindex');
        }
      }
    };
  }, [isOpen, rootRef]);

  function outsideDialog(event) {
    const dialog = dialogRef.current;
    if (event.target !== dialog) return false;
    const rect = dialog.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  }

  function updateRange(nextStart, nextCount, commit = false) {
    const whole = (value, fallback, maximum) => {
      if (value === '' && !commit) return '';
      const number = String(value).trim() === '' ? NaN : Number(value);
      return Math.min(
        maximum,
        Math.max(1, Number.isFinite(number) ? Math.floor(number) : fallback)
      );
    };
    const start = offerOffset ? whole(nextStart, 1, range.maxStart) : 1;
    const maximum = exportRangeLimits(
      state.totalResults,
      state.totalResultsRelation,
      String(start || 1)
    ).maxCount;
    const count = whole(nextCount, defaultCount, Math.max(1, maximum));
    const corrected =
      String(start) !== nextStart || String(count) !== nextCount;
    setStatus(
      !unavailable && corrected && start !== '' && count !== ''
        ? {
            key: requestKey,
            correction: true,
            message: interpolateLabel(labels.exportPreview, {
              start,
              end: start + count - 1,
              count,
              total: state.totalResults,
            }),
          }
        : null
    );
    setStartValue(String(start));
    setCountValue(String(count));
    return { start, count };
  }

  function commitRange() {
    return updateRange(startValue, countValue, true);
  }

  function wholeNumberKey(event) {
    if (
      event.nativeEvent.isComposing ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    if (event.key.length === 1 && !/^[0-9]$/.test(event.key))
      event.preventDefault();
  }

  function wholeNumberPaste(event) {
    if (!/^[0-9]+$/.test(event.clipboardData.getData('text').trim()))
      event.preventDefault();
  }

  async function download(format, document) {
    if (
      !isOpen ||
      unavailable ||
      (requestRef.current && !requestRef.current.signal.aborted)
    )
      return;
    const corrected = commitRange();
    const from = corrected.start - 1;
    const { count } = corrected;
    const fields = availableGroupIds.filter(id => selectedGroupSet.has(id));
    const columns = columnsForExportGroups(fields);
    const tracked = { format, start: from + 1, count, fields };
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus({
      key: requestKey,
      pending: true,
      message: labels.exportLoading,
    });
    try {
      const response = await fetch(exportEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          from,
          size: count,
          ...(columns.includes('summary') && {
            _source: { includes: [...body._source.includes, 'teaser'] },
          }),
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Export request failed');
      const result = readExportResponse(
        await response.json(),
        count,
        from,
        columns.includes('summary') ? document : undefined
      );
      if (controller.signal.aborted) return;
      if (!result.records.length) {
        setStatus({ key: requestKey, message: labels.exportEmpty });
        emit('empty', { ...tracked, total: result.total });
        return;
      }
      if (needsExportTaxonomies(result.records, columns)) {
        const taxonomy = await loadTaxonomies(config.taxonomyEndpoint);
        if (controller.signal.aborted) return;
        if (taxonomy.error || !taxonomy.termMap)
          throw new ExportTaxonomyError('Export taxonomy lookup failed');
        try {
          result.records = withExportTaxonomyNames(
            result.records,
            columns,
            taxonomy.termMap
          );
        } catch (error) {
          if (!(error instanceof ExportTaxonomyError)) throw error;
          const refreshed = await loadTaxonomies(config.taxonomyEndpoint, {
            force: true,
          });
          if (controller.signal.aborted) return;
          if (refreshed.error) throw error;
          result.records = withExportTaxonomyNames(
            result.records,
            columns,
            refreshed.termMap
          );
        }
      }
      if (controller.signal.aborted) return;
      saveFile(
        document,
        format === 'csv'
          ? exportCsv(result.records, columns)
          : exportJson(result, count, columns),
        format
      );
      emit('download', {
        ...tracked,
        returned: result.records.length,
        total: result.total,
        limited: result.limited,
      });
      setStatus({
        key: requestKey,
        message: interpolateLabel(
          result.limited ? labels.exportLimited : labels.exportComplete,
          {
            start: from + 1,
            end: from + result.records.length,
            count: result.records.length,
            total: result.total,
          }
        ),
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        const taxonomyError = error instanceof ExportTaxonomyError;
        setStatus({
          key: requestKey,
          error: true,
          message: taxonomyError
            ? labels.exportTaxonomyError
            : labels.exportError,
        });
        emit('error', {
          ...tracked,
          reason: taxonomyError ? 'taxonomy' : 'request',
        });
      }
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
    <div
      ref={exportRef}
      className="mg-search__export"
      data-vf-google-analytics-region={region}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`mg-button mg-button-secondary mg-button-outline${unavailable ? ' disabled' : ''}`}
        aria-haspopup="dialog"
        disabled={unavailable}
        onClick={() => {
          setStatus(null);
          setSelectedGroups(
            DEFAULT_EXPORT_GROUPS.filter(id => availableGroupSet.has(id))
          );
          setStartValue('1');

          setCountValue(String(Math.min(defaultCount, initialMaximum)));

          setOpenKey(requestKey);
          emit('open', {
            total: state.totalResults,
            totalRelation: state.totalResultsRelation,
          });
        }}
        data-vf-analytics-label="Search download: Open"
      >
        {labels.exportOpen}
      </button>
      {isOpen && (
        <dialog
          ref={dialogRef}
          className="mg-dialog mg-search__export-dialog"
          aria-labelledby={titleId}
          aria-describedby={helpId}
          onFocusCapture={() => {
            modalHadFocusRef.current = true;
          }}
          onBlurCapture={event => {
            if (
              event.relatedTarget &&
              !event.currentTarget.contains(event.relatedTarget)
            )
              modalHadFocusRef.current = false;
          }}
          onClose={closeModal}
          onCancel={closeModal}
          onPointerCancel={() => {
            outsideRef.current = false;
          }}
          onPointerDown={event => {
            outsideRef.current = outsideDialog(event);
          }}
          onClick={event => {
            if (outsideRef.current && outsideDialog(event)) closeModal();
            outsideRef.current = false;
          }}
        >
          <header className="mg-dialog__header mg-search__export-header">
            <span className="mg-search__export-header-icon" aria-hidden="true">
              <span className="mg-icon mg-icon-download" />
            </span>
            <h2
              ref={titleRef}
              id={titleId}
              tabIndex={-1}
              className="mg-dialog__title"
            >
              {labels.exportRegion}
            </h2>
            <button
              type="button"
              className="mg-icon-button mg-dialog__close"
              aria-label={
                labels.exportClose?.trim() || DEFAULT_LABELS.exportClose
              }
              onClick={closeModal}
              data-vf-analytics-label="Search download: Close"
            >
              <span className="mg-icon mg-icon-close" aria-hidden="true" />
            </button>
            <p id={helpId} className="mg-search__export-scope">
              {interpolateLabel(labels.exportScope, {
                limit: requestedExportCount(countValue) ?? '…',
              })}
            </p>
          </header>
          <div className="mg-dialog__body">
            <fieldset
              className={`mg-search__export-range${offerOffset ? ' mg-search__export-range--paged' : ''}`}
            >
              <legend className="mg-form-group__legend">
                <span>{availability || labels.exportCountLabel}</span>
              </legend>
              <TextInput
                className="mg-search__export-count"
                id={countId}
                type="number"
                label={labels.exportCountLabel}
                min={1}
                max={range.maxCount || undefined}
                step={1}
                inputMode="numeric"
                required
                onBlur={commitRange}
                onKeyDown={wholeNumberKey}
                onPaste={wholeNumberPaste}
                value={countValue}
                disabled={busy}
                helpText={countHelp}
                onChange={event => updateRange(startValue, event.target.value)}
                analyticsLabel="Search download: Quantity"
              />
              {offerOffset && (
                <TextInput
                  className="mg-search__export-start"
                  id={startId}
                  type="number"
                  label={labels.exportStartLabel}
                  min={1}
                  max={range.maxStart}
                  step={1}
                  inputMode="numeric"
                  required
                  onBlur={commitRange}
                  onKeyDown={wholeNumberKey}
                  onPaste={wholeNumberPaste}
                  value={startValue}
                  disabled={busy}
                  helpText={
                    state.totalResults > MAX_RESULT_WINDOW
                      ? interpolateLabel(labels.exportStartHelp, {
                          max: MAX_RESULT_WINDOW,
                        })
                      : undefined
                  }
                  onChange={event =>
                    updateRange(event.target.value, countValue)
                  }
                  analyticsLabel="Search download: Start"
                />
              )}
              {previewCount !== null && (
                <figure
                  className="mg-search__export-preview"
                  aria-labelledby={previewId}
                >
                  <div
                    className={`mg-search__export-preview-track${previewWindow ? ' mg-search__export-preview-track--window' : ''}`}
                    aria-hidden="true"
                  >
                    <span
                      className="mg-search__export-preview-selection"
                      style={{
                        insetInlineStart: `min(${((range.start - 1) / previewScale) * 100}%, calc(100% - 1px))`,
                        inlineSize: `${(previewCount / previewScale) * 100}%`,
                      }}
                    />
                  </div>
                  <figcaption id={previewId} className="mg-form-help">
                    {interpolateLabel(labels.exportPreview, {
                      start: range.start,
                      end: range.start + previewCount - 1,
                      count: previewCount,
                      total: state.totalResults,
                    })}
                    {previewWindow && (
                      <span className="mg-u-sr-only">
                        {' '}
                        {interpolateLabel(labels.exportPreviewWindow, {
                          window: MAX_RESULT_WINDOW,
                        })}
                      </span>
                    )}
                  </figcaption>
                </figure>
              )}
            </fieldset>
            <details
              className="mg-search__export-field-options"
              open
              data-vf-analytics-label="Search download: Fields"
            >
              <summary>{labels.exportFields}</summary>
              <fieldset
                className="mg-search__export-fields"
                disabled={busy}
                aria-describedby={fieldsHelpId}
              >
                <legend>
                  <span className="mg-u-sr-only">{labels.exportFields}</span>
                </legend>
                <p id={fieldsHelpId}>{labels.exportFieldsHelp}</p>
                <div className="mg-search__export-field-grid">
                  {fieldGroups.map(group => (
                    <Checkbox
                      key={group.id}
                      label={labels[group.label]}
                      value={group.id}
                      analyticsLabel={`Search download: Field ${group.id}`}
                      checked={selectedGroupSet.has(group.id)}
                      disabled={busy}
                      onChange={event => {
                        const checked = event.target.checked;
                        setStatus(null);
                        setSelectedGroups(previous =>
                          checked
                            ? [...previous, group.id]
                            : previous.filter(id => id !== group.id)
                        );
                      }}
                    />
                  ))}
                </div>
              </fieldset>
            </details>
          </div>
          <section
            className="mg-search__export-footer"
            aria-labelledby={formatTitleId}
          >
            <h3 id={formatTitleId} className="mg-search__export-format-title">
              {labels.exportFormatTitle}
            </h3>
            <p id={formatHelpId} className="mg-form-help">
              {labels.exportFormatHelp}
            </p>
            <div className="mg-search__export-actions" aria-busy={busy}>
              <button
                type="button"
                className={`mg-button mg-button-primary${unavailable || busy ? ' disabled' : ''}`}
                aria-describedby={`${helpId} ${formatHelpId}`}
                disabled={unavailable}
                aria-disabled={busy || undefined}
                onClick={event =>
                  download('csv', event.currentTarget.ownerDocument)
                }
                data-vf-analytics-label="Search download: CSV"
              >
                <span className="mg-icon mg-icon-download" aria-hidden="true" />
                {labels.exportCsv}
              </button>
              <button
                type="button"
                className={`mg-button mg-button-secondary mg-button-outline${unavailable || busy ? ' disabled' : ''}`}
                aria-describedby={`${helpId} ${formatHelpId}`}
                disabled={unavailable}
                aria-disabled={busy || undefined}
                onClick={event =>
                  download('json', event.currentTarget.ownerDocument)
                }
                data-vf-analytics-label="Search download: JSON"
              >
                <span className="mg-icon mg-icon-download" aria-hidden="true" />
                {labels.exportJson}
              </button>
            </div>
            <p
              className={`mg-search__export-status${currentStatus?.correction ? ' mg-u-sr-only' : ''}`}
              role="status"
              aria-live="polite"
            >
              {!currentStatus?.error && currentStatus?.message}
            </p>
            {currentStatus?.error && (
              <p role="alert">{currentStatus.message}</p>
            )}
            <p className="mg-form-help mg-search__export-help">
              {labels.exportContact}{' '}
              <a
                href={contactUrl}
                data-vf-analytics-label="Search download: Contact"
              >
                {labels.exportContactLink}
              </a>
            </p>
          </section>
        </dialog>
      )}
    </div>
  );
}

SearchExport.propTypes = { isStale: PropTypes.bool };
