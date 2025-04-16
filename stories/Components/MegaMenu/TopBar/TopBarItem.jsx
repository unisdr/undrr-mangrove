import React from "react";
export function TopBarItem ({ 
  title, 
  onMouseEnter, 
  activeItem, 
  link, 
  children, 
  bannerDescription, 
  handleFocusSection,
  onKeyDown,
  hasSubmenu
}) {
  let isActive = title === activeItem;
  
  return (
    <li
      className={`mg-mega-topbar__item ${isActive ? 'mg-mega-topbar__item--active' : ''}`}
      onMouseEnter={children || bannerDescription ? onMouseEnter : undefined}
      onFocus={onMouseEnter}
      role="none"
    >
      {link && link.url ? (
        <a 
          href={link.url}
          role="menuitem"
          onKeyDown={onKeyDown}
        >
          {title}
        </a>
      ) : (
        <span 
          tabIndex={0} 
          role="menuitem"
          aria-haspopup={hasSubmenu}
          aria-expanded={isActive && hasSubmenu}
          onKeyDown={(e) => {
            if (handleFocusSection && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              handleFocusSection(e);
            }
            if (onKeyDown) {
              onKeyDown(e);
            }
          }}
        >
          {title}
        </span>
      )}
    </li>
  )
}
