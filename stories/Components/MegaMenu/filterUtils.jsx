import React from 'react';
import PropTypes from 'prop-types';

/** Infer whole-label initials, including CamelCase boundaries, without a dictionary. */
function menuAcronyms(text) {
  const words = (
    text
      .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
      .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
      .match(/[\p{L}\p{N}]+/gu) || []
  ).filter(word => /^\p{L}/u.test(word));
  const initials = list =>
    list
      .map(word => Array.from(word)[0])
      .join('')
      .toLowerCase();
  const significant = words.filter(
    word => !/^(?:a|an|and|at|by|for|from|in|of|on|or|the|to|with)$/i.test(word)
  );
  return [...new Set([initials(words), initials(significant)])].filter(
    alias => Array.from(alias).length >= 2
  );
}

/** Accept GAR, G-A-R, G.A.R. and spaced initials, but not arbitrary phrases. */
function acronymQuery(query) {
  if (!/^(?:\p{L}{2,}|\p{L}(?:[-.\s]+\p{L})+\.?)$/u.test(query)) return null;
  return query.replace(/[-.\s]/g, '');
}

/**
 * Extracts all navigable links from a sections tree, preserving full hierarchy paths.
 *
 * @param {Array} sections - The hierarchical menu sections array.
 * @returns {Array} Destinations, hierarchy paths and precomputed title/ancestor acronym aliases.
 */
export function flattenMenuItems(sections) {
  const results = [];
  const seen = new Set();
  const aliases = new Map();
  const getAliases = title => {
    if (!aliases.has(title)) aliases.set(title, menuAcronyms(title));
    return aliases.get(title);
  };

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
            acronyms: {
              title: getAliases(item.title),
              path: ancestors.flatMap(getAliases),
            },
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

/** English conjunctions share one search form; content keeps its original text. */
function searchWords(text) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+|&/gu) || []).map(word =>
    word === '&' ? 'and' : word
  );
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
  const rawQuery = query.trim().toLowerCase();
  const acronym = acronymQuery(rawQuery);
  const spelledAcronym = acronym && /[-.\s]/.test(rawQuery);
  const words = searchWords(rawQuery);
  const keepAnd = words.length > 0 && words.every(word => word === 'and');
  const terms = keepAnd ? ['and'] : words.filter(word => word !== 'and');
  const useWords =
    !spelledAcronym && (words.length > 1 || words.includes('and'));
  const normalized = spelledAcronym
    ? acronym
    : useWords
      ? terms.join(' ')
      : rawQuery;
  if (!normalized) return [];
  const textForms = new Map();
  const searchForm = text => {
    if (!useWords) return text.toLowerCase();
    if (!textForms.has(text)) {
      textForms.set(
        text,
        searchWords(text)
          .filter(word => keepAnd || word !== 'and')
          .join(' ')
      );
    }
    return textForms.get(text);
  };
  // Flattened menus already index aliases. Keep direct utility callers cheap
  // too, sharing repeated ancestor labels within this query only.
  const aliases = new Map();
  const hasAcronym = text => {
    if (!acronym) return false;
    if (!aliases.has(text)) aliases.set(text, menuAcronyms(text));
    return aliases.get(text).includes(acronym);
  };
  // Fixed rank buckets preserve menu order without sorting. Every query word
  // must occur; title-only matches precede breadcrumb and combined matches.
  const buckets = [[], [], [], [], [], [], [], [], []];
  for (const item of items) {
    const title = searchForm(item.title || '');
    const path = searchForm(item.fullPath || '');
    if (title === normalized) buckets[0].push(item);
    else if (title.startsWith(normalized)) buckets[1].push(item);
    else if (
      !useWords &&
      title.includes(normalized) &&
      searchWords(title).some(word => word.startsWith(normalized))
    )
      buckets[2].push(item);
    else if (
      acronym &&
      (item.acronyms
        ? item.acronyms.title.includes(acronym)
        : hasAcronym(item.title || ''))
    )
      buckets[3].push(item);
    else if (title.includes(normalized)) buckets[4].push(item);
    else if (useWords && terms.every(term => title.includes(term)))
      buckets[5].push(item);
    else if (
      path.includes(normalized) ||
      (useWords && terms.every(term => path.includes(term)))
    )
      buckets[6].push(item);
    else if (
      useWords &&
      terms.every(term => title.includes(term) || path.includes(term))
    )
      buckets[7].push(item);
    else if (
      acronym &&
      (item.acronyms
        ? item.acronyms.path.includes(acronym)
        : (item.path || (item.fullPath || '').split('›')).some(hasAcronym))
    )
      buckets[8].push(item);
  }
  // Only fall back to typo tolerance when literal matching finds nothing.
  if (
    buckets.every(bucket => !bucket.length) &&
    !useWords &&
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
 * Highlights individual query words, preserving authored text and punctuation.
 *
 * @param {Object} props
 * @param {string} props.text - The full text to display.
 * @param {string} props.query - The search query to highlight.
 * @returns {React.ReactNode}
 */
export function HighlightText({ text, query }) {
  if (!query || !query.trim() || !text) return text || '';
  const compact = acronymQuery(query.trim().toLowerCase());
  const words =
    compact && /[-.\s]/.test(query.trim()) ? [compact] : searchWords(query);
  if (!words.length) return text;
  const alternatives = [...new Set(words)].sort((a, b) => b.length - a.length);
  if (alternatives.includes('and')) alternatives.push('&');
  const parts = text.split(new RegExp(`(${alternatives.join('|')})`, 'giu'));
  return parts.map((part, index) =>
    index % 2 ? (
      <mark key={index} className="mg-mega-filter__highlight">
        {part}
      </mark>
    ) : (
      part
    )
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
