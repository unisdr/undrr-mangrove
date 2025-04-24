import React from "react";
import { Icons } from "../../../Atom/Icons/Icons";

export function TopBarIconButton({ onClick, icon }) {
  return (
    <button 
      className="mg-mega-topbar__icon-button" 
      onClick={onClick}
      aria-label="Toggle navigation menu"
      aria-haspopup="true"
    >
      <Icons 
        src={icon}
        aria-hidden="true"
      />
    </button>
  )
}