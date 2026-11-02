import React from 'react';

/**
 * Extracts all navigable links from a sections tree, preserving full hierarchy paths.
 *
 * @param {Array} sections - The hierarchical menu sections array.
 * @returns {Array<{ title: string, url: string, path: string[], fullPath: string }>}
 */
export function flattenMenuItems(sections) {
  const results = [];
  const seen = new Set();

  const walk = (items, ancestors = []) => {
    if (!items || !Array.isArray(items)) return;
    for (const item of items) {
      if (!item || !item.title) continue;
      const currentPath = [...ancestors, item.title];
      const url = item.url || item.bannerButton?.url;

      if (url) {
        const key = `${url}|${item.title}|${ancestors.join('>')}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            title: item.title,
            url,
            path: ancestors,
            fullPath: ancestors.join(' › '),
          });
        }
      }

      if (item.items && item.items.length > 0) {
        walk(item.items, currentPath);
      }
    }
  };

  walk(sections);
  return results;
}

/**
 * Filters a flat list of menu items by query string matching title or category path.
 *
 * @param {Array} items - Flat list of menu items from flattenMenuItems.
 * @param {string} query - Search/filter query.
 * @returns {Array} Matching items.
 */
export function filterMenuItems(items, query) {
  if (!items || !query || !query.trim()) return [];
  const normalized = query.trim().toLowerCase();
  return items.filter(item => {
    const inTitle = item.title?.toLowerCase().includes(normalized);
    const inPath = item.fullPath?.toLowerCase().includes(normalized);
    return Boolean(inTitle || inPath);
  });
}

/**
 * Replaces `{var}` placeholders in a template string with provided variables.
 *
 * @param {string} template - The template string.
 * @param {Object} variables - Key-value replacements.
 * @returns {string} The formatted string.
 */
export function formatLabel(template, variables = {}) {
  if (typeof template !== 'string') return '';
  return Object.entries(variables).reduce(
    (acc, [key, val]) =>
      acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)),
    template
  );
}

/**
 * Recursively highlights occurrences of query in text using a <mark> element.
 *
 * @param {Object} props
 * @param {string} props.text - The full text to display.
 * @param {string} props.query - The search query to highlight.
 * @returns {React.ReactNode}
 */
export function HighlightText({ text, query }) {
  if (!query || !query.trim() || !text) return text || '';
  const q = query.trim();
  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + q.length);
  const after = text.slice(index + q.length);

  return (
    <>
      {before}
      <mark className="mg-mega-filter__highlight">{match}</mark>
      <HighlightText text={after} query={query} />
    </>
  );
}
