import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const TreeItem = ({
  id,
  label,
  children,
  isExpanded = false,
  isSelected = false,
  onToggle,
  onSelect,
  href,
  asLink = false,
}) => {
  const [expanded, setExpanded] = useState(isExpanded);

  const handleToggle = e => {
    e.stopPropagation();
    setExpanded(!expanded);
    if (onToggle) onToggle(id, !expanded);
  };

  const handleLabelClick = e => {
    if (asLink && href) {
      if (hasChildren) {
        handleToggle(e);
      } else {
        if (onSelect) onSelect(id);
      }
    } else if (hasChildren) {
      handleToggle(e);
    }
  };

  return (
    <li
      className={classNames('mg-tree__item', {
        'mg-tree__item--selected': isSelected,
      })}
      role="treeitem"
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={isSelected}
    >
      <div className="mg-tree__label-container" onClick={handleLabelClick}>
        {hasChildren && (
          <button
            type="button"
            className="mg-tree__toggle"
            onClick={handleToggle}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            aria-expanded={expanded}
          >
            <span
              className={classNames('mg-tree__icon', {
                'is-expanded': expanded,
              })}
            >
              ▶
            </span>
          </button>
        )}
        {asLink && href ? (
          <a href={href} className="mg-tree__label" onClick={handleLabelClick}>
            {label}
          </a>
        ) : (
          <span className="mg-tree__label">{label}</span>
        )}
      </div>
      {hasChildren && expanded && (
        <ul className="mg-tree__group" role="group">
          {children}
        </ul>
      )}
    </li>
  );
};

TreeItem.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.node.isRequired,
  children: PropTypes.node,
  isExpanded: PropTypes.bool,
  isSelected: PropTypes.bool,
  onToggle: PropTypes.func,
  onSelect: PropTypes.func,
  href: PropTypes.string,
  asLink: PropTypes.bool,
};

export const Tree = ({ children, guides = true, className, ...props }) => {
  return (
    <ul
      className={classNames(
        'mg-tree',
        { 'mg-tree--guides': guides },
        className
      )}
      role="tree"
      {...props}
    >
      {children}
    </ul>
  );
};

Tree.propTypes = {
  children: PropTypes.node.isRequired,
  guides: PropTypes.bool,
  className: PropTypes.string,
};
