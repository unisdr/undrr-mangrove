import { Icons } from "../../../Atom/Icons/Icons";
import "./topbar.scss"

export function TopBarIconButton({ onClick, icon }) {
  return (
    <button className="mg-mega-topbar__icon-button" onClick={onClick}>
      <Icons 
        src={icon}
      />
    </button>
  )
}