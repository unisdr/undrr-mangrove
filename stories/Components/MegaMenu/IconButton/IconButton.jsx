import { Icons } from "../../../Atom/Icons/Icons";
import "./IconButton.scss"

export function IconButton({ onClick, icon }) {
  return (
    <button className="mg-icon-button" onClick={onClick}>
      <Icons 
        src={icon}
      />
    </button>
  )
}