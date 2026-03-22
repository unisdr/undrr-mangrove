import React from 'react';
import PropTypes from 'prop-types';
// import './cta-button.scss';

/**
 * Call-to-action button rendered as a styled anchor link.
 *
 * @param {Object} props
 * @param {string} props.label                 Button text
 * @param {'Primary'|'Secondary'} [props.Type] Visual style variant
 * @param {'Default'|'Disabled'} [props.State] Enabled or disabled state
 */
export function CtaButton({
  label,
  Type = 'Primary',
  State = 'Default',
  ...props
}) {
  const type = Type === 'Secondary' ? 'secondary' : 'primary';
  const isDisabled = State === 'Disabled';
  const className = ['mg-button', `mg-button-${type}`, isDisabled && 'disabled']
    .filter(Boolean)
    .join(' ');
  return (
    <a
      className={className}
      {...(isDisabled
        ? { 'aria-disabled': 'true' }
        : { href: '#' })}
      {...props}
    >
      {label}
    </a>
  );
}

CtaButton.propTypes = {
  /** Button text */
  label: PropTypes.string.isRequired,
  /** Visual style variant */
  Type: PropTypes.oneOf(['Primary', 'Secondary']),
  /** Enabled or disabled state */
  State: PropTypes.oneOf(['Default', 'Disabled']),
};
