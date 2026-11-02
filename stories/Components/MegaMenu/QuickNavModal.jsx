import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import PropTypes from 'prop-types';
import {
  flattenMenuItems,
  filterMenuItems,
  formatLabel,
  HighlightText,
} from './filterUtils';

export function QuickNavModal({
  isOpen,
  onClose,
  sections,
  labels = {},
  searchUrl = '/search?q=',
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const titleId = useId();

  const allItems = useMemo(() => {
    return flattenMenuItems(sections);
  }, [sections]);

  const filteredResults = useMemo(() => {
    return query.trim()
      ? filterMenuItems(allItems, query)
      : allItems.slice(0, 8);
  }, [allItems, query]);

  // Focus input and reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keep selected index within valid bounds when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation inside the palette
  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      onClose();
      return;
    }

    const totalSelectable = filteredResults.length + 1; // +1 for the full search fallback

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % totalSelectable);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalSelectable) % totalSelectable);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredResults.length) {
        const item = filteredResults[selectedIndex];
        if (item?.url) {
          window.location.href = item.url;
        }
      } else {
        const term = query.trim();
        window.location.href = `${searchUrl}${encodeURIComponent(term)}`;
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
          <kbd
            className="mg-mega-quicknav__esc"
            onClick={onClose}
            aria-label={labels.closeLabel || 'Close'}
          >
            ESC
          </kbd>
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
            <p className="mg-mega-quicknav__empty">
              {labels.noFilterResultsLabel || 'No menu items found'}
            </p>
          )}
        </div>

        <div className="mg-mega-quicknav__footer">
          <a
            href={`${searchUrl}${encodeURIComponent(query.trim())}`}
            className={`mg-mega-quicknav__search-link ${
              selectedIndex === filteredResults.length
                ? 'mg-mega-quicknav__search-link--selected'
                : ''
            }`}
            onClick={onClose}
          >
            <span className="mg-icon mg-icon-search" aria-hidden="true" />
            <span>
              {query.trim()
                ? formatLabel(labels.searchSiteLabel, { query: query.trim() })
                : 'Search full site'}
            </span>
            <span
              className="mg-mega-quicknav__footer-action"
              aria-hidden="true"
            >
              Enter ↵
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

QuickNavModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sections: PropTypes.array.isRequired,
  labels: PropTypes.object,
  searchUrl: PropTypes.string,
};
