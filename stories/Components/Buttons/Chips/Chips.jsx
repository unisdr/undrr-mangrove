import React from 'react';
import PropTypes from 'prop-types';
// import './chips.scss';

/**
 * Small interactive tag-like element for filters and selections.
 *
 * The default variant links to a topic; the dismiss ("With X") variant
 * renders a button that removes a filter.
 *
 * @param {Object} props
 * @param {string} props.label  Visible text for the chip
 * @param {string} [props.Type='Default']  Variant: 'Default' (link) or 'With X' (dismiss button)
 */
export function Chips({ label, Type = 'Default' }) {
  if (Type === 'With X') {
    return (
      <button
        type="button"
        className="chip chip__cross"
        aria-label={`Remove filter: ${label}`}
      >
        {label}
      </button>
    );
  }

  return (
    <a className="chip" href="#">
      {label}
    </a>
  );
}

Chips.propTypes = {
  /** Visible text for the chip. */
  label: PropTypes.string.isRequired,
  /** Variant: 'Default' renders a link; 'With X' renders a dismiss button. */
  Type: PropTypes.oneOf(['Default', 'With X']),
};
