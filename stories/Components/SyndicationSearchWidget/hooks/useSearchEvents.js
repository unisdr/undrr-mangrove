/**
 * @file useSearchEvents.js
 * @description Bubbling `mg-search:*` events for site analytics.
 *
 * Only the handlers of the controls a visitor operates call the emitter.
 * Configuration, defaults, URL restoration and programmatic dispatches change
 * the search state through other paths and so never emit. The details carry
 * stable keys and codes, never the search text or a translated label.
 *
 * @module SearchWidget/hooks/useSearchEvents
 */

import { useCallback } from 'react';
import { useSearchConfig } from '../context/SearchContext';
import { useWidgetRootRef } from '../context/WidgetRootContext';
import { analyticsRegion } from '../utils/constants';
import { tabOptionValue } from '../utils/customFacetTabs';

/**
 * Compare a facet's selection before and after a visitor's action.
 *
 * @param {string[]} previous - Selected values before the action
 * @param {string[]} next - Selected values after the action
 * @returns {{action: ('select'|'clear'), changed: string[]}|null} Null when
 *   the selection is unchanged. A replacement counts as a selection.
 */
export function selectionChange(previous, next) {
  const added = next.filter(value => !previous.includes(value));
  if (added.length) return { action: 'select', changed: added };
  const removed = previous.filter(value => !next.includes(value));
  return removed.length ? { action: 'clear', changed: removed } : null;
}

/**
 * The value reported for a custom facet option: its authored URL value, or
 * its position when it has none. Matches the `Search tab` click labels.
 *
 * @param {Object} facet - Custom facet config
 * @param {string|number} index - Option position
 * @returns {string}
 */
export function customOptionValue(facet, index) {
  return tabOptionValue(facet, Number(index)) ?? String(index);
}

/**
 * @returns {Function} `emit(element, name, detail)`: dispatches
 *   `mg-search:<name>` from `element`, or from the widget root when the
 *   element is missing or detached, adding the facets region to the detail.
 */
export function useSearchEvents() {
  const config = useSearchConfig();
  const rootRef = useWidgetRootRef();
  const region = analyticsRegion(config, 'facets');

  return useCallback(
    (element, name, detail) => {
      const target = element?.isConnected ? element : rootRef.current;
      if (!target) return;
      const EventClass =
        target.ownerDocument?.defaultView?.CustomEvent || CustomEvent;
      target.dispatchEvent(
        new EventClass(`mg-search:${name}`, {
          bubbles: true,
          composed: true,
          detail: { region, ...detail },
        })
      );
    },
    [region, rootRef]
  );
}

export default useSearchEvents;
