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
 * Re-resolutions after a resolved target left the document, within
 * THRASH_WINDOW_MS, before the hook gives up and keeps the in-widget layout.
 * Editors replace a target block a few times in a burst at most; more than
 * this means the portal itself is removing its target.
 */
const THRASH_LIMIT = 10;
const THRASH_WINDOW_MS = 1000;

/**
 * Find the first element in `doc` matching `selector` that is outside the
 * widget, or null. The widget's own markup (and the widget root) is never a
 * target: portaling into it would remove the in-widget fallback that
 * matched, detach the target and loop. An invalid selector counts as no
 * match rather than throwing.
 * @private
 */
function query(doc, selector, root) {
  let matches;
  try {
    matches = doc.querySelectorAll(selector);
  } catch {
    return null;
  }
  for (const el of matches) {
    if (!root || !root.contains(el)) return el;
  }
  return null;
}

/**
 * Resolve `selector` to a DOM element for a React portal, and keep it
 * resolved as the page changes.
 *
 * The selector is matched in the document that owns the widget root, not the
 * global `document`: a block editor canvas can be an iframe while the
 * widget's script runs in the parent window. See `utils/ownerDocument.js`.
 * Elements inside the widget itself never match.
 *
 * Block editors such as Gutenberg render target blocks after the widget, move
 * them, or replace them with new nodes. When the selector has no match at
 * mount, or the resolved element later leaves the document, the hook watches
 * that document's body for added or removed nodes and resolves the selector
 * again. While the element is connected the observer callback is a single
 * `isConnected` check, so it costs nothing measurable on busy pages. If
 * resolved targets keep leaving the document in a tight loop, the hook stops
 * watching and returns null.
 *
 * `onMissing` is called at most once per selector for the life of the
 * component (including StrictMode's double effect run), the first time it
 * fails to match, so callers can warn without repeating the warning on every
 * DOM change.
 *
 * @param {string|null|undefined} selector - CSS selector for the target
 * @param {boolean} enabled - Whether the target is wanted at all
 * @param {{current: (Node|null)}} rootRef - Ref to the widget root, used to
 *   find the document to search and to exclude the widget's own markup
 * @param {Function} [onMissing] - Called once when the selector doesn't match
 * @returns {Element|null} The connected target element, or null
 */
export function useExternalTarget(selector, enabled, rootRef, onMissing) {
  const [target, setTarget] = useState(null);
  // A ref, so a new onMissing identity on each render doesn't re-run the
  // resolution or reset the once-only warning.
  const onMissingRef = useRef(onMissing);
  onMissingRef.current = onMissing;
  // Selectors already warned about. Outside the effect so a re-run (StrictMode,
  // or toggling `enabled`) doesn't warn again.
  const warnedRef = useRef(new Set());

  useEffect(() => {
    // Effects run after commit, so the root is attached by now.
    const root = rootRef?.current || null;
    const doc = getOwnerDocument(root);
    if (!enabled || !selector || !doc?.body) {
      setTarget(null);
      return undefined;
    }

    let current = null;
    let observer = null;
    let lostAt = [];
    let gaveUp = false;

    const warnMissing = () => {
      if (warnedRef.current.has(selector)) return;
      warnedRef.current.add(selector);
      onMissingRef.current?.(selector);
    };

    const resolve = () => {
      if (gaveUp || current?.isConnected) return;

      if (current) {
        // A target we portaled into has left the document. Count it, and
        // give up if that keeps happening in a burst.
        const now = Date.now();
        lostAt = lostAt.filter(t => now - t < THRASH_WINDOW_MS);
        lostAt.push(now);
        if (lostAt.length > THRASH_LIMIT) {
          gaveUp = true;
          observer?.disconnect();
          current = null;
          setTarget(null);
          console.warn(
            `[SyndicationSearchWidget] target selector "${selector}" kept being removed from the page; using the in-widget layout.`
          );
          return;
        }
      }

      const next = query(doc, selector, root);
      if (next !== current) {
        current = next;
        setTarget(next);
      }
      if (!next) warnMissing();
    };

    resolve();

    // The observer of the window this code runs in can watch a same-origin
    // iframe's document, so the global constructor is enough.
    if (typeof MutationObserver === 'undefined') return undefined;

    // Observing stays on while resolved: nothing else reports that the
    // target was removed, and the callback returns at once while it's
    // still in the document.
    observer = new MutationObserver(resolve);
    observer.observe(doc.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [selector, enabled, rootRef]);

  return target;
}

export default useExternalTarget;
