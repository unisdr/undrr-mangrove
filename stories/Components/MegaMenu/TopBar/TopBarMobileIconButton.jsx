import React from 'react';

export function TopBarMobileIconButton({ onClick, isOpen, sidebarId, labels }) {
  return (
    <button
      className="mg-mega-topbar-mobile__icon-button"
      onClick={onClick}
      aria-label={
        isOpen ? labels.closeMobileNavLabel : labels.toggleMobileNavLabel
      }
      aria-expanded={isOpen}
      aria-controls={sidebarId}
      aria-haspopup="dialog"
    >
      <span
        className={`mg-icon ${isOpen ? 'mg-icon-angle-circled-left' : 'mg-icon-menu'}`}
        aria-hidden="true"
      ></span>
    </button>
  );
}
