/** Build a portable exploratory field guide from the current token sources. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as sass from 'sass';

const require = createRequire(import.meta.url);
const { build, buildTokensDictionary } = require('./build-tokens.cjs');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'examples/field-guide');
const output = path.join(source, 'dist');
const dictionary = buildTokensDictionary();

// Generate only inside this checkout; do not depend on another running build.
for (const [file, contents] of build()) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}
fs.mkdirSync(path.join(output, 'assets'), { recursive: true });
for (const file of ['index.html', 'guide.css', 'guide.js', 'specimen.html']) {
  fs.copyFileSync(path.join(source, file), path.join(output, file));
}
fs.writeFileSync(
  path.join(output, 'tokens.json'),
  JSON.stringify(dictionary, null, 2) + '\n'
);
for (const id of Object.keys(dictionary.brands)) {
  const suffix = id === 'undrr' ? '' : `-${id}`;
  const result = sass.compile(
    path.join(root, `stories/assets/scss/style${suffix}.scss`),
    {
      style: 'compressed',
      silenceDeprecations: [
        'import',
        'global-builtin',
        'color-functions',
        'if-function',
      ],
    }
  );
  fs.writeFileSync(path.join(output, `assets/${id}.css`), result.css);
}
fs.copyFileSync(
  path.join(root, 'stories/assets/images/undrr-logo-blue.svg'),
  path.join(output, 'assets/undrr-logo-blue.svg')
);
// Relative icon URLs in the real stylesheets need the bundled icon font.
fs.cpSync(
  path.join(root, 'stories/assets/fonts/mangrove-icon-set'),
  path.join(output, 'fonts/mangrove-icon-set'),
  { recursive: true }
);
console.log(
  `Field guide built in ${path.relative(root, output)} (${dictionary.totalTokens} tokens, ${Object.keys(dictionary.brands).length} themes).`
);
