import React, { useRef, useState, useEffect } from "react";
import { Icons } from "../../../Atom/Icons/Icons";
import chevronLeftIcon from "../../../assets/icons/chevron-left-circle.svg"

import Section from "../Section/Section"

function SidebarItem({ section, sectionListRef, sectionIndex, handleSectionToggle, index, itemListRef, ref, handleOnKeyDown }) {
  const display = sectionIndex === index


  return (
    <li
      className="mg-mega-sidebar-section"
      onKeyDown={handleOnKeyDown}
    >
      <button
        className="mg-mega-sidebar-section__item"
        onClick={() => handleSectionToggle(index)}
        aria-pressed={display}
        ref={ref}
      >
        <span>{section.title}</span>
        <Icons src={chevronLeftIcon} />
      </button>
      {
        display && (section && section.items) && (
          <Section
            section={section}
            index={index}
            sectionListRef={sectionListRef}
            itemListRef={itemListRef}
          />
        )
      }
    </li>
  )
}

export function Sidebar({ sections, itemListRef, sectionListRef }) {
  const [sectionIndex, setSectionIndex] = useState(null);

  const handleSectionToggle = (index) => {
    if (index === sectionIndex) {
      setSectionIndex(null);
      return
    }
    setSectionIndex(index);
  }

  const handleFocusByArrows = (e, index) => {

    const itemRef = itemListRef?.current

    if ((e.key === 'ArrowDown') && index < itemRef?.length - 1) {
      if (Number.isInteger(sectionIndex)) {
        sectionListRef.current?.[index].focus();
      } else {
        itemRef[index + 1].focus();
      }
    }
    if ((e.key === 'ArrowUp') && index >= 1) {
      itemRef[index - 1].focus();
    }
  }

  return (
    <div className="sidebar">
      <ul className="sidebar__list">
        {
          sections.map((section, index) => (
            <SidebarItem
              key={index}
              index={index}
              section={section}
              ref={element => itemListRef.current[index] = element}
              sectionIndex={sectionIndex}
              handleSectionToggle={handleSectionToggle}
              sectionListRef={sectionListRef}
              itemListRef={itemListRef}
              handleOnKeyDown={(e) => handleFocusByArrows(e, index)}
            />
          ))
        }
      </ul>
    </div>
  )
}
