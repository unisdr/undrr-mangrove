import React from 'react';
import PropTypes from 'prop-types';

/**
 * Renders a decorative Mangrove SVG icon using CSS classes.
 *
 * Accepts a bare name ("globe"), a qualified name ("mg-icon-globe"),
 * a legacy Mangrove name ("mg-globe"), or a full class string
 * ("mg-icon mg-icon-globe"). FontAwesome names are no longer supported.
 *
 * @example
 * <Icon name="globe" size="lg" />
 */
export function Icon({ name, className = '', size, ...props }) {
  if (!name) return null;

  let iconClasses;

  if (name.includes(' ')) {
    // Full class string passed - use as-is (e.g., "mg-icon mg-icon-globe")
    iconClasses = name;
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
  /** Icon name ("globe", "mg-icon-globe", "mg-globe") or full Mangrove class string */
  name: PropTypes.string.isRequired,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Size variant: "sm", "lg", "xl" */
  size: PropTypes.oneOf(['sm', 'lg', 'xl']),
};

export default Icon;
