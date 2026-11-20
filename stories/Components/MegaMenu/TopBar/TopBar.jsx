import React, { useEffect, useRef } from 'react';
import { useRailDrag } from './useRailDrag';
import { TopBarItem } from './TopBarItem';
import { TopBarMobileIconButton } from './TopBarMobileIconButton.jsx';

export function TopBar({
  isMobile,
  openMobileSection,
  sidebarId,
  labels,
  toggleItem,
  toggleShowSidebar,
  showSidebar,
  sections,
  activeItem,
  activateItem,
  sectionListRef,
  itemListRef,
  logoSrc,
  logoAlt = '',
  logoHref = '/',
  logoWidth,
  logoHeight,
  enableFilter = false,
  enableSiteSearch,
  searchUrl,
  onNavigate,
}) {
  const railDrag = useRailDrag(isMobile);
  const pendingPanelFocusRef = useRef(null);
  useEffect(() => {
    if (pendingPanelFocusRef.current === activeItem) {
      sectionListRef.current?.[activeItem]?.focus();
      pendingPanelFocusRef.current = null;
    }
  }, [activeItem, sectionListRef]);

  const handleFocusByArrows = (e, index) => {
    // Optional APG disclosure navigation keys, on the top-level trigger only.
    const itemRef = itemListRef?.current;
    if (
      [
        'ArrowDown',
        'ArrowUp',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
      ].includes(e.key)
    ) {
      e.preventDefault();
    }

    // Refs of removed sections stay behind as null entries.
    const items = (itemRef || []).filter(Boolean);
    if (e.key === 'Home') items[0]?.focus();
    if (e.key === 'End') items[items.length - 1]?.focus();

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const rtl = window.getComputedStyle(e.currentTarget).direction === 'rtl';
      const step = (e.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
      itemRef[index + step]?.focus();
    }
    if (e.key === 'ArrowDown' && sectionListRef.current?.[index]) {
      if (activeItem === index) sectionListRef.current[index].focus();
      else {
        pendingPanelFocusRef.current = index;
        activateItem(index);
      }
    }
  };

  const menuItems = sections.map((section, index) => (
    <TopBarItem
      isMobile={isMobile}
      sidebarId={sidebarId}
      onMobileClick={event => {
        // Safari does not focus buttons on touch; save a reliable return target.
        event.currentTarget.focus({ preventScroll: true });
        openMobileSection(index);
      }}
      key={index}
      index={index}
      ref={element => {
        itemListRef.current[index] = element;
      }}
      title={section.title}
      icon={section.icon}
      link={section.bannerButton}
      onToggle={() => toggleItem(index)}
      activeItem={activeItem}
      section={section}
      sections={sections}
      handleOnKeyDown={e => {
        if (isMobile && e.key === 'ArrowDown') {
          e.preventDefault();
          openMobileSection(index);
        } else {
          handleFocusByArrows(e, index);
        }
      }}
      sectionListRef={sectionListRef}
      itemListRef={itemListRef}
      enableFilter={enableFilter && !isMobile}
      enableSiteSearch={enableSiteSearch}
      searchUrl={searchUrl}
      onNavigate={onNavigate}
      onCloseSection={() => activateItem(null)}
      labels={labels}
    >
      {section.sections}
    </TopBarItem>
  ));

  // Branded variant: logo + nav wrapped in a <div>
  if (logoSrc) {
    return (
      <div className="mg-mega-topbar mg-mega-topbar--branded | mg-container-full-width">
        <a
          className="mg-mega-topbar__logo"
          href={logoHref}
          aria-label={logoAlt || 'Home'}
        >
          <img
            className="mg-mega-topbar__logo-img"
            src={logoSrc}
            alt={logoAlt}
            {...(logoWidth != null ? { width: logoWidth } : {})}
            {...(logoHeight != null ? { height: logoHeight } : {})}
          />
        </a>

        {/* Mobile/Tablet hamburger button - hidden on desktop via CSS */}
        <TopBarMobileIconButton
          sidebarId={sidebarId}
          labels={labels}
          isOpen={showSidebar}
          onClick={() => toggleShowSidebar()}
        />

        <ul className="mg-mega-topbar__nav" {...railDrag}>
          {/* Mobile labels open the corresponding section in the dialog. */}
          {menuItems}
        </ul>
      </div>
    );
  }

  // Keep the trigger outside the scrolling list, as in the branded variant.
  return (
    <div className="mg-mega-topbar | mg-container-full-width">
      <TopBarMobileIconButton
        sidebarId={sidebarId}
        labels={labels}
        isOpen={showSidebar}
        onClick={() => toggleShowSidebar()}
      />
      <ul className="mg-mega-topbar__nav" {...railDrag}>
        {menuItems}
      </ul>
    </div>
  );
}
