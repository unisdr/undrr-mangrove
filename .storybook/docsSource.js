import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * "Show code" source for docs pages.
 *
 * Story files without a `component` in their meta document CSS-only
 * patterns: the markup is the whole API, so consumers need HTML they can
 * paste into Drupal, Twig or a plain page. For those stories the snippet is
 * the story rendered to static HTML. Story files with a `component` keep
 * Storybook's JSX snippet.
 *
 * Opt out per story or file with `parameters.docs.source.html: false`, or
 * force HTML for a component story with `html: true`.
 */

const formatHtml = async html => {
  const [prettier, htmlPlugin] = await Promise.all([
    import('prettier/standalone'),
    import('prettier/plugins/html'),
  ]);
  const formatted = await prettier.format(html, {
    parser: 'html',
    plugins: [htmlPlugin],
    printWidth: 80,
    tabWidth: 2,
    htmlWhitespaceSensitivity: 'ignore',
  });
  return formatted.trim();
};

/**
 * Render a story's own markup (without global decorators) to formatted HTML.
 *
 * @param {object} storyContext Storybook story context.
 * @param {Function} [format] Formats an HTML string; defaults to Prettier.
 * @returns {Promise<string>} Formatted HTML, or '' when the story renders nothing.
 */
export const renderStoryToHtml = async (storyContext, format = formatHtml) => {
  const { originalStoryFn, args } = storyContext;
  // Render inside a component so stories that call React hooks work.
  const StorySource = () => originalStoryFn(args, storyContext);
  const markup = renderToStaticMarkup(React.createElement(StorySource));
  return markup.trim() ? (await format(markup)).trim() : '';
};

const wantsHtml = storyContext => {
  const preference = storyContext.parameters?.docs?.source?.html;
  if (typeof preference === 'boolean') return preference;
  return !storyContext.component;
};

/**
 * Create a `parameters.docs.source.transform` function.
 *
 * @param {object} [options]
 * @param {Function} [options.format] Formats an HTML string; defaults to Prettier.
 * @returns {Function} Transform taking (code, storyContext) and returning the
 *   snippet to show, or a promise of it.
 */
export const createSourceTransform = ({ format = formatHtml } = {}) => {
  const cache = new Map();

  return (code, storyContext) => {
    if (
      !wantsHtml(storyContext) ||
      typeof storyContext.originalStoryFn !== 'function'
    ) {
      return code;
    }

    // The docs Source block calls the transform on every render, so reuse the
    // result for the same story, locale and args.
    let key;
    try {
      key = JSON.stringify([
        storyContext.id,
        storyContext.globals?.locale,
        storyContext.args,
      ]);
    } catch {
      key = undefined;
    }

    const render = () =>
      // Wrapped so a synchronous throw also becomes a rejected promise.
      Promise.resolve()
        .then(() => renderStoryToHtml(storyContext, format))
        .catch(error => {
          // Stories that need the live preview (Storybook hooks, DOM access)
          // cannot render on their own; fall back to the story source.
          console.warn(
            `[docs source] Could not render ${storyContext.id} to HTML:`,
            error
          );
          return '';
        });

    if (key === undefined) {
      return render().then(html => html || code);
    }
    if (!cache.has(key)) {
      cache.set(key, render());
    }
    return cache.get(key).then(html => html || code);
  };
};

export const transformSource = createSourceTransform();
