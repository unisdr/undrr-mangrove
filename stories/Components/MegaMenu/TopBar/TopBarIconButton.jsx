import React from "react";

export function TopBarIconButton({ onClick, isOpen }) {
  return (
    <button 
      className="mg-mega-topbar__icon-button" 
      onClick={onClick}
      aria-label="Toggle navigation menu"
      aria-haspopup="true"
    >
      <span 
        className={`mg-icon fa-${isOpen ? 'angle-circled-left' : 'angle-circled-right'}`} 
        aria-hidden="true"
      ></span>
    </button>
  )
}