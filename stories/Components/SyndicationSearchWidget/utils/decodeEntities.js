/**
 * @file decodeEntities.js
 * @description Decode HTML entities in plain-text strings from the API.
 *
 * Drupal's taxonomy REST views HTML-escape term names (`raw_output: false`),
 * so labels arrive as `Côte d&#039;Ivoire`. React escapes text again on
 * render, which would show the entity literally. Decode once, where the data
 * enters the widget.
 *
 * @module SearchWidget/utils/decodeEntities
 */

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

const ENTITY_PATTERN = /&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi;

/**
 * Decode entities without a DOM (Node, workers). Handles numeric entities
 * and the named entities Drupal's escaping produces.
 *
 * @param {string} text - Text containing HTML entities
 * @returns {string} Decoded text
 */
export function decodeEntitiesFallback(text) {
  return text.replace(ENTITY_PATTERN, (match, entity) => {
    if (entity[0] === '#') {
      const isHex = entity[1] === 'x' || entity[1] === 'X';
      const codePoint = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      if (
        !Number.isFinite(codePoint) ||
        codePoint <= 0 ||
        codePoint > 0x10ffff
      ) {
        return match;
      }
      return String.fromCodePoint(codePoint);
    }
    const named = NAMED_ENTITIES[entity.toLowerCase()];
    return named === undefined ? match : named;
  });
}

let textarea = null;

/**
 * Decode HTML entities in a plain-text string.
 *
 * Uses a detached `<textarea>` in the browser: its content is parsed as
 * text (RCDATA), so entities are decoded but markup is never interpreted or
 * executed. Falls back to a regex decoder where no DOM is available.
 *
 * @param {*} value - Value to decode; non-strings are returned unchanged
 * @returns {*} Decoded string, or the original value
 */
export function decodeEntities(value) {
  if (typeof value !== 'string' || !value.includes('&')) {
    return value;
  }
  if (typeof document !== 'undefined' && document.createElement) {
    try {
      if (!textarea) textarea = document.createElement('textarea');
      textarea.innerHTML = value;
      return textarea.value;
    } catch {
      // Fall through to the regex decoder
    }
  }
  return decodeEntitiesFallback(value);
}

export default decodeEntities;
