import React from "react";
export function TopBarItem ({ title, onMouseEnter, activeItem }) {
  let isActive = title === activeItem;
  return (
    <span 
      className={`mg-mega-topbar__item ${isActive ? 'mg-mega-topbar__item--active' : ''}`} 
      onMouseEnter={onMouseEnter}
    >
      {title}
    </span>
  )
}