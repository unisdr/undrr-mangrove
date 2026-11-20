import React from 'react';
import PropTypes from 'prop-types';

/**
 * Demonstrates the page composition utilities. These are CSS classes, not a
 * component — this exists so the classes have somewhere to be seen and reviewed.
 */
export function Reading({ contents, children }) {
  return (
    <div
      className={`mg-reading${contents ? ' mg-reading--with-contents mg-grid mg-grid--article' : ''}`}
    >
      {contents}
      <div className="mg-reading__article">{children}</div>
    </div>
  );
}

Reading.propTypes = {
  /**
   * A contents element. When present it sits in a sticky sidebar from 900px
   * (`$mg-breakpoint-tablet`) up, using `mg-grid`'s `--article` variant (an
   * asymmetric flexible/fixed-width grid) for the split.
   */
  contents: PropTypes.node,
  children: PropTypes.node,
};
