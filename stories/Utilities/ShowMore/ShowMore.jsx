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

import React, { useEffect, useId } from 'react';
import PropTypes from 'prop-types';
import { mgShowMore } from '../../assets/js/show-more';

const EMPTY_DATA = [];

/**
 * ShowMore component.
 *
 * Renders collapsible content blocks with toggle buttons that are managed
 * by the `mgShowMore` vanilla JS utility.
 *
 * @param {Object} props
 * @param {Array<Object>} props.data                          Array of collapsible content items
 * @param {string} props.data[].button_text                   Label for the toggle button
 * @param {string} props.data[].collapsable_wrapper_class     CSS class applied to the content wrapper, for styling only
 * @param {string} props.data[].collapsable_text              Text content to show/hide
 */
export function ShowMore({ data = EMPTY_DATA }) {
  // Each item gets its own id, and the toggle targets that id rather than
  // `collapsable_wrapper_class`. Two items sharing a wrapper class used to
  // drive the same content: the items are flat siblings, so they share a
  // parent and the vanilla script's ancestor walk cannot separate them
  // (#1228). `useId` is stable across renders and unique per instance;
  // non-word characters are stripped because the value goes into an id
  // selector. The wrapper class keeps its documented meaning — a styling
  // hook — and consumers may still reuse it freely.
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  useEffect(() => {
    mgShowMore();
  }, []);

  return (
    <React.Fragment>
      {' '}
      {data.map((item, index) => (
        <React.Fragment key={index}>
          <div
            id={`mg-show-more-${instanceId}-${index}`}
            className={item.collapsable_wrapper_class}
          >
            {item.collapsable_text}
          </div>
          <button
            type="button"
            className="mg-button mg-button-primary mg-show-more--button"
            data-mg-show-more="true"
            data-mg-show-more-target={`#mg-show-more-${instanceId}-${index}`}
            data-mg-show-more-label-open="Show less themes"
            data-mg-show-more-label-collapsed="Show more themes"
          >
            {item.button_text}
          </button>
        </React.Fragment>
      ))}
    </React.Fragment>
  );
}

ShowMore.propTypes = {
  /** Array of collapsible content items */
  data: PropTypes.arrayOf(
    PropTypes.shape({
      /** Label displayed on the toggle button */
      button_text: PropTypes.string.isRequired,
      /** CSS class applied to the content wrapper, for styling only. It need not be unique: the toggle targets a minted id */
      collapsable_wrapper_class: PropTypes.string.isRequired,
      /** Text content that is shown or hidden */
      collapsable_text: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default ShowMore;
