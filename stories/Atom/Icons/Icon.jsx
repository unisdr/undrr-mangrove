import React from 'react';
import PropTypes from 'prop-types';

/**
 * Icon Component
 *
 * Renders a Mangrove icon using CSS classes. Supports multiple formats:
 *
 * 1. Name only: <Icon name="globe" /> → "mg-icon mg-icon-globe"
 * 2. Full class string: <Icon name="mg-icon fa-globe" /> → passed through
 * 3. Legacy fa- format: <Icon name="fa-globe" /> → "mg-icon fa-globe"
 * 4. mg-icon- prefixed: <Icon name="mg-icon-globe" /> → "mg-icon mg-icon-globe"
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

  if (name.includes(' ')) {
    // Full class string passed - use as-is (e.g., "mg-icon fa-globe")
    iconClasses = name;
  } else if (name.startsWith('fa-')) {
    // Legacy FontAwesome format: fa-globe → mg-icon fa-globe
    iconClasses = `mg-icon ${name}`;
  } else if (name.startsWith('mg-icon-')) {
    // Already qualified: mg-icon-globe → mg-icon mg-icon-globe
    iconClasses = `mg-icon ${name}`;
  } else if (name.startsWith('mg-')) {
    // Backward compat: mg-globe → mg-icon mg-icon-globe
    iconClasses = `mg-icon mg-icon-${name.slice(3)}`;
  } else {
    // Just the name: globe → mg-icon mg-icon-globe
    iconClasses = `mg-icon mg-icon-${name}`;
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
