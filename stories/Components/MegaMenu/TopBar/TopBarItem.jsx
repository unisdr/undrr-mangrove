import React from "react";
import { Icons } from "../../../Atom/Icons/Icons";
import information from "../../../assets/icons/information.svg"

export function TopBarItem ({ title, onMouseEnter }) {
  return (
    <div className="mg-mega-topbar__item" onMouseEnter={onMouseEnter}>
      <svg aria-hidden="true" focusable="false" role="img">
          <use href="icons/information.svg#information" />
      </svg>
      {title}
    </div>
  )
}