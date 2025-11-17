import React, { useRef, useState, useEffect } from 'react';

import Section from '../Section/Section';

function SidebarItem({
  section,
  sectionListRef,
  sectionIndex,
  handleSectionToggle,
  index,
  itemListRef,
  ref,
  handleOnKeyDown,
}) {
  const display = sectionIndex === index;
  const hasChildren = section?.items && section.items.length > 0;

  return (
    <li
      className="mg-mega-sidebar-section"
      onKeyDown={handleOnKeyDown}
      role="none"
    >
      {hasChildren ? (
        <button
          className="mg-mega-sidebar-section__item"
          onClick={() => handleSectionToggle(index)}
          aria-pressed={display}
          aria-expanded={display}
          aria-haspopup="true"
          ref={ref}
          role="menuitem"
        >
          <span>{section.title}</span>
          <span
            className="mg-icon fa-angle-circled-left"
            aria-hidden="true"
          ></span>
        </button>
      ) : (
        <a
          className="mg-mega-sidebar-section__item"
          href={section.url || section.bannerButton?.url || '#'}
          ref={ref}
          role="menuitem"
        >
          <span>{section.title}</span>
        </a>
      )}

      {hasChildren && display && (
        <Section
          section={section}
          index={index}
          sectionListRef={sectionListRef}
          itemListRef={itemListRef}
        />
      )}
    </li>
  );
}

export function Sidebar({ sections, itemListRef, sectionListRef, open }) {
  const [sectionIndex, setSectionIndex] = useState(null);

  // Reset expanded sections when sidebar closes
  useEffect(() => {
    if (!open) {
      setSectionIndex(null);
    }
  }, [open]);

  const handleSectionToggle = index => {
    if (index === sectionIndex) {
      setSectionIndex(null);
      return;
    }
    setSectionIndex(index);
  };

  const handleFocusByArrows = (e, index) => {
    // Prevent default scrolling behavior with arrow keys
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

    const itemRef = itemListRef?.current;

    if (e.key === 'ArrowDown' && index < itemRef?.length - 1) {
      if (Number.isInteger(sectionIndex)) {
        sectionListRef.current?.[index].focus();
      } else {
        itemRef[index + 1].focus();
      }
    }
    if (e.key === 'ArrowUp' && index >= 1) {
      itemRef[index - 1].focus();
    }
  };

  return (
    <div
      className={`mg-mega-mobile-sidebar ${open ? 'mg-mega-mobile-sidebar--open' : ''}`}
      role="dialog"
      aria-label="Mobile navigation menu"
    >
      <ul
        className="mg-mega-sidebar__list"
        role="menu"
        aria-label="Navigation options"
      >
        {sections.map((section, index) => (
          <SidebarItem
            key={index}
            index={index}
            section={section}
            ref={element => (itemListRef.current[index] = element)}
            sectionIndex={sectionIndex}
            handleSectionToggle={handleSectionToggle}
            sectionListRef={sectionListRef}
            itemListRef={itemListRef}
            handleOnKeyDown={e => handleFocusByArrows(e, index)}
          />
        ))}
      </ul>
    </div>
  );
}
