import React from "react";
import Section from "../Section/Section.jsx";

export function TopBarItem({
  title,
  onMouseEnter,
  activeItem,
  link,
  bannerDescription,
  handleOnKeyDown,
  ref,
  section,
  sectionListRef,
  itemListRef,
  index,
}) {

  let isActive = index === activeItem;

  return (
    <li
      className={`mg-mega-topbar__item ${isActive ? 'mg-mega-topbar__item--active' : ''}`}
      onMouseEnter={section || bannerDescription ? onMouseEnter : undefined}
      onFocus={onMouseEnter}
      onKeyDown={handleOnKeyDown}
    >
      {/* Render link if no children and link URL exists, otherwise just show title */}
      {/* {!children && link && link.url ? <a href={link.url}>{title}</a> : title} */}
      {link && link.url ?
        <a
          className="mg-mega-topbar__item-link"
          href={link.url}
          ref={ref}
        >
          {title}
        </a>
        :
        <button
          className="mg-mega-topbar__item-link"
          ref={ref}
        >
          {title}
        </button>
      }

      <Section
        section={section}
        index={index}
        sectionListRef={sectionListRef}
        itemListRef={itemListRef}
      />

    </li>
  )
}
