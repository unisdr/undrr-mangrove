import React from "react";
import { useState } from "react";
import { Icons } from "../../../Atom/Icons/Icons";
import chevronLeftIcon from "../../../assets/icons/chevron-left-circle.svg"

import SectionItems from "../SectionItems/SectionItems"

function SidebarSection ({ section, display, onClick }) {

  return (
    <li className="mg-mega-sidebar-section">
      <button className="mg-mega-sidebar-section__item" onClick={(val) => onClick(val)} aria-pressed={display}>
        <span>{section.title}</span>
        <Icons src={chevronLeftIcon} />
      </button>
      {
        display && (section && section.items) && <SectionItems section={section} />
      }
      { display && ( section && !section.items && section.bannerDescription && (
          <article className="mg-mega-content | mg-container-full-width" aria-live="polite" dangerouslySetInnerHTML={{ __html: section.bannerDescription }} />
        ))
      }
    </li>
  )
}

export function Sidebar({ sections }) {
  const [sectionIndex, setSectionIndex] = useState(null);

  const onSectionToggle = (index) => {
    if (index === sectionIndex) {
      setSectionIndex(null);
      return
    }
    setSectionIndex(index);
  }

  return (
    <div className="sidebar">
      <ul className="sidebar__list">
        {
          sections.map((section, index) => (
            <SidebarSection section={section} key={index} display={sectionIndex === index} onClick={() => onSectionToggle(index)}/>
          ))
        }
      </ul>
    </div>
  )
}
