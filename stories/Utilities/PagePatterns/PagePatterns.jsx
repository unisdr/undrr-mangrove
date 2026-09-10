import React from 'react';
import PropTypes from 'prop-types';

/**
 * Demonstrates the page composition utilities. These are CSS classes, not a
 * component — this exists so the classes have somewhere to be seen and reviewed.
 */
export function Band({ feature = false, children }) {
  return (
    <section className={`mg-band${feature ? ' mg-band--feature' : ''}`}>
      <div className="mg-band__inner | mg-container">{children}</div>
    </section>
  );
}

Band.propTypes = {
  /** Carry the page title rather than a supporting section: hero colour, light text. */
  feature: PropTypes.bool,
  children: PropTypes.node,
};

export function Facts({ items }) {
  return (
    <ul className="mg-facts">
      {items.map(([icon, label]) => (
        <li key={label}>
          <span className={`mg-icon mg-icon-${icon}`} aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}

Facts.propTypes = {
  /** `[icon name, label]` pairs. */
  items: PropTypes.arrayOf(PropTypes.array).isRequired,
};

export function Reading({ contents, children }) {
  return (
    <div
      className={`mg-reading${contents ? ' mg-reading--with-contents' : ''}`}
    >
      {contents}
      <div className="mg-reading__article">{children}</div>
    </div>
  );
}

Reading.propTypes = {
  /** A contents element. When present it sits in a sticky sidebar above 48rem. */
  contents: PropTypes.node,
  children: PropTypes.node,
};
