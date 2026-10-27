/**
 * Webpack entry wrapper for the standalone SkipLink bundle.
 *
 * See CtaButton.entry.js: SkipLink is imported by PageHeader, which is an entry
 * point, so SkipLink.jsx must not be an entry point itself.
 *
 * `export *` does not re-export a default binding, so the default is forwarded
 * explicitly -- without it the bundle silently loses the default export it has
 * always had.
 */
export * from './SkipLink';
export { default } from './SkipLink';
