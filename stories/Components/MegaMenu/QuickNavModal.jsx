import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import PropTypes from 'prop-types';
import {
  flattenMenuItems,
  filterMenuItems,
  formatLabel,
  HighlightText,
  getSiteSearchUrl,
} from './filterUtils';

export function QuickNavModal({
  isOpen,
  onClose,
  sections,
  labels = {},
  enableSiteSearch = true,
  searchUrl = '/search',
  onNavigate,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const titleId = useId();

  const allItems = useMemo(() => {
    return flattenMenuItems(sections);
  }, [sections]);

  const filteredResults = useMemo(() => {
    return query.trim()
      ? filterMenuItems(allItems, query)
      : allItems.slice(0, 8);
  }, [allItems, query]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Focus management: capture previous focus, autofocus input on open, and restore focus on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement;
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (
      previousActiveElementRef.current &&
      typeof previousActiveElementRef.current.focus === 'function'
    ) {
      previousActiveElementRef.current.focus();
      previousActiveElementRef.current = null;
    }
  }, [isOpen]);

  // Keep selected index within valid bounds when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation and focus trapping inside the palette
  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      const dialog = modalRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      return;
    }

    const hasSiteSearch = Boolean(enableSiteSearch && query.trim());
    const totalSelectable =
      filteredResults.length > 0
        ? filteredResults.length + (hasSiteSearch ? 1 : 0)
        : hasSiteSearch
          ? 1
          : 0;

    if (totalSelectable === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % totalSelectable);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalSelectable) % totalSelectable);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (
        filteredResults.length > 0 &&
        selectedIndex < filteredResults.length
      ) {
        const item = filteredResults[selectedIndex];
        if (item?.url) {
          if (typeof onNavigate === 'function') {
            onNavigate(item.url);
          } else if (typeof window.location.assign === 'function') {
            window.location.assign(item.url);
          } else {
            window.location.href = item.url;
          }
        }
      } else if (hasSiteSearch) {
        const targetUrl = getSiteSearchUrl(searchUrl, query);
        if (typeof onNavigate === 'function') {
          onNavigate(targetUrl);
        } else if (typeof window.location.assign === 'function') {
          window.location.assign(targetUrl);
        } else {
          window.location.href = targetUrl;
        }
      }
    }
  };

  // Ensure selected item scrolls into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(
      '.mg-mega-quicknav__item--selected'
    );
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="mg-mega-quicknav-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="mg-mega-quicknav"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className="mg-u-sr-only">
          {labels.filterPlaceholder || 'Quick search navigation'}
        </h2>

        <div className="mg-mega-quicknav__header">
          <span
            className="mg-icon mg-icon-search mg-mega-quicknav__icon"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            className="mg-mega-quicknav__input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={
              labels.filterPlaceholder || 'Jump to section or search site...'
            }
            aria-label={labels.filterPlaceholder || 'Filter menu items'}
          />
          {query && (
            <button
              type="button"
              className="mg-mega-quicknav__clear"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label={labels.clearFilterLabel || 'Clear filter'}
            >
              ×
            </button>
          )}
          <button
            type="button"
            className="mg-mega-quicknav__esc"
            onClick={onClose}
            aria-label={labels.closeLabel || 'Close'}
          >
            <kbd aria-hidden="true">ESC</kbd>
          </button>
        </div>

        <div className="mg-mega-quicknav__body">
          <div
            className="mg-mega-quicknav__status"
            role="status"
            aria-live="polite"
          >
            {query.trim()
              ? formatLabel(labels.filterMatchesCount, {
                  count: filteredResults.length,
                })
              : labels.allSectionsLabel || 'Suggested destinations'}
          </div>

          {filteredResults.length > 0 ? (
            <ul
              ref={listRef}
              className="mg-mega-quicknav__list"
              aria-label={labels.filterPlaceholder || 'Matching destinations'}
            >
              {filteredResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <li
                    key={idx}
                    className={`mg-mega-quicknav__item ${
                      isSelected ? 'mg-mega-quicknav__item--selected' : ''
                    }`}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <a
                      href={item.url}
                      className="mg-mega-quicknav__link"
                      onClick={onClose}
                      aria-label={
                        item.fullPath
                          ? `${item.title} (${item.fullPath})`
                          : item.title
                      }
                    >
                      <div className="mg-mega-quicknav__link-text">
                        <span className="mg-mega-quicknav__item-title">
                          <HighlightText text={item.title} query={query} />
                        </span>
                        {item.fullPath && (
                          <span className="mg-mega-quicknav__item-path">
                            <HighlightText text={item.fullPath} query={query} />
                          </span>
                        )}
                      </div>
                      <span
                        className="mg-mega-quicknav__item-arrow"
                        aria-hidden="true"
                      >
                        ↵
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mg-mega-quicknav__empty-container">
              <p className="mg-mega-quicknav__empty">
                {labels.noFilterResultsLabel || 'No menu items found'}
              </p>
              {enableSiteSearch && query.trim() && (
                <div className="mg-mega-quicknav__empty-actions">
                  <a
                    href={getSiteSearchUrl(searchUrl, query)}
                    className={`mg-mega-quicknav__empty-search-cta ${
                      selectedIndex === 0
                        ? 'mg-mega-quicknav__empty-search-cta--selected'
                        : ''
                    }`}
                    onClick={onClose}
                  >
                    <span
                      className="mg-icon mg-icon-search mg-mega-quicknav__empty-search-icon"
                      aria-hidden="true"
                    />
                    <div className="mg-mega-quicknav__empty-search-content">
                      <span className="mg-mega-quicknav__empty-search-title">
                        {formatLabel(labels.searchSiteLabel, {
                          query: query.trim(),
                        })}
                      </span>
                      <span className="mg-mega-quicknav__empty-search-subtitle">
                        {labels.searchSitePromptLabel ||
                          'Search across all site content'}
                      </span>
                    </div>
                    <span
                      className="mg-mega-quicknav__empty-search-badge"
                      aria-hidden="true"
                    >
                      Enter ↵
                    </span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {enableSiteSearch && (
          <div className="mg-mega-quicknav__footer">
            <a
              href={getSiteSearchUrl(searchUrl, query)}
              className={`mg-mega-quicknav__search-link ${
                selectedIndex ===
                (filteredResults.length > 0 ? filteredResults.length : 0)
                  ? 'mg-mega-quicknav__search-link--selected'
                  : ''
              }`}
              onClick={onClose}
            >
              <span className="mg-icon mg-icon-search" aria-hidden="true" />
              <span>
                {query.trim()
                  ? formatLabel(labels.searchSiteLabel, { query: query.trim() })
                  : labels.searchSiteDefaultLabel || 'Search full site'}
              </span>
              <span
                className="mg-mega-quicknav__footer-action"
                aria-hidden="true"
              >
                Enter ↵
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

QuickNavModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sections: PropTypes.array.isRequired,
  labels: PropTypes.object,
  enableSiteSearch: PropTypes.bool,
  searchUrl: PropTypes.string,
  onNavigate: PropTypes.func,
};
