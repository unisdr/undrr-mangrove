import React, { useRef, useState } from 'react';
import { TopBarItem } from './TopBarItem';
import { TopBarMobileIconButton } from './TopBarMobileIconButton.jsx';

export function TopBar({
  handleItemHover,
  toggleShowSidebar,
  showSidebar,
  sections,
  activeItem,
  sectionListRef,
  itemListRef,
}) {
  const handleFocusByArrows = (e, index) => {
    // Prevent default browser scrolling for arrow keys
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

    const itemRef = itemListRef?.current;

    if (e.key === 'ArrowLeft' && index >= 1) {
      itemRef[index - 1].focus();
    }
    if (e.key === 'ArrowRight' && index < itemRef?.length - 1) {
      itemRef[index + 1].focus();
    }
    if (e.key === 'ArrowDown') {
      sectionListRef?.current?.[index].focus();
    }
  };

  return (
    <ul
      className="mg-mega-topbar | mg-container-full-width"
      role="menubar"
      aria-label="Main navigation menu"
    >
      {/* Mobile/Tablet hamburger button - hidden on desktop via CSS */}
      <TopBarMobileIconButton
        isOpen={showSidebar}
        onClick={() => toggleShowSidebar()}
      />

      {/* Desktop menu items - hidden on mobile/tablet via CSS */}
      {sections.map((section, index) => (
        <TopBarItem
          key={index}
          index={index}
          ref={element => (itemListRef.current[index] = element)}
          title={section.title}
          bannerDescription={section.bannerDescription}
          link={section.bannerButton}
          children={section.sections}
          onMouseEnter={() => handleItemHover(index)}
          activeItem={activeItem}
          section={section}
          handleOnKeyDown={e => {
            handleFocusByArrows(e, index);
          }}
          sectionListRef={sectionListRef}
          itemListRef={itemListRef}
        />
      ))}
    </ul>
  );
}
