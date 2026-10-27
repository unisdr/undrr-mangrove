/**
 * Webpack entry wrapper for the standalone CtaButton bundle.
 *
 * CtaButton is imported by Hero and the card components, which are entry
 * points themselves. A module that is both an entry point and a dependency of
 * another entry is not duplicated into the consumer's chunk, so under
 * `experiments.outputModule` the consumer's bundle referenced a chunk it never
 * imported and the component resolved to `undefined` at render time. Pointing
 * the entry at this wrapper keeps CtaButton.jsx an ordinary module, so each
 * consumer inlines its own copy.
 */
export * from './CtaButton';
