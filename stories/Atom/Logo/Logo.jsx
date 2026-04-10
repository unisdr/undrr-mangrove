import React from 'react';
import PropTypes from 'prop-types';

/** Renders a logo image with alt text. */
export const Logo = ({ src, alt }) => <img src={src} alt={alt} />;

Logo.propTypes = {
  /** URL of the logo image. */
  src: PropTypes.string.isRequired,
  /** Alternative text describing the logo for screen readers. */
  alt: PropTypes.string.isRequired,
};
