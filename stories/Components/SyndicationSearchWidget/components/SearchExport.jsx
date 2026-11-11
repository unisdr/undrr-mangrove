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
import { isQueryTooShortToSearch } from '../utils/constants';
import { searchRequestKey } from '../utils/searchRequestKey';
import { saveFile } from '../utils/saveFile';
import {
  EXPORT_FIELD_GROUPS,
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
  const requestRef = useRef(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const outsideRef = useRef(false);
  const modalHadFocusRef = useRef(false);
  const rootRef = useWidgetRootRef();
  const [openKey, setOpenKey] = useState(null);
  const [status, setStatus] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState(DEFAULT_EXPORT_GROUPS);
  const [countValue, setCountValue] = useState(() =>
    String(normalizeExportDefaultCount(config.exportDefaultCount))
  );
  const [countError, setCountError] = useState(false);
  const [startValue, setStartValue] = useState('1');
  const [startError, setStartError] = useState(false);
  const helpId = useId();
  const titleId = useId();
  const fieldsHelpId = useId();
  const countId = useId();
  const startId = useId();
  const formatTitleId = useId();
  const formatHelpId = useId();
  const defaultCount = normalizeExportDefaultCount(config.exportDefaultCount);
  const { query, facets, facetOperators, customFacets, sortBy } = state;
  const body = useMemo(
    () =>
      buildExportQuery(
        { query, facets, facetOperators, customFacets, sortBy },
        config
      ),
    [config, query, facets, facetOperators, customFacets, sortBy]
  );
  const requestKey = searchRequestKey(config.searchEndpoint, body);
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

  const range = exportRangeLimits(
    state.totalResults,
    state.totalResultsRelation,
    startValue
  );
  const initialMaximum = exportRangeLimits(
    state.totalResults,
    state.totalResultsRelation,
    '1'
  ).maxCount;
  const countHelp =
    !unavailable && range.maxCount > 0
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

  async function download(format, document) {
    if (
      !isOpen ||
      unavailable ||
      (requestRef.current && !requestRef.current.signal.aborted)
    )
      return;
    if (range.start === null) {
      setStartError(true);
      document.getElementById(startId)?.focus();
      return;
    }
    const from = range.start - 1;
    const count = requestedExportCount(countValue, range.maxCount);
    if (count === null) {
      setCountError(true);
      document.getElementById(countId)?.focus();
      return;
    }
    const columns = columnsForExportGroups(selectedGroups);
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
        body: JSON.stringify({ ...body, from, size: count }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Export request failed');
      const result = readExportResponse(await response.json(), count, from);
      if (controller.signal.aborted) return;
      if (!result.records.length) {
        setStatus({ key: requestKey, message: labels.exportEmpty });
        return;
      }
      saveFile(
        document,
        format === 'csv'
          ? exportCsv(result.records, columns)
          : exportJson(result, count, columns),
        format
      );
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
    <div className="mg-search__export">
      <button
        ref={triggerRef}
        type="button"
        className={`mg-button mg-button-secondary mg-button-outline${unavailable ? ' disabled' : ''}`}
        aria-haspopup="dialog"
        disabled={unavailable}
        onClick={() => {
          setStatus(null);
          setSelectedGroups(DEFAULT_EXPORT_GROUPS);
          setStartValue('1');
          setStartError(false);
          setCountValue(String(Math.min(defaultCount, initialMaximum)));
          setCountError(false);
          setOpenKey(requestKey);
        }}
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
            <div className="mg-search__export-range">
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
                value={startValue}
                disabled={busy}
                helpText={
                  !unavailable
                    ? interpolateLabel(labels.exportStartHelp, {
                        max: range.maxStart,
                      })
                    : undefined
                }
                error={startError}
                errorText={interpolateLabel(labels.exportStartError, {
                  max: range.maxStart,
                })}
                onChange={event => {
                  const value = event.target.value;
                  const nextRange = exportRangeLimits(
                    state.totalResults,
                    state.totalResultsRelation,
                    value
                  );
                  setStartValue(value);
                  setStartError(false);
                  setCountError(
                    nextRange.maxCount > 0 &&
                      requestedExportCount(countValue, nextRange.maxCount) ===
                        null
                  );
                  setStatus(null);
                }}
              />
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
                value={countValue}
                disabled={busy}
                helpText={[availability, countHelp].filter(Boolean).join(' · ')}
                error={countError}
                errorText={interpolateLabel(labels.exportCountError, {
                  max: Math.max(1, range.maxCount ?? MAX_EXPORT_LIMIT),
                })}
                onChange={event => {
                  setCountValue(event.target.value);
                  setCountError(false);
                  setStatus(null);
                }}
              />
            </div>
            <details className="mg-search__export-field-options" open>
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
                  {EXPORT_FIELD_GROUPS.map(group => (
                    <Checkbox
                      key={group.id}
                      label={labels[group.label]}
                      value={group.id}
                      checked={selectedGroups.includes(group.id)}
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
              >
                <span className="mg-icon mg-icon-download" aria-hidden="true" />
                {labels.exportJson}
              </button>
            </div>
            <p
              className="mg-search__export-status"
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
              <a href={contactUrl}>{labels.exportContactLink}</a>
            </p>
          </section>
        </dialog>
      )}
    </div>
  );
}

SearchExport.propTypes = { isStale: PropTypes.bool };
