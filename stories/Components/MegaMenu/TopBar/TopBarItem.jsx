import React, { useId } from 'react';
import Section from '../Section/Section.jsx';

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
      {/* A trigger with a panel is always a disclosure button, even when the
          section has a landing page: a link that also expands is ambiguous
          and Enter could do only one of the two. The landing link is offered
          inside the panel instead. Sections without a panel stay links. */}
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
      ) : hasPanel ? (
        <button
          type="button"
          className="mg-mega-topbar__item-link"
          ref={ref}
          onClick={onToggle}
          aria-expanded={String(isActive)}
          aria-controls={panelId}
          data-vf-analytics-label="Mega menu: Section"
        >
          {label}
        </button>
      ) : link && link.url ? (
        <a className="mg-mega-topbar__item-link" href={link.url} ref={ref}>
          {label}
        </a>
      ) : (
        <button
          type="button"
          className="mg-mega-topbar__item-link"
          ref={ref}
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
