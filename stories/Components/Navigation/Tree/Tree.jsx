import React, {
  useState,
  useRef,
  useContext,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useId,
} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const TreeContext = createContext(null);
const EMPTY_EXPANDED_IDS = [];
const DEFAULT_TOGGLE_ICON = 'mg-icon-right';
const ITEM_SELECTOR = 'li[role="treeitem"][data-mg-treeitem-id]';

const itemIdOf = el => el.getAttribute('data-mg-treeitem-id');

// Ids of the items that contain targetId, outermost first, read from the
// TreeItem elements. Returns null when targetId is not in the tree.
const findAncestorIds = (nodes, targetId, trail = []) => {
  let found = null;
  React.Children.forEach(nodes, child => {
    if (found || !React.isValidElement(child)) return;
    const { id, children } = child.props;
    if (id === targetId) {
      found = trail;
      return;
    }
    found = findAncestorIds(
      children,
      targetId,
      id !== undefined && id !== null ? [...trail, id] : trail
    );
  });
  return found;
};

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
  current,
  toggleIcon,
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

  const isTabStop = context ? context.tabStopId === id : false;

  const iconClass =
    toggleIcon || (context && context.toggleIcon) || DEFAULT_TOGGLE_ICON;

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
      id={context ? `${context.domIdPrefix}${id}` : `mg-treeitem-${id}`}
      data-mg-treeitem-id={id}
      className={classNames('mg-tree__item', {
        'mg-tree__item--selected': isSelected,
      })}
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
      tabIndex={isTabStop ? 0 : -1}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      <div className="mg-tree__label-container" onClick={handleLabelClick}>
        {hasChildren && (
          // The treeitem already exposes aria-expanded and handles the
          // keyboard, so the chevron is a pointer-only affordance.
          <button
            type="button"
            className="mg-tree__toggle"
            onClick={handleToggle}
            tabIndex={-1}
            aria-hidden="true"
          >
            <span
              className={classNames('mg-tree__icon mg-icon', iconClass, {
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
            aria-current={current || undefined}
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
  /**
   * aria-current value for the item's link, e.g. "page" when the link points
   * at the current page. Only rendered when the item is a link.
   */
  current: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  /**
   * Icon class for this item's expand toggle, e.g. "mg-icon-arrow-right".
   * Overrides the Tree's toggleIcon. The glyph should point towards the
   * inline end; it rotates a quarter turn when expanded.
   */
  toggleIcon: PropTypes.string,
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
  toggleIcon = DEFAULT_TOGGLE_ICON,
  className,
  onBlur,
  ...props
}) => {
  const treeRef = useRef(null);
  // Scopes the item DOM ids to this tree, so two trees built from the same
  // data (a desktop and a mobile menu) do not repeat ids on one page.
  const reactId = useId();
  const domIdPrefix = `mg-tree${reactId.replace(/[^\w-]/g, '')}item-`;

  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(
    () => new Set(defaultExpandedIds)
  );
  const [uncontrolledSelected, setUncontrolledSelected] =
    useState(defaultSelectedId);
  // The item that holds focus while focus is inside the tree.
  const [focusedId, setFocusedId] = useState(null);
  // The one item with tabindex="0".
  const [tabStopId, setTabStopId] = useState(null);

  const expandedIds = controlledExpandedIds
    ? new Set(controlledExpandedIds)
    : uncontrolledExpanded;

  const selectedId =
    controlledSelectedId !== undefined
      ? controlledSelectedId
      : uncontrolledSelected;

  // Keep the roving tab stop on an item that is rendered. While focus is in
  // the tree it follows the focused item. Otherwise Tab lands on the selected
  // item, or its nearest visible ancestor when it sits in a collapsed parent,
  // and then on the first item (ARIA APG treeview).
  useEffect(() => {
    if (!treeRef.current) return;
    const rendered = new Set(
      Array.from(treeRef.current.querySelectorAll(ITEM_SELECTOR), itemIdOf)
    );
    if (rendered.size === 0) return;

    let next = null;
    if (focusedId !== null && rendered.has(focusedId)) {
      next = focusedId;
    } else if (selectedId !== null && selectedId !== undefined) {
      const candidates = [
        selectedId,
        ...(findAncestorIds(children, selectedId) || []).reverse(),
      ];
      next = candidates.find(id => rendered.has(id)) ?? null;
    }
    if (next === null) {
      next = itemIdOf(treeRef.current.querySelector(ITEM_SELECTOR));
    }
    setTabStopId(prev => (prev === next ? prev : next));
  }, [focusedId, selectedId, expandedIds, children]);

  // Once focus leaves the tree, the next Tab in returns to the selected item.
  const handleTreeBlur = e => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setFocusedId(null);
    }
    if (onBlur) onBlur(e);
  };

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
        treeRef.current.querySelectorAll(ITEM_SELECTOR)
      ).filter(el => {
        let parentGroup = el.parentElement?.closest('ul[role="group"]');
        while (parentGroup) {
          const parentItem = parentGroup.closest(ITEM_SELECTOR);
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
      // In RTL the tree grows leftwards, so the expand and collapse arrows swap.
      const dirEl = treeRef.current.closest('[dir]');
      const isRtl = dirEl
        ? dirEl.getAttribute('dir').toLowerCase() === 'rtl'
        : getComputedStyle(treeRef.current).direction === 'rtl';
      let { key } = e;
      if (isRtl && key === 'ArrowRight') key = 'ArrowLeft';
      else if (isRtl && key === 'ArrowLeft') key = 'ArrowRight';

      switch (key) {
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
                ':scope > ul[role="group"] > li[role="treeitem"]'
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
            const parentItem = currentEl.parentElement?.closest(ITEM_SELECTOR);
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
          // Only the item's own link: an expanded parent also contains its
          // children's links.
          const link = currentEl.querySelector(
            ':scope > .mg-tree__label-container > a'
          );
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
      tabStopId,
      domIdPrefix,
      setFocusedId,
      toggleItem,
      selectItem,
      handleKeyDown,
      toggleIcon,
    }),
    [
      expandedIds,
      selectedId,
      tabStopId,
      domIdPrefix,
      setFocusedId,
      toggleItem,
      selectItem,
      handleKeyDown,
      toggleIcon,
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
        onBlur={handleTreeBlur}
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
  /**
   * Icon class for the expand toggles, e.g. "mg-icon-arrow-right". The glyph
   * should point towards the inline end; it rotates a quarter turn when
   * expanded and mirrors in RTL.
   */
  toggleIcon: PropTypes.string,
  className: PropTypes.string,
};

export default Tree;
