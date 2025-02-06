import React from "react";
import { TopBarItem } from "./TopBarItem";
import { TopBarIconButton } from "./TopBarIconButton.jsx";
import { useBreakpoint } from "./hook.js";
import hamburger from "../../../assets/icons/arrow-right.svg"
import close from "../../../assets/icons/arrow-right.svg"

export function TopBar({ onItemHover, toggleShowSidebar, showSidebar, sections, activeItem }) {


  const onMouseEnter = (item) => {
    onItemHover(item);
  }

  const breakpoint = useBreakpoint();

  return (
    <div className="mg-mega-topbar | mg-container-full-width">
      {
        breakpoint === 'mobile' ? (
          <TopBarIconButton icon={showSidebar ? close : hamburger} onClick={() => toggleShowSidebar()} />
        ) : (
          sections.map((item, index) => (
            <TopBarItem
              key={index}
              title={item.title}
              onMouseEnter={() => onItemHover(item)}
              activeItem={activeItem}
            />))
        )
      }
    </div>
  )
}