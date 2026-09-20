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

function ShowMoreItem({ item, id, labelOpen, labelCollapsed }) {
  const buttonRef = useRef(null);

  // Each new item owns its enhancement. Mounting or updating this component
  // never initialises unrelated vanilla markup elsewhere in the document.
  useEffect(() => mgShowMore(buttonRef.current), []);

  useEffect(() => {
    const button = buttonRef.current;
    const target = document.getElementById(id);
    button.textContent = target.classList.contains('mg-show-more--collapsed')
      ? labelCollapsed
      : labelOpen;
  }, [id, labelOpen, labelCollapsed]);

  return (
    <React.Fragment>
      <div id={id} className={item.collapsable_wrapper_class}>
        {item.collapsable_text}
      </div>
      <button
        ref={buttonRef}
        type="button"
        className="mg-button mg-button-primary mg-show-more--button"
        data-mg-show-more="true"
        data-mg-show-more-skip-auto-init="true"
        data-mg-show-more-target={`#${id}`}
        data-mg-show-more-label-open={labelOpen}
        data-mg-show-more-label-collapsed={labelCollapsed}
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
  collapsable_text: PropTypes.string.isRequired,
});

ShowMoreItem.propTypes = {
  item: itemType.isRequired,
  id: PropTypes.string.isRequired,
  labelOpen: PropTypes.string.isRequired,
  labelCollapsed: PropTypes.string.isRequired,
};

/**
 * ShowMore component.
 *
 * Renders collapsible content blocks with toggle buttons that are managed
 * by the `mgShowMore` vanilla JS utility.
 *
 * @param {Object} props
 * @param {Array<Object>} props.data                          Array of collapsible content items
 * @param {string} props.data[].button_text                   Legacy field; use labelCollapsed instead
 * @param {string} props.data[].collapsable_wrapper_class     CSS class applied to the content wrapper, for styling only
 * @param {string} props.data[].collapsable_text              Text content to show/hide
 * @param {string} props.labelOpen                           Translated expanded-state label
 * @param {string} props.labelCollapsed                      Translated collapsed-state label
 */
export function ShowMore({
  data = EMPTY_DATA,
  labelOpen = 'Show less',
  labelCollapsed = 'Show more',
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
        />
      ))}
    </React.Fragment>
  );
}

ShowMore.propTypes = {
  /** Array of collapsible content items */
  data: PropTypes.arrayOf(itemType).isRequired,
  /** Label while expanded; supply the page's translated wording. */
  labelOpen: PropTypes.string,
  /** Label while collapsed; supply the page's translated wording. */
  labelCollapsed: PropTypes.string,
};

export default ShowMore;
