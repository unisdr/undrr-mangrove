import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const CopyButton = ({
  textToCopy,
  className,
  ariaLabel = 'Copy to clipboard',
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <button
      type="button"
      className={classNames('mg-copy-button', className)}
      onClick={handleCopy}
      aria-label={ariaLabel}
    >
      <i className="mg-icon mg-icon-copy" aria-hidden="true"></i>

      <span
        className={classNames('mg-copy-button__feedback', {
          'mg-copy-button__feedback--visible': copied,
        })}
      >
        Copied!
      </span>

      <span className="mg-visually-hidden" aria-live="polite">
        {copied ? 'Copied to clipboard.' : ''}
      </span>
    </button>
  );
};

CopyButton.propTypes = {
  textToCopy: PropTypes.string.isRequired,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};
