import React from 'react';
import PropTypes from 'prop-types';
import { Tree, TreeItem } from './Tree';

const renderItems = items =>
  items.map(({ id, label, href, current, children }) => (
    <TreeItem
      key={id}
      id={id}
      label={label}
      href={href}
      asLink={Boolean(href)}
      current={current}
    >
      {children && children.length > 0 ? renderItems(children) : undefined}
    </TreeItem>
  ));

/**
 * Data-driven Tree used by hydration, where there is no JSX to build
 * TreeItem children from. Renders the same Tree and TreeItem components, so
 * keyboard navigation and ARIA are identical. Without `items` it passes
 * children through and behaves exactly like Tree.
 */
export const HydratedTree = ({ items, children, ...props }) => (
  <Tree {...props}>{items ? renderItems(items) : children}</Tree>
);

const itemShape = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  href: PropTypes.string,
  current: PropTypes.string,
};
itemShape.children = PropTypes.arrayOf(PropTypes.shape(itemShape));

HydratedTree.propTypes = {
  /** Nested items, as returned by Tree.fromElement */
  items: PropTypes.arrayOf(PropTypes.shape(itemShape)),
  /** TreeItem children, used when items is not set */
  children: PropTypes.node,
};

export default HydratedTree;
