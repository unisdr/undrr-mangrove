/**
 * Jest globalSetup — make the suite runnable on a clone that has never built.
 *
 * The token contract suite compiles the SCSS entry points, which `@import`
 * generated partials that are build output and therefore not committed.
 * Without this hook `yarn test` fails on a fresh clone with an opaque Sass
 * "Can't find stylesheet" error before a single assertion runs.
 *
 * See scripts/ensure-generated.cjs for why only missing files are written.
 */
const {
  ensureGeneratedTokenPartials,
} = require('./scripts/ensure-generated.cjs');

module.exports = function globalSetup() {
  const written = ensureGeneratedTokenPartials();

  if (written.length > 0) {
    process.stdout.write(
      `jest: generated ${written.length} missing token partial(s) ` +
        '(equivalent to `yarn build:tokens`)\n'
    );
  }
};
