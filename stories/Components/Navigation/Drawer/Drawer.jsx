import React, { useEffect, useId, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import DOMPurify from 'dompurify';
import { DEFAULT_DRAWER_LABELS } from './_labels';

export { DEFAULT_DRAWER_LABELS };

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const sanitize = html => ({ __html: DOMPurify.sanitize(html) });

export const Drawer = ({
  isOpen = false,
  onClose,
  position = 'start',
  title,
  children,
  footer,
  bodyHtml,
  footerHtml,
  labels = {},
  className,
  backdrop = true,
  isFloatingPanel = false,
  ...props
}) => {
  const { closeLabel } = { ...DEFAULT_DRAWER_LABELS, ...labels };
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const returnFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  const isModal = backdrop && !isFloatingPanel;
  const baseClass = isFloatingPanel ? 'mg-floating-panel' : 'mg-drawer';

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape' && isOpen && onCloseRef.current) {
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // A closed drawer is off-screen but still in the DOM: inert keeps its
  // controls out of the tab order and away from assistive technology.
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    drawer.inert = !isOpen;

    if (isOpen) {
      returnFocusRef.current = document.activeElement;
      (closeButtonRef.current || drawer).focus();
      return;
    }

    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (target && target.isConnected && typeof target.focus === 'function') {
      if (
        drawer.contains(document.activeElement) ||
        !document.activeElement ||
        document.activeElement === document.body
      ) {
        target.focus();
      }
    }
  }, [isOpen]);

  // Keep Tab inside a modal drawer while it is open.
  const handleTrapKeyDown = event => {
    if (!isModal || !isOpen || event.key !== 'Tab') return;
    const focusable = Array.from(drawerRef.current.querySelectorAll(FOCUSABLE));
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const classes = classNames(
    baseClass,
    {
      'is-open': isOpen,
      [`${baseClass}--${position}`]: !isFloatingPanel && position,
    },
    className
  );

  // Strings always render as text. Server-rendered markup is only accepted
  // through bodyHtml / footerHtml, and is sanitised first.
  let body = children;
  if (bodyHtml) body = <div dangerouslySetInnerHTML={sanitize(bodyHtml)} />;
  let footerContent = footer;
  if (footerHtml) {
    footerContent = <div dangerouslySetInnerHTML={sanitize(footerHtml)} />;
  }

  return (
    <>
      {isModal && isOpen && (
        <div
          className="mg-drawer__backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        ref={drawerRef}
        className={classes}
        aria-hidden={isOpen ? undefined : 'true'}
        tabIndex="-1"
        role="dialog"
        aria-modal={isModal && isOpen ? 'true' : undefined}
        aria-labelledby={title ? titleId : undefined}
        onKeyDown={handleTrapKeyDown}
        {...props}
      >
        <div className={`${baseClass}__header`}>
          {title && (
            <h2 id={titleId} className={`${baseClass}__title`}>
              {title}
            </h2>
          )}
          <button
            ref={closeButtonRef}
            type="button"
            className={`mg-icon-button mg-icon-button--small ${baseClass}__close`}
            onClick={onClose}
            aria-label={closeLabel}
          >
            <span className="mg-icon mg-icon-close" aria-hidden="true" />
          </button>
        </div>
        <div className={`${baseClass}__body`}>{body}</div>
        {footerContent && (
          <div className={`${baseClass}__footer`}>{footerContent}</div>
        )}
      </div>
    </>
  );
};

Drawer.propTypes = {
  /** Whether the drawer is open */
  isOpen: PropTypes.bool,
  /** Called by the close button, the backdrop and the Escape key */
  onClose: PropTypes.func,
  /** Edge the drawer slides from; start and end follow text direction */
  position: PropTypes.oneOf(['start', 'end', 'bottom']),
  /** Heading text; also names the dialog */
  title: PropTypes.node,
  /** Body content. Strings render as plain text. */
  children: PropTypes.node,
  /** Footer content. Strings render as plain text. */
  footer: PropTypes.node,
  /** Server-rendered body markup (sanitised). Used by hydration. */
  bodyHtml: PropTypes.string,
  /** Server-rendered footer markup (sanitised). Used by hydration. */
  footerHtml: PropTypes.string,
  /** Translated UI strings */
  labels: PropTypes.shape({ closeLabel: PropTypes.string }),
  /** Additional CSS class names */
  className: PropTypes.string,
  /** Show a backdrop; a drawer with a backdrop is modal */
  backdrop: PropTypes.bool,
  /** Render as a non-modal floating panel instead of an edge drawer */
  isFloatingPanel: PropTypes.bool,
};

export default Drawer;
