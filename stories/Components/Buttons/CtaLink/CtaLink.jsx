import React from 'react';
import PropTypes from 'prop-types';
// import './cta-link.scss';

const cls = (...classes) =>
  classes.filter(Boolean).length > 0 ? classes.filter(Boolean).join(' ') : null;

/**
 * Call-to-action link rendered as an anchor or inline span depending on the
 * button option. Supports arrow and space visual variants.
 *
 * @param {Object} props
 * @param {string} props.label          Visible link text.
 * @param {string} [props.Type]         Visual variant; set to 'Space' for spaced style.
 * @param {string} [props.button_option] Render mode: 'span' or 'inline' renders a span, otherwise an anchor.
 */
export function Ctalink({ label, Type, button_option }) {
  let type = 'arrow';
  if (Type == 'Space') {
    type = 'space';
  }
  let button_type = button_option ? button_option.toLowerCase() : '';

  return (
    <>
      {`${button_type}` === 'span' || `${button_type}` === 'inline' ? (
        <span className={cls('cta__link', `cta--${type}`)}>
          {label} <i />
        </span>
      ) : (
        <a className={cls('cta__link', `cta--${type}`)} href="#">
          {label} <i />
        </a>
      )}
    </>
  );
}

Ctalink.propTypes = {
  /** Visible link text. */
  label: PropTypes.string.isRequired,
  /** Visual variant; set to 'Space' for spaced style. */
  Type: PropTypes.string,
  /** Render mode: 'span' or 'inline' renders a span element instead of an anchor. */
  button_option: PropTypes.string,
};
