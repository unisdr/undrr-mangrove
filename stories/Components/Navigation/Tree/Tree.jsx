import React, {
  useState,
  useRef,
  useContext,
  createContext,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const TreeContext = createContext(null);
const EMPTY_EXPANDED_IDS = [];

export const TreeItem = ({
  id,
  label,
  children,
  isExpanded: controlledExpanded,
  isSelected: controlledSelected,
  onToggle: customToggle,
  onSelect: customSelect,
  href,
  asLink = false,
}) => {
  const context = useContext(TreeContext);
  const [localExpanded, setLocalExpanded] = useState(
    controlledExpanded || false
  );

  const hasChildren = Boolean(children && React.Children.count(children) > 0);

  const isExpanded =
    controlledExpanded !== undefined
      ? controlledExpanded
      : context
        ? context.expandedIds.has(id)
        : localExpanded;

  const isSelected =
    controlledSelected !== undefined
      ? controlledSelected
      : context
        ? context.selectedId === id
        : false;

  const isFocused = context ? context.focusedId === id : false;

  const handleToggle = e => {
    if (e) e.stopPropagation();
    const next = !isExpanded;
    if (controlledExpanded === undefined) {
      setLocalExpanded(next);
    }
    if (context) {
      context.toggleItem(id, next);
    }
    if (customToggle) {
      customToggle(id, next);
    }
  };

  const handleSelect = e => {
    if (context) {
      context.selectItem(id);
    }
    if (customSelect) {
      customSelect(id);
    }
  };

  const handleLabelClick = e => {
    if (asLink && href) {
      if (hasChildren) {
        handleToggle(e);
      } else {
        handleSelect(e);
      }
    } else if (hasChildren) {
      handleToggle(e);
    } else {
      handleSelect(e);
    }
  };

  const handleKeyDown = e => {
    if (context) {
      e.stopPropagation();
      context.handleKeyDown(e, id, hasChildren, isExpanded, handleToggle);
    }
  };

  const handleFocus = e => {
    if (e) e.stopPropagation();
    if (context) {
      context.setFocusedId(id);
    }
  };

  return (
    <li
      id={`mg-treeitem-${id}`}
      data-mg-treeitem-id={id}
      className={classNames('mg-tree__item', {
        'mg-tree__item--selected': isSelected,
      })}
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      <div className="mg-tree__label-container" onClick={handleLabelClick}>
        {hasChildren && (
          <button
            type="button"
            className="mg-tree__toggle"
            onClick={handleToggle}
            tabIndex={-1}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            aria-expanded={isExpanded}
          >
            <span
              className={classNames('mg-tree__icon mg-icon mg-icon-right', {
                'is-expanded': isExpanded,
              })}
              aria-hidden="true"
            />
          </button>
        )}
        {asLink && href ? (
          <a
            href={href}
            tabIndex={-1}
            className="mg-tree__label"
            onClick={handleLabelClick}
          >
            {label}
          </a>
        ) : (
          <span className="mg-tree__label">{label}</span>
        )}
      </div>
      {hasChildren && isExpanded && (
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

export const Tree = ({
  children,
  guides = true,
  expandedIds: controlledExpandedIds,
  defaultExpandedIds = EMPTY_EXPANDED_IDS,
  selectedId: controlledSelectedId,
  defaultSelectedId = null,
  onToggle,
  onSelect,
  className,
  ...props
}) => {
  const treeRef = useRef(null);

  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(
    () => new Set(defaultExpandedIds)
  );
  const [uncontrolledSelected, setUncontrolledSelected] =
    useState(defaultSelectedId);
  const [focusedId, setFocusedId] = useState(null);

  const expandedIds = controlledExpandedIds
    ? new Set(controlledExpandedIds)
    : uncontrolledExpanded;

  const selectedId =
    controlledSelectedId !== undefined
      ? controlledSelectedId
      : uncontrolledSelected;

  // Initialize focus on mount or when tree items render
  useEffect(() => {
    if (!focusedId && treeRef.current) {
      const firstItem = treeRef.current.querySelector(
        'li[role="treeitem"][data-mg-treeitem-id]'
      );
      if (firstItem) {
        setFocusedId(firstItem.getAttribute('data-mg-treeitem-id'));
      }
    }
  }, [focusedId, children]);

  const toggleItem = useCallback(
    (id, nextState) => {
      if (!controlledExpandedIds) {
        setUncontrolledExpanded(prev => {
          const next = new Set(prev);
          if (nextState) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        });
      }
      if (onToggle) {
        onToggle(id, nextState);
      }
    },
    [controlledExpandedIds, onToggle]
  );

  const selectItem = useCallback(
    id => {
      if (controlledSelectedId === undefined) {
        setUncontrolledSelected(id);
      }
      if (onSelect) {
        onSelect(id);
      }
    },
    [controlledSelectedId, onSelect]
  );

  const handleKeyDown = useCallback(
    (e, currentId, hasChildren, isExpanded, toggleFn) => {
      if (!treeRef.current) return;

      const visibleItems = Array.from(
        treeRef.current.querySelectorAll(
          'li[role="treeitem"][data-mg-treeitem-id]'
        )
      ).filter(el => {
        let parentGroup = el.parentElement?.closest('ul[role="group"]');
        while (parentGroup) {
          const parentItem = parentGroup.closest(
            'li[role="treeitem"][data-mg-treeitem-id]'
          );
          if (!parentItem) break;
          const parentId = parentItem.getAttribute('data-mg-treeitem-id');
          if (!expandedIds.has(parentId)) return false;
          parentGroup = parentItem.parentElement?.closest('ul[role="group"]');
        }
        return true;
      });

      const currentIndex = visibleItems.findIndex(
        el => el.getAttribute('data-mg-treeitem-id') === currentId
      );
      if (currentIndex === -1) return;

      const currentEl = visibleItems[currentIndex];

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          if (currentIndex < visibleItems.length - 1) {
            const nextEl = visibleItems[currentIndex + 1];
            const nextId = nextEl.getAttribute('data-mg-treeitem-id');
            setFocusedId(nextId);
            nextEl.focus();
          }
          break;
        }

        case 'ArrowUp': {
          e.preventDefault();
          if (currentIndex > 0) {
            const prevEl = visibleItems[currentIndex - 1];
            const prevId = prevEl.getAttribute('data-mg-treeitem-id');
            setFocusedId(prevId);
            prevEl.focus();
          }
          break;
        }

        case 'ArrowRight': {
          e.preventDefault();
          if (hasChildren) {
            if (!isExpanded) {
              toggleFn();
            } else {
              // Move focus to first child
              const firstChild = currentEl.querySelector(
                'ul[role="group"] > li[role="treeitem"]'
              );
              if (firstChild) {
                const childId = firstChild.getAttribute('data-mg-treeitem-id');
                setFocusedId(childId);
                firstChild.focus();
              }
            }
          }
          break;
        }

        case 'ArrowLeft': {
          e.preventDefault();
          if (hasChildren && isExpanded) {
            toggleFn();
          } else {
            // Move focus to parent treeitem
            const parentItem = currentEl.parentElement?.closest(
              'li[role="treeitem"][data-mg-treeitem-id]'
            );
            if (parentItem) {
              const parentId = parentItem.getAttribute('data-mg-treeitem-id');
              setFocusedId(parentId);
              parentItem.focus();
            }
          }
          break;
        }

        case 'Home': {
          e.preventDefault();
          if (visibleItems.length > 0) {
            const firstEl = visibleItems[0];
            const firstId = firstEl.getAttribute('data-mg-treeitem-id');
            setFocusedId(firstId);
            firstEl.focus();
          }
          break;
        }

        case 'End': {
          e.preventDefault();
          if (visibleItems.length > 0) {
            const lastEl = visibleItems[visibleItems.length - 1];
            const lastId = lastEl.getAttribute('data-mg-treeitem-id');
            setFocusedId(lastId);
            lastEl.focus();
          }
          break;
        }

        case 'Enter':
        case ' ': {
          e.preventDefault();
          selectItem(currentId);
          const link = currentEl.querySelector('a');
          if (link) {
            link.click();
          } else if (hasChildren) {
            toggleFn();
          }
          break;
        }

        default:
          break;
      }
    },
    [expandedIds, selectItem]
  );

  const contextValue = useMemo(
    () => ({
      expandedIds,
      selectedId,
      focusedId,
      setFocusedId,
      toggleItem,
      selectItem,
      handleKeyDown,
    }),
    [
      expandedIds,
      selectedId,
      focusedId,
      setFocusedId,
      toggleItem,
      selectItem,
      handleKeyDown,
    ]
  );

  return (
    <TreeContext.Provider value={contextValue}>
      <ul
        ref={treeRef}
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
    </TreeContext.Provider>
  );
};

Tree.propTypes = {
  children: PropTypes.node.isRequired,
  guides: PropTypes.bool,
  expandedIds: PropTypes.arrayOf(PropTypes.string),
  defaultExpandedIds: PropTypes.arrayOf(PropTypes.string),
  selectedId: PropTypes.string,
  defaultSelectedId: PropTypes.string,
  onToggle: PropTypes.func,
  onSelect: PropTypes.func,
  className: PropTypes.string,
};

export default Tree;
