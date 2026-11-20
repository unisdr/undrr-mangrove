import React, { useState, useRef, useEffect, useId } from 'react';
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
  panelId,
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
  const destinationsId = useId();

  // Landmarks inside every section share a name unless it is derived from the
  // section itself, which leaves a screen-reader landmark list unusable.
  const sectionTitle = section?.title || 'Menu section';

  const showCategories = Boolean(
    hasIntroduction &&
    section.items.length > 0 &&
    section.items[0].items?.length > 0
  );
  const chosen = showCategories ? section.items[itemIndex] : null;

  // Arrow keys only supplement Tab (see "Design principles" in MegaMenu.mdx),
  // and land only on what can take focus: never the CSS-hidden mobile list, a
  // link without an address or a disabled control.
  const isShown = (element, panel) => {
    if (typeof element.checkVisibility === 'function')
      return element.checkVisibility({ visibilityProperty: true });
    const view = element.ownerDocument.defaultView;
    for (
      let node = element;
      node && node !== panel;
      node = node.parentElement
    ) {
      const style = view.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden')
        return false;
    }
    return true;
  };

  const getArrowTargets = () => {
    const panel = sectionListRef?.current?.[index];
    if (!panel) return [];
    return Array.from(
      panel.querySelectorAll(
        'a[href], button, input, select, textarea, summary, iframe, [tabindex]'
      )
    ).filter(
      element =>
        !element.disabled &&
        element.getAttribute('tabindex') !== '-1' &&
        !element.closest('[inert]') &&
        isShown(element, panel)
    );
  };

  const follows = (element, reference) =>
    Boolean(
      // compareDocumentPosition returns a bitmask; this is its documented use.
      // eslint-disable-next-line no-bitwise
      reference.compareDocumentPosition(element) &
      Node.DOCUMENT_POSITION_FOLLOWING
    );

  const landingLink = className => (
    <a href={section.bannerButton.url} className={className}>
      {section.bannerButton.label || labels.overviewLabel}
    </a>
  );

  // Nested destinations, `depth` levels deep.
  const renderLinks = (items, depth) =>
    items.map((item, key) => (
      <li key={key}>
        <a href={item.url}>{item.title}</a>
        {depth > 1 && item.items?.length > 0 && (
          <ul>{renderLinks(item.items, depth - 1)}</ul>
        )}
      </li>
    ));

  // The chosen category's page, or the section's landing page when there are
  // no categories and no banner offers it, leads the desktop destinations.
  let overview = null;
  if (chosen) {
    if (chosen.url) overview = { url: chosen.url, title: chosen.title };
  } else if (!hasIntroduction && section?.bannerButton?.url) {
    overview = {
      url: section.bannerButton.url,
      title: section.bannerButton.label || section.title,
    };
  }

  const handleArrowFocus = e => {
    if (e.target.closest('.mg-mega-menu-finder')) return;
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    // Leave caret movement and option lists in form fields alone.
    if (
      e.target.isContentEditable ||
      e.target.closest('input, textarea, select, [contenteditable]')
    )
      return;
    e.preventDefault();
    e.stopPropagation();

    // Work from where focus actually is, so pointer clicks and Tab presses
    // between key presses never leave a stale position behind. Document
    // order also gives a focused column or the panel itself a place.
    const focused = e.target.ownerDocument.activeElement;
    const targets = getArrowTargets();

    if (e.key === 'Home') targets[0]?.focus();
    if (e.key === 'End') targets[targets.length - 1]?.focus();
    if (e.key === 'ArrowDown') {
      targets.find(target => follows(target, focused))?.focus();
    }
    if (e.key === 'ArrowUp') {
      const previous = targets
        .filter(
          target =>
            target !== focused &&
            !follows(target, focused) &&
            !target.contains(focused)
        )
        .pop();
      // Up from the first entry returns to the panel's own button.
      (previous || itemListRef.current?.[index])?.focus();
    }
  };

  // Both panel shapes share their disclosure wiring.
  const panelProps = {
    id: panelId,
    'aria-label': sectionTitle,
    'aria-hidden': !isActive,
    inert: !isActive ? true : undefined,
    role: 'region',
    tabIndex: -1,
    ref: element => {
      sectionListRef.current[index] = element;
    },
    onKeyDown: handleArrowFocus,
  };

  return (
    <>
      {section && section.items && (
        // The panel takes focus only from script (↓ on its button); its links
        // and buttons are the tab stops.
        <article
          className={`mg-mega-content${enableFilter && hasIntroduction ? ' mg-mega-content--filterable' : ''} | mg-container-full-width`}
          {...panelProps}
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
          {hasIntroduction && (
            <nav
              className="mg-mega-content__left"
              aria-label={`${sectionTitle} categories`}
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
                  {(section.bannerButton?.label || section.bannerButton?.url) &&
                    landingLink('mg-button mg-button-primary')}
                </section>
                {showCategories && (
                  <ul className="mg-mega-content__section-list">
                    {section.items.map((item, index) => (
                      <li
                        key={index}
                        className="mg-mega-content__section-list-item"
                        onMouseEnter={() => setItemIndex(index)}
                      >
                        {/* A disclosure: focus alone never switches it. */}
                        <button
                          type="button"
                          className={`mg-mega-content__section-list-link ${
                            itemIndex === index
                              ? 'mg-mega-content__section-list-link--active'
                              : ''
                          }`}
                          aria-expanded={String(itemIndex === index)}
                          aria-controls={destinationsId}
                          data-vf-analytics-label="Mega menu: Category"
                          onClick={() => setItemIndex(index)}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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
            >
              {/* Mobile version - shows all nested items */}
              <ul className="mg-mega-content__menu--mobile">
                {renderLinks(section.items, 3)}
              </ul>

              {/* Desktop version: the chosen category's destinations, or
                  every item when there are no categories. */}
              <ul
                id={destinationsId}
                className="mg-mega-content__menu--desktop"
                aria-label={chosen ? chosen.title : undefined}
              >
                {overview && (
                  <li className="mg-mega-content__overview">
                    <a href={overview.url}>{overview.title}</a>
                  </li>
                )}
                {renderLinks(chosen ? chosen.items || [] : section.items, 2)}
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
          {...panelProps}
        >
          {/* `display: contents` keeps the authored markup laid out as a
              direct child of the panel, as it was before this wrapper. */}
          <div
            className="mg-mega-content__banner-only"
            dangerouslySetInnerHTML={{ __html: section.bannerDescription }}
          />
          {section.bannerButton?.url &&
            landingLink(
              'mg-button mg-button-primary mg-mega-content__banner-only-cta'
            )}
        </article>
      )}
    </>
  );
}
