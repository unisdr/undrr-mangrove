/**
 * @file ownerDocument.js
 * @description Resolve the document a widget node belongs to.
 *
 * The widget can be mounted into a document other than the one its script
 * runs in: a block editor that renders its canvas in an iframe (Drupal's
 * Gutenberg 4, WordPress) runs block JavaScript in the parent window. A
 * lookup through the global `document` then searches the wrong tree. On a
 * normal page `node.ownerDocument === document`, so resolving through the
 * node changes nothing there.
 *
 * @module SearchWidget/utils/ownerDocument
 */

/**
 * Return the document that owns `node`, falling back to the global
 * `document`, or `null` where there is no DOM (server rendering).
 *
 * @param {Node|null|undefined} node
 * @returns {Document|null}
 */
export function getOwnerDocument(node) {
  if (node && node.ownerDocument) return node.ownerDocument;
  return typeof document === 'undefined' ? null : document;
}

/**
 * Resolve a target element for a portal. `target` is a CSS selector looked up
 * in the document that owns `node`.
 *
 * @param {string} target CSS selector
 * @param {Node|null|undefined} node A node inside the widget
 * @returns {Element|null}
 */
export function resolveTarget(target, node) {
  if (!target) return null;
  const doc = getOwnerDocument(node);
  return doc ? doc.querySelector(target) : null;
}
