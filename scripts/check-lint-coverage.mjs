#!/usr/bin/env node
/**
 * Fails when a source file matches no ESLint configuration.
 *
 * ESLint reports such a file as "File ignored because no matching
 * configuration was supplied" — a warning that is easy to miss and that never
 * appears at all unless the file is passed explicitly. Plain `.jsx` escaped
 * linting that way for the whole of the library's life: 199 component files,
 * every one of them walked past by `yarn lint:check`. See
 * unisdr/undrr-mangrove#1235 and #1241.
 *
 * `ESLint#calculateConfigForFile` returns `undefined` for such a file, which
 * is the signal this script checks. Note that `ESLint#isPathIgnored` is not
 * usable here: it answers true both for a file the config deliberately ignores
 * and for one nothing matches, so it cannot tell a recorded decision from a
 * hole. The deliberate exclusions are therefore listed below, which makes
 * adding one a visible edit rather than a silent gap.
 */

import { ESLint } from 'eslint';
import { glob } from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Directories whose source files must all be linted. */
const DIRECTORIES = ['src', 'stories', 'scripts'];

/** Extensions that hold JavaScript or TypeScript source. */
const EXTENSIONS = ['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx'];

/**
 * Paths the repository deliberately keeps out of ESLint. Each must also be in
 * the `ignores` block of eslint.config.mjs; both are vendored third-party or
 * generated code that the project does not style.
 */
const DELIBERATELY_IGNORED = [
  '**/glideslider.js',
  'stories/assets/js/lib/*.js',
];

async function main() {
  const eslint = new ESLint({ cwd: ROOT });

  const files = await glob(
    `{${DIRECTORIES.join(',')}}/**/*.{${EXTENSIONS.join(',')}}`,
    { cwd: ROOT, absolute: true, nodir: true, ignore: '**/node_modules/**' }
  );

  const ignored = new Set(
    await glob(DELIBERATELY_IGNORED, {
      cwd: ROOT,
      absolute: true,
      nodir: true,
      ignore: '**/node_modules/**',
    })
  );

  const unmatched = [];

  for (const file of files) {
    const relative = path.relative(ROOT, file);

    if (ignored.has(file)) {
      continue;
    }

    // Returns undefined when no config object's `files` pattern claims the
    // file, which is exactly the hole this script exists to find. The awaits
    // run in sequence on purpose: ESLint's API is per file and the file count
    // is small, so the ordered output is worth more than the concurrency.
    const config = await eslint.calculateConfigForFile(file);

    if (!config || !config.rules) {
      unmatched.push(relative);
    }
  }

  if (unmatched.length > 0) {
    console.error(
      `${unmatched.length} source file(s) match no ESLint configuration, so they are never linted:\n`
    );
    for (const file of unmatched) {
      console.error(`  ${file}`);
    }

    console.error(
      '\nAdd the extension to a `files` pattern in eslint.config.mjs, or add the path to `ignores` if it is meant to be skipped.'
    );
    process.exit(1);
  }

  console.log(
    `Lint coverage: ${files.length} source file(s) across ${DIRECTORIES.join(', ')} all match an ESLint configuration.`
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
