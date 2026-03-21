import React from 'react';
import PropTypes from 'prop-types';
// import './cta-button.scss';

/**
 * Call-to-action button rendered as a styled anchor link.
 *
 * @param {Object} props
 * @param {string} props.label                     Button text
 * @param {'Primary'|'Secondary'} [props.Type]     Visual style variant
 * @param {'Default'|'Disabled'} [props.State]     Enabled or disabled state
 * @param {'Arrow'|'No Arrow'} [props.For_Primary] Arrow variant for primary buttons
 */
export function CtaButton({
  label,
  Type = 'Primary',
  State = 'Default',
  For_Primary = 'Arrow',
  ...props
}) {
  const type = Type === 'Secondary' ? 'secondary' : 'primary';
  const isDisabled = State === 'Disabled';
  const for_primary = For_Primary === 'No Arrow' ? 'without-arrow' : 'arrow';
  const cls = (...classes) =>
    classes.filter(Boolean).length > 0
      ? classes.filter(Boolean).join(' ')
      : null;
  return (
    <a
      {...(Type === 'Secondary'
        ? { className: cls('mg-button', `mg-button-${type}`, isDisabled && 'disabled') }
        : {
            className: cls(
              'mg-button',
              `mg-button-${type}`,
              `mg-button-${for_primary}`,
              isDisabled && 'disabled'
            ),
          })}
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
  /** Arrow variant for primary buttons */
  For_Primary: PropTypes.oneOf(['Arrow', 'No Arrow']),
};
