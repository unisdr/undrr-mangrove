import React from "react";
import { useState, useEffect, useRef } from "react";
import { TopBar } from "./TopBar/TopBar";
import { Sidebar } from "./TopBar/Sidebar";
import { useBreakpoint } from "./TopBar/hook";

const MegaMenu = ({ sections, delay = 300 }) => {
  const [section, setSection] = useState(null);
  const [itemIndex, setItemIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
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
    if ((breakpoint !== "mobilelandscape") && (breakpoint !== "mobile")) {
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
        onItemHover={setSection}
        toggleShowSidebar={() => setShowSidebar((prev) => !prev)}
        showSidebar={showSidebar}
      />

      {section && (
        <article className="mg-mega-content" aria-live="polite">
          <div className="mg-mega-content__banner">
            <header>{section.bannerHeading}</header>
            <p>{section.bannerDescription}</p>
          </div>
          <div className="mg-mega-content__navigation">
            <aside className="mg-mega-content__left">
              <ul className="mg-mega-content__section-list" role="list">
                {section.items.map((item, index) => (
                  <li
                    key={index}
                    className="mg-mega-content__section-list-item"
                    onMouseEnter={() => setItemIndex(index)}
                  >
                    <a
                      className={`mg-mega-content__section-list-link ${
                        itemIndex === index
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
            </aside>
            <section className="mg-mega-content__right">
              <ul className="mg-mega-content__subsection-list">
                {section.items[itemIndex].subItems.map((subItem, subIndex) => (
                  <li key={subIndex}>
                    <div className="mg-mega-content__subsection-list-title">{subItem.title}</div>
                    {/* <a href={subItem.url} className="">{subItem.title}</a> */}
                    <ul className="mg-mega-content__subsubsection-list">
                      {section.items[itemIndex].subItems[subIndex].subsubItems.map((subsubItem, subsubIndex) => (
                        <li key={subsubIndex}>
                          <a href={subsubItem.url}>{subsubItem.title}</a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>
      )}
      {showSidebar && (
        <Sidebar sections={sections} onClose={() => setShowSidebar(false)} />
      )}
    </nav>
  );
};

export default MegaMenu;
