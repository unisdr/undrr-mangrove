import React from 'react';
import PropTypes from 'prop-types';
// import './section-header.scss';
import { Heading } from '../../Atom/Typography/Heading/Heading';

/**
 * Displays a section heading with an optional description line below it.
 *
 * @param {Object} props
 * @param {string} props.headerText      Main heading text
 * @param {string} [props.descriptionText] Supporting description displayed below the heading
 */
export function SectionHeader({ headerText, descriptionText }) {
  return (
    <div className="mg-section-header">
      <Heading type="2">{headerText}</Heading>
      <Heading type="4">{descriptionText}</Heading>
    </div>
  );
}

SectionHeader.propTypes = {
  /** Main heading text rendered as an h2. */
  headerText: PropTypes.string.isRequired,
  /** Supporting description rendered as an h4 below the heading. */
  descriptionText: PropTypes.string,
};
