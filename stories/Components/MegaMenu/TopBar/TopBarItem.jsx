import React from "react";

export function TopBarItem ({ title, onMouseEnter }) {
  return (
    <div className="mg-mega-topbar__item" onMouseEnter={onMouseEnter}>
      <svg aria-hidden="true" focusable="false" role="img">
        {/* NOTE - Each menu item has a different icon, they are listed below (see design on Figma) */}
          <use href="icons/information.svg#information" />
          {/* <use href="icons/remove-red-eye.svg#remove-red-eye" /> */}
          {/* <use href="icons/help-outline.svg#help-outline" /> */}
          {/* <use href="icons/settings.svg#settings" /> */}
      </svg>
      {title}
    </div>
  )
}