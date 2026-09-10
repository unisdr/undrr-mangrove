/**
 * @file SkipLink.jsx
 * @description Bypass block: the first focusable element on the page, hidden
 * until it receives keyboard focus.
 *
 * WCAG 2.4.1 (Level A) is satisfied for screen readers by Mangrove's
 * landmarks, but a sighted keyboard user has no landmark navigation. On an
 * UNDRR page that means tabbing through the brand bar, the mega menu strip
 * and, on a hub page, an identity row and section links before reaching the
 * first paragraph. This is the equivalent affordance for them.
 *
 * @module SkipLink
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * SkipLink component.
 *
 * Renders an anchor pointing at the page's main content. The anchor is
 * visually hidden until focused, at which point it appears in normal flow at
 * the top of the page and pushes the content below it down.
 *
 * The target element must carry both `id={targetId}` and `tabIndex={-1}`.
 * Without `tabIndex`, following the link moves the scroll position but leaves
 * focus on the link, so the next Tab press returns the user to the navigation
 * they just skipped.
 *
 * @param {Object} props
 * @param {string} [props.targetId='main-content'] Id of the `<main>` element to skip to
 * @param {string} [props.label='Skip to main content'] Visible link text; supply a translated string on non-English pages
 * @param {string} [props.className] Additional CSS classes
 * @param {Function} [props.onClick] Additional click handler, called after focus is moved
 */
export function SkipLink({
  targetId = 'main-content',
  label = 'Skip to main content',
  className,
  onClick,
  ...rest
}) {
  const classes = ['mg-skip-link', className].filter(Boolean).join(' ');

  // Fragment navigation alone moves the scroll position; whether it also moves
  // focus has never been consistent across browsers. Moving it here makes the
  // behaviour the same everywhere, and the href still works without
  // JavaScript.
  const handleClick = event => {
    const target =
      typeof document === 'undefined'
        ? null
        : document.getElementById(targetId);

    if (target) {
      target.focus();
    }

    if (onClick) {
      onClick(event);
    }
  };

  return (
    <a
      className={classes}
      href={`#${targetId}`}
      onClick={handleClick}
      {...rest}
    >
      {label}
    </a>
  );
}

SkipLink.propTypes = {
  /** Id of the `<main>` element to skip to. That element also needs `tabIndex={-1}`. */
  targetId: PropTypes.string,
  /** Visible link text. Supply a translated string on non-English pages. */
  label: PropTypes.string,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Additional click handler, called after focus is moved to the target */
  onClick: PropTypes.func,
};

export default SkipLink;
