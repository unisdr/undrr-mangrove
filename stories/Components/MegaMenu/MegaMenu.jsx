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
import React, { useState, useEffect, useRef } from 'react';
import { TopBar } from './TopBar/TopBar';
import { Sidebar } from './TopBar/Sidebar';
import { useBreakpoint } from './TopBar/hook';

const MegaMenu = ({ sections, delay = 300 }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const breakpoint = useBreakpoint();

  const itemListRef = useRef([]);
  const sectionListRef = useRef([]);

  // Use ref for timeoutId to prevent re-renders
  const timeoutRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveItem(null);
    }, delay);
  };

  const handleItemHover = item => {
    clearTimeout(timeoutRef.current);
    setActiveItem(item);
  };

  const handleEscape = e => {
    if (e.key === 'Escape') {
      setActiveItem(null);
    }
  };

  useEffect(() => {
    if (breakpoint !== 'mobile') {
      setShowSidebar(false);
    }
  }, [breakpoint]);

  return (
    <nav
      className="mg-mega-wrapper"
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleEscape}
      aria-label="Main Navigation"
    >
      <TopBar
        sections={sections}
        handleItemHover={handleItemHover}
        toggleShowSidebar={() => setShowSidebar(prev => !prev)}
        showSidebar={showSidebar}
        activeItem={activeItem}
        itemListRef={itemListRef}
        sectionListRef={sectionListRef}
      />

      {/* Backdrop overlay – closes sidebar on click */}
      {showSidebar && (
        <button
          className="mg-mega-mobile-sidebar-overlay"
          aria-label="Close mobile navigation"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar is always mounted for smooth open/close transitions */}
      <Sidebar
        open={showSidebar}
        sections={sections}
        itemListRef={itemListRef}
        sectionListRef={sectionListRef}
      />
    </nav>
  );
};

export default MegaMenu;
