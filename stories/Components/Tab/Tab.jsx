import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { mgTabsRuntime } from '../../assets/js/tabs';

/**
 * Renders a tab component with either stacked or horizontal layout.
 * @param {Object} props - The component props.
 * @param {Array} props.tabdata - An array of tab objects containing text, text_id, and data.
 * @param {string} [props.variant='horizontal'] - The layout variant, either 'stacked' or 'horizontal'.
 * @param {boolean} [props.defaultOpen] - Whether stacked panels start open (true), closed (false), or default (undefined = open first).
 * @param {boolean} [props.singleOpen=false] - When true, only one stacked panel can be open at a time.
 * @param {boolean} [props.filterable=false] - When true, renders a search input to filter stacked sections.
 * @param {string} [props.filterPlaceholder='Filter sections\u2026'] - Placeholder text for the filter input.
 * @returns {JSX.Element} A React component representing the tab structure.
 */
export function Tab({
  tabdata,
  variant = 'horizontal',
  defaultOpen,
  singleOpen = false,
  filterable = false,
  filterPlaceholder = 'Filter sections\u2026',
}) {
  const containerRef = useRef(null);

  // Initialize this container's tabs runtime (scoped, not global).
  // The runtime handles all behavior: ARIA, keyboard, filtering, defaults.
  useEffect(() => {
    if (containerRef.current) {
      mgTabsRuntime(containerRef.current, true);
    }
  }, []);

  return tabdata ? (
    <article
      ref={containerRef}
      className={`mg-tabs ${variant === 'stacked' ? 'mg-tabs--stacked' : 'mg-tabs--horizontal'}`}
      data-mg-js-tabs
      data-mg-js-tabs-variant={variant === 'stacked' ? 'stacked' : 'horizontal'}
      {...(defaultOpen != null ? { 'data-mg-js-tabs-default-open': String(defaultOpen) } : {})}
      {...(singleOpen ? { 'data-mg-js-tabs-single-open': '' } : {})}
      {...(filterable && variant === 'stacked' ? { 'data-mg-js-tabs-filterable': '' } : {})}
      {...(filterable && variant === 'stacked' && filterPlaceholder
        ? { 'data-mg-js-tabs-filter-placeholder': filterPlaceholder }
        : {})}
    >
      <ul className="mg-tabs__list">
        {tabdata.map((tab, index) => (
          <React.Fragment key={`tab-group-${index}`}>
            <li className="mg-tabs__item">
              <a
                className="mg-tabs__link"
                href={`#mg-tabs__section-${tab.text_id}`}
                data-mg-js-tabs-default={tab.is_default}
              >
                {tab.text}
              </a>
            </li>
            <li className="mg-tabs-content" data-mg-js-tabs-content>
              <section
                className="mg-tabs__section"
                id={`mg-tabs__section-${tab.text_id}`}
              >
                {tab.data ? (
                  <div dangerouslySetInnerHTML={{ __html: tab.data }} />
                ) : null}
              </section>
            </li>
          </React.Fragment>
        ))}
      </ul>
    </article>
  ) : (
    <div
      dangerouslySetInnerHTML={{
        __html: '<!-- mgTabs: No tab data passed -->',
      }}
    />
  );
}

Tab.propTypes = {
  /** Array of tab objects, each containing text, text_id, and optional HTML data. */
  tabdata: PropTypes.arrayOf(
    PropTypes.shape({
      /** Display label for the tab. */
      text: PropTypes.string.isRequired,
      /** Unique identifier used for the tab section anchor. */
      text_id: PropTypes.string.isRequired,
      /** HTML content rendered inside the tab panel. */
      data: PropTypes.string,
      /** Whether this tab should be selected by default. */
      is_default: PropTypes.string,
    })
  ).isRequired,
  /** Layout variant controlling tab orientation. */
  variant: PropTypes.oneOf(['stacked', 'horizontal']),
  /** Whether stacked panels start open (true), closed (false), or default (undefined = open first). */
  defaultOpen: PropTypes.bool,
  /** When true, only one stacked panel can be open at a time (accordion behavior). */
  singleOpen: PropTypes.bool,
  /** When true, renders a search input to filter stacked sections by text content. */
  filterable: PropTypes.bool,
  /** Placeholder text for the filter input. */
  filterPlaceholder: PropTypes.string,
};
