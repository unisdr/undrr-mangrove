/**
 * @file Boilerplate.jsx
 * @description Example component to clone when creating new components.
 *
 * @module Boilerplate
 */

import React from 'react';
import PropTypes from 'prop-types';
// import './boilerplate.scss'; // Import in components.scss instead

/**
 * Boilerplate component.
 *
 * Clone this directory when creating a new component. Replace the name,
 * props, and markup with your own.
 *
 * @param {Object} props
 * @param {string} props.title        Heading text
 * @param {React.ReactNode} props.children  Body content
 * @param {'primary'|'secondary'} [props.variant='primary']  Visual variant
 */
export function Boilerplate({ title, children, variant = 'primary' }) {
  return (
    <div className={`mg-boilerplate mg-boilerplate--${variant}`}>
      <h2 className="mg-boilerplate__title">{title}</h2>
      <div className="mg-boilerplate__content">{children}</div>
    </div>
  );
}

Boilerplate.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary']),
};

export default Boilerplate;
