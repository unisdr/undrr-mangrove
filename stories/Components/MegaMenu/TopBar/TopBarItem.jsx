import React from 'react';
import Section from '../Section/Section.jsx';

export function TopBarItem({
  inert,
  title,
  icon,
  onMouseEnter,
  activeItem,
  link,
  bannerDescription,
  handleOnKeyDown,
  ref,
  section,
  sectionListRef,
  itemListRef,
  index,
}) {
  let isActive = index === activeItem;
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
      inert={inert ? true : undefined}
      aria-hidden={inert ? true : undefined}
      className={`mg-mega-topbar__item ${isActive ? 'mg-mega-topbar__item--active' : ''}`}
      onMouseEnter={section || bannerDescription ? onMouseEnter : undefined}
      onFocus={onMouseEnter}
      onKeyDown={handleOnKeyDown}
    >
      {/* Render link if no children and link URL exists, otherwise just show title */}
      {/* {!children && link && link.url ? <a href={link.url}>{title}</a> : title} */}
      {link && link.url ? (
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
        >
          {label}
        </button>
      )}

      <Section
        section={section}
        index={index}
        sectionListRef={sectionListRef}
        itemListRef={itemListRef}
      />
    </li>
  );
}
