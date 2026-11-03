import React from 'react';
import PropTypes from 'prop-types';

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

/** One insertion, deletion, substitution or adjacent transposition per word. */
function isNearWord(query, word) {
  if (Math.abs(query.length - word.length) > 1) return false;
  let i = 0;
  while (i < query.length && query[i] === word[i]) i++;
  if (i === query.length) return true;
  let j = i;
  if (query.length < word.length) j++;
  else if (query.length > word.length) i++;
  else if (query[i] === word[i + 1] && query[i + 1] === word[i]) {
    i += 2;
    j += 2;
  } else {
    i++;
    j++;
  }
  while (i < query.length && j < word.length) {
    if (query[i++] !== word[j++]) return false;
  }
  return i === query.length && j === word.length;
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
  // A fixed number of rank buckets keeps stable menu order without sorting.
  const buckets = [[], [], [], []];
  for (const item of items) {
    const title = item.title?.toLowerCase() || '';
    if (title === normalized) buckets[0].push(item);
    else if (title.startsWith(normalized)) buckets[1].push(item);
    else if (title.includes(normalized)) buckets[2].push(item);
    else if (item.fullPath?.toLowerCase().includes(normalized))
      buckets[3].push(item);
  }
  // Only fall back to typo tolerance when literal matching finds nothing.
  if (
    buckets.every(bucket => !bucket.length) &&
    /^[\p{L}\p{N}]{4,}$/u.test(normalized)
  ) {
    const queryCharacters = Array.from(normalized);
    const wordMatches = new Map();
    const textMatches = new Map();
    const hasNearWord = text => {
      // Menu ancestors repeat for every descendant. Match each distinct text
      // and word once per query, without retaining stale data between queries.
      if (!textMatches.has(text)) {
        const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
        textMatches.set(
          text,
          words.some(word => {
            if (!wordMatches.has(word)) {
              wordMatches.set(
                word,
                isNearWord(queryCharacters, Array.from(word))
              );
            }
            return wordMatches.get(word);
          })
        );
      }
      return textMatches.get(text);
    };
    for (const item of items) {
      if (hasNearWord(item.title || '')) buckets[0].push(item);
      else if (hasNearWord(item.fullPath || '')) buckets[1].push(item);
    }
  }
  const results = [];
  const seen = new Set();
  for (const bucket of buckets) {
    for (const item of bucket) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      results.push(item);
    }
  }
  return results;
}

/**
 * Resolves the destination URL for full-site search, pointing by default to the
 * syndicated search page (/search) and its #query= hash parameter.
 *
 * @param {string} searchUrl - Configured search URL or template (defaults to '/search').
 * @param {string} query - The query term.
 * @returns {string} Destination URL with query term appended appropriately.
 */
export function getSiteSearchUrl(searchUrl = '/search', query = '') {
  const term = encodeURIComponent((query || '').trim());
  if (!searchUrl) return `/search#query=${term}`;

  if (searchUrl.endsWith('=')) {
    return `${searchUrl}${term}`;
  }

  if (searchUrl.includes('#')) {
    return `${searchUrl}&query=${term}`;
  }

  if (searchUrl.includes('?')) {
    return `${searchUrl}&query=${term}`;
  }

  // Base path like '/search' or '/search/'
  const base = searchUrl.replace(/\/+$/, '');
  return `${base}#query=${term}`;
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
      acc.replace(new RegExp(`\\{${key}\\}`, 'g'), () => String(val)),
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

/** Breadcrumb-style context for one destination; the enclosing link owns navigation. */
export function MenuResultTrail({ item, query }) {
  return (
    <span className="mg-mega-filter__trail">
      {item.path.map((title, index) => (
        <span key={index} className="mg-mega-filter__trail-step">
          <HighlightText text={title} query={query} />
        </span>
      ))}
      <span className="mg-mega-filter__trail-step mg-mega-filter__item-title">
        <HighlightText text={item.title} query={query} />
      </span>
    </span>
  );
}

MenuResultTrail.propTypes = {
  item: PropTypes.shape({
    path: PropTypes.arrayOf(PropTypes.string).isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  query: PropTypes.string,
};
