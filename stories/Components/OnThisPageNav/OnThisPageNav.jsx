import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  mgOnThisPageNav,
  mgOnThisPageNavDestroy,
} from '../../assets/js/on-this-page-nav';

export const DEFAULT_ON_THIS_PAGE_LABELS = {
  label: 'On this page',
};

/**
 * Storybook wrapper for the OnThisPageNav vanilla JS component.
 * Renders the HTML structure and calls mgOnThisPageNav() via useEffect.
 * This is not intended as a production React component.
 *
 * @param {Object} props
 * @param {string} [props.depth]            Max heading level to scan ("2", "3", "4")
 * @param {string} [props.contentSelector]  CSS selector for heading scan scope
 * @param {object} [props.labels]           UI label overrides
 * @param {Array<{href: string, text: string}>} [props.items] Explicit nav items (skips auto-detect)
 * @param {string} [props.ctaHref]          CTA link URL
 * @param {string} [props.ctaText]          CTA link text
 */
export default function OnThisPageNav({
  depth = '2',
  contentSelector = null,
  labels = {},
  items = null,
  ctaHref = null,
  ctaText = null,
}) {
  const { label } = { ...DEFAULT_ON_THIS_PAGE_LABELS, ...labels };
  const navRef = useRef(null);

  useEffect(() => {
    const nav = navRef.current;
    if (nav) {
      delete nav.dataset.mgOnThisPageNavInitialized;
      mgOnThisPageNav([nav]);
    }
    return () => {
      if (nav) mgOnThisPageNavDestroy(nav);
    };
  }, [depth, contentSelector, label, items, ctaHref, ctaText]);

  return (
    <nav
      ref={navRef}
      data-mg-on-this-page-nav
      data-mg-on-this-page-nav-depth={depth}
      {...(contentSelector && {
        'data-mg-on-this-page-nav-content': contentSelector,
      })}
      data-mg-on-this-page-nav-label={label}
      className="mg-on-this-page-nav"
    >
      {items && (
        <ul className="mg-on-this-page-nav__list">
          {items.map((item, i) => (
            <li key={i} className="mg-on-this-page-nav__item">
              <a href={item.href} className="mg-on-this-page-nav__link">
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      )}
      {ctaHref && ctaText && (
        <a
          href={ctaHref}
          className="mg-on-this-page-nav__cta"
        >
          {ctaText}
        </a>
      )}
    </nav>
  );
}

OnThisPageNav.propTypes = {
  /** Max heading level to scan: "2" (h2 only), "3" (h2+h3), "4" (h2+h3+h4) */
  depth: PropTypes.string,
  /** CSS selector to scope heading scan (defaults to document.body) */
  contentSelector: PropTypes.string,
  /** UI label overrides */
  labels: PropTypes.shape({
    label: PropTypes.string,
  }),
  /** Explicit nav items (skips auto-detect when provided) */
  items: PropTypes.arrayOf(
    PropTypes.shape({
      href: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    })
  ),
  /** CTA button URL */
  ctaHref: PropTypes.string,
  /** CTA button text */
  ctaText: PropTypes.string,
};
