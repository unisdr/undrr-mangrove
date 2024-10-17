import React from "react";

export function TopBarItem ({ title, onMouseEnter, iconSrc }) {
  return (
    <button className="mg-mega-topbar__item" onMouseEnter={onMouseEnter}>
      <svg aria-hidden="true" focusable="false" role="img">
          <use href={iconSrc} />
      </svg>
      {title}
    </button>
  )
}