/**
 * "Show code" source for docs pages.
 *
 * By default Storybook's own snippet is shown: JSX from args, or the story
 * source for `render` stories. Story files for CSS-only components opt in to
 * HTML with `parameters.docs.source.html: true` in their meta (or on one
 * story). For those, the snippet is the story rendered to formatted static
 * HTML that consumers can paste into Drupal, Twig or a plain page.
 *
 * The renderer (react-dom/server and Prettier) is a separate chunk, fetched
 * the first time an opted-in story's code is needed.
 */

const loadRenderer = () =>
  import(/* webpackChunkName: "docs-source-render" */ './docsSourceRender');

const DEFAULT_CACHE_SIZE = 100;

const wantsHtml = storyContext =>
  storyContext.parameters?.docs?.source?.html === true;

/**
 * Build a cache key from the story id, all globals and the args.
 *
 * Functions, symbols and React elements cannot be serialised faithfully, so
 * any of them in args or globals means the result is not cached.
 *
 * @param {object} storyContext Storybook story context.
 * @returns {string|undefined} The key, or undefined when not cacheable.
 */
export const cacheKey = storyContext => {
  try {
    return JSON.stringify(
      [storyContext.id, storyContext.globals ?? {}, storyContext.args ?? {}],
      (name, value) => {
        if (
          typeof value === 'function' ||
          typeof value === 'symbol' ||
          (value && typeof value === 'object' && '$$typeof' in value)
        ) {
          throw new Error('Not serialisable');
        }
        return value;
      }
    );
  } catch {
    return undefined;
  }
};

/**
 * Create a `parameters.docs.source.transform` function.
 *
 * @param {object} [options]
 * @param {Function} [options.load] Resolves to the renderer module; defaults
 *   to a lazy import of `./docsSourceRender`.
 * @param {number} [options.cacheSize] Most rendered snippets to keep.
 * @returns {Function} Transform taking (code, storyContext) and returning the
 *   snippet to show, or a promise of it.
 */
export const createSourceTransform = ({
  load = loadRenderer,
  cacheSize = DEFAULT_CACHE_SIZE,
} = {}) => {
  // Least recently used first: Map keeps insertion order.
  const cache = new Map();

  return (code, storyContext) => {
    if (
      !wantsHtml(storyContext) ||
      typeof storyContext.originalStoryFn !== 'function'
    ) {
      return code;
    }

    const render = () =>
      // Wrapped so a synchronous throw also becomes a rejected promise.
      Promise.resolve()
        .then(load)
        .then(renderer => renderer.renderStoryToHtml(storyContext))
        .catch(error => {
          // Stories that need the live preview (Storybook hooks, DOM access)
          // cannot render on their own; fall back to the story source.
          console.warn(
            `[docs source] Could not render ${storyContext.id} to HTML:`,
            error
          );
          return '';
        });

    // The docs Source block calls the transform on every render, so reuse the
    // result for the same story, globals and args.
    const key = cacheKey(storyContext);
    if (key === undefined) {
      return render().then(html => html || code);
    }

    let result = cache.get(key);
    if (result) {
      cache.delete(key);
    } else {
      result = render();
    }
    cache.set(key, result);
    while (cache.size > cacheSize) {
      cache.delete(cache.keys().next().value);
    }
    return result.then(html => html || code);
  };
};

export const transformSource = createSourceTransform();
