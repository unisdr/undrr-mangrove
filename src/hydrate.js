import React from 'react';
import { createRoot } from 'react-dom/client';

// Page-wide root counter for identifierPrefix. It lives on globalThis rather
// than in module scope so it is shared by every hydrator and by duplicate
// copies of this runtime (for example a site bundle alongside the CDN build),
// each of which may bring its own copy of React whose useId counter starts at 0.
const ROOT_COUNTER_KEY = Symbol.for('undrr.mangrove.hydrate.rootCounter');

function nextRootId() {
  const current = globalThis[ROOT_COUNTER_KEY];
  const id = Number.isSafeInteger(current) && current >= 0 ? current : 0;
  globalThis[ROOT_COUNTER_KEY] = id + 1;
  return id;
}

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
 * @param {string} [config.options.identifierPrefix] - Prefix for React useId() (defaults to selector-based slug). A page-wide root number is appended, so ids stay unique across hydrators and `update()` calls
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
          identifierPrefix: `${prefix}-${nextRootId()}-`,
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
