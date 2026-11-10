import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { lockDialogScroll } from '../../../assets/js/dialog-scroll-lock';
import { useWidgetRootRef } from '../context/WidgetRootContext';
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
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const outsideRef = useRef(false);
  const modalHadFocusRef = useRef(false);
  const rootRef = useWidgetRootRef();
  const [openKey, setOpenKey] = useState(null);
  const [status, setStatus] = useState(null);
  const helpId = useId();
  const titleId = useId();
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
    <div className="mg-search__export">
      <button
        ref={triggerRef}
        type="button"
        className={`mg-button mg-button-secondary mg-button-outline${unavailable ? ' disabled' : ''}`}
        aria-haspopup="dialog"
        disabled={unavailable}
        onClick={() => {
          setStatus(null);
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
          <header className="mg-dialog__header">
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
              className="mg-button mg-button-secondary mg-dialog__close"
              onClick={closeModal}
            >
              {labels.exportClose}
            </button>
          </header>
          <div className="mg-dialog__body">
            <p id={helpId}>{interpolateLabel(labels.exportScope, { limit })}</p>
            <div className="mg-search__export-actions" aria-busy={busy}>
              <button
                type="button"
                className={`mg-button mg-button-secondary${unavailable || busy ? ' disabled' : ''}`}
                aria-describedby={helpId}
                disabled={unavailable}
                aria-disabled={busy || undefined}
                onClick={event =>
                  download('csv', event.currentTarget.ownerDocument)
                }
              >
                {labels.exportCsv}
              </button>
              <button
                type="button"
                className={`mg-button mg-button-secondary${unavailable || busy ? ' disabled' : ''}`}
                aria-describedby={helpId}
                disabled={unavailable}
                aria-disabled={busy || undefined}
                onClick={event =>
                  download('json', event.currentTarget.ownerDocument)
                }
              >
                {labels.exportJson}
              </button>
            </div>
            <p role="status" aria-live="polite">
              {!currentStatus?.error && currentStatus?.message}
            </p>
            {currentStatus?.error && (
              <p role="alert">{currentStatus.message}</p>
            )}
            <p>
              {labels.exportContact}{' '}
              <a href={contactUrl}>{labels.exportContactLink}</a>
            </p>
          </div>
        </dialog>
      )}
    </div>
  );
}

SearchExport.propTypes = { isStale: PropTypes.bool };
