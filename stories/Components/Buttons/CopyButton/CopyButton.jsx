import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { DEFAULT_COPY_BUTTON_LABELS } from './_labels';

export { DEFAULT_COPY_BUTTON_LABELS };

const EMPTY_LABELS = {};

const VARIANT_CLASSES = {
  outline: 'mg-button-primary mg-button-outline',
  primary: 'mg-button-primary',
  secondary: 'mg-button-secondary mg-button-outline',
};

export const CopyButton = ({
  textToCopy = '',
  className,
  labels = EMPTY_LABELS,
  ariaLabel: customAriaLabel,
  copiedLabel: customCopiedLabel,
  tooltipLabel: customTooltipLabel,
  variant = 'outline',
  size,
}) => {
  const ariaLabel =
    customAriaLabel || labels.ariaLabel || DEFAULT_COPY_BUTTON_LABELS.ariaLabel;
  const copiedLabel =
    customCopiedLabel ||
    labels.copiedLabel ||
    DEFAULT_COPY_BUTTON_LABELS.copiedLabel;
  const tooltipLabel =
    customTooltipLabel ||
    labels.tooltipLabel ||
    DEFAULT_COPY_BUTTON_LABELS.tooltipLabel;

  // idle | copied | failed
  const [status, setStatus] = useState('idle');
  const copied = status === 'copied';
  const failed = status === 'failed';
  const failedLabel =
    labels.failedLabel || DEFAULT_COPY_BUTTON_LABELS.failedLabel;
  const failedTooltipLabel =
    labels.failedTooltipLabel || DEFAULT_COPY_BUTTON_LABELS.failedTooltipLabel;
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showStatus = (next, duration) => {
    setStatus(next);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setStatus('idle');
    }, duration);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      showStatus('copied', 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
      // Longer, so the reader has time to act on the manual-copy hint.
      showStatus('failed', 5000);
    }
  };

  return (
    <button
      type="button"
      className={classNames(
        'mg-button',
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.outline,
        'mg-button--icon',
        {
          'mg-button--small': size === 'small',
          'mg-button--large': size === 'large',
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
          'mg-copy-button__feedback--visible': copied || failed,
          'mg-copy-button__feedback--error': failed,
        })}
        aria-hidden="true"
      >
        {failed ? failedTooltipLabel : tooltipLabel}
      </span>

      <span className="mg-u-sr-only" aria-live="polite">
        {copied ? copiedLabel : ''}
        {failed ? failedLabel : ''}
      </span>
    </button>
  );
};

CopyButton.propTypes = {
  textToCopy: PropTypes.string,
  className: PropTypes.string,
  labels: PropTypes.shape({
    ariaLabel: PropTypes.string,
    copiedLabel: PropTypes.string,
    tooltipLabel: PropTypes.string,
    failedLabel: PropTypes.string,
    failedTooltipLabel: PropTypes.string,
  }),
  ariaLabel: PropTypes.string,
  copiedLabel: PropTypes.string,
  tooltipLabel: PropTypes.string,
  variant: PropTypes.oneOf(['outline', 'primary', 'secondary']),
  size: PropTypes.oneOf(['small', 'large']),
};

export default CopyButton;
