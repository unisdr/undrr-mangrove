import React from 'react';
import PropTypes from 'prop-types';
import { Blockquote } from '../../Atom/BaseTypography/Blockquote/Blockquote';
// import './blockquotecomp.scss';

/**
 * Renders a styled blockquote with optional color variant wrapping.
 *
 * @param {Object} props
 * @param {string} props.blockquoteText  The quoted text content
 * @param {string} [props.citeText]      Attribution or citation text
 * @param {string} [props.Colors]        Color variant class name ('default' renders without a wrapper)
 */
export function BlockquoteComponent({ blockquoteText, citeText, Colors }) {
  return (
    <>
      {Colors == 'default' ? (
        <Blockquote text={blockquoteText} citeText={citeText}>
          {' '}
        </Blockquote>
      ) : (
        <div className={['blockquote', `${Colors}`].join(' ')}>
          <Blockquote text={blockquoteText} citeText={citeText}>
            {' '}
          </Blockquote>
        </div>
      )}
    </>
  );
}

BlockquoteComponent.propTypes = {
  /** The quoted text content */
  blockquoteText: PropTypes.string.isRequired,
  /** Attribution or citation text */
  citeText: PropTypes.string,
  /** Color variant class name ('default' renders without a wrapper) */
  Colors: PropTypes.string,
};
