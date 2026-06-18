/**
 * @file SearchForm.jsx
 * @description Search input form component with accessibility features.
 *
 * @module SearchWidget/components/SearchForm
 */

import React, { useCallback, useId } from 'react';
import { useSearchConfig, useSearchDispatch, useSearchLabels, interpolateLabel, actions } from '../context/SearchContext';

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
  const labels = useSearchLabels();
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
      aria-label={labels.searchFormLabel}
      onSubmit={handleSubmit}
      data-vf-google-analytics-region="undrr-search-form"
    >
      <div className="mg-search__input-wrapper">
        <label htmlFor={inputId} className="mg-u-sr-only">
          {labels.searchLabel}
        </label>
        <input
          id={inputId}
          type="search"
          className="mg-search__input form-control"
          placeholder={labels.searchPlaceholder}
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
            ? interpolateLabel(labels.searchHintMin, { min: minSearchLength })
            : labels.searchHint}
        </span>

        {/* Clear button */}
        {value && (
          <button
            type="button"
            className="mg-search__clear"
            onClick={handleClear}
            aria-label={labels.clearSearch}
          >
            <span className="mg-icon mg-icon-close" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Loading state is conveyed by the widget-level progress strip and
          aria-busy on the results region; the submit button keeps a stable
          icon + label to avoid stacking multiple animated indicators. */}
      <button
        type="submit"
        className="mg-button mg-button-primary mg-search__submit"
        aria-label={labels.submitSearch}
        aria-busy={isLoading || isStale}
      >
        <span className="mg-search__submit-icon" aria-hidden="true">
          <span className="mg-icon mg-icon-search" />
        </span>
        <span className="mg-search__submit-text">{labels.submitSearchText}</span>
      </button>
    </form>
  );
}

export default SearchForm;
