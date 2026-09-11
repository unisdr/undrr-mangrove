import React, { memo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { mgTabsRuntime, mgTabsDestroy } from '../../assets/js/tabs';

export const DEFAULT_TAB_LABELS = {
  filterPlaceholder: 'Filter sections…',
  tabListLabel: 'Sections',
};

/**
 * Renders a tab component with either stacked or horizontal layout.
 * @param {Object} props - The component props.
 * @param {Array} props.tabdata - An array of tab objects containing text, text_id, and data.
 * @param {string} [props.variant='horizontal'] - The layout variant, either 'stacked' or 'horizontal'.
 * @param {boolean} [props.defaultOpen] - Whether stacked panels start open (true), closed (false), or default (undefined = open first).
 * @param {boolean} [props.singleOpen=false] - When true, only one stacked panel can be open at a time.
 * @param {boolean} [props.filterable=false] - When true, renders a search input to filter stacked sections.
 * @param {object} [props.labels] - UI label overrides.
 * @returns {JSX.Element} A React component representing the tab structure.
 */
export function Tab({
  tabdata,
  variant = 'horizontal',
  defaultOpen,
  singleOpen = false,
  stackOnMobile = false,
  filterable = false,
  labels = DEFAULT_TAB_LABELS,
}) {
  const { filterPlaceholder, tabListLabel } = {
    ...DEFAULT_TAB_LABELS,
    ...labels,
  };
  const containerRef = useRef(null);

  // Initialize this container's tabs runtime (scoped, not global).
  // The runtime handles all behavior: ARIA, keyboard, filtering, defaults.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    mgTabsRuntime(container, true);
    return () => mgTabsDestroy(container, true);
  }, [
    tabdata,
    variant,
    defaultOpen,
    singleOpen,
    stackOnMobile,
    filterable,
    filterPlaceholder,
    tabListLabel,
  ]);

  return tabdata ? (
    <article
      ref={containerRef}
      className={`mg-tabs ${variant === 'stacked' ? 'mg-tabs--stacked' : 'mg-tabs--horizontal'}`}
      data-mg-js-tabs
      data-mg-js-tabs-label={tabListLabel}
      {...(stackOnMobile && variant !== 'stacked'
        ? { 'data-mg-js-tabs-stack-on-mobile': '' }
        : {})}
      data-mg-js-tabs-variant={variant === 'stacked' ? 'stacked' : 'horizontal'}
      {...(variant === 'stacked' && defaultOpen != null
        ? { 'data-mg-js-tabs-default-open': String(defaultOpen) }
        : {})}
      {...(variant === 'stacked' && singleOpen
        ? { 'data-mg-js-tabs-single-open': '' }
        : {})}
      {...(filterable && variant === 'stacked'
        ? { 'data-mg-js-tabs-filterable': '' }
        : {})}
      {...(filterable && variant === 'stacked' && filterPlaceholder
        ? { 'data-mg-js-tabs-filter-placeholder': filterPlaceholder }
        : {})}
    >
      {variant === 'stacked' ? (
        <ul className="mg-tabs__list">
          {tabdata.map(tab => (
            <React.Fragment key={tab.text_id}>
              <li className="mg-tabs__item">
                <TabTrigger tab={tab} />
              </li>
              <li className="mg-tabs-content" data-mg-js-tabs-content>
                <TabPanel textId={tab.text_id} data={tab.data} />
              </li>
            </React.Fragment>
          ))}
        </ul>
      ) : (
        <>
          <div className="mg-tabs__rail">
            <div className="mg-tabs__scroll">
              <ul className="mg-tabs__list">
                {tabdata.map(tab => (
                  <li className="mg-tabs__item" key={tab.text_id}>
                    <TabTrigger tab={tab} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mg-tabs__panels">
            {tabdata.map(tab => (
              <div
                className="mg-tabs-content"
                data-mg-js-tabs-content
                key={tab.text_id}
              >
                {stackOnMobile && (
                  <div className="mg-tabs__mobile-item" hidden>
                    <TabTrigger tab={tab} mobile />
                  </div>
                )}
                <TabPanel textId={tab.text_id} data={tab.data} />
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  ) : (
    <div
      dangerouslySetInnerHTML={{
        __html: '<!-- mgTabs: No tab data passed -->',
      }}
    />
  );
}

function TabTrigger({ tab, mobile = false }) {
  return (
    <a
      className={
        mobile ? 'mg-tabs__link mg-tabs__mobile-link' : 'mg-tabs__link'
      }
      href={`#mg-tabs__section-${tab.text_id}`}
      data-mg-js-tabs-default={tab.is_default}
    >
      {tab.text}
    </a>
  );
}

// Keep unchanged rich content mounted through parent renders. Reassigning
// innerHTML would otherwise discard live form values and embedded state.
const TabPanel = memo(function TabPanel({ textId, data }) {
  return (
    <section className="mg-tabs__section" id={`mg-tabs__section-${textId}`}>
      {data ? <div dangerouslySetInnerHTML={{ __html: data }} /> : null}
    </section>
  );
});

Tab.propTypes = {
  /** Array of tab objects, each containing text, text_id, and optional HTML data. */
  tabdata: PropTypes.arrayOf(
    PropTypes.shape({
      /** Display label for the tab. */
      text: PropTypes.string.isRequired,
      /** Unique identifier used for the tab section anchor. */
      text_id: PropTypes.string.isRequired,
      /** Pre-sanitised HTML content rendered inside the tab panel. Consumers must sanitise it before passing it. */
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
  /** Opt in to stacked disclosures below 480px for the horizontal variant. */
  stackOnMobile: PropTypes.bool,
  /** When true, renders a search input to filter stacked sections by text content. */
  filterable: PropTypes.bool,
  /** UI label overrides. */
  labels: PropTypes.shape({
    filterPlaceholder: PropTypes.string,
    tabListLabel: PropTypes.string,
  }),
};
