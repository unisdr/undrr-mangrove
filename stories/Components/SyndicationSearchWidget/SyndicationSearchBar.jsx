/**
 * @file SyndicationSearchBar.jsx
 * @description Standalone search bar that pairs with a SyndicationSearchWidget
 * mounted elsewhere on the page (or on a different page entirely).
 *
 * The bar communicates with the results widget via the URL hash. On submit
 * it writes `#query=<encoded>` and the SyndicationSearchWidget's existing
 * `useHashSync` hook picks up the new value. No shared store, no runtime
 * coupling between mounts — the URL is the contract.
 *
 * Two placement patterns:
 *
 * - **Same-page hero**: mount the bar in a hero/banner area and the results
 *   widget further down the same page. Submit updates the current page hash;
 *   useHashSync (in the results widget) fires and re-runs the search.
 *
 * - **Cross-page hero**: mount the bar on a landing page and the results
 *   widget on a separate `/search` page. Set `searchTargetUrl` so submit
 *   navigates to that page with the hash appended.
 *
 * @module SyndicationSearchBar
 */

import React, { useState, useId, useCallback } from 'react';
import PropTypes from 'prop-types';

// Default navigation: full-page assign. Extracted so consumers can pass
// `navigate` to integrate with a SPA router (or for test isolation, since
// JSDOM disallows mocking window.location.assign directly).
function defaultNavigate(url) {
  if (typeof window !== 'undefined') {
    window.location.assign(url);
  }
}

/**
 * SyndicationSearchBar component.
 *
 * @param {Object} props - Component props
 * @param {string} [props.placeholder] - Input placeholder text
 * @param {string} [props.defaultQuery] - Pre-filled value
 * @param {string|null} [props.searchTargetUrl] - Optional URL to navigate to
 *   on submit (for cross-page use). When null, the bar updates the current
 *   page hash so a same-page results widget picks it up.
 * @param {string} [props.paramName] - URL hash key to write the query under
 *   (default `'query'`). The results widget reads from this same key.
 * @param {string} [props.submitLabel] - Submit button label
 * @param {string} [props.ariaLabel] - aria-label on the form (search role)
 * @param {(url: string) => void} [props.navigate] - Optional override for
 *   cross-page navigation; called with the resolved URL when
 *   `searchTargetUrl` is set. Defaults to `window.location.assign`.
 *   SPAs can pass a router-aware `push` function here.
 */
export function SyndicationSearchBar({
  placeholder = 'Search...',
  defaultQuery = '',
  searchTargetUrl = null,
  paramName = 'query',
  submitLabel = 'Search',
  ariaLabel = 'Search content',
  navigate = defaultNavigate,
}) {
  const [value, setValue] = useState(defaultQuery);
  const generatedId = useId();
  const inputId = `mg-search-bar-${generatedId.replace(/:/g, '')}`;

  const handleChange = useCallback(e => {
    setValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setValue('');
  }, []);

  const handleSubmit = useCallback(
    e => {
      e.preventDefault();
      if (typeof window === 'undefined') return;

      const trimmed = value.trim();
      const hash = trimmed
        ? `#${paramName}=${encodeURIComponent(trimmed)}`
        : '';

      if (searchTargetUrl) {
        // Cross-page: navigate (default: window.location.assign) to the
        // target URL with the hash appended.
        navigate(`${searchTargetUrl}${hash}`);
        return;
      }

      // Same-page: update the hash so a co-mounted results widget's
      // useHashSync picks it up. If the new hash matches the current one
      // the browser fires no hashchange event — set to '' first to force
      // it.
      const currentHash = window.location.hash;
      const newHash = hash || '';
      if (currentHash === newHash) {
        window.location.hash = '';
      }
      window.location.hash = newHash;
    },
    [value, paramName, searchTargetUrl, navigate]
  );

  return (
    <form
      className="mg-search-bar"
      role="search"
      aria-label={ariaLabel}
      onSubmit={handleSubmit}
    >
      <div className="mg-search-bar__input-wrapper">
        <label htmlFor={inputId} className="mg-u-sr-only">
          {ariaLabel}
        </label>
        <input
          id={inputId}
          type="search"
          className="mg-search-bar__input mg-search__input"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        {value && (
          <button
            type="button"
            className="mg-search-bar__clear mg-search__clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <span className="mg-icon mg-icon-close" aria-hidden="true" />
          </button>
        )}
      </div>

      <button
        type="submit"
        className="mg-button mg-button-primary mg-search-bar__submit mg-search__submit"
        aria-label="Submit search"
      >
        <span className="mg-search__submit-icon" aria-hidden="true">
          <span className="mg-icon mg-icon-search" />
        </span>
        <span className="mg-search__submit-text">{submitLabel}</span>
      </button>
    </form>
  );
}

SyndicationSearchBar.propTypes = {
  placeholder: PropTypes.string,
  defaultQuery: PropTypes.string,
  searchTargetUrl: PropTypes.string,
  paramName: PropTypes.string,
  submitLabel: PropTypes.string,
  ariaLabel: PropTypes.string,
  navigate: PropTypes.func,
};

export default SyndicationSearchBar;
