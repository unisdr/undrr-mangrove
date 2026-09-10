/** @jest-environment node */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const config = fs.readFileSync(path.join(root, 'webpack.config.js'), 'utf8');

/**
 * The component build emits one ES module per entry. A module that is both an
 * entry point and a dependency of another entry is not duplicated into the
 * consumer's chunk, so the consumer's bundle ends up referencing a chunk it
 * never imports and the component resolves to `undefined` at render time --
 * which is how it surfaced: Hero rendered without its CTA button. Shared
 * components therefore get a thin `*.entry.js` wrapper so the shared module
 * itself stays an ordinary module.
 */
function readEntries() {
  const start = config.indexOf('hydrate:');
  const block = config.slice(start, config.indexOf('externals', start));
  const entries = {};
  for (const match of block.matchAll(/([A-Za-z]\w*):\s*\n?\s*'(\.\/[^']+)'/g)) {
    entries[match[1]] = path.resolve(root, match[2]);
  }
  return entries;
}

function resolveImport(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  for (const candidate of [base, `${base}.jsx`, `${base}.js`]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

describe('webpack component entries', () => {
  const entries = readEntries();

  test('the entry list was parsed', () => {
    expect(Object.keys(entries).length).toBeGreaterThan(30);
    expect(entries).toHaveProperty('Hero');
  });

  test('no entry module is imported by another entry', () => {
    const byPath = new Map(
      Object.entries(entries).map(([name, file]) => [file, name])
    );
    const offenders = [];

    for (const [file, name] of byPath) {
      if (!fs.existsSync(file)) continue;
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(
        /^import\s+[^;]*?from\s+'(\.[^']+)'/gm
      )) {
        const target = resolveImport(file, match[1]);
        if (target && target !== file && byPath.has(target)) {
          offenders.push(`${name} imports entry ${byPath.get(target)}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
