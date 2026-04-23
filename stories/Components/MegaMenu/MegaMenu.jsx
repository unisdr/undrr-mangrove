/**
 * MegaMenu component. Multi-level navigation with sections and items.
 *
 * Pass `logoSrc` to get the branded variant: the logo sits at inline-start
 * of the nav strip, next to the menu items. Useful for sub-branded sites
 * like PreventionWeb or MCR2030.
 *
 * Language prefixes: this component does not detect `/ar/`, `/fr/`, etc.
 * The wrapper layer (Drupal, Twig, whatever) should pass the right
 * `logoHref`, e.g. `data-mg-mega-menu-logo-href="/ar/"` on Arabic pages.
 *
 * @param {Object[]} sections - Array of section objects containing menu structure
 * @param {string} sections[].title - Top-level menu item label (required)
 * @param {string} sections[].icon - Optional icon class name shown before the title on desktop topbar (e.g. "mg-icon mg-icon-chart-bar")
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
 * @param {number} [hoverDelay=180] - Delay in milliseconds before opening menu on hover (prevents accidental opens)
 * @param {string} [logoSrc] - Image URL for a logo at inline-start of the nav strip (enables branded variant)
 * @param {string} [logoAlt=''] - Alt text for the logo image
 * @param {string} [logoHref='/'] - Where the logo links to. Defaults to `/`; on multilingual sites, pass the language-prefixed root from the CMS (e.g. `/ar/`)
 * @param {number} [logoWidth] - Optional explicit width for CLS prevention
 * @param {number} [logoHeight] - Optional explicit height for CLS prevention
 * @returns {JSX.Element} Rendered MegaMenu component
 *
 * @see schemas/navigation.schema.js — canonical field names and documented deviations.
 */
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { TopBar } from './TopBar/TopBar';
import { Sidebar } from './TopBar/Sidebar';

const MegaMenu = ({
  sections,
  delay = 300,
  hoverDelay = 180,
  logoSrc,
  logoAlt = '',
  logoHref = '/',
  logoWidth,
  logoHeight,
}) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [jsActive, setJsActive] = useState(false);

  const itemListRef = useRef([]);
  const sectionListRef = useRef([]);

  // Refs for timeout management
  const closeTimeoutRef = useRef(null);
  const openTimeoutRef = useRef(null);

  // Signal that JS has mounted and the sidebar is available to handle mobile nav.
  // This adds --js-active so the CSS can safely hide pointer events on mobile items.
  useEffect(() => {
    setJsActive(true);
  }, []);

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
      className={`mg-mega-wrapper${jsActive ? ' mg-mega-wrapper--js-active' : ''}`}
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
        logoSrc={logoSrc}
        logoAlt={logoAlt}
        logoHref={logoHref}
        logoWidth={logoWidth}
        logoHeight={logoHeight}
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

MegaMenu.propTypes = {
  /** Array of section objects containing the menu structure. */
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      icon: PropTypes.string,
      bannerHeading: PropTypes.string,
      bannerDescription: PropTypes.string,
      bannerButton: PropTypes.shape({
        label: PropTypes.string,
        url: PropTypes.string,
      }),
      items: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          url: PropTypes.string,
          items: PropTypes.array,
        })
      ),
    })
  ).isRequired,
  /** Delay in ms before closing menu on mouse leave. */
  delay: PropTypes.number,
  /** Delay in ms before opening menu on hover (prevents accidental opens). */
  hoverDelay: PropTypes.number,
  /** Logo image URL. Enables the branded nav variant with logo at inline-start. */
  logoSrc: PropTypes.string,
  /** Alt text for the logo. */
  logoAlt: PropTypes.string,
  /** URL the logo links to. On multilingual sites, pass the language-prefixed root. */
  logoHref: PropTypes.string,
  /** Explicit width for the logo (CLS prevention). */
  logoWidth: PropTypes.number,
  /** Explicit height for the logo (CLS prevention). */
  logoHeight: PropTypes.number,
};

export default MegaMenu;
