import React from 'react';
import Section from '../Section/Section.jsx';

export function TopBarItem({
  isMobile,
  sidebarId,
  onMobileClick,
  title,
  icon,
  onMouseEnter,
  activeItem,
  link,
  bannerDescription,
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
  // The panel below is a disclosure, not a menu: announce expanded state
  // only where a panel actually exists.
  const hasPanel = Boolean(section && section.items);

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
      onMouseEnter={section || bannerDescription ? onMouseEnter : undefined}
      onFocus={isMobile ? undefined : onMouseEnter}
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
          const trigger = sectionListRef.current[index]?.querySelector(
            '.mg-mega-content__finder-trigger'
          );
          if (trigger) {
            event.preventDefault();
            trigger.click();
            return;
          }
        }
        handleOnKeyDown(event);
      }}
    >
      {/* Render link if no children and link URL exists, otherwise just show title */}
      {/* {!children && link && link.url ? <a href={link.url}>{title}</a> : title} */}
      {isMobile ? (
        <button
          type="button"
          className="mg-mega-topbar__item-link"
          ref={ref}
          onClick={onMobileClick}
          aria-haspopup="dialog"
          aria-controls={sidebarId}
          data-vf-analytics-label="Mega menu: Section"
        >
          {label}
        </button>
      ) : link && link.url ? (
        <a
          className="mg-mega-topbar__item-link"
          href={link.url}
          ref={ref}
          aria-expanded={hasPanel ? String(isActive) : undefined}
        >
          {label}
        </a>
      ) : (
        <button
          className="mg-mega-topbar__item-link"
          ref={ref}
          aria-expanded={hasPanel ? String(isActive) : undefined}
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
