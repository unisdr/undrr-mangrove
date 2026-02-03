import React from 'react';
import PropTypes from 'prop-types';

/**
 * Icon Component
 *
 * Renders a Mangrove icon using CSS classes. Supports multiple formats:
 *
 * 1. Name only: <Icon name="globe" /> → "mg-icon mg-globe"
 * 2. Full class string: <Icon name="mg-icon fa-globe" /> → passed through
 * 3. Legacy fa- format: <Icon name="fa-globe" /> → "mg-icon fa-globe"
 *
 * The component normalizes all formats to work with Mangrove's icon system.
 *
 * @example
 * // Preferred - just the icon name
 * <Icon name="globe" />
 *
 * // Legacy - FontAwesome style (still supported)
 * <Icon name="fa-globe" />
 *
 * // Full class string (passed through)
 * <Icon name="mg-icon fa-globe" />
 */
export function Icon({ name, className = '', size, ...props }) {
  if (!name) return null;

  let iconClasses;

  if (name.includes('mg-icon')) {
    // Full class string passed - use as-is
    iconClasses = name;
  } else if (name.startsWith('fa-')) {
    // Legacy FontAwesome format: fa-globe → mg-icon fa-globe
    iconClasses = `mg-icon ${name}`;
  } else if (name.startsWith('mg-')) {
    // New Mangrove format: mg-globe → mg-icon mg-globe
    iconClasses = `mg-icon ${name}`;
  } else {
    // Just the name: globe → mg-icon mg-globe (with fa- fallback via CSS)
    iconClasses = `mg-icon mg-${name}`;
  }

  // Add size modifier if provided
  if (size) {
    iconClasses += ` mg-icon--${size}`;
  }

  // Add any additional classes
  if (className) {
    iconClasses += ` ${className}`;
  }

  return <span className={iconClasses} aria-hidden="true" {...props} />;
}

Icon.propTypes = {
  /** Icon name - can be just the name (e.g., "globe"), fa- prefixed (e.g., "fa-globe"), or full class string */
  name: PropTypes.string.isRequired,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Size variant: "sm", "lg", "xl" */
  size: PropTypes.oneOf(['sm', 'lg', 'xl']),
};

export default Icon;
