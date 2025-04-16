import { useState, useRef, forwardRef } from "react";
import { useBreakpoint } from "../TopBar/hook";

const SectionItems = forwardRef(function SectionItems({ section, topBarRef, activeItem, setSection }, ref) {
  const [itemIndex, setItemIndex] = useState(0);
  const contentLeftRef = useRef(null);
  const contentRightRef = useRef(null);
  const breakpoint = useBreakpoint();

  // Store references to all focusable elements
  const allLinks = useRef([]);
  const currentFocusIndex = useRef(-1);

  // Collect all links when component renders or updates
  const collectFocusableElements = () => {
    setTimeout(() => {
      const article = ref.current;
      if (!article) return;
      
      const links = article.querySelectorAll('a');
      allLinks.current = Array.from(links);
    }, 0);
  };

  // Update focusable elements when section or itemIndex changes
  useState(() => {
    collectFocusableElements();
  }, [section, itemIndex]);

  const focusNextElement = () => {
    if (allLinks.current.length === 0) return;
    
    currentFocusIndex.current = (currentFocusIndex.current + 1) % allLinks.current.length;
    allLinks.current[currentFocusIndex.current].focus();
  };

  const focusPrevElement = () => {
    if (allLinks.current.length === 0) return;
    
    currentFocusIndex.current = currentFocusIndex.current <= 0 ? 
      allLinks.current.length - 1 : 
      currentFocusIndex.current - 1;
    
    allLinks.current[currentFocusIndex.current].focus();
  };

  const handleKeyDown = (e) => {
    const target = e.target;
    
    // Update current focus index when a link receives focus
    if (target.tagName === 'A') {
      currentFocusIndex.current = allLinks.current.indexOf(target);
    }

    switch (e.key) {
      case 'ArrowUp':
        if (target === ref.current) {
          e.preventDefault();
          topBarRef?.current.focus();
        } else {
          e.preventDefault();
          focusPrevElement();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusNextElement();
        break;
      case 'ArrowLeft':
        if (target === ref.current) {
          e.preventDefault();
          contentLeftRef?.current.focus();
        }
        break;
      case 'ArrowRight':
        if (target === ref.current) {
          e.preventDefault();
          contentRightRef?.current.focus();
        }
        break;
      case 'Tab':
        // If tabbing out of the menu and not holding shift, close the submenu
        if (!e.shiftKey && 
            allLinks.current.length > 0 && 
            target === allLinks.current[allLinks.current.length - 1]) {
          setSection(null);
        }
        break;
      default:
        break;
    }
  };

  // Handle navigation within left panel categories
  const handleLeftPanelKeyDown = (e, index) => {
    const leftLinks = contentLeftRef.current.querySelectorAll('.mg-mega-content__section-list-item a');
    const currentIndex = Array.from(leftLinks).indexOf(e.target);
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          leftLinks[currentIndex - 1].focus();
        } else if (section.bannerButton?.label) {
          contentLeftRef.current.querySelector('.mg-button').focus();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < leftLinks.length - 1) {
          leftLinks[currentIndex + 1].focus();
        } else {
          contentRightRef.current.focus();
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        setItemIndex(index);
        break;
      default:
        break;
    }
  };

  return (
    <article
      className="mg-mega-content | mg-container-full-width"
      aria-labelledby={`menu-section-${section.title}`}
      aria-live="polite"
      ref={ref}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
    >
      <span id={`menu-section-${section.title}`} className="visually-hidden">{section.title} submenu</span>
      
      {/* Only show the left area if there are child items and heading */}
      {section.bannerHeading && section.bannerDescription && section.items && (
        <aside 
          className="mg-mega-content__left" 
          ref={contentLeftRef} 
          tabIndex={0} 
          aria-label="Categories">
          <section className="mg-mega-content__banner">
            <header>{section.bannerHeading}</header>
            {(
              section.bannerDescription.includes('<') ? (
                <div dangerouslySetInnerHTML={{ __html: section.bannerDescription }} />
              ) : (
                <p>{section.bannerDescription}</p>
              )
            )}
            {section.bannerButton?.label && (
              <a 
                href={section.bannerButton.url} 
                className="mg-button mg-button-primary"
                onKeyDown={handleKeyDown}
              >
                {section.bannerButton.label}
              </a>
            )}
          </section>
          {section.items.length > 0 && section.items[0].items && section.items[0].items.length > 0 ? (
            <ul className="mg-mega-content__section-list" role="menu" aria-label="Categories menu">
              {section.items.map((item, index) => (
                <li
                  key={index}
                  className="mg-mega-content__section-list-item"
                  onMouseEnter={() => setItemIndex(index)}
                  role="none"
                >
                  <a
                    className={`mg-mega-content__section-list-link ${itemIndex === index
                      ? "mg-mega-content__section-list-link--active"
                      : ""
                      }`}
                    href={item.url}
                    role="menuitem"
                    aria-current={itemIndex === index ? "page" : undefined}
                    onFocus={() => setItemIndex(index)}
                    onKeyDown={(e) => handleLeftPanelKeyDown(e, index)}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      )}
      {section.items && (
        <section 
          className="mg-mega-content__right" 
          ref={contentRightRef} 
          tabIndex={0} 
          aria-label="Submenu items">
          <ul role="menu" aria-label="Submenu items list">
            {section.items[itemIndex]?.items ? (
              section.items[itemIndex].items.map((subItem, subIndex) => (
                <li key={subIndex} role="none">
                  <a 
                    href={subItem.url} 
                    role="menuitem" 
                    aria-haspopup={subItem.items ? "true" : undefined}
                    onKeyDown={handleKeyDown}
                  >
                    {subItem.title}
                  </a>
                  {subItem.items && (
                    <ul role="menu" aria-label={`${subItem.title} subitems`}>
                      {subItem.items.map((nestedItem, nestedIndex) => (
                        <li key={nestedIndex} role="none">
                          <a 
                            href={nestedItem.url} 
                            role="menuitem"
                            onKeyDown={handleKeyDown}
                          >
                            {nestedItem.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))
            ) : (
              section.items.map((item, index) => (
                <li key={index} role="none">
                  <a 
                    href={item.url} 
                    role="menuitem"
                    onKeyDown={handleKeyDown}
                  >
                    {item.title}
                  </a>
                </li>
              ))
            )}
          </ul>
        </section>
      )}
    </article>
  );
});

export default SectionItems;
