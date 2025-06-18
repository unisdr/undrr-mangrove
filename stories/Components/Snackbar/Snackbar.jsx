import React, { useEffect, useRef } from 'react';
import { ErrorIcon, WarningIcon, InfoIcon, SuccessIcon } from './SnackbarIcons';

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
const Snackbar = ({
  severity,
  opened,
  message,
  onClose,
  openedMiliseconds,
}) => {
  let icon;
  const closeButtonRef = useRef(null);

  // close the snackbar after the openedMiliseconds if it is set
  useEffect(() => {
    if (opened && openedMiliseconds) {
      const timerId = setTimeout(() => {
        onClose();
      }, openedMiliseconds);

      // Clear the timer if the component unmounts or if opened or openedMiliseconds change before the timeout expires
      return () => {
        clearTimeout(timerId);
      };
    }
  }, [opened, openedMiliseconds, onClose]);

  // Add keyboard support - close on escape key
  useEffect(() => {
    const handleKeyDown = event => {
      if (opened && event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the close button when snackbar opens
    if (opened && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [opened, onClose]);

  switch (severity) {
    case 'error':
      icon = <ErrorIcon />;
      break;
    case 'warning':
      icon = <WarningIcon />;
      break;
    case 'info':
      icon = <InfoIcon />;
      break;
    case 'success':
      icon = <SuccessIcon />;
      break;
    default:
      icon = <></>;
  }

  // Prepare screen reader announcement
  const getAriaLabel = () => {
    if (!severity) return '';
    return `${severity} notification: `;
  };

  return (
    <aside
      className={`mg-snackbar-wrapper ${
        opened ? 'mg-snackbar-wrapper__open' : ''
      }`}
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className={`mg-snackbar mg-snackbar__${severity}`} role="alert">
        <div className="mg-snackbar__content">
          {severity && (
            <span className={`mg-snackbar__icon`} aria-hidden="true">
              {icon}
            </span>
          )}
          <span className={`mg-snackbar__message`}>
            <span className="mg-u-sr-only">{getAriaLabel()}</span>
            {message}
          </span>
          <button
            ref={closeButtonRef}
            className="mg-button"
            onClick={() => onClose()}
            aria-label="Close notification"
          >
            Close
          </button>
        </div>
      </div>
    </aside>
  );
};

export const ShowOffSnackbar = ({
  severity = 'info',
  message = 'Showing off an example of the snackbar',
  openedMiliseconds,
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
    <div style={{ position: 'relative', height: '80px', marginBottom: '20px' }}>
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
        <div className={`mg-snackbar mg-snackbar__${severity}`} role="alert">
          <div className="mg-snackbar__content">
            {severity && (
              <span className={`mg-snackbar__icon`} aria-hidden="true">
                {severity === 'error' && <ErrorIcon />}
                {severity === 'warning' && <WarningIcon />}
                {severity === 'info' && <InfoIcon />}
                {severity === 'success' && <SuccessIcon />}
              </span>
            )}
            <span className={`mg-snackbar__message`}>
              <span className="mg-u-sr-only">{`${severity} notification: `}</span>
              {message}
            </span>
            <button className="mg-button" aria-label="Close notification">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Snackbar;
