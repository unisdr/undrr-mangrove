import React, { useEffect, useState } from "react";
import { ErrorIcon, WarningIcon, InfoIcon, SuccessIcon } from "./SnackbarIcons";

/**
 * snackbar component, should be used with react state to control the opened prop and the onClose callback
 *
 * @param {String} severity severity of the snackbar, can be error, warning, info, success, unspecified
 * @param {Boolean} opened boolean that determines if the snackbar is opened or not
 * @param {String} message tet that is displayed in the snackbar
 * @param {Function} onClose on close callback that is triggered when the close button is clicked (or when the snackbar is closed)
 * @param {Number} openedMiliseconds time after opening before the snackbar automaticaly dissapears (in miliseconds)
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
  switch (severity) {
    case "error":
      icon = <ErrorIcon />;
      break;
    case "warning":
      icon = <WarningIcon />;
      break;
    case "info":
      icon = <InfoIcon />;
      break;
    case "success":
      icon = <SuccessIcon />;
      break;
    default:
      icon = <></>;
  }

  return (
    <aside
      className={`mg-snackbar-wrapper ${
        opened ? "mg-snackbar-wrapper__open" : ""
      }`}
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className={`mg-snackbar mg-snackbar__${severity}`}>
        <div className="mg-snackbar__content">
          {severity && (
            <span className={`mg-snackbar__icon`} aria-hidden="true">
              {icon}
            </span>
          )}
          <span className={`mg-snackbar__message`}>{message}</span>
          <button className="mg-button" onClick={() => onClose()}>
            Close
          </button>
        </div>
      </div>
    </aside>
  );
};

export const ShowOffSnackbar = ({
  severity = "info",
  message = "Showing off an example of the snackbar",
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
          opnnedMiliseconds={openedMiliseconds}
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

export default Snackbar;
