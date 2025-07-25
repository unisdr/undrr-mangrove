import React from 'react';

export function TopBarMobileIconButton({ onClick, isOpen }) {
  return (
    <button
      className="mg-mega-topbar-mobile__icon-button"
      onClick={onClick}
      aria-label="Toggle navigation menu"
      aria-haspopup="true"
    >
      <span
        className={`mg-icon ${isOpen ? 'fa-angle-circled-left' : 'fa-menu'}`}
        aria-hidden="true"
      ></span>
    </button>
  );
}
