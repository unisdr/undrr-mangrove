import React from 'react';
import PropTypes from 'prop-types';
// import './pagination.scss';

export const DEFAULT_PAGINATION_LABELS = {
  prevLabel: 'Previous',
  nextLabel: 'Next',
  nextAriaLabel: 'Next page',
};

/**
 * Pagination component that renders previous/next navigation links
 * with page number indicators.
 *
 * @param {object} props - Component props.
 * @param {string} [props.text] - Decorative text displayed before the first page number.
 * @param {string} [props.text2] - Decorative text displayed before the last page number.
 * @param {object} [props.labels] - UI label overrides.
 */
export function Pagination({ text, text2, labels = {} }) {
  const { prevLabel, nextLabel, nextAriaLabel } = {
    ...DEFAULT_PAGINATION_LABELS,
    ...labels,
  };
  return (
    <nav className="pagination" aria-label="Pagination">
      <ul>
        <li className="disabled">
          <span aria-disabled="true">
            {prevLabel}
          </span>
        </li>
        <li>
          {text}
          <span>
            {' '}
            <a href="#" aria-label="Page 1">
              1
            </a>
          </span>
          {text2}
          <span>
            {' '}
            <a href="#" aria-label="Page 123">
              123
            </a>
          </span>
        </li>
        <li>
          <a href="#" aria-label={nextAriaLabel}>
            {nextLabel}
          </a>
        </li>
      </ul>
    </nav>
  );
}

Pagination.propTypes = {
  /** Decorative text displayed before the first page number. */
  text: PropTypes.string,
  /** Decorative text displayed before the last page number. */
  text2: PropTypes.string,
  /** UI label overrides. */
  labels: PropTypes.shape({
    prevLabel: PropTypes.string,
    nextLabel: PropTypes.string,
    nextAriaLabel: PropTypes.string,
  }),
};
