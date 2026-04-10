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

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { mgShowMore } from '../../assets/js/show-more';

/**
 * ShowMore component.
 *
 * Renders collapsible content blocks with toggle buttons that are managed
 * by the `mgShowMore` vanilla JS utility.
 *
 * @param {Object} props
 * @param {Array<Object>} props.data                          Array of collapsible content items
 * @param {string} props.data[].button_text                   Label for the toggle button
 * @param {string} props.data[].collapsable_wrapper_class     CSS class for the content wrapper (used as a selector target)
 * @param {string} props.data[].collapsable_text              Text content to show/hide
 */
export function ShowMore({ data = [] }) {
  useEffect(() => {
    mgShowMore();
  }, []);

  return (
    <React.Fragment>
      {' '}
      {data.map((item, index) => (
        <React.Fragment key={index}>
          <div className={item.collapsable_wrapper_class}>
            {item.collapsable_text}
          </div>
          <a
            href="#"
            className="mg-button mg-button-primary mg-show-more--button"
            data-mg-show-more="true"
            data-mg-show-more-target={`.${item.collapsable_wrapper_class}`}
            data-mg-show-more-label-open="Show less themes"
            data-mg-show-more-label-collapsed="Show more themes"
          >
            {item.button_text}
          </a>
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
      /** CSS class applied to the content wrapper, also used as the target selector */
      collapsable_wrapper_class: PropTypes.string.isRequired,
      /** Text content that is shown or hidden */
      collapsable_text: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default ShowMore;
