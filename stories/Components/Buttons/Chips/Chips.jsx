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
export function Chips({
  label,
  Type = 'Default',
  href = '#',
  onDismiss,
  removeLabel,
  className,
  ...props
}) {
  const classes = ['mg-chip', Type === 'With X' && 'mg-chip__cross', className]
    .filter(Boolean)
    .join(' ');

  if (Type === 'With X') {
    return (
      <button
        {...props}
        type="button"
        className={classes}
        aria-label={removeLabel || `Remove filter: ${label}`}
        onClick={onDismiss}
      >
        {label}
      </button>
    );
  }

  return (
    <a {...props} className={classes} href={href}>
      {label}
    </a>
  );
}

Chips.propTypes = {
  /** Visible text for the chip. */
  label: PropTypes.string.isRequired,
  /** Variant: 'Default' renders a link; 'With X' renders a dismiss button. */
  Type: PropTypes.oneOf(['Default', 'With X']),
  /** Destination for the default link variant. */
  href: PropTypes.string,
  /** Called when the dismissible variant is activated. */
  onDismiss: PropTypes.func,
  /** Localised accessible name for the dismissible variant. */
  removeLabel: PropTypes.string,
  /** Additional classes to compose with the Mangrove chip classes. */
  className: PropTypes.string,
};
