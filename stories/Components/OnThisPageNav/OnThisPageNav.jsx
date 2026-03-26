import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { mgOnThisPageNav } from '../../assets/js/on-this-page-nav';

/**
 * Storybook wrapper for the OnThisPageNav vanilla JS component.
 * Renders the HTML structure and calls mgOnThisPageNav() via useEffect.
 * This is not intended as a production React component.
 *
 * @param {Object} props
 * @param {string} [props.depth]            Max heading level to scan ("2", "3", "4")
 * @param {string} [props.contentSelector]  CSS selector for heading scan scope
 * @param {string} [props.label]            aria-label for the nav
 * @param {string} [props.offset]           Scroll offset in pixels
 * @param {Array<{href: string, text: string}>} [props.items] Explicit nav items (skips auto-detect)
 * @param {string} [props.ctaHref]          CTA link URL
 * @param {string} [props.ctaText]          CTA link text
 */
export default function OnThisPageNav({
  depth = '2',
  contentSelector = null,
  label = 'On this page',
  offset = '0',
  items = null,
  ctaHref = null,
  ctaText = null,
}) {
  const navRef = useRef(null);

  useEffect(() => {
    if (navRef.current) {
      // Reset init flag so Storybook re-renders work
      delete navRef.current.dataset.mgOnThisPageNavInitialized;
      mgOnThisPageNav([navRef.current]);
    }
  });

  return (
    <nav
      ref={navRef}
      data-mg-on-this-page-nav
      data-mg-on-this-page-nav-depth={depth}
      {...(contentSelector && {
        'data-mg-on-this-page-nav-content': contentSelector,
      })}
      data-mg-on-this-page-nav-label={label}
      data-mg-on-this-page-nav-offset={offset}
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
  /** Accessible label for the nav element */
  label: PropTypes.string,
  /** Scroll offset in pixels for fixed headers */
  offset: PropTypes.string,
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
