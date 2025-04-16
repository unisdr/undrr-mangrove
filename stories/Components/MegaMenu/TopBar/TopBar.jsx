import React, { forwardRef } from "react";
import { TopBarItem } from "./TopBarItem";
import { TopBarIconButton } from "./TopBarIconButton.jsx";
import { useBreakpoint } from "./hook.js";
import hamburger from "../../../assets/icons/arrow-right.svg"
import close from "../../../assets/icons/arrow-right.svg"

export const TopBar = forwardRef(({ onItemHover, toggleShowSidebar, showSidebar, sections, activeItem, handleFocusSection }, ref) => {
  const breakpoint = useBreakpoint();

  const handleKeyDown = (e, index) => {
    const items = Array.from(ref.current.querySelectorAll('li'));
    const focusableItems = items.filter(item => !item.classList.contains('hidden'));
    const currentIndex = focusableItems.indexOf(items[index]);

    // Handle keyboard navigation
    switch(e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < focusableItems.length - 1) {
          const nextItem = focusableItems[currentIndex + 1].querySelector('a, span[tabIndex="0"]');
          if (nextItem) nextItem.focus();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          const prevItem = focusableItems[currentIndex - 1].querySelector('a, span[tabIndex="0"]');
          if (prevItem) prevItem.focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        const firstItem = focusableItems[0].querySelector('a, span[tabIndex="0"]');
        if (firstItem) firstItem.focus();
        break;
      case 'End':
        e.preventDefault();
        const lastItem = focusableItems[focusableItems.length - 1].querySelector('a, span[tabIndex="0"]');
        if (lastItem) lastItem.focus();
        break;
      case 'ArrowDown':
        if (handleFocusSection) {
          handleFocusSection(e);
        }
        break;
      default:
        break;
    }
  };

  return (
    <ul className="mg-mega-topbar | mg-container-full-width" ref={ref} role="menubar" aria-label="Main menu">
      {
        breakpoint === 'mobile' ? (
          <TopBarIconButton 
            icon={showSidebar ? close : hamburger} 
            onClick={() => toggleShowSidebar()} 
            aria-label={showSidebar ? "Close menu" : "Open menu"}
            aria-expanded={showSidebar}
          />
        ) : (
          sections.map((item, index) => (
            <TopBarItem
              key={index}
              index={index}
              title={item.title}
              bannerDescription={item.bannerDescription}
              link={item.bannerButton}
              children={item.items}
              onMouseEnter={() => onItemHover(item)}
              activeItem={activeItem}
              handleFocusSection={handleFocusSection}
              onKeyDown={(e) => handleKeyDown(e, index)}
              hasSubmenu={!!(item.items || item.bannerDescription)}
            />))
        )
      }
    </ul>
  )
});
