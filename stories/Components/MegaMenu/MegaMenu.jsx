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
 * @param {number} [hoverDelay=80] - Delay in milliseconds before opening menu on hover (prevents accidental opens)
 * @returns {JSX.Element} Rendered MegaMenu component
 */
import React, { useState, useEffect, useRef } from 'react';
import { TopBar } from './TopBar/TopBar';
import { Sidebar } from './TopBar/Sidebar';

const MegaMenu = ({ sections, delay = 300, hoverDelay = 180 }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const itemListRef = useRef([]);
  const sectionListRef = useRef([]);

  // Refs for timeout management
  const closeTimeoutRef = useRef(null);
  const openTimeoutRef = useRef(null);

  // Clear all timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(closeTimeoutRef.current);
      clearTimeout(openTimeoutRef.current);
    };
  }, []);

  const handleMouseLeave = () => {
    // Clear any pending open timeout
    clearTimeout(openTimeoutRef.current);

    // Set timeout to close the menu
    closeTimeoutRef.current = setTimeout(() => {
      setActiveItem(null);
    }, delay);
  };

  const handleItemHover = item => {
    // Clear any pending close timeout
    clearTimeout(closeTimeoutRef.current);

    // Clear any pending open timeout
    clearTimeout(openTimeoutRef.current);

    // Set timeout before opening (prevents accidental opens)
    openTimeoutRef.current = setTimeout(() => {
      setActiveItem(item);
    }, hoverDelay);
  };

  const handleEscape = e => {
    if (e.key === 'Escape') {
      setActiveItem(null);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is outside the mega menu wrapper
      const megaWrapper = document.querySelector('.mg-mega-wrapper');
      if (megaWrapper && !megaWrapper.contains(e.target)) {
        setActiveItem(null);
      }
    };

    // Only add listener when menu is open
    if (activeItem !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [activeItem]);

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
