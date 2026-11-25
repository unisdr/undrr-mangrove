import React from 'react';
import PropTypes from 'prop-types';

/**
 * Demonstrates the page composition utilities. These are CSS classes, not a
 * component — this exists so the classes have somewhere to be seen and reviewed.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.contents] Optional contents element. A sidebar containing a TableOfContents is sticky from 900px.
 * @param {React.ReactNode} [props.children] Main reading content.
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
   * A contents element. The `mg-grid--article` layout adds a sidebar from
   * 900px (`$mg-breakpoint-tablet`). The sidebar is sticky when it contains
   * a TableOfContents.
   */
  contents: PropTypes.node,
  children: PropTypes.node,
};
