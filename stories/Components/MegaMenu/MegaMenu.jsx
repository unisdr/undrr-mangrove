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
import { useBreakpoint } from "./TopBar/hook";

const MegaMenu = ({ sections, delay = 300 }) => {
  const [section, setSection] = useState(null);
  const [itemIndex, setItemIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const breakpoint = useBreakpoint();

  // Use ref for timeoutId to prevent re-renders
  const timeoutRef = useRef(null);

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

  const handleMouseEnter = (item) => {
    clearTimeout(timeoutRef.current);
    setSection(item);
  };

  useEffect(() => {
    if (breakpoint !== "mobile") {
      setShowSidebar(false);
    }
  }, [breakpoint]);

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
      />

      {section && (
        <article className="mg-mega-content | mg-container-full-width" aria-live="polite">
          <aside className="mg-mega-content__left">
            <section className="mg-mega-content__banner">
              <header>{section.bannerHeading}</header>
              <p>{section.bannerDescription}</p>
              {section.bannerButton && (
                <a href={section.bannerButton.url} className="mg-button mg-button-primary">
                  {section.bannerButton.label}
                </a>
              )}
            </section>
            {section.items.length > 0 && section.items[0].items && section.items[0].items.length > 0 ? (
              <ul className="mg-mega-content__section-list" role="list">
                {section.items.map((item, index) => (
                  <li
                    key={index}
                    className="mg-mega-content__section-list-item"
                    onMouseEnter={() => setItemIndex(index)}
                  >
                    <a
                      className={`mg-mega-content__section-list-link ${itemIndex === index
                        ? "mg-mega-content__section-list-link--active"
                        : ""
                        }`}
                      href={item.url}
                      aria-current={itemIndex === index ? "page" : undefined}
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </aside>
          <section className="mg-mega-content__right">
            {section.items.length > 0 && section.items[0].items && section.items[0].items.length > 0 ? (
              <ul role="list">
                {section.items[itemIndex].items.map((subItem, subIndex) => (
                  <li key={subIndex}>
                    <a href={subItem.url}>{subItem.title}</a>
                    {subItem.items && (
                      <ul role="list">
                        {subItem.items.map((nestedItem, nestedIndex) => (
                          <li key={nestedIndex}>
                            <a href={nestedItem.url}>{nestedItem.title}</a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <ul role="list">
                {section.items.map((item, index) => (
                  <li key={index}>
                    <a href={item.url}>{item.title}</a>
                  </li>
                ))}
              </ul>
            )
            }
          </section>
        </article>)}
      {showSidebar && (
        <Sidebar sections={sections} onClose={() => setShowSidebar(false)} />
      )}
    </nav>
  );
};


export default MegaMenu;