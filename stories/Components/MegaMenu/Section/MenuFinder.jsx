import React, { useId, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  flattenMenuItems,
  filterMenuItems,
  formatLabel,
  getSiteSearchUrl,
  MenuResultTrail,
} from '../filterUtils';

/** Menu-wide navigation finder, revealed from an expanded section. */
export default function MenuFinder({
  sections,
  query,
  onQueryChange,
  onBack,
  labels,
  enableSiteSearch,
  searchUrl,
  onNavigate,
  onClose,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const finderRef = useRef(null);
  const backdropPressRef = useRef(false);
  const allItems = useMemo(() => flattenMenuItems(sections), [sections]);
  const results = useMemo(
    () => filterMenuItems(allItems, query),
    [allItems, query]
  );
  useEffect(() => {
    const dialog = finderRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  const handleLinkClick = event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    if (typeof onNavigate === 'function') {
      event.preventDefault();
      onNavigate(event.currentTarget.getAttribute('href'));
    }
    onClose();
  };
  const handleKeyDown = event => {
    // Let IMEs consume candidate-selection keys without dismissing either menu.
    if (event.isComposing || event.nativeEvent?.isComposing) {
      event.stopPropagation();
      return;
    }
    if (event.key === 'Tab') {
      const controls = Array.from(
        finderRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), a[href]'
        )
      );
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && event.target === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && event.target === last) {
        event.preventDefault();
        first?.focus();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onBack();
      return;
    }
    if (!['Enter', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const links = Array.from(finderRef.current.querySelectorAll('a[href]'));
    const index = links.indexOf(event.target);
    const inInput = event.target === inputRef.current;
    if (inInput && event.key === 'Enter' && links[0]) {
      event.preventDefault();
      links[0].click();
    } else if (
      (inInput || index >= 0) &&
      (event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
      links.length
    ) {
      event.preventDefault();
      const next = inInput
        ? event.key === 'ArrowDown'
          ? links[0]
          : links.at(-1)
        : links[index + (event.key === 'ArrowDown' ? 1 : -1)];
      (next || inputRef.current)?.focus();
      next?.scrollIntoView?.({ block: 'nearest', behavior: 'instant' });
    }
  };
  const isBackdropEvent = event => {
    if (event.target !== event.currentTarget) return false;
    const rect = event.currentTarget.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  };
  return (
    <dialog
      className="mg-dialog mg-mega-menu-finder"
      aria-labelledby={`${inputId}-title`}
      aria-modal="true"
      ref={finderRef}
      onKeyDown={handleKeyDown}
      onCancel={event => {
        event.preventDefault();
        onBack();
      }}
      onPointerDown={event => {
        backdropPressRef.current = isBackdropEvent(event);
      }}
      onPointerCancel={() => {
        backdropPressRef.current = false;
      }}
      onClick={event => {
        const dismiss = backdropPressRef.current && isBackdropEvent(event);
        backdropPressRef.current = false;
        if (dismiss) onBack();
      }}
    >
      <div className="mg-mega-menu-finder__header">
        <div className="mg-mega-menu-finder__heading">
          <label
            id={`${inputId}-title`}
            className="mg-mega-menu-finder__label"
            htmlFor={inputId}
            data-vf-analytics-label="Mega menu: Filter"
          >
            {labels.menuFilterLabel}
          </label>
          <button
            type="button"
            className="mg-mega-menu-finder__action"
            aria-label={labels.closeLabel}
            data-vf-analytics-label="Mega menu: Close finder"
            onClick={onBack}
          >
            <span className="mg-icon mg-icon-close" aria-hidden="true" />
          </button>
        </div>
        <div className="mg-mega-filter">
          <span
            className="mg-icon mg-icon-search mg-mega-filter__icon"
            aria-hidden="true"
          />
          <input
            id={inputId}
            ref={inputRef}
            type="search"
            className="mg-mega-filter__input"
            data-vf-analytics-label="Mega menu: Filter"
            value={query}
            onChange={event => onQueryChange(event.target.value)}
          />
          {query && (
            <button
              type="button"
              className="mg-mega-filter__clear"
              aria-label={labels.clearFilterLabel}
              data-vf-analytics-label="Mega menu: Clear filter"
              onClick={() => {
                onQueryChange('');
                inputRef.current?.focus();
              }}
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
      </div>
      {query.trim() && (
        <div className="mg-mega-menu-finder__results">
          <div
            role="status"
            aria-live="polite"
            className={
              results.length ? 'mg-u-sr-only' : 'mg-mega-filter__status'
            }
          >
            {results.length
              ? formatLabel(labels.filterMatchesCount, {
                  count: results.length,
                })
              : labels.noFilterResultsLabel}
          </div>
          {results.length > 0 && (
            <ul className="mg-mega-filter__mobile-list">
              {results.map(item => (
                <li key={item.url}>
                  <a
                    href={item.url}
                    className="mg-mega-filter__mobile-link"
                    aria-label={
                      item.fullPath
                        ? `${item.title} (${item.fullPath})`
                        : item.title
                    }
                    onClick={handleLinkClick}
                  >
                    <MenuResultTrail item={item} query={query} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {query.trim() && enableSiteSearch && (
        <div className="mg-mega-menu-finder__footer">
          <a
            href={getSiteSearchUrl(searchUrl, query)}
            className="mg-button mg-button-secondary mg-button-outline mg-mega-filter__site-search-link"
            data-vf-analytics-label="Mega menu: Site search"
            onClick={handleLinkClick}
          >
            <span>
              {formatLabel(labels.searchSiteLabel, { query: query.trim() })}
            </span>
            <span
              className="mg-icon mg-icon-arrow-right mg-mega-filter__fallback-arrow"
              aria-hidden="true"
            />
          </a>
        </div>
      )}
    </dialog>
  );
}

MenuFinder.propTypes = {
  sections: PropTypes.array.isRequired,
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  labels: PropTypes.object.isRequired,
  enableSiteSearch: PropTypes.bool,
  searchUrl: PropTypes.string,
  onNavigate: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};
