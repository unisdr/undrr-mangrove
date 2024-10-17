import React from "react";
import { useState } from "react";
import { Icons } from "../../../Atom/Icons/Icons";
import chevronLeftIcon from "../../../assets/icons/chevron-left.svg"

function SidebarSection ({ section, display, onClick }) {
  const [itemIndex, setItemIndex] = useState(null);
  const [subItemIndex, setSubItemIndex] = useState(null);

  const onItemToggle = (index) => {
    if (index === itemIndex) {
        setItemIndex(null);
        return;
    }
    setItemIndex(index);
  };

  const onsubItemToggle = (index) => {
      if (index === subItemIndex) {
          setSubItemIndex(null);
          return;
      }
      setSubItemIndex(index);
  };

  return (
    <div className="mg-mega-sidebar-section">
      <div className="mg-mega-sidebar-section__item" onClick={(val) => onClick(val)}>
        <span>{section.title}</span>
        <Icons src={chevronLeftIcon} />
      </div>
      {
        display && (
          <ol>
            {
              section.items.map((item, index) => (
                <li key={index}>
                  <div
                    onClick={() => onItemToggle(index)} className="mg-mega-sidebar-section__item"
                  >
                    <span>{item.title}</span>
                    <Icons src={chevronLeftIcon} />
                  </div>
                  {
                    index === itemIndex && (
                      <ol>
                        {
                          item.subItems.map((subItem, index) => (
                            <li key={index}>

                              <div
                                onClick={() => onsubItemToggle(index)} className="mg-mega-sidebar-section__item"
                              >
                                <span>{subItem.title}</span>
                                <Icons src={chevronLeftIcon} />
                              </div>
                              {
                                index === subItemIndex && (
                                  <ol>
                                    {
                                      subItem.subsubItems.map((subsubItem, index) => (
                                        <li key={index}>
                                          <a href={subsubItem.url}>{subsubItem.title}</a>
                                        </li>
                                      ))
                                    }
                                  </ol>
                                )
                              }
                            </li>
                          ))
                        }
                      </ol>
                    )
                  }
                </li>
              ))
            }
          </ol>
        )
      }
    </div>
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
    <div className="mg-mega-content__sidebar">
      {
        sections.map((section, index) => (
          <SidebarSection section={section} key={index} display={sectionIndex === index} onClick={() => onSectionToggle(index)}/>
        ))
      }
    </div>
  )
} 