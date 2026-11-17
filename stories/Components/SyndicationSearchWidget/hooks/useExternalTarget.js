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
const targetClaims = new WeakMap();
const pendingTargets = new WeakSet();

function isVisible(root) {
  if (!root?.isConnected) return false;
  const view = root.ownerDocument.defaultView;
  for (let node = root; node; node = node.parentElement) {
    if (
      node.hasAttribute('hidden') ||
      node.getAttribute('aria-hidden') === 'true' ||
      (node.tagName === 'DETAILS' &&
        !node.open &&
        !node.querySelector('summary')?.contains(root))
    ) {
      return false;
    }
    const style = view?.getComputedStyle(node);
    if (style?.display === 'none' || style?.visibility === 'hidden')
      return false;
  }
  return true;
}

function updateClaims(target) {
  const claims = targetClaims.get(target);
  if (!claims) return;
  const connected = [...claims].filter(claim => claim.root?.isConnected);
  const visible = connected.filter(claim => isVisible(claim.root));
  // Shared controls belong to the group rather than a display. Keep one
  // controller outside closed panels even when no display is visible.
  const candidates = visible.length
    ? visible
    : connected.filter(claim => claim.keepWhenHidden);
  candidates.sort((a, b) => {
    if (a.root === b.root) return 0;
    return a.root.compareDocumentPosition(b.root) & 4 ? -1 : 1;
  });
  const owner = candidates[0];
  claims.forEach(claim => claim.update(!!owner && claim.root === owner.root));
}

function scheduleClaimUpdate(target) {
  if (pendingTargets.has(target)) return;
  pendingTargets.add(target);
  // Several widget observers can see the same tab switch. Scan its shared
  // target once after that batch, rather than once per observing widget.
  Promise.resolve().then(() => {
    pendingTargets.delete(target);
    updateClaims(target);
  });
}

function claimTarget(target, claim) {
  if (!targetClaims.has(target)) targetClaims.set(target, new Set());
  targetClaims.get(target).add(claim);
  updateClaims(target);
}

function releaseTarget(target, claim) {
  const claims = targetClaims.get(target);
  if (!claims) return;
  claims.delete(claim);
  if (claims.size) updateClaims(target);
  else targetClaims.delete(target);
}

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
 * again. Visibility changes transfer ownership to the first visible widget
 * in document order when multiple widgets share the target. If resolved
 * targets keep leaving the document in a tight loop, the hook stops
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
 * @param {boolean} [keepWhenHidden=false] - Keep group controls outside closed displays
 * @returns {{target: Element|null, isOwner: boolean}} Target and control ownership
 */
export function useExternalTarget(
  selector,
  enabled,
  rootRef,
  onMissing,
  keepWhenHidden = false
) {
  const [target, setTarget] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
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
      setIsOwner(false);
      return undefined;
    }

    let current = null;
    let observer = null;
    let lostAt = [];
    let gaveUp = false;
    const claim = { root, update: setIsOwner, keepWhenHidden };

    const warnMissing = () => {
      if (warnedRef.current.has(selector)) return;
      warnedRef.current.add(selector);
      onMissingRef.current?.(selector);
    };

    const resolve = () => {
      if (gaveUp) return;
      if (current?.isConnected) {
        scheduleClaimUpdate(current);
        return;
      }

      if (current) {
        releaseTarget(current, claim);
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
          setIsOwner(false);
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
        setIsOwner(false);
        if (next) claimTarget(next, claim);
      }
      if (!next) warnMissing();
    };

    resolve();

    // The observer of the window this code runs in can watch a same-origin
    // iframe's document, so the global constructor is enough.
    if (typeof MutationObserver === 'undefined') {
      return () => current && releaseTarget(current, claim);
    }

    // Tab/disclosure visibility changes do not remove their widget roots.
    observer = new MutationObserver(records => {
      if (
        !current?.isConnected ||
        records.some(record => {
          if (record.type === 'attributes') return record.target.contains(root);
          // Result and portal rendering also mutate the body. Only moving
          // this widget (or an ancestor) can change its visibility or order.
          return [...record.addedNodes, ...record.removedNodes].some(node =>
            node.contains(root)
          );
        })
      ) {
        resolve();
      }
    });
    doc.defaultView?.addEventListener('resize', resolve);
    observer.observe(doc.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'aria-hidden', 'class', 'style', 'open'],
    });

    return () => {
      observer.disconnect();
      doc.defaultView?.removeEventListener('resize', resolve);
      if (current) releaseTarget(current, claim);
    };
  }, [selector, enabled, rootRef, keepWhenHidden]);

  return { target, isOwner };
}

export default useExternalTarget;
