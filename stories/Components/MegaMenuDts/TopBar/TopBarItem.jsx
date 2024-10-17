import React from "react";

export function TopBarItem ({ title, onMouseEnter, classes, iconSrc }) {
  return (
    <div className={`mg-mega-topbar__item ${classes}`} onMouseEnter={onMouseEnter}>
      <svg aria-hidden="true" focusable="false" role="img">
          <use href={iconSrc} />
      </svg>
      {title}
    </div>
  )
}