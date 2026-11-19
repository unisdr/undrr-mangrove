import React, { useState, useRef, useEffect } from 'react';
import MenuFinder from './MenuFinder';

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
  sections,
  isActive,
  index,
  sectionListRef,
  itemListRef,
  enableFilter = false,
  enableSiteSearch = true,
  searchUrl = '/search',
  onNavigate,
  onClose,
  labels,
}) {
  // Note: We render both mobile and desktop content structures.
  // CSS media queries control which version is visible.
  const [filterQuery, setFilterQuery] = useState('');
  const [finderOpen, setFinderOpen] = useState(false);
  const hasIntroduction = Boolean(
    section?.bannerHeading && section?.bannerDescription && section?.items
  );
  const filtering = enableFilter && finderOpen && isActive && hasIntroduction;
  const finderTriggerRef = useRef(null);
  const [shortcutLabel, setShortcutLabel] = useState('Ctrl K');
  useEffect(() => {
    const platform = navigator.userAgentData?.platform || navigator.platform;
    if (/Mac|iPhone|iPad|iPod/i.test(platform)) setShortcutLabel('⌘K');
  }, []);
  const restoreFinderFocusRef = useRef(false);
  useEffect(() => {
    if (!isActive || !enableFilter || !hasIntroduction) {
      // Resizing or removing the owning utility dismisses the finder for good.
      // Its former footer may be hidden/removed; use the surviving nav control.
      if (finderOpen && isActive) itemListRef.current[index]?.focus();
      restoreFinderFocusRef.current = false;
      setFilterQuery('');
      setFinderOpen(false);
    }
  }, [isActive, enableFilter, hasIntroduction, finderOpen, itemListRef, index]);
  useEffect(() => {
    if (!finderOpen && restoreFinderFocusRef.current) {
      restoreFinderFocusRef.current = false;
      finderTriggerRef.current?.focus();
    }
  }, [finderOpen]);
  const backToMenu = () => {
    restoreFinderFocusRef.current = true;
    setFilterQuery('');
    setFinderOpen(false);
  };
  const finderTrigger = enableFilter && (
    <button
      ref={finderTriggerRef}
      type="button"
      className="mg-mega-menu-finder__action mg-mega-content__finder-trigger"
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+k Control+k"
      data-vf-analytics-label="Mega menu: Finder"
      onClick={() => setFinderOpen(true)}
    >
      <span>{labels.menuFilterLabel}</span>
      <kbd className="mg-mega-content__finder-shortcut" aria-hidden="true">
        {shortcutLabel}
      </kbd>
    </button>
  );
  const [itemIndex, setItemIndex] = useState(0);

  // Landmarks inside every section share a name unless it is derived from the
  // section itself, which leaves a screen-reader landmark list unusable.
  const sectionTitle = section?.title || 'Menu section';

  const asideRef = useRef(null);
  const contentRef = useRef(null);

  // The panel renders both a mobile and a desktop destination list and CSS
  // hides one of them. Arrow keys must only land on the list that is shown,
  // otherwise focus() on a hidden link fails silently and the key does nothing.
  const isListShown = list =>
    !list ||
    list.ownerDocument.defaultView.getComputedStyle(list).display !== 'none';

  const getArrowTargets = () => {
    const panel = sectionListRef?.current?.[index];
    if (!panel) return [];
    const hiddenLists = Array.from(
      panel.querySelectorAll(
        '.mg-mega-content__menu--mobile, .mg-mega-content__menu--desktop'
      )
    ).filter(list => !isListShown(list));
    return Array.from(
      panel.querySelectorAll(
        'audio, button, a, canvas, details, iframe, input, select, summary, textarea, video, [tabindex]'
      )
    ).filter(
      element =>
        // The two columns take focus so Tab users can scroll them; arrow keys
        // step between the links and controls inside them instead.
        element !== asideRef.current &&
        element !== contentRef.current &&
        !hiddenLists.some(list => list.contains(element))
    );
  };

  const handleArrowFocus = e => {
    if (e.target.closest('.mg-mega-menu-finder')) return;
    // Tab and Shift+Tab follow the browser's own order. The panel sits
    // directly after its trigger, so leaving either end reaches the
    // neighbouring top-bar items without help.
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key))
      return;
    // Prevent default browser scrolling behavior for arrow keys
    e.preventDefault();
    e.stopPropagation();

    // Work from where focus actually is, so pointer clicks and Tab presses
    // between arrow presses do not leave a stale position behind.
    const targets = getArrowTargets();
    const current = targets.indexOf(e.target.ownerDocument.activeElement);

    if (e.key === 'ArrowDown') {
      if (current < targets.length - 1) targets[current + 1].focus();
      else itemListRef.current?.[index + 1]?.focus();
    }

    if (e.key === 'ArrowUp') {
      if (current > 0) targets[current - 1].focus();
      else itemListRef.current?.[index]?.focus();
    }

    // Left and right cross between the category column and the
    // destinations column, only when there is a category column.
    if (!asideRef.current) return;

    if (e.key === 'ArrowLeft') {
      (
        asideRef.current.querySelector(
          '.mg-mega-content__section-list-link--active'
        ) || asideRef.current
      ).focus();
    }

    if (e.key === 'ArrowRight') {
      const firstLink = Array.from(
        contentRef.current?.querySelectorAll('ul > li > a') || []
      ).find(link => targets.includes(link));
      (firstLink || contentRef.current)?.focus();
    }
  };

  return (
    <>
      {section && section.items && (
        <article
          className={`mg-mega-content${enableFilter && hasIntroduction ? ' mg-mega-content--filterable' : ''} | mg-container-full-width`}
          aria-label={sectionTitle}
          aria-live="polite"
          aria-hidden={!isActive}
          inert={!isActive ? true : undefined}
          tabIndex={0}
          ref={element => {
            sectionListRef.current[index] = element;
          }}
          onKeyDown={handleArrowFocus}
          role="region"
        >
          {filtering && (
            <MenuFinder
              sections={sections}
              query={filterQuery}
              onQueryChange={setFilterQuery}
              onBack={backToMenu}
              labels={labels}
              enableSiteSearch={enableSiteSearch}
              searchUrl={searchUrl}
              onNavigate={onNavigate}
              onClose={onClose}
            />
          )}
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
                <div
                  className={
                    enableFilter
                      ? 'mg-mega-content__left-scroll'
                      : 'mg-mega-content__left-contents'
                  }
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
                </div>
                {enableFilter && (
                  <div className="mg-mega-content__finder-footer">
                    {finderTrigger}
                  </div>
                )}
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
              <ul
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
          aria-hidden={!isActive}
          inert={!isActive ? true : undefined}
          aria-label={sectionTitle}
          tabIndex={0}
          ref={element => {
            sectionListRef.current[index] = element;
          }}
          dangerouslySetInnerHTML={{ __html: section.bannerDescription }}
          onKeyDown={handleArrowFocus}
        />
      )}
    </>
  );
}
