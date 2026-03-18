import React from 'react';
import PropTypes from 'prop-types';
// import './textcta.scss';
// import '../../../assets/scss/_grid.scss';
import { Heading } from '../../Atom/Typography/Heading/Heading';
import { P } from '../../Atom/BaseTypography/Paragraph/Paragraph';
import { CtaButton } from '../Buttons/CtaButton/CtaButton';

/**
 * Text call-to-action block displaying a heading, description paragraph, and a
 * CTA button. Typically used for partnership or promotional sections.
 *
 * @param {Object} props
 * @param {string} props.headerText       Heading text displayed as an h2.
 * @param {string} props.descriptionText  Body copy rendered below the heading.
 * @param {string} props.label            Label for the call-to-action button.
 */
export function TextCta({ headerText, descriptionText, label }) {
  return (
    <div
      className="grid-x trusted-partnerships__container"
      data-viewport="true"
    >
      <div className="cell medium-7 small-12 medium-offset-1 trusted-partnerships--header">
        <Heading type="2">{headerText}</Heading>
        <P label={descriptionText} />
        <CtaButton label={label} />
      </div>
    </div>
  );
}

TextCta.propTypes = {
  /** Heading text displayed as an h2. */
  headerText: PropTypes.string.isRequired,
  /** Body copy rendered below the heading. */
  descriptionText: PropTypes.string.isRequired,
  /** Label for the call-to-action button. */
  label: PropTypes.string.isRequired,
};
