#!/usr/bin/env node
/**
 * Watch tokens/*.yaml and regenerate the Sass partials on change.
 *
 * `sass --watch` only follows the SCSS tree, so before this existed an edit to
 * a token source during `yarn dev` was a silent no-op: the YAML changed, the
 * partials did not, and the browser showed the old value with no error to
 * explain it.
 *
 * Deliberately dependency-free and deliberately not clever. It shells out to
 * the same generator the build uses, so there is one code path and no chance
 * of the watcher and the build disagreeing.
 */
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'tokens');
const generator = path.join(__dirname, 'build-tokens.cjs');

let pending = null;

function rebuild(reason) {
  execFile(process.execPath, [generator], (err, stdout, stderr) => {
    const out = (stdout || '').trim();
    if (err) {
      // A token error is the point of the generator, not a crash: print it and
      // keep watching so the next save can fix it.
      process.stderr.write(`watch-tokens: ${reason} -> ${(stderr || err.message).trim()}\n`);
      return;
    }
    process.stdout.write(`watch-tokens: ${reason}${out ? ` -> ${out}` : ' -> rebuilt'}\n`);
  });
}

fs.watch(dir, (_event, filename) => {
  if (!filename || !filename.endsWith('.yaml')) return;
  // Editors write in bursts; coalesce so one save is one rebuild.
  clearTimeout(pending);
  pending = setTimeout(() => rebuild(filename), 50);
});

process.stdout.write(`watch-tokens: watching ${path.relative(process.cwd(), dir)}/*.yaml\n`);
