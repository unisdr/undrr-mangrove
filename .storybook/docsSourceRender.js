import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as prettier from 'prettier/standalone';
import * as htmlPlugin from 'prettier/plugins/html';

/**
 * Renders a story to formatted HTML for the docs "Show code" panel.
 *
 * Kept apart from `docsSource.js` so react-dom/server and Prettier load in
 * their own chunk, only when a story file opts in with
 * `parameters.docs.source.html: true`.
 */

// A prefix no story would write, so React's useId values can be found and
// renamed without touching ids the story sets itself.
const ID_PREFIX = 'mgdocsid-';
const REACT_ID = /_mgdocsid-R_[0-9A-Za-z]+_/g;

const LEADING_TAG = /^\s*(<link\b[^>]*>|<script\b[^>]*>\s*<\/script>)/i;

const attributes = tag => {
  const found = {};
  for (const [, name, value] of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    found[name.toLowerCase()] = value;
  }
  return found;
};

/**
 * Remove the image preload hints React adds while rendering.
 *
 * React 19 hoists resource hints (image preloads, preconnects, async scripts)
 * in front of the rendered markup. It adds `<link rel="preload" as="image">`
 * for every `<img>` it renders; those are noise in a snippet. Only preloads
 * that match an `<img>` in the markup are dropped, so hints the story renders
 * on purpose stay. A story that renders its own preload for an image it also
 * shows cannot be told apart: React merges the two into one tag.
 *
 * @param {string} markup Output of renderToStaticMarkup.
 * @returns {string} Markup without React's image preloads.
 */
export const stripReactPreloads = markup => {
  const hoisted = [];
  let rest = markup;
  let match = rest.match(LEADING_TAG);
  while (match) {
    hoisted.push(match[1]);
    rest = rest.slice(match[0].length);
    match = rest.match(LEADING_TAG);
  }
  if (!hoisted.length) return markup;

  const images = [...rest.matchAll(/<img\b[^>]*>/gi)].map(([tag]) =>
    attributes(tag)
  );
  const sources = new Set(images.map(img => img.src).filter(Boolean));
  const sourceSets = new Set(images.map(img => img.srcset).filter(Boolean));

  const kept = hoisted.filter(tag => {
    const attrs = attributes(tag);
    const isImagePreload =
      /^<link\b/i.test(tag) && attrs.rel === 'preload' && attrs.as === 'image';
    if (!isImagePreload) return true;
    if (attrs.imagesrcset) return !sourceSets.has(attrs.imagesrcset);
    return !sources.has(attrs.href);
  });

  return kept.join('') + rest;
};

const slugify = text =>
  String(text || '')
    .split('/')
    .pop()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Replace React's generated ids with readable, stable ones.
 *
 * The same generated id always maps to the same placeholder, so `for`,
 * `aria-labelledby`, `aria-describedby` and `aria-controls` keep pointing at
 * the element they reference.
 *
 * @param {string} markup Rendered markup.
 * @param {string} [name] Base for the placeholder, e.g. the story title.
 * @returns {string} Markup with placeholder ids.
 */
export const replaceReactIds = (markup, name) => {
  const base = slugify(name) || 'example-id';
  const ids = new Map();
  return markup.replace(REACT_ID, id => {
    if (!ids.has(id)) ids.set(id, `${base}-${ids.size + 1}`);
    return ids.get(id);
  });
};

/**
 * Format HTML with Prettier.
 *
 * `htmlWhitespaceSensitivity: 'css'` keeps inline elements next to their text
 * (`<strong>a</strong>: b`); 'ignore' would add whitespace that renders.
 *
 * @param {string} html HTML to format.
 * @returns {Promise<string>} Formatted HTML.
 */
export const formatHtml = async html =>
  (
    await prettier.format(html, {
      parser: 'html',
      plugins: [htmlPlugin],
      printWidth: 80,
      tabWidth: 2,
      htmlWhitespaceSensitivity: 'css',
    })
  ).trim();

/**
 * Render a story's own markup to formatted HTML.
 *
 * Uses `originalStoryFn`, so no decorators run: neither global decorators
 * nor the file's or story's own. The snippet is the story's markup only.
 *
 * @param {object} storyContext Storybook story context.
 * @returns {Promise<string>} Formatted HTML, or '' when the story renders nothing.
 */
export const renderStoryToHtml = async storyContext => {
  const { originalStoryFn, args } = storyContext;
  // Render inside a component so stories that call React hooks work.
  const StorySource = () => originalStoryFn(args, storyContext);
  const markup = renderToStaticMarkup(React.createElement(StorySource), {
    identifierPrefix: ID_PREFIX,
  });
  const cleaned = replaceReactIds(
    stripReactPreloads(markup),
    storyContext.title
  ).trim();
  return cleaned ? formatHtml(cleaned) : '';
};
