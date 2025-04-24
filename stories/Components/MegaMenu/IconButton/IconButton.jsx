import React from "react";

export function IconButton({ onClick, iconName, label }) {
  return (
    <button 
      className="mg-icon-button" 
      onClick={onClick}
      aria-label={label}
    >
      <span 
        className={`mg-icon fa-${iconName}`} 
        aria-hidden="true"
      ></span>
    </button>
  )
}