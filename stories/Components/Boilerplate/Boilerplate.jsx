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
 * @param {string} [props.href]       Optional link URL for the title
 * @param {React.ReactNode} props.children  Body content
 * @param {'primary'|'secondary'} [props.variant='primary']  Visual variant
 * @returns {JSX.Element} Rendered Boilerplate component
 */
export function Boilerplate({ title, href, children, variant = 'primary', ...props }) {
  return (
    <div className={`mg-boilerplate mg-boilerplate--${variant}`} {...props}>
      <h2 className="mg-boilerplate__title">
        {href ? <a href={href}>{title}</a> : title}
      </h2>
      <div className="mg-boilerplate__content">{children}</div>
    </div>
  );
}

Boilerplate.propTypes = {
  title: PropTypes.string.isRequired,
  href: PropTypes.string,
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary']),
};

export default Boilerplate;
