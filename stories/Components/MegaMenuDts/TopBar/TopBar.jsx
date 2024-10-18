import React from "react";
import { TopBarItem } from "./TopBarItem.jsx";
import { TopBarIconButton } from "./TopBarIconButton.jsx";
import { useBreakpoint } from "./hook.js";
import hamburger from "../../../assets/icons/hamburger.svg"
import close from "../../../assets/icons/times.svg"

export function TopBar({ onItemHover, toggleShowSidebar, showSidebar, sections }) {

  const topBarItems = document.getElementsByClassName("mg-mega-topbar__item");

  const onMouseEnter = (item, index) => {
    for (let i = 0; i < topBarItems.length; i++) {
      topBarItems[i].classList.remove("mg-mega-topbar__item--current");
    }
    topBarItems[index].classList.add("mg-mega-topbar__item--current");
    onItemHover(item);
  }

  const breakpoint = useBreakpoint();

  return (
    <div className="mg-mega-topbar">
      {
        ((breakpoint === 'mobile') || (breakpoint === 'mobilelandscape')) ? (
          <TopBarIconButton icon={showSidebar ? close : hamburger} onClick={() => toggleShowSidebar()}/>
        ) : (
          sections.map((item, index) => (
            <TopBarItem
              key={index}
              title={item.title}
              onMouseEnter={() => onMouseEnter(item, index)}
              iconSrc={item.icon}
            /> 
          ))
        )
      }
    </div>
    )
}