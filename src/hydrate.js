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
 * A match sitting inside a hydrated container that `selector` also matches is
 * never a target, so a component is free to render the marker its own
 * hydration selector matches. A different component's hydration host nested
 * inside a hydrated container still hydrates.
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
   * Is this match nested inside an already-hydrated container of its own kind?
   *
   * A component may render the same `data-mg-*` marker its own hydration
   * selector matches — SyndicationSearchWidget renders `data-mg-search-widget`
   * on its root so its pager can find the widget to scroll to. A re-scan then
   * reads that React-rendered marker as an un-hydrated target and mounts a
   * second copy inside the first. See undrr/undrr-mangrove#1227.
   *
   * The ancestor has to match `selector` as well as be hydrated. "Inside any
   * hydrated container" is too wide: ScrollContainer and Drawer read
   * `innerHTML`/`outerHTML` in their `fromElement` and re-emit the consumer's
   * markup through `dangerouslySetInnerHTML`, so a hydration host an author
   * nested in one comes back out of React verbatim and must still hydrate. A
   * row of hydrated cards inside a ScrollContainer is its canonical use. What
   * cannot be told apart is a marker the component rendered itself from one it
   * re-emitted for the consumer, and that ambiguity only exists when the two
   * carry the same selector — so only that case is skipped.
   *
   * The walk reads the DOM rather than this hydrator's own `entries`, so a
   * page that builds two hydrators for one selector — a wrapper loaded twice,
   * or a site bundle alongside the CDN build — does not reopen #1227.
   *
   * The walk starts at the parent: the container's own hydrated flag is the
   * separate already-mounted check.
   *
   * @param {Element} container
   * @param {Element|Document|DocumentFragment} context - the subtree being scanned
   * @returns {boolean}
   */
  function isInsideHydratedContainerOfSameKind(container, context) {
    // A container an earlier mount in this same scan detached: clearing the
    // outer container took this one out of the scanned tree, so there is
    // nothing left to hydrate. The NodeList is a static snapshot, so this is
    // the only place that shows up.
    if (!context.contains(container)) return true;

    let node = container.parentElement;
    while (node) {
      if (node.dataset.mgHydrated === 'true' && node.matches(selector)) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  /**
   * Scan a DOM subtree for unhydrated containers and mount components.
   *
   * Containers already mounted, and containers sitting inside a hydrated
   * container the same selector matches, are skipped.
   *
   * @param {Element|Document} [context=document] - DOM node to scan within
   * @returns {Array} Newly created React roots from this scan
   */
  function update(context = document) {
    const containers = context.querySelectorAll(selector);
    const newRoots = [];

    containers.forEach((container, index) => {
      if (container.dataset.mgHydrated === 'true') return;
      if (isInsideHydratedContainerOfSameKind(container, context)) return;

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
