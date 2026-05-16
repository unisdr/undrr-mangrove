import React from 'react';

/**
 * Lightweight callout box for use in MDX documentation pages.
 *
 * Unlike HighlightBox (which relies on CSS custom properties that may not be
 * present in the Storybook docs iframe), DocCallout uses inline styles so it
 * renders correctly in any context without depending on theme state.
 *
 * @param {'warning'|'info'} variant
 *   'warning' — cautionary/experimental notes (amber)
 *   'info'    — important directives (UNDRR blue)
 * @param {React.ReactNode} children
 */
export function DocCallout({ variant = 'info', children }) {
  const base = {
    padding: '1rem 1.25rem',
    marginBottom: '1.5rem',
    borderRadius: '2px',
  };

  const variants = {
    info: {
      borderLeft: '5px solid #004f91',
      background: '#edf2f9',
      color: '#1a1a1a',
    },
    warning: {
      borderLeft: '5px solid #b45309',
      background: '#fdf6e3',
      color: '#1a1a1a',
    },
  };

  return (
    <div style={{ ...base, ...(variants[variant] ?? variants.info) }}>
      {children}
    </div>
  );
}

export default DocCallout;
