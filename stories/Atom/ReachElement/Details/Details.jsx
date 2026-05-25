import React from 'react';
import PropTypes from 'prop-types';
// import './details.scss';

export const DetailsTag = ({ summary, details }) => (
  <details className="mg-details">
    <summary>{summary}</summary>
    <p>{details}</p>
  </details>
);

DetailsTag.propTypes = {
  summary: PropTypes.string.isRequired,
  details: PropTypes.string.isRequired,
};
