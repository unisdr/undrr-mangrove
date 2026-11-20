import React, { useId } from 'react';
import Section from '../Section/Section.jsx';
import Chevron from '../Chevron';

export function TopBarItem({
  isMobile,
  sidebarId,
  onMobileClick,
  title,
  icon,
  onToggle,
  activeItem,
  link,
  handleOnKeyDown,
  ref,
  section,
  sections,
  sectionListRef,
  itemListRef,
  index,
  enableFilter,
  enableSiteSearch,
  searchUrl,
  onNavigate,
  onCloseSection,
  labels,
}) {
  const isActive = index === activeItem;
  const panelId = useId();
  // The panel below is a disclosure, not a menu (WAI-ARIA APG disclosure
  // navigation). Section renders a panel for child items or for banner copy
  // alone; only those triggers announce an expanded state.
  const hasPanel = Boolean(
    section && (section.items || section.bannerDescription)
  );

  const trigger = {
    className: 'mg-mega-topbar__item-link',
    ref,
    onKeyDown: handleOnKeyDown,
  };

  const label = (
    <>
      {icon && (
        <span
          className={`mg-mega-topbar__item-icon ${icon}`}
          aria-hidden="true"
        />
      )}
      {title}
    </>
  );

  return (
    <li
      className={`mg-mega-topbar__item ${isActive ? 'mg-mega-topbar__item--active' : ''}`}
      // Only the finder shortcut listens here, because it must also work from
      // inside the open panel; bar navigation keys belong to the trigger.
      onKeyDown={event => {
        const isEditable =
          event.target.isContentEditable ||
          event.target.closest('input, textarea, select, [contenteditable]');
        const shortcut =
          event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);
        if (
          isActive &&
          enableFilter &&
          shortcut &&
          !isEditable &&
          !event.altKey &&
          !event.shiftKey &&
          !event.repeat &&
          !event.isComposing &&
          !event.defaultPrevented
        ) {
          const finder = sectionListRef.current[index]?.querySelector(
            '.mg-mega-content__finder-trigger'
          );
          if (finder) {
            event.preventDefault();
            finder.click();
          }
        }
      }}
    >
      {/* A trigger with a panel is always a disclosure button, even when the
          section has a landing page; the landing link is inside the panel.
          See "Design principles" in MegaMenu.mdx. */}
      {isMobile ? (
        <button
          type="button"
          {...trigger}
          onClick={onMobileClick}
          aria-haspopup="dialog"
          aria-controls={sidebarId}
          data-vf-analytics-label="Mega menu: Section"
        >
          {label}
        </button>
      ) : hasPanel ? (
        <button
          type="button"
          {...trigger}
          onClick={onToggle}
          aria-expanded={String(isActive)}
          aria-controls={panelId}
          data-vf-analytics-label="Mega menu: Section"
        >
          {label}
          <Chevron className="mg-mega-topbar__item-chevron" />
        </button>
      ) : link && link.url ? (
        <a {...trigger} href={link.url}>
          {label}
        </a>
      ) : (
        <button
          type="button"
          {...trigger}
          data-vf-analytics-label="Mega menu: Section"
        >
          {label}
        </button>
      )}

      <Section
        section={section}
        sections={sections}
        isActive={isActive}
        index={index}
        panelId={panelId}
        sectionListRef={sectionListRef}
        itemListRef={itemListRef}
        enableFilter={enableFilter}
        enableSiteSearch={enableSiteSearch}
        searchUrl={searchUrl}
        onNavigate={onNavigate}
        onClose={onCloseSection}
        labels={labels}
      />
    </li>
  );
}
