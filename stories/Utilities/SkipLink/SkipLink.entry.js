/**
 * Webpack entry wrapper for the standalone SkipLink bundle.
 *
 * See CtaButton.entry.js: SkipLink is imported by PageHeader, which is an entry
 * point, so SkipLink.jsx must not be an entry point itself.
 */
export * from './SkipLink';
