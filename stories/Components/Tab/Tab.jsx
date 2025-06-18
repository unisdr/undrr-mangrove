import React, { useEffect } from 'react';
import { mgTabs } from '../../assets/js/tabs';

/**
 * Renders a tab component with either stacked or horizontal layout.
 * @param {Object} props - The component props.
 * @param {Array} props.tabdata - An array of tab objects containing text, text_id, and data.
 * @param {string} props.variant - The layout variant, either 'stacked' or 'horizontal'.
 * @returns {JSX.Element} A React component representing the tab structure.
 */
export function Tab({ tabdata, variant }) {
  useEffect(() => {
    mgTabs();
  }, []);
  return tabdata ? (
    <article
      className={`mg-tabs ${variant === 'stacked' ? 'mg-tabs--stacked' : 'mg-tabs--horizontal'}`}
      data-mg-js-tabs
      data-mg-js-tabs-variant={variant === 'stacked' ? 'stacked' : 'horizontal'}
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
