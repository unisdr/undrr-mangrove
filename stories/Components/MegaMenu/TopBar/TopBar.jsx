import React, { useEffect, useRef } from 'react';
import { TopBarItem } from './TopBarItem';
import { TopBarMobileIconButton } from './TopBarMobileIconButton.jsx';

export function TopBar({
  isMobile,
  openMobileSection,
  sidebarId,
  labels,
  handleItemHover,
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
}) {
  const pendingPanelFocusRef = useRef(null);
  useEffect(() => {
    if (pendingPanelFocusRef.current === activeItem) {
      sectionListRef.current?.[activeItem]?.focus();
      pendingPanelFocusRef.current = null;
    }
  }, [activeItem, sectionListRef]);

  const handleFocusByArrows = (e, index) => {
    // Prevent default browser scrolling for arrow keys
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

    const itemRef = itemListRef?.current;

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
      bannerDescription={section.bannerDescription}
      link={section.bannerButton}
      onMouseEnter={() => {
        if (!isMobile) handleItemHover(index);
      }}
      activeItem={activeItem}
      section={section}
      handleOnKeyDown={e => {
        if (isMobile && e.key === 'ArrowDown') {
          e.preventDefault();
          e.currentTarget.querySelector('button')?.focus();
          openMobileSection(index);
        } else {
          handleFocusByArrows(e, index);
        }
      }}
      sectionListRef={sectionListRef}
      itemListRef={itemListRef}
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

        <ul className="mg-mega-topbar__nav">
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
      <ul className="mg-mega-topbar__nav">{menuItems}</ul>
    </div>
  );
}
