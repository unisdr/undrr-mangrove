import React from 'react';
import PropTypes from 'prop-types';
// import './Container.scss'; // Import the SASS file

/** Wraps content in a centered, max-width container. */
export function Container({ children, className }) {
  return <div className={`mg-container ${className || ''}`}>{children}</div>;
}

Container.propTypes = {
  /** Content to render inside the container. */
  children: PropTypes.node,
  /** Additional CSS class name appended to the container element. */
  className: PropTypes.string,
};
