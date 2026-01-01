/**
 * @file SearchForm.jsx
 * @description Search input form component with accessibility features.
 *
 * @module SearchWidget/components/SearchForm
 */

import React, { useCallback, useId } from 'react';
import { useSearchConfig, useSearchDispatch, actions } from '../context/SearchContext';

/**
 * SearchForm component.
 * Renders the search input and submit button.
 *
 * @param {Object} props - Component props
 * @param {string} props.value - Current query value
 * @param {Function} props.onChange - Query change handler
 * @param {boolean} props.isStale - Whether results are stale (search pending)
 * @param {boolean} props.isLoading - Whether search is loading
 * @param {string} props.widgetId - Unique widget ID for accessibility
 */
export function SearchForm({ value, onChange, isStale, isLoading, widgetId = '' }) {
  const config = useSearchConfig();
  const dispatch = useSearchDispatch();
  const generatedId = useId();
  const inputId = widgetId ? `search-${widgetId}` : generatedId;

  const { showSearchBox, minSearchLength } = config;

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    // Form submission doesn't need special handling -
    // the search is triggered by the value change
  }, []);

  const handleChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    dispatch(actions.setQuery(''));
  }, [onChange, dispatch]);

  if (!showSearchBox) {
    return null;
  }

  return (
    <form
      className="mg-search__form"
      role="search"
      aria-label="Search content"
      onSubmit={handleSubmit}
      data-vf-google-analytics-region="undrr-search-form"
    >
      <div className="mg-search__input-wrapper">
        <label htmlFor={inputId} className="mg-u-sr-only">
          Search
        </label>
        <input
          id={inputId}
          type="search"
          className="mg-search__input form-control"
          placeholder="Search..."
          value={value}
          onChange={handleChange}
          aria-describedby={`${inputId}-hint`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        <span id={`${inputId}-hint`} className="mg-u-sr-only">
          {minSearchLength > 1
            ? `Enter at least ${minSearchLength} characters to search`
            : 'Enter search terms'}
        </span>

        {/* Clear button */}
        {value && (
          <button
            type="button"
            className="mg-search__clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        )}

        {/* Loading/stale indicator */}
        {(isLoading || isStale) && (
          <span
            className="mg-search__loading"
            aria-hidden="true"
            title="Searching..."
          />
        )}
      </div>

      <button
        type="submit"
        className={`mg-search__submit btn btn-primary ${isLoading || isStale ? 'mg-search__submit--loading' : ''}`}
        aria-label={isLoading || isStale ? 'Searching...' : 'Submit search'}
        aria-busy={isLoading || isStale}
      >
        <span className="mg-search__submit-text">
          {isLoading || isStale ? 'Searching' : 'Search'}
        </span>
        <span className="mg-search__submit-icon" aria-hidden="true">
          {isLoading || isStale ? (
            <span className="mg-search__submit-spinner" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </span>
      </button>
    </form>
  );
}

export default SearchForm;
