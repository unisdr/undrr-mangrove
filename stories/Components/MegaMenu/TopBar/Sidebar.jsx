import React, { useLayoutEffect, useRef, useState, useId } from 'react';

const EMPTY_PATH = [];

// Ordinary navigation links and drill-in buttons deliberately use native Tab
// behaviour, rather than application-menu roles and roving tabindex.
export function Sidebar({ sections, open, onClose, labels, id }) {
  const [path, setPath] = useState(EMPTY_PATH);
  const openerRef = useRef(null);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const listRef = useRef(null);
  const historyRef = useRef([]);
  const returningRef = useRef(null);
  const titleId = useId();
  let current = null;
  let parent = null;
  let items = sections;
  let validPath = true;
  for (const index of path) {
    parent = current;
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
      openerRef.current?.focus();
      setPath(EMPTY_PATH);
      historyRef.current = [];
      return;
    }
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
        dialogRef.current.querySelectorAll('a[href], button, summary')
      ).filter(
        element =>
          !element.closest('details:not([open])') ||
          element.tagName === 'SUMMARY'
      );
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
      hidden={!open}
      onKeyDown={handleKeyDown}
    >
      <div className="mg-mega-mobile-sidebar__header">
        {path.length > 0 ? (
          <button className="mg-mega-mobile-sidebar__back" onClick={back}>
            <span className="mg-mega-mobile-sidebar__arrow" aria-hidden="true">
              ←
            </span>
            {parent?.title || labels.allSectionsLabel}
          </button>
        ) : (
          <span>{labels.menuLabel}</span>
        )}
        <button
          className="mg-mega-mobile-sidebar__close"
          onClick={onClose}
          aria-label={labels.closeMobileNavLabel}
        >
          {labels.closeLabel}
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="mg-mega-mobile-sidebar__page" key={path.join('-')}>
        <h2
          id={titleId}
          ref={headingRef}
          tabIndex={-1}
          className="mg-mega-mobile-sidebar__title"
        >
          {current?.title || labels.allSectionsLabel}
        </h2>
        {overviewUrl && (
          <a className="mg-mega-mobile-sidebar__overview" href={overviewUrl}>
            {!current.url
              ? current.bannerButton?.label || labels.overviewLabel
              : labels.overviewLabel}
          </a>
        )}
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
                  <span
                    className="mg-mega-mobile-sidebar__arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
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
        {current?.bannerDescription && (
          <details className="mg-mega-mobile-sidebar__intro">
            <summary>{current.bannerHeading || current.title}</summary>
            {/* Same caller-sanitised HTML contract as the existing desktop banner. */}
            <div
              dangerouslySetInnerHTML={{ __html: current.bannerDescription }}
            />
          </details>
        )}
      </div>
    </div>
  );
}
