import React from "react";
export function TopBarItem ({ title, onMouseEnter, activeItem, link, children, bannerDescription }) {
  let isActive = title === activeItem;
  return (
    <span 
      className={`mg-mega-topbar__item ${isActive ? 'mg-mega-topbar__item--active' : ''}`} 
      onMouseEnter={children || bannerDescription ? onMouseEnter : undefined}
    >
      {/* Render link if no children and link URL exists, otherwise just show title */}
      {/* {!children && link && link.url ? <a href={link.url}>{title}</a> : title} */}
      {link && link.url ? <a href={link.url}>{title}</a> : title}
    </span>
  )
}