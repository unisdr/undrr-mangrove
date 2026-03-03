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
 * @returns {{ roots: Array, update: Function, unmountAll: Function }}
 */
export default function createHydrator({
  selector,
  component,
  fromElement,
  options = {},
}) {
  const { clearContainer = true, debugLabel = selector, onError } = options;
  const Component = component?.default ?? component;
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
        const root = createRoot(container);
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
