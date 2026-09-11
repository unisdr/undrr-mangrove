import React from 'react';
import PropTypes from 'prop-types';
// import './cta-button.scss';

/**
 * Call-to-action button rendered as a styled anchor link.
 *
 * @param {Object} props
 * @param {string} props.label                 Button text
 * @param {'Primary'|'Secondary'} [props.Type] Visual emphasis variant
 * @param {boolean} [props.Outline] Whether to use the transparent treatment
 * @param {'Default'|'Disabled'} [props.State] Enabled or disabled state
 */
export function CtaButton({
  label,
  Type = 'Primary',
  Variant = 'Default',
  Outline = false,
  State = 'Default',
  href = '#',
  onClick,
  className,
  ...props
}) {
  const type = Type === 'Secondary' ? 'secondary' : 'primary';
  const isDisabled = State === 'Disabled';
  const computedClassName = [
    'mg-button',
    Variant === 'CTA' && 'mg-button-cta',
    `mg-button-${type}`,
    Outline && 'mg-button-outline',
    isDisabled && 'disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <a
      className={computedClassName}
      {...props}
      {...(isDisabled
        ? { 'aria-disabled': 'true', tabIndex: -1 }
        : { href, onClick })}
    >
      {label}
    </a>
  );
}

CtaButton.propTypes = {
  /** Button text */
  label: PropTypes.string.isRequired,
  /** Visual emphasis variant */
  Type: PropTypes.oneOf(['Primary', 'Secondary']),
  /** Treatment variant: conventional button or editorial CTA link. */
  Variant: PropTypes.oneOf(['Default', 'CTA']),
  /** Use a transparent outlined treatment */
  Outline: PropTypes.bool,
  /** Enabled or disabled state */
  State: PropTypes.oneOf(['Default', 'Disabled']),
  /** Link destination. Omitted from disabled controls. */
  href: PropTypes.string,
  /** Link activation handler. Omitted from disabled controls. */
  onClick: PropTypes.func,
  /** Additional classes to compose with the Mangrove button classes. */
  className: PropTypes.string,
};
