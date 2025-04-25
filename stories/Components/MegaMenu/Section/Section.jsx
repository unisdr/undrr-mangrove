import React, { useState, useRef, useEffect } from "react";
import { useBreakpoint } from "../TopBar/hook";

export default function Section({ section, index, sectionListRef, itemListRef }) {

  const breakpoint = useBreakpoint()

  const [itemIndex, setItemIndex] = useState(0);
  const [focusIndex, setFocusIndex] = useState(0);
  const [focusableElements, setFocusableElements] = useState([]);

  const asideRef = useRef(null)
  const contentRef = useRef(null)

  // Log the section prop whenever it changes
  useEffect(() => {
    console.log(`Section ${index} mounted or section prop updated:`, section);
  }, [section, index]); // Add section and index to dependency array

  // Log the itemIndex state after it updates
  useEffect(() => {
    console.log(`Section ${index}: Submenu itemIndex changed to:`, itemIndex);
    // Optional: Log the actual item data if needed
    // console.log(`Section ${index}: Displaying submenu for:`, section?.items?.[itemIndex]?.title);
  }, [itemIndex, index, section]);

  const handleArrowFocus = (e) => {
    // Prevent default browser scrolling behavior for arrow keys
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (e.key === 'ArrowDown' || e.key === 'Tab') {
      if (focusIndex < focusableElements?.length - 1) {
        setFocusIndex((prevIndex) => prevIndex + 1);
      } else {
        breakpoint !== 'mobile' && setFocusIndex(0);
        itemListRef.current?.[index + 1]?.focus();
      }
    }

    if (e.key === 'ArrowUp' || (e.shiftKey && e.key === 'Tab')) {
      if (focusIndex > 0) {
        setFocusIndex((prevIndex) => prevIndex - 1);
      } else {
        itemListRef.current?.[index]?.focus();
        setFocusIndex(0);
      }
    }

    if (asideRef.current) {
      if (e.key === 'ArrowLeft') {
        setFocusIndex(0);
      }

      // Focus on first element on right side in content area
      // only if aside element exists
      if (e.key === 'ArrowRight') {
        const rightSection = contentRef.current;
        
        const firstLink = rightSection?.querySelector('ul > li > a');
        
        if (firstLink) {
          rightSection.setAttribute('tabindex', '-1');
          
          firstLink.focus();
          
          const firstLinkIndex = focusableElements.findIndex(el => el === firstLink);
          if (firstLinkIndex !== -1) {
            setFocusIndex(firstLinkIndex);
          }
        } else {
          contentRef.current?.focus();
          const firstContentElement = focusableElements.filter((item) => (item === contentRef.current));
          firstContentElement[0] && setFocusIndex(focusableElements.indexOf(firstContentElement[0]));
        }
      }
    }
  }

  useEffect(() => {

    const tabableElements = sectionListRef?.current?.[index]?.querySelectorAll(
      'audio, button, a, canvas, details, iframe, input, select, summary, textarea, video, [tabindex]'
    );
    
    setFocusableElements(Array.from(tabableElements || []))
  }, [sectionListRef, index, itemIndex])


  useEffect(() => {
    if (focusableElements.length > 0 && focusIndex >= 0) {
      focusableElements[focusIndex]?.focus()
    }
  }, [focusIndex])

  return (
    <>

      {section && section.items && (
        <article
          className="mg-mega-content | mg-container-full-width"
          aria-label="Menu section"
          aria-live="polite"
          tabIndex={0}
          ref={(element => sectionListRef.current[index] = element)}
          onKeyDown={handleArrowFocus}
          role="region"
        >
          {/* Only show the left area if there are child items and heading */}
          {section.bannerHeading && section.bannerDescription && section.items && (
            <aside className="mg-mega-content__left" aria-label="Category navigation" ref={asideRef} tabIndex={0} role="navigation">
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
                  <a href={section.bannerButton.url} className="mg-button mg-button-primary">
                    {section.bannerButton.label}
                  </a>
                )}
              </section>
              {section.items.length > 0 && section.items[0].items && section.items[0].items.length > 0 ? (
                <ul className="mg-mega-content__section-list" role="menu" aria-label="Categories">
                  {section.items.map((item, index) => (
                    <li
                      key={index}
                      className="mg-mega-content__section-list-item"
                      onMouseEnter={() => {
                        console.log(`Section ${index}: Triggered by Mouse Hover - Setting itemIndex to ${index}`);
                        setItemIndex(index)
                      }}
                      role="none"
                    >
                      <a
                        className={`mg-mega-content__section-list-link ${itemIndex === index
                          ? "mg-mega-content__section-list-link--active"
                          : ""
                          }`}
                        href={item.url}
                        aria-current={itemIndex === index ? "page" : undefined}
                        onFocus={() => {
                          console.log(`Section ${index}: Triggered by Keyboard Focus - Setting itemIndex to ${index}`);
                          setItemIndex(index)
                        }}
                        role="menuitem"
                        aria-haspopup={item.items && item.items.length > 0 ? "true" : undefined}
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
            <section className="mg-mega-content__right" aria-label="Submenu content" ref={contentRef} tabIndex={0} role="navigation">
              <ul role="menu" aria-label="Submenu items">
                {section.items[itemIndex]?.items ? (
                  section.items[itemIndex].items.map((subItem, subIndex) => (
                    <li key={subIndex} role="none">
                      <a href={subItem.url} role="menuitem" aria-haspopup={subItem.items ? "true" : undefined}>{subItem.title}</a>
                      {subItem.items && (
                        <ul role="menu" aria-label={`${subItem.title} submenu`}>
                          {subItem.items.map((nestedItem, nestedIndex) => (
                            <li key={nestedIndex} role="none">
                              <a href={nestedItem.url} role="menuitem">{nestedItem.title}</a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))
                ) : (
                  section.items.map((item, index) => (
                    <li key={index} role="none">
                      <a href={item.url} role="menuitem">{item.title}</a>
                    </li>
                  ))
                )}
              </ul>
            </section>
          )}

          {/*  If there are no child items just show the banner description in a call to action style */}
        </article>
      )}
      {section && !section.items && section.bannerDescription && (
        <article
          className="mg-mega-content | mg-container-full-width"
          aria-live="polite"
          aria-label="Submenu item"
          tabIndex={0}
          ref={(element => sectionListRef.current[index] = element)}
          dangerouslySetInnerHTML={{ __html: section.bannerDescription }}
          onKeyDown={handleArrowFocus}
        />
      )}
    </>
  )
}
