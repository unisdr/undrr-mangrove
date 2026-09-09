import React, { useLayoutEffect, useRef, useState, useId } from 'react';

const EMPTY_PATH = [];

// Ordinary navigation links and drill-in buttons deliberately use native Tab
// behaviour, rather than application-menu roles and roving tabindex.
export function Sidebar({
  sections,
  open,
  present = open,
  onClose,
  labels,
  id,
}) {
  const [path, setPath] = useState(EMPTY_PATH);
  const openerRef = useRef(null);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const listRef = useRef(null);
  const historyRef = useRef([]);
  const returningRef = useRef(null);
  const titleId = useId();
  let current = null;
  let items = sections;
  let validPath = true;
  for (const index of path) {
    current = items?.[index];
    if (!current) {
      validPath = false;
      break;
    }
    items = current.items || [];
  }
  useLayoutEffect(() => {
    if (!validPath) {
      historyRef.current = [];
      returningRef.current = null;
      setPath(EMPTY_PATH);
    }
  }, [validPath]);

  useLayoutEffect(() => {
    if (!open) {
      const wrapper = dialogRef.current?.closest('.mg-mega-wrapper');
      const desktop = window.matchMedia?.('(min-width: 900px)').matches;
      const target = desktop
        ? wrapper?.querySelector('.mg-mega-topbar__item-link')
        : openerRef.current;
      if (openerRef.current) target?.focus();
      openerRef.current = null;
      return;
    }
    setPath(EMPTY_PATH);
    historyRef.current = [];
    returningRef.current = null;
    const opener =
      dialogRef.current
        .closest('.mg-mega-wrapper')
        ?.querySelector('.mg-mega-topbar-mobile__icon-button') ||
      document.activeElement;
    openerRef.current = opener;
    const containFocus = event => {
      if (!dialogRef.current?.contains(event.target))
        headingRef.current?.focus();
    };
    document.addEventListener('focusin', containFocus);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    headingRef.current?.focus();
    return () => {
      document.removeEventListener('focusin', containFocus);
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!present) {
      setPath(EMPTY_PATH);
      historyRef.current = [];
      returningRef.current = null;
    }
  }, [present]);

  useLayoutEffect(() => {
    if (!open) return;
    const saved = returningRef.current;
    if (saved) {
      listRef.current
        ?.querySelectorAll('[data-mg-menu-entry]')
        [saved.index]?.focus({ preventScroll: true });
      dialogRef.current.scrollTop = saved.scrollTop;
      returningRef.current = null;
    } else {
      dialogRef.current.scrollTop = 0;
      headingRef.current?.focus();
    }
  }, [path, open]);

  // A CMS/React update can remove the focused link without changing the path.
  // Leave surviving focus alone, but recover to the current heading if it vanished.
  useLayoutEffect(() => {
    if (open && !dialogRef.current?.contains(document.activeElement)) {
      headingRef.current?.focus();
    }
  });

  const enter = index => {
    historyRef.current.push({ index, scrollTop: dialogRef.current.scrollTop });
    setPath(previous => [...previous, index]);
  };
  const back = () => {
    returningRef.current = historyRef.current.pop();
    setPath(previous => previous.slice(0, -1));
  };
  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.preventDefault();
      onClose();
    }
    if (event.key === 'Tab') {
      const focusable = Array.from(
        dialogRef.current.querySelectorAll(
          'a[href], button, input, select, textarea, summary, iframe, [contenteditable="true"], [tabindex], audio[controls], video[controls]'
        )
      ).filter(element => {
        if (
          element.tabIndex < 0 ||
          element.matches(':disabled, input[type="hidden"]') ||
          element.closest('[hidden], [inert]')
        )
          return false;
        for (
          let details = element.parentElement?.closest('details:not([open])');
          details;
          details = details.parentElement?.closest('details:not([open])')
        ) {
          if (details.querySelector(':scope > summary') !== element)
            return false;
        }
        for (
          let ancestor = element;
          ancestor && ancestor !== dialogRef.current;
          ancestor = ancestor.parentElement
        ) {
          const style = window.getComputedStyle(ancestor);
          if (style.display === 'none' || style.visibility === 'hidden')
            return false;
        }
        return true;
      });
      const first = focusable[0];
      const last = focusable.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === headingRef.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };
  const overviewUrl = current?.url || current?.bannerButton?.url;

  return (
    <div
      id={id}
      ref={dialogRef}
      className={`mg-mega-mobile-sidebar mg-mega-mobile-sidebar--progressive${open ? ' mg-mega-mobile-sidebar--open' : ''}`}
      role="dialog"
      aria-modal={open ? 'true' : undefined}
      aria-labelledby={titleId}
      hidden={!present}
      aria-hidden={!open}
      inert={!open ? true : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className="mg-mega-mobile-sidebar__header">
        <button
          className="mg-mega-mobile-sidebar__close"
          onClick={onClose}
          aria-label={labels.closeMobileNavLabel}
        >
          {labels.closeLabel}
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div
        className={`mg-mega-mobile-sidebar__page${path.length ? ' mg-mega-mobile-sidebar__page--section' : ''}`}
        key={path.join('-')}
      >
        {path.length > 0 && (
          <button className="mg-mega-mobile-sidebar__back" onClick={back}>
            <span className="mg-mega-mobile-sidebar__arrow" aria-hidden="true">
              ←
            </span>
            {labels.backLabel}
          </button>
        )}
        <h2
          id={titleId}
          ref={headingRef}
          tabIndex={-1}
          className="mg-mega-mobile-sidebar__title"
        >
          {overviewUrl ? (
            <a
              className="mg-mega-mobile-sidebar__title-link"
              href={overviewUrl}
            >
              {current.title}
            </a>
          ) : (
            current?.title || labels.allSectionsLabel
          )}
        </h2>
        {current?.url &&
          current.bannerButton?.url &&
          current.url !== current.bannerButton.url && (
            <a
              className="mg-mega-mobile-sidebar__overview"
              href={current.bannerButton.url}
            >
              {current.bannerButton.label || labels.overviewLabel}
            </a>
          )}
        {items?.length > 0 && (
          <ul ref={listRef} className="mg-mega-sidebar__list">
            {(items || []).map((item, index) => (
              <li className="mg-mega-sidebar-section" key={index}>
                {item.items?.length > 0 || item.bannerDescription ? (
                  <button
                    className="mg-mega-sidebar-section__item"
                    data-mg-menu-entry
                    onClick={() => enter(index)}
                  >
                    {item.title}
                    <svg
                      className="mg-mega-mobile-sidebar__chevron"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </button>
                ) : (
                  <a
                    className="mg-mega-sidebar-section__item"
                    data-mg-menu-entry
                    href={item.url || item.bannerButton?.url || '#'}
                  >
                    {item.title}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
        {current?.bannerDescription && (
          <div className="mg-mega-mobile-sidebar__intro">
            {current.bannerHeading &&
              current.bannerHeading !== current.title && (
                <h3>{current.bannerHeading}</h3>
              )}
            {/* Same caller-sanitised HTML contract as the existing desktop banner. */}
            <div
              dangerouslySetInnerHTML={{ __html: current.bannerDescription }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
