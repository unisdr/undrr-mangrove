/**
 * @file useExternalTarget.js
 * @description Resolve a CSS selector to a portal target that may appear,
 * move or be replaced after the widget mounts.
 *
 * @module SearchWidget/hooks/useExternalTarget
 */

import { useEffect, useRef, useState } from 'react';
import { getOwnerDocument } from '../utils/ownerDocument';

/**
 * Find the first element in `doc` matching `selector`, or null. An invalid
 * selector counts as no match rather than throwing.
 * @private
 */
function query(doc, selector) {
  try {
    return doc.querySelector(selector);
  } catch {
    return null;
  }
}

/**
 * Resolve `selector` to a DOM element for a React portal, and keep it
 * resolved as the page changes.
 *
 * The selector is matched in the document that owns the widget root, not the
 * global `document`: a block editor canvas can be an iframe while the
 * widget's script runs in the parent window. See `utils/ownerDocument.js`.
 *
 * Block editors such as Gutenberg render target blocks after the widget, move
 * them, or replace them with new nodes. When the selector has no match at
 * mount, or the resolved element later leaves the document, the hook watches
 * that document's body for added or removed nodes and resolves the selector again.
 * While the element is connected the observer callback is a single
 * `isConnected` check, so it costs nothing measurable on busy pages.
 *
 * `onMissing` is called at most once per selector, the first time it fails to
 * match, so callers can warn without repeating the warning on every DOM change.
 *
 * @param {string|null|undefined} selector - CSS selector for the target
 * @param {boolean} enabled - Whether the target is wanted at all
 * @param {{current: (Node|null)}} rootRef - Ref to a node inside the widget,
 *   used to find the document to search
 * @param {Function} [onMissing] - Called once when the selector doesn't match
 * @returns {Element|null} The connected target element, or null
 */
export function useExternalTarget(selector, enabled, rootRef, onMissing) {
  const [target, setTarget] = useState(null);
  // A ref, so a new onMissing identity on each render doesn't re-run the
  // resolution or reset the once-only warning.
  const onMissingRef = useRef(onMissing);
  onMissingRef.current = onMissing;

  useEffect(() => {
    // Effects run after commit, so the root is attached by now.
    const doc = getOwnerDocument(rootRef?.current);
    if (!enabled || !selector || !doc?.body) {
      setTarget(null);
      return undefined;
    }

    let current = null;
    let warned = false;

    const resolve = () => {
      if (current?.isConnected) return;
      const next = query(doc, selector);
      if (next !== current) {
        current = next;
        setTarget(next);
      }
      if (!next && !warned) {
        warned = true;
        onMissingRef.current?.(selector);
      }
    };

    resolve();

    // The observer of the window this code runs in can watch a same-origin
    // iframe's document, so the global constructor is enough.
    if (typeof MutationObserver === 'undefined') return undefined;

    // Observing stays on while resolved: nothing else reports that the
    // target was removed, and the callback returns at once while it's
    // still in the document.
    const observer = new MutationObserver(resolve);
    observer.observe(doc.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [selector, enabled, rootRef]);

  return target;
}

export default useExternalTarget;
