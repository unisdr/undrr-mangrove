/**
 * @file WidgetRootContext.jsx
 * @description Shares a ref to the widget's root element with descendants.
 *
 * Components with no DOM node of their own (the search pager) read the root
 * at event time to find the document the widget is mounted in. See
 * `utils/ownerDocument.js`.
 *
 * @module SearchWidget/context/WidgetRootContext
 */

import { createContext, use } from 'react';
const NO_ROOT = { current: null };

export const WidgetRootContext = createContext(NO_ROOT);

/**
 * Return the ref to the widget root. Its `current` is null outside a
 * provider, which `getOwnerDocument` treats as the global `document`.
 *
 * @returns {{current: (HTMLElement|null)}}
 */
export function useWidgetRootRef() {
  return use(WidgetRootContext);
}
