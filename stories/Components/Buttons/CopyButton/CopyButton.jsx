import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const CopyButton = ({
  textToCopy,
  className,
  ariaLabel = 'Copy to clipboard',
  copiedLabel = 'Copied to clipboard.',
  tooltipLabel = 'Copied!',
  variant = 'outline',
  size,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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

  const variantClasses = {
    outline: 'mg-button-primary mg-button-outline',
    primary: 'mg-button-primary',
    secondary: 'mg-button-secondary mg-button-outline',
  };

  return (
    <button
      type="button"
      className={classNames(
        'mg-button',
        variantClasses[variant] || variantClasses.outline,
        'mg-button--icon',
        {
          [`mg-button--icon--${size}`]: size,
          'mg-copy-button--copied': copied,
        },
        'mg-copy-button',
        className
      )}
      onClick={handleCopy}
      aria-label={ariaLabel}
    >
      <span
        className="mg-icon mg-icon-copy mg-button__icon"
        aria-hidden="true"
      />

      {/*
        Micro-feedback tooltip: Scoped directly to CopyButton because icon-only
        copy actions need transient floating feedback without disturbing the
        button layout (unlike ShareButtons which swaps text in-place). If Mangrove
        later introduces a shared Tooltip/Popover primitive with collision
        detection and directional placement across multiple components, this
        micro-feedback can be refactored to consume that shared component.
      */}
      <span
        className={classNames('mg-copy-button__feedback', {
          'mg-copy-button__feedback--visible': copied,
        })}
        role="status"
        aria-hidden="true"
      >
        {tooltipLabel}
      </span>

      <span className="mg-u-sr-only" aria-live="polite">
        {copied ? copiedLabel : ''}
      </span>
    </button>
  );
};

CopyButton.propTypes = {
  textToCopy: PropTypes.string.isRequired,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
  copiedLabel: PropTypes.string,
  tooltipLabel: PropTypes.string,
  variant: PropTypes.oneOf(['outline', 'primary', 'secondary']),
  size: PropTypes.oneOf(['small', 'large']),
};
