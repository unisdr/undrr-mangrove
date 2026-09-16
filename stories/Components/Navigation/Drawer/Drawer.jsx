import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Drawer = ({
  isOpen,
  onClose,
  position = 'start',
  title,
  children,
  footer,
  className,
  backdrop = true,
  isFloatingPanel = false,
  ...props
}) => {
  const drawerRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const baseClass = isFloatingPanel ? 'mg-floating-panel' : 'mg-drawer';

  const classes = classNames(
    baseClass,
    {
      'is-open': isOpen,
      [`${baseClass}--${position}`]: !isFloatingPanel && position,
    },
    className
  );

  return (
    <>
      {backdrop && !isFloatingPanel && isOpen && (
        <div
          className="mg-drawer__backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        ref={drawerRef}
        className={classes}
        aria-hidden={!isOpen}
        tabIndex="-1"
        role={isFloatingPanel ? 'dialog' : 'complementary'}
        {...props}
      >
        <div className={`${baseClass}__header`}>
          {title && <h2 className={`${baseClass}__title`}>{title}</h2>}
          <button
            type="button"
            className={`${baseClass}__close`}
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className={`${baseClass}__body`}>{children}</div>
        {footer && <div className={`${baseClass}__footer`}>{footer}</div>}
      </div>
    </>
  );
};

Drawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.oneOf(['start', 'end', 'bottom']),
  title: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  className: PropTypes.string,
  backdrop: PropTypes.bool,
  isFloatingPanel: PropTypes.bool,
};
