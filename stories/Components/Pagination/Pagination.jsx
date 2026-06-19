import React from 'react';
import PropTypes from 'prop-types';
// import './pagination.scss';

/**
 * Pagination component that renders previous/next navigation links
 * with page number indicators.
 *
 * @param {object} props - Component props.
 * @param {string} [props.text] - Decorative text displayed before the first page number.
 * @param {string} [props.text2] - Decorative text displayed before the last page number.
 */
export function Pagination({ text, text2, prevLabel = 'Previous', nextLabel = 'Next', nextAriaLabel = 'Next page' }) {
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
  /** Visible label for the previous page link. */
  prevLabel: PropTypes.string,
  /** Visible label for the next page link. */
  nextLabel: PropTypes.string,
  /** Accessible label for the next page anchor. */
  nextAriaLabel: PropTypes.string,
};
