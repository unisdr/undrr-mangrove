#!/usr/bin/env node
/**
 * Watch tokens/*.tokens.json and regenerate the Sass partials on change.
 *
 * `sass --watch` only follows the SCSS tree, so before this existed an edit to
 * a token source during `yarn dev` was a silent no-op: the token JSON changed, the
 * partials did not, and the browser showed the old value with no error to
 * explain it.
 *
 * Deliberately dependency-free and deliberately not clever. It shells out to
 * the same generator the build uses, so there is one code path and no chance
 * of the watcher and the build disagreeing.
 */
const { execFile } = require('child_process');
const { promisify } = require('util');
const run = promisify(execFile);
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'tokens');
const generator = path.join(__dirname, 'build-tokens.cjs');

let pending = null;

async function rebuild(reason) {
  try {
    const generated = await run(process.execPath, [generator]);
    const exchanged = await run(process.execPath, [generator, '--export-dtcg']);
    const out = [generated.stdout, exchanged.stdout]
      .map(value => value.trim())
      .filter(Boolean)
      .join('\n');
    process.stdout.write(
      `watch-tokens: ${reason}${out ? ` -> ${out}` : ' -> rebuilt'}\n`
    );
  } catch (error) {
    // Report a bad source and keep watching for the next corrected save.
    process.stderr.write(
      `watch-tokens: ${reason} -> ${(error.stderr || error.message).trim()}\n`
    );
  }
}

fs.watch(dir, (_event, filename) => {
  if (!filename || !filename.endsWith('.tokens.json')) return;
  // Editors write in bursts; coalesce so one save is one rebuild.
  clearTimeout(pending);
  pending = setTimeout(() => rebuild(filename), 50);
});

process.stdout.write(
  `watch-tokens: watching ${path.relative(process.cwd(), dir)}/*.tokens.json\n`
);
