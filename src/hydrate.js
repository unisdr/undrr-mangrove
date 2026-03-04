import React from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Generic hydration runtime for Mangrove components (Layer 1).
 *
 * Queries the DOM for containers matching `selector`, extracts props via
 * `fromElement`, and renders the React `component` into each one. Marks
 * mounted containers with `data-mg-hydrated="true"` to prevent double-rendering.
 *
 * @param {object} config
 * @param {string} config.selector - CSS selector for container elements
 * @param {Function|object} config.component - React component (or module with `.default`)
 * @param {Function} config.fromElement - (container: Element) => props object
 * @param {object} [config.options]
 * @param {boolean} [config.options.clearContainer=true] - Clear innerHTML before rendering
 * @param {string} [config.options.debugLabel] - Label for error messages (defaults to selector)
 * @param {Function} [config.options.onError] - (error, container) callback
 * @param {string} [config.options.identifierPrefix] - Prefix for React useId() (defaults to selector-based slug)
 * @returns {{ roots: Array, update: Function, unmountAll: Function }}
 */
export default function createHydrator({
  selector,
  component,
  fromElement,
  options = {},
}) {
  const { clearContainer = true, debugLabel = selector, onError, identifierPrefix } = options;
  const Component = component?.default ?? component;

  // Derive a stable prefix from the selector to avoid useId() collisions
  // across multiple React roots on the same page.
  const prefix = identifierPrefix ?? selector.replace(/[[\]\.#=>"' ]/g, '').replace(/^data-mg-?/, 'mg-');
  const entries = []; // { root, container } pairs

  /**
   * Scan a DOM subtree for unhydrated containers and mount components.
   *
   * @param {Element|Document} [context=document] - DOM node to scan within
   * @returns {Array} Newly created React roots from this scan
   */
  function update(context = document) {
    const containers = context.querySelectorAll(selector);
    const newRoots = [];

    containers.forEach((container, index) => {
      if (container.dataset.mgHydrated === 'true') return;

      const savedHTML = clearContainer ? container.innerHTML : null;
      try {
        const props = fromElement(container);
        if (clearContainer) container.innerHTML = '';
        const root = createRoot(container, {
          identifierPrefix: `${prefix}-${index}-`,
          onCaughtError(error, errorInfo) {
            console.error(`[${debugLabel}] Caught error in container #${index}:`, error, errorInfo);
            if (onError) onError(error, container);
          },
          onUncaughtError(error, errorInfo) {
            console.error(`[${debugLabel}] Uncaught error in container #${index}:`, error, errorInfo);
            if (onError) onError(error, container);
          },
          onRecoverableError(error) {
            console.warn(`[${debugLabel}] Recoverable error in container #${index}:`, error);
          },
        });
        root.render(React.createElement(Component, props));
        container.dataset.mgHydrated = 'true';
        entries.push({ root, container });
        newRoots.push(root);
      } catch (error) {
        console.error(`[${debugLabel}] Container #${index}:`, error);
        if (savedHTML !== null) container.innerHTML = savedHTML;
        if (onError) onError(error, container);
      }
    });

    return newRoots;
  }

  // Initial scan against the full document
  update();

  return {
    /** All React roots created by this hydrator */
    get roots() {
      return entries.map(e => e.root);
    },
    update,
    unmountAll() {
      entries.forEach(({ root, container }) => {
        root.unmount();
        delete container.dataset.mgHydrated;
      });
      entries.length = 0;
    },
  };
}
