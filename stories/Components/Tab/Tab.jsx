import React, { useEffect, useDeferredValue, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { mgTabsRuntime, mgTabsApplyStackedDefaults } from '../../assets/js/tabs';

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
  const [filterQuery, setFilterQuery] = useState('');
  const deferredQuery = useDeferredValue(filterQuery);
  const [matchCount, setMatchCount] = useState(-1); // -1 = no filter active
  const hasFilteredRef = useRef(false);
  const hintId = useId();

  // Initialize this container's tabs runtime (scoped, not global)
  useEffect(() => {
    if (containerRef.current) {
      mgTabsRuntime(containerRef.current, true);
    }
  }, []);

  // Filter effect — runs when deferred query changes (skips initial mount)
  useEffect(() => {
    if (!filterable || variant !== 'stacked' || !containerRef.current) return;
    const container = containerRef.current;
    const query = deferredQuery.toLowerCase().trim();

    if (!query) {
      // On initial mount (no filter applied yet), skip — mgTabsRuntime handles defaults
      if (!hasFilteredRef.current) return;

      // Restore: show all items, reset to default state
      const items = container.querySelectorAll('.mg-tabs__item');
      const tabs = container.querySelectorAll('.mg-tabs__link');
      const panels = container.querySelectorAll('[id^="mg-tabs__section"]');
      items.forEach(item => {
        item.style.display = '';
        const contentLi = item.nextElementSibling;
        if (contentLi?.classList.contains('mg-tabs-content')) {
          contentLi.style.display = '';
        }
      });
      mgTabsApplyStackedDefaults(container, tabs, panels);
      setMatchCount(-1);
      return;
    }

    hasFilteredRef.current = true;
    const items = container.querySelectorAll('.mg-tabs__item');
    let matches = 0;

    items.forEach(item => {
      const trigger = item.querySelector('.mg-tabs__link');
      const contentLi = item.nextElementSibling;
      const panel = contentLi?.querySelector('.mg-tabs__section');

      const triggerText = trigger?.textContent?.toLowerCase() || '';
      const panelText = panel?.textContent?.toLowerCase() || '';
      const isMatch = triggerText.includes(query) || panelText.includes(query);

      item.style.display = isMatch ? '' : 'none';
      if (contentLi?.classList.contains('mg-tabs-content')) {
        contentLi.style.display = isMatch ? '' : 'none';
      }

      // Auto-expand matching panels
      if (isMatch && panel && trigger) {
        panel.removeAttribute('hidden');
        trigger.setAttribute('aria-expanded', 'true');
        trigger.classList.add('is-active', 'mg-tabs__stacked--open');
        matches++;
      } else if (!isMatch && panel && trigger) {
        panel.setAttribute('hidden', 'until-found');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.classList.remove('is-active', 'mg-tabs__stacked--open');
      }
    });

    setMatchCount(matches);
  }, [deferredQuery, filterable, variant]);

  return tabdata ? (
    <article
      ref={containerRef}
      className={`mg-tabs ${variant === 'stacked' ? 'mg-tabs--stacked' : 'mg-tabs--horizontal'}`}
      data-mg-js-tabs
      data-mg-js-tabs-variant={variant === 'stacked' ? 'stacked' : 'horizontal'}
      {...(defaultOpen != null ? { 'data-mg-js-tabs-default-open': String(defaultOpen) } : {})}
      {...(singleOpen ? { 'data-mg-js-tabs-single-open': '' } : {})}
    >
      {filterable && variant === 'stacked' && (
        <div className="mg-tabs__filter">
          <input
            type="search"
            className="mg-form-input mg-tabs__filter-input"
            placeholder={filterPlaceholder}
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            aria-describedby={hintId}
          />
          <span id={hintId} className="mg-u-sr-only">
            Results will filter as you type
          </span>
        </div>
      )}
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
      {filterable && matchCount === 0 && (
        <p className="mg-tabs__no-results" role="status" aria-live="assertive">
          No matching sections found.
        </p>
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
