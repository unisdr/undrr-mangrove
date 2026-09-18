import React, { useState, useRef, useEffect } from 'react';

/**
 * Trust boundary: `bannerDescription` is rendered unescaped, on purpose.
 *
 * Two sites in this file render `section.bannerDescription` as markup rather
 * than text — the banner blurb in a section that has child items, and the whole
 * call-to-action panel in a section that has none. `Sidebar.jsx` renders the
 * same value the same way for the mobile overlay. None of the three sanitise,
 * and `.includes('<')` at the first site is a routing check, not a filter: it
 * decides whether to wrap the string in a `<p>`, and anything with a `<` in it
 * goes through as markup.
 *
 * That is deliberate. Banner copy is authored, and it carries links, inline
 * emphasis and — in the no-items shape — a whole block of layout that the
 * component has no equivalent prop for. The value arrives through the
 * `sections` prop, so the boundary is the consumer's own code: whatever builds
 * the sections array owns sanitising it. Several sibling components do sanitise
 * with DOMPurify (`TextCta`, `Drawer`, the Cards), so this file diverging from
 * them is worth stating rather than leaving to be read as an oversight.
 *
 * Note that most integrations build `sections` in a wrapper from a CMS or API
 * response rather than hand-writing it, and `data-sections` accepts the same
 * structure as JSON on the hydration host. Sanitise `bannerDescription` where
 * that array is built. See "Banner HTML trust contract" in MegaMenu.mdx for the
 * consumer-facing statement of the same contract.
 */

export default function Section({
  section,
  index,
  sectionListRef,
  itemListRef,
}) {
  // Note: We render both mobile and desktop content structures.
  // CSS media queries control which version is visible.
  const [itemIndex, setItemIndex] = useState(0);
  const [focusIndex, setFocusIndex] = useState(0);
  const [focusableElements, setFocusableElements] = useState([]);

  // Landmarks inside every section share a name unless it is derived from the
  // section itself, which leaves a screen-reader landmark list unusable.
  const sectionTitle = section?.title || 'Menu section';

  const asideRef = useRef(null);
  const contentRef = useRef(null);

  const handleArrowFocus = e => {
    // Prevent default browser scrolling behavior for arrow keys
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (e.key === 'ArrowDown' || e.key === 'Tab') {
      if (focusIndex < focusableElements?.length - 1) {
        setFocusIndex(prevIndex => prevIndex + 1);
      } else {
        setFocusIndex(0);
        itemListRef.current?.[index + 1]?.focus();
      }
    }

    if (e.key === 'ArrowUp' || (e.shiftKey && e.key === 'Tab')) {
      if (focusIndex > 0) {
        setFocusIndex(prevIndex => prevIndex - 1);
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

          const firstLinkIndex = focusableElements.findIndex(
            el => el === firstLink
          );
          if (firstLinkIndex !== -1) {
            setFocusIndex(firstLinkIndex);
          }
        } else {
          contentRef.current?.focus();
          const firstContentElement = focusableElements.filter(
            item => item === contentRef.current
          );
          firstContentElement[0] &&
            setFocusIndex(focusableElements.indexOf(firstContentElement[0]));
        }
      }
    }
  };

  useEffect(() => {
    const tabableElements = sectionListRef?.current?.[index]?.querySelectorAll(
      'audio, button, a, canvas, details, iframe, input, select, summary, textarea, video, [tabindex]'
    );

    setFocusableElements(Array.from(tabableElements || []));
  }, [sectionListRef, index, itemIndex]);

  useEffect(() => {
    if (focusableElements.length > 0 && focusIndex >= 0) {
      focusableElements[focusIndex]?.focus();
    }
  }, [focusIndex]);

  return (
    <>
      {section && section.items && (
        <article
          className="mg-mega-content | mg-container-full-width"
          aria-label={sectionTitle}
          aria-live="polite"
          tabIndex={0}
          ref={element => (sectionListRef.current[index] = element)}
          onKeyDown={handleArrowFocus}
          role="region"
        >
          {/* Only show the left area if there are child items and heading */}
          {section.bannerHeading &&
            section.bannerDescription &&
            section.items && (
              <nav
                className="mg-mega-content__left"
                aria-label={`${sectionTitle} categories`}
                ref={asideRef}
                tabIndex={0}
              >
                <section className="mg-mega-content__banner">
                  <header>{section.bannerHeading}</header>
                  {/* Authored banner copy, rendered as-is so its links and
                      inline markup survive. The `<` check routes between markup
                      and text; it does not filter. See the trust boundary note
                      at the top of this file. */}
                  {section.bannerDescription.includes('<') ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: section.bannerDescription,
                      }}
                    />
                  ) : (
                    <p>{section.bannerDescription}</p>
                  )}
                  {section.bannerButton?.label && (
                    <a
                      href={section.bannerButton.url}
                      className="mg-button mg-button-primary"
                    >
                      {section.bannerButton.label}
                    </a>
                  )}
                </section>
                {section.items.length > 0 &&
                section.items[0].items &&
                section.items[0].items.length > 0 ? (
                  <ul
                    className="mg-mega-content__section-list"
                    role="menu"
                    aria-label="Categories"
                  >
                    {section.items.map((item, index) => (
                      <li
                        key={index}
                        className="mg-mega-content__section-list-item"
                        onMouseEnter={() => setItemIndex(index)}
                        role="none"
                      >
                        <a
                          className={`mg-mega-content__section-list-link ${
                            itemIndex === index
                              ? 'mg-mega-content__section-list-link--active'
                              : ''
                          }`}
                          href={item.url}
                          aria-current={
                            itemIndex === index ? 'page' : undefined
                          }
                          onFocus={() => setItemIndex(index)}
                          role="menuitem"
                          aria-haspopup={
                            item.items && item.items.length > 0
                              ? 'true'
                              : undefined
                          }
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </nav>
            )}
          {section.items && (
            <nav
              className="mg-mega-content__right"
              aria-label={`${sectionTitle} submenu`}
              ref={contentRef}
              tabIndex={0}
            >
              {/* Mobile version - shows all nested items */}
              <ul
                role="menu"
                aria-label="Submenu items"
                className="mg-mega-content__menu--mobile"
              >
                {section.items.map((item, index) => (
                  <li key={index} role="none">
                    <a
                      href={item.url}
                      role="menuitem"
                      aria-haspopup={item.items ? 'true' : undefined}
                    >
                      {item.title}
                    </a>
                    {item.items && item.items.length > 0 && (
                      <ul role="menu" aria-label={`${item.title} submenu`}>
                        {item.items.map((subItem, subIndex) => (
                          <li key={subIndex} role="none">
                            <a
                              href={subItem.url}
                              role="menuitem"
                              aria-haspopup={subItem.items ? 'true' : undefined}
                            >
                              {subItem.title}
                            </a>
                            {/* Render third level if exists */}
                            {subItem.items && (
                              <ul
                                role="menu"
                                aria-label={`${subItem.title} nested submenu`}
                              >
                                {subItem.items.map(
                                  (nestedItem, nestedIndex) => (
                                    <li key={nestedIndex} role="none">
                                      <a href={nestedItem.url} role="menuitem">
                                        {nestedItem.title}
                                      </a>
                                    </li>
                                  )
                                )}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>

              {/* Desktop version - shows items based on hover state */}
              {/* Key forces remount on tab change, retriggering CSS animations */}
              <ul
                key={`desktop-menu-${itemIndex}`}
                role="menu"
                aria-label="Submenu items"
                className="mg-mega-content__menu--desktop"
              >
                {section.items[itemIndex]?.items
                  ? section.items[itemIndex].items.map((subItem, subIndex) => (
                      <li key={subIndex} role="none">
                        <a
                          href={subItem.url}
                          role="menuitem"
                          aria-haspopup={subItem.items ? 'true' : undefined}
                        >
                          {subItem.title}
                        </a>
                        {subItem.items && (
                          <ul
                            role="menu"
                            aria-label={`${subItem.title} submenu`}
                          >
                            {subItem.items.map((nestedItem, nestedIndex) => (
                              <li key={nestedIndex} role="none">
                                <a href={nestedItem.url} role="menuitem">
                                  {nestedItem.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))
                  : section.items.map((item, index) => (
                      <li key={index} role="none">
                        <a href={item.url} role="menuitem">
                          {item.title}
                        </a>
                      </li>
                    ))}
              </ul>
            </nav>
          )}

          {/*  If there are no child items just show the banner description in a call to action style */}
        </article>
      )}
      {/* A section with no child items renders its banner description as the
          whole panel, so this markup is the caller's layout and not just inline
          copy. Same contract as above: see the note at the top of this file. */}
      {section && !section.items && section.bannerDescription && (
        <article
          className="mg-mega-content | mg-container-full-width"
          aria-live="polite"
          aria-label={sectionTitle}
          tabIndex={0}
          ref={element => (sectionListRef.current[index] = element)}
          dangerouslySetInnerHTML={{ __html: section.bannerDescription }}
          onKeyDown={handleArrowFocus}
        />
      )}
    </>
  );
}
