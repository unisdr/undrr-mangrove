/**
 * MegaMenu component that displays a navigation menu with sections and items
 * @param {Object[]} sections - Array of section objects containing menu structure
 * @param {string} sections[].bannerHeading - Heading text for the section banner
 * @param {string} sections[].bannerDescription - Description text for the section banner
 * @param {Object} sections[].bannerButton - Optional button object for the banner
 * @param {string} sections[].bannerButton.label - Label text for the banner button
 * @param {string} sections[].bannerButton.url - URL for the banner button
 * @param {Object[]} sections[].items - Array of menu items for the section
 * @param {string} sections[].items[].title - Title of the menu item
 * @param {string} sections[].items[].url - URL for the menu item
 * @param {Object[]} sections[].items[].items - Optional nested items
 * @param {number} [delay=300] - Delay in milliseconds before closing menu on mouse leave
 * @returns {JSX.Element} Rendered MegaMenu component
 */
import React from "react";
import { useState, useEffect, useRef } from "react";
import { TopBar } from "./TopBar/TopBar";
import { Sidebar } from "./TopBar/Sidebar";
import SectionItems from "./SectionItems/SectionItems";
import { useBreakpoint } from "./TopBar/hook";

const MegaMenu = ({ sections, delay = 300 }) => {
  const [section, setSection] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const breakpoint = useBreakpoint();

  // Use ref for timeoutId to prevent re-renders
  const timeoutRef = useRef(null);
  const topBarRef = useRef(null);
  const contentRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSection(null);
    }, delay);
  };

  const handleFocusSection = (e) => {
    if(e.key === 'ArrowDown'){
      contentRef?.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    // ESC key closes the menu
    if (e.key === 'Escape' && section) {
      setSection(null);
      // Return focus to the menu item that opened the submenu
      if (topBarRef?.current) {
        const focusableItems = topBarRef.current.querySelectorAll('li a, li span[tabIndex="0"]');
        const activeIndex = Array.from(focusableItems).findIndex(item => 
          item.textContent === activeItem
        );
        if (activeIndex >= 0 && focusableItems[activeIndex]) {
          focusableItems[activeIndex].focus();
        }
      }
    }
  };

  const handleMouseEnter = (item) => {
    clearTimeout(timeoutRef.current);
    setSection(item);
  };

  useEffect(() => {
    if (breakpoint !== "mobile") {
      setShowSidebar(false);
    }
  }, [breakpoint]);

  // Add event listener for Escape key
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [section, activeItem]);

  return (
    <nav
      className="mg-mega-wrapper"
      onMouseLeave={handleMouseLeave}
      aria-label="Main Navigation"
    >
      <TopBar
        sections={sections}
        onItemHover={(item) => {
          handleMouseEnter(item);
          setActiveItem(item.title);
        }}
        toggleShowSidebar={() => setShowSidebar((prev) => !prev)}
        showSidebar={showSidebar}
        activeItem={activeItem}
        handleFocusSection={handleFocusSection}
        ref={topBarRef}
      />

      {section && section.items && (
        <SectionItems 
          section={section} 
          topBarRef={topBarRef} 
          ref={contentRef} 
          activeItem={activeItem}
          setSection={setSection} 
        />
      )}

      {section && !section.items && section.bannerDescription && (
        <article
          className="mg-mega-content | mg-container-full-width"
          aria-live="polite"
          aria-labelledby={`menu-description-${section.title}`}
          ref={contentRef}
          tabIndex={0}
        >
          <div id={`menu-description-${section.title}`} dangerouslySetInnerHTML={{ __html: section.bannerDescription }} />
        </article>
      )}
      {showSidebar && (
        <Sidebar sections={sections} onClose={() => setShowSidebar(false)} />
      )}
    </nav>
  );
};

export default MegaMenu;
