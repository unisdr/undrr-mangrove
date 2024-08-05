import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { TopBar } from "./TopBar/TopBar";
import { Sidebar } from "./TopBar/Sidebar";
import { useBreakpoint } from "./TopBar/hook";

const MegaMenu =  ({ sections, delay = 300 }) => {
  let timeoutId = null;

  const [section, setSection] = useState(null);
  const [itemIndex, setItemIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const breakpoint = useBreakpoint();

  const handleMouseLeave = () => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      setSection(null);
    }, delay);
  };

  const handleMouseEnter = (item) => {
    clearTimeout(timeoutId);
    setSection(item);
  };

  useEffect(() => {
    // Clean up the timeout when the component unmounts
    if (breakpoint !== "mobile") {
      setShowSidebar(false);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return (
    <nav className="mg-mega-wrapper" onMouseLeave={handleMouseLeave}>
      <TopBar
        sections={sections}
        onItemHover={(section) => setSection(section)}
        toggleShowSidebar={() => setShowSidebar(!showSidebar)}
        showSidebar={showSidebar}
      />

      {section !== null && (
        <article className="mg-mega-content">
          <aside className="mg-mega-content__left">
            <section className="mg-mega-content__banner">
              <header>{section.bannerHeading}</header>
              <p>{section.bannerDescription}</p>
            </section>
            <ul className="mg-mega-content__section-list">
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
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
          <section className="mg-mega-content__right">
            <ul>
              {section.items[itemIndex].subItems.map((item, index) => (
                <li key={index}>
                  <a href={item.url}>{item.title}</a>
                </li>
              ))}
            </ul>
          </section>
        </article>
      )}
      {showSidebar && (
        <Sidebar sections={sections} onClose={() => setShowSidebar(false)} />
      )}
    </nav>
  );
}

export default MegaMenu;