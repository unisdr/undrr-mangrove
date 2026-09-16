import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Notice } from '../Notice/Notice';

/**
 * snackbar component, should be used with react state to control the opened prop and the onClose callback
 *
 * @param {String} severity severity of the snackbar, can be error, warning, info, success, unspecified
 * @param {Boolean} opened boolean that determines if the snackbar is opened or not
 * @param {String} message text that is displayed in the snackbar
 * @param {Function} onClose on close callback that is triggered when the close button is clicked (or when the snackbar is closed)
 * @param {Number} openedMiliseconds time after opening before the snackbar automatically disappears (in milliseconds)
 * @returns Component that renders a snackbar based on opened, severity, message and onClose props
 */
export const DEFAULT_SNACKBAR_LABELS = {
  closeLabel: 'Close',
  closeAriaLabel: 'Close notification',
};

const SEVERITY_TO_VARIANT = {
  error: 'negative',
  warning: 'warning',
  info: 'info',
  success: 'positive',
};

const SnackbarBody = ({
  severity,
  message,
  onClose,
  closeLabel,
  closeAriaLabel,
  closeButtonRef,
  role = 'alert',
}) => (
  <Notice
    role={role}
    variant={SEVERITY_TO_VARIANT[severity] || 'info'}
    icon={Boolean(SEVERITY_TO_VARIANT[severity])}
    className={`mg-snackbar mg-snackbar__${severity}`}
    headerContent={
      <>
        <span className="mg-snackbar__message">
          {severity && (
            <span className="mg-u-sr-only">{`${severity} notification: `}</span>
          )}
          {message}
        </span>
        <button
          type="button"
          ref={closeButtonRef}
          className="mg-button mg-button-secondary mg-button-outline"
          onClick={onClose}
          aria-label={closeAriaLabel}
        >
          {closeLabel}
        </button>
      </>
    }
  />
);

const Snackbar = ({
  severity,
  opened,
  message,
  onClose,
  openedMiliseconds,
  labels = {},
}) => {
  const { closeLabel, closeAriaLabel } = {
    ...DEFAULT_SNACKBAR_LABELS,
    ...labels,
  };
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const prevOpenedRef = useRef(false);
  onCloseRef.current = onClose;

  // close the snackbar after the openedMiliseconds if it is set
  useEffect(() => {
    if (opened && openedMiliseconds) {
      const timerId = setTimeout(() => {
        onCloseRef.current();
      }, openedMiliseconds);

      return () => {
        clearTimeout(timerId);
      };
    }
  }, [opened, openedMiliseconds]);

  // Add keyboard support and focus management
  useEffect(() => {
    const handleKeyDown = event => {
      if (opened && event.key === 'Escape') {
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the close button only when transitioning to open
    if (opened && !prevOpenedRef.current && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
    prevOpenedRef.current = opened;

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [opened]);

  // The body is only mounted while open: role="alert" announces on insertion,
  // and a closed toast leaves no off-screen close button in the tab order.
  return (
    <aside
      className={`mg-snackbar-wrapper ${
        opened ? 'mg-snackbar-wrapper__open' : ''
      }`}
    >
      {opened && (
        <SnackbarBody
          severity={severity}
          message={message}
          onClose={() => onClose()}
          closeLabel={closeLabel}
          closeAriaLabel={closeAriaLabel}
          closeButtonRef={closeButtonRef}
        />
      )}
    </aside>
  );
};

export const ShowOffSnackbar = ({
  severity = 'info',
  message = 'Showing off an example of the snackbar',
  openedMiliseconds,
  labels = {},
}) => {
  const [SnackbarOpen, setSnackbarOpen] = React.useState(false);
  return (
    <div>
      <button
        className="mg-button mg-button-primary"
        onClick={() => {
          setSnackbarOpen(!SnackbarOpen);
        }}
      >
        Show/hide
      </button>
      {
        <Snackbar
          openedMiliseconds={openedMiliseconds}
          severity={severity}
          opened={SnackbarOpen}
          message={message}
          labels={labels}
          onClose={() => {
            setSnackbarOpen(false);
          }}
        ></Snackbar>
      }
    </div>
  );
};

// Static display component for documentation purposes only
export const SnackbarPreview = ({ severity, message }) => {
  return (
    <div style={{ position: 'relative', marginBottom: '20px' }}>
      <div
        className="mg-snackbar-wrapper mg-snackbar-wrapper__open"
        style={{
          position: 'relative',
          transform: 'none',
          left: '0',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        <SnackbarBody
          severity={severity}
          message={message}
          onClose={() => {}}
          closeLabel={DEFAULT_SNACKBAR_LABELS.closeLabel}
          closeAriaLabel={DEFAULT_SNACKBAR_LABELS.closeAriaLabel}
          role={null}
        />
      </div>
    </div>
  );
};

Snackbar.propTypes = {
  /** Severity level controlling icon and color: error, warning, info, or success. */
  severity: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  /** Whether the snackbar is currently visible. */
  opened: PropTypes.bool.isRequired,
  /** Text displayed in the snackbar. */
  message: PropTypes.string.isRequired,
  /** Callback fired when the snackbar closes (dismiss button or auto-close). */
  onClose: PropTypes.func.isRequired,
  /** Auto-dismiss delay in milliseconds. Omit to keep the snackbar open until dismissed. */
  openedMiliseconds: PropTypes.number,
  /** Translated UI labels. Keys: closeLabel, closeAriaLabel. */
  labels: PropTypes.shape({
    closeLabel: PropTypes.string,
    closeAriaLabel: PropTypes.string,
  }),
};

export default Snackbar;
