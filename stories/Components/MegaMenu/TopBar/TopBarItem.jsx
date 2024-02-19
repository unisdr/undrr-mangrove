import { h } from "preact";
export function TopBarItem ({ title, onMouseEnter }) {
  return (
    <div className="mg-mega-topbar__item" onMouseEnter={onMouseEnter}>
      {title}
    </div>
  )
}