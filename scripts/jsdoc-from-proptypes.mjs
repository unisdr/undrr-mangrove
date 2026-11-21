/**
 * Draft a typed JSDoc `@param` block from a component's PropTypes.
 *
 *   yarn jsdoc:draft stories/Atom/Icons/Icon.jsx [ExportName] [--write]
 *
 * Prints the draft for human review: keep the component's own prose, check
 * every description and refine computed enums or loose shapes before
 * committing. With `--write`, the draft replaces the `@param` lines of the
 * component's existing docblock, or is appended to it when it has none; a
 * component with no docblock is left alone. See unisdr/undrr-mangrove#1511.
 */
import fs from 'node:fs';
import { readPropTypesDocgen } from './ai-manifest/react-docgen-source.js';
import { draftJsDocParams } from './lib/prop-contracts.js';

const args = process.argv.slice(2);
const write = args.includes('--write');
const [file, ...names] = args.filter(arg => arg !== '--write');

if (!file) {
  console.error(
    'Usage: yarn jsdoc:draft <component file> [export name ...] [--write]'
  );
  process.exit(1);
}

const docs = readPropTypesDocgen(file, names);
if (!docs?.props || !Object.keys(docs.props).length) {
  console.error(
    `No PropTypes found for ${names.length ? names.join(', ') : 'the component'} in ${file}.` +
      ' Pass the export name when the file defines more than one component.'
  );
  process.exit(1);
}

const draft = draftJsDocParams(docs);

if (!write) {
  console.log(draft);
  process.exit(0);
}

// react-docgen gives the docblock's text, not its position, so find the
// block that holds it. Matching on the first line is enough to locate it.
const source = fs.readFileSync(file, 'utf8');
const firstLine = docs.description?.split('\n')[0]?.trim();
const block = firstLine
  ? [...source.matchAll(/\/\*\*[\s\S]*?\*\//g)].find(match =>
      match[0].includes(firstLine)
    )
  : undefined;
if (!block) {
  console.error(
    `Could not find the component's docblock in ${file}; nothing written. Paste the draft by hand:\n\n${draft}`
  );
  process.exit(1);
}
// A one-line `/** Text. */` docblock is opened out first. Continuation lines
// of a multi-line @param are not removed: delete them in review.
const lines = block[0].includes('\n')
  ? block[0].split('\n')
  : ['/**', ` * ${block[0].replace(/^\/\*\*\s*|\s*\*\/$/g, '')}`, ' */'];
const kept = lines.filter(line => !/^\s*\*\s*@param\b/.test(line));
const closing = kept.pop();
while (kept.length > 1 && /^\s*\*\s*$/.test(kept.at(-1))) kept.pop();
const updated = [...kept, ' *', draft, closing].join('\n');
fs.writeFileSync(
  file,
  source.slice(0, block.index) +
    updated +
    source.slice(block.index + block[0].length)
);
console.log(
  `Wrote the drafted @param block to ${file}. Review it before committing.`
);
