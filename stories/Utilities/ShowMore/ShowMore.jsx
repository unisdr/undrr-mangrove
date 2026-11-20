/**
 * @file ShowMore.jsx
 * @description Collapsible show-more/show-less toggle for long content blocks.
 *
 * Each item in the `data` array renders a content wrapper and a toggle button.
 * The vanilla `mgShowMore` script handles expand/collapse behavior via
 * `data-mg-show-more-*` attributes.
 *
 * @module ShowMore
 */

import React, { useEffect, useId, useRef } from 'react';
import PropTypes from 'prop-types';
import { mgShowMore } from '../../assets/js/show-more';

const EMPTY_DATA = [];

function ShowMoreItem({
  item,
  id,
  labelOpen,
  labelCollapsed,
  minHiddenLines,
  mode,
  visibleItems,
}) {
  const itemsMode = mode === 'items';
  const buttonRef = useRef(null);

  // Each new item owns its enhancement. Mounting or updating this component
  // never initialises unrelated vanilla markup elsewhere in the document.
  useEffect(() => mgShowMore(buttonRef.current), []);

  useEffect(() => {
    const button = buttonRef.current;
    const target = document.getElementById(id);
    const collapsed = itemsMode
      ? button.getAttribute('aria-expanded') !== 'true'
      : target.classList.contains('mg-show-more--collapsed');
    button.textContent = collapsed ? labelCollapsed : labelOpen;
  }, [id, labelOpen, labelCollapsed, itemsMode]);

  return (
    <React.Fragment>
      {itemsMode ? (
        // Whole elements past `visibleItems` are the ones hidden.
        <ul id={id} className={item.collapsable_wrapper_class}>
          {(item.collapsable_items || []).map((entry, index) => (
            <li
              key={index}
              data-mg-show-more-item={index >= visibleItems ? '' : undefined}
            >
              {entry}
            </li>
          ))}
        </ul>
      ) : (
        <div id={id} className={item.collapsable_wrapper_class}>
          {item.collapsable_text}
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        // Items mode ships the toggle hidden: without JavaScript every item
        // shows and there is nothing to toggle.
        hidden={itemsMode || undefined}
        className="mg-button mg-button-primary mg-show-more--button"
        data-mg-show-more="true"
        data-mg-show-more-mode={itemsMode ? 'items' : undefined}
        data-mg-show-more-skip-auto-init="true"
        data-mg-show-more-target={`#${id}`}
        data-mg-show-more-label-open={labelOpen}
        data-mg-show-more-label-collapsed={labelCollapsed}
        data-mg-show-more-min-hidden-lines={minHiddenLines}
      >
        {labelCollapsed}
      </button>
    </React.Fragment>
  );
}

const itemType = PropTypes.shape({
  /** Legacy pre-enhancement label; use labelCollapsed for both render and toggle. */
  button_text: PropTypes.string,
  collapsable_wrapper_class: PropTypes.string.isRequired,
  /** Content for the default, visual-only mode. */
  collapsable_text: PropTypes.string,
  /** Items mode: one list item each; those past `visibleItems` are hidden. */
  collapsable_items: PropTypes.arrayOf(PropTypes.node),
});

ShowMoreItem.propTypes = {
  item: itemType.isRequired,
  id: PropTypes.string.isRequired,
  labelOpen: PropTypes.string.isRequired,
  labelCollapsed: PropTypes.string.isRequired,
  minHiddenLines: PropTypes.number,
  mode: PropTypes.oneOf(['height', 'items']),
  visibleItems: PropTypes.number,
};

/**
 * ShowMore component.
 *
 * Renders collapsible content blocks with toggle buttons that are managed
 * by the `mgShowMore` vanilla JS utility.
 *
 * @param {Object} props
 * @param {Array<{button_text?: string, collapsable_wrapper_class: string, collapsable_text: string}>} [props.data=EMPTY_DATA] Collapsible content items. `collapsable_text` is the text to show or hide; `collapsable_wrapper_class` is a CSS class on the content wrapper, for styling only; `button_text` is a legacy field, use `labelCollapsed` instead. With no items nothing renders
 * @param {string} [props.labelOpen='Show less']             Translated expanded-state label
 * @param {string} [props.labelCollapsed='Show more']        Translated collapsed-state label
 * @param {number} [props.minHiddenLines]                    Collapse only when at least this many lines would be hidden
 */
export function ShowMore({
  data = EMPTY_DATA,
  labelOpen = 'Show less',
  labelCollapsed = 'Show more',
  minHiddenLines,
  mode = 'height',
  visibleItems = 3,
}) {
  // Each item gets its own id, and the toggle targets that id rather than
  // `collapsable_wrapper_class`. Two items sharing a wrapper class used to
  // drive the same content: the items are flat siblings, so they share a
  // parent and the vanilla script's ancestor walk cannot separate them
  // (#1228). `useId` is stable across renders and unique per instance;
  // non-word characters are stripped because the value goes into an id
  // selector. The wrapper class keeps its documented meaning — a styling
  // hook — and consumers may still reuse it freely.
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <React.Fragment>
      {data.map((item, index) => (
        <ShowMoreItem
          key={index}
          item={item}
          id={`mg-show-more-${instanceId}-${index}`}
          labelOpen={labelOpen}
          labelCollapsed={labelCollapsed}
          minHiddenLines={minHiddenLines}
          mode={mode}
          visibleItems={visibleItems}
        />
      ))}
    </React.Fragment>
  );
}

ShowMore.propTypes = {
  /**
   * Array of collapsible content items. Optional: with no items nothing
   * renders, and items added later are enhanced as they mount.
   */
  data: PropTypes.arrayOf(itemType),
  /** Label while expanded; supply the page's translated wording. */
  labelOpen: PropTypes.string,
  /** Label while collapsed; supply the page's translated wording. */
  labelCollapsed: PropTypes.string,
  /**
   * Collapse only when the content runs at least this many lines past the
   * collapsed height (`--mg-show-more-height`); otherwise leave it open and
   * hide the toggle. Set it before the item is enhanced.
   */
  minHiddenLines: PropTypes.number,
  /**
   * `"height"` (default): the visual-only collapse by max-height. `"items"`:
   * a true disclosure that hides whole list items past `visibleItems` with
   * `hidden="until-found"`, and gives the toggle `aria-expanded`. Each data
   * entry then takes `collapsable_items` instead of `collapsable_text`.
   */
  mode: PropTypes.oneOf(['height', 'items']),
  /** Items mode: how many list items stay visible. */
  visibleItems: PropTypes.number,
};

export default ShowMore;
