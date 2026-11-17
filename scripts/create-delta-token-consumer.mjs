/**
 * Create a plain HTML consumer from complete DTCG exchange files.
 * A temporary source copy demonstrates source edits, regeneration and consumption.
 * Usage: node scripts/create-delta-token-consumer.mjs [.cache/token-only-consumer]
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { format } from 'prettier';
import * as sass from 'sass';
import {
  deltaStyles,
  resolveDocument,
} from './token-consumer/delta-consumer.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(
  root,
  process.argv[2] || '.cache/token-only-consumer'
);
const cache = path.join(root, '.cache');
const relative = path.relative(cache, output);
if (!relative || relative.startsWith('..') || path.isAbsolute(relative))
  throw new Error(
    'Choose an output directory strictly inside this checkout’s .cache/.'
  );
const require = createRequire(import.meta.url);
const { buildDtcgDocuments } = require('./build-tokens.cjs');
const sourceDir = path.join(root, 'tokens');
const sourceNames = (await fs.readdir(sourceDir))
  .filter(name => name.endsWith('.tokens.json'))
  .sort();
const sha = data => createHash('sha256').update(data).digest('hex');
const sourceHashes = async () =>
  Object.fromEntries(
    await Promise.all(
      sourceNames.map(async name => [
        name,
        sha(await fs.readFile(path.join(sourceDir, name))),
      ])
    )
  );
const beforeHashes = await sourceHashes();
const temporary = await fs.mkdtemp(
  path.join(os.tmpdir(), 'mangrove-token-consumer-')
);
try {
  const temporaryTokens = path.join(temporary, 'tokens');
  await fs.mkdir(temporaryTokens);
  for (const name of sourceNames)
    await fs.copyFile(
      path.join(sourceDir, name),
      path.join(temporaryTokens, name)
    );
  const baseline = buildDtcgDocuments({ tokensDir: temporaryTokens }).get(
    'delta-2027.tokens.json'
  );
  const sourcePath = path.join(temporaryTokens, 'delta-2027.tokens.json');
  const source = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
  const original = structuredClone(source);
  source['delta-2027'].primitive.accent['600'].$value.components = [
    124 / 255,
    58 / 255,
    237 / 255,
  ];
  source['delta-2027'].typography.weight.medium.$value = 700;
  source['delta-2027'].spacing['3'].$value = { value: 16, unit: 'px' };
  await fs.writeFile(sourcePath, JSON.stringify(source, null, 2));
  const edited = buildDtcgDocuments({ tokensDir: temporaryTokens }).get(
    'delta-2027.tokens.json'
  );
  for (const document of [baseline, edited]) {
    assert.equal(JSON.stringify(document).includes('$extensions'), false);
    assert.ok(resolveDocument(document).size > 300);
  }
  const originalStyles = deltaStyles(baseline);
  const editedStyles = deltaStyles(edited);
  assert.notEqual(
    originalStyles['--example-action'],
    editedStyles['--example-action']
  );
  assert.equal(editedStyles['--example-weight'], '700');
  assert.equal(editedStyles['--example-padding'], '16px');
  assert.deepEqual(
    await sourceHashes(),
    beforeHashes,
    'Canonical repository token sources must remain unchanged'
  );
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(
    path.join(output, 'baseline.tokens.json'),
    JSON.stringify(baseline, null, 2) + '\n'
  );
  await fs.writeFile(
    path.join(output, 'edited.tokens.json'),
    JSON.stringify(edited, null, 2) + '\n'
  );
  for (const [name, value] of [
    ['before.json', original],
    ['after.json', source],
  ])
    await fs.writeFile(
      path.join(temporary, name),
      await format(JSON.stringify(value), { parser: 'json' })
    );
  const diff = spawnSync(
    'diff',
    [
      '-u',
      '-L',
      'tokens/delta-2027.tokens.json (baseline copy)',
      '-L',
      'tokens/delta-2027.tokens.json (edited copy)',
      path.join(temporary, 'before.json'),
      path.join(temporary, 'after.json'),
    ],
    { encoding: 'utf8' }
  );
  if (diff.status !== 1)
    throw new Error(`Expected a source diff: ${diff.stderr}`);
  await fs.writeFile(path.join(output, 'source-edit.diff'), diff.stdout);
  await fs.writeFile(path.join(output, 'source-edit.txt'), diff.stdout);
  await fs.copyFile(
    path.join(root, 'scripts/token-consumer/delta-consumer.mjs'),
    path.join(output, 'delta-consumer.mjs')
  );
  const fontDir = path.join(root, 'stories/assets/fonts/delta-2027');
  await fs.cp(fontDir, path.join(output, 'fonts/delta-2027'), {
    recursive: true,
    filter: file => !file.endsWith('.scss'),
  });
  const faces = sass.compileString(
    '@use "font-paths" with ($font-path-delta-2027: "./fonts/delta-2027"); @use "delta-2027/delta-2027";',
    {
      loadPaths: [
        path.join(root, 'stories/assets/scss'),
        path.join(root, 'stories/assets/fonts'),
      ],
      logger: sass.Logger.silent,
    }
  ).css;
  await fs.writeFile(path.join(output, 'fonts.css'), faces);
  await fs.copyFile(
    path.join(root, 'scripts/token-consumer/example.css'),
    path.join(output, 'example.css')
  );
  await fs.copyFile(
    path.join(root, 'scripts/token-consumer/example.mjs'),
    path.join(output, 'example.mjs')
  );
  for (const kind of ['baseline', 'edited']) {
    await fs.writeFile(
      path.join(output, `${kind}.html`),
      `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${kind === 'baseline' ? 'Original tokens' : 'Edited tokens'} — plain HTML consumer</title><link rel="stylesheet" href="fonts.css"><link rel="stylesheet" href="example.css"><body data-document="${kind}.tokens.json"><main><h1>Disaster event record</h1><p>This page reads a complete DTCG document. It uses plain HTML and its own small stylesheet.</p><form><label for="event">Event name</label><input id="event" value="Flooding in Central Province"><button type="submit">Save draft</button><p role="status">Changes are stored only in this example.</p></form><details><summary>Values used by this consumer</summary><pre id="values"></pre></details></main><script type="module" src="example.mjs"></script></body></html>`
    );
  }
  const report = {
    sourceEdits: [
      {
        path: 'delta-2027.primitive.accent.600.$value.components',
        before:
          original['delta-2027'].primitive.accent['600'].$value.components,
        after: source['delta-2027'].primitive.accent['600'].$value.components,
      },
      {
        path: 'delta-2027.typography.weight.medium.$value',
        before: original['delta-2027'].typography.weight.medium.$value,
        after: 700,
      },
      {
        path: 'delta-2027.spacing.3.$value',
        before: original['delta-2027'].spacing['3'].$value,
        after: { value: 16, unit: 'px' },
      },
    ],
    baselineTokenCount: resolveDocument(baseline).size,
    editedTokenCount: resolveDocument(edited).size,
    repositorySourcesUnchanged: true,
    sourceHashes: beforeHashes,
    baseline: originalStyles,
    edited: editedStyles,
  };
  await fs.writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(report, null, 2) + '\n'
  );
  await fs.copyFile(
    path.join(root, 'scripts/token-consumer/index.html'),
    path.join(output, 'index.html')
  );
  console.log(
    `Created ${path.relative(root, output)}/index.html: complete exports, three temporary source edits, independent plain HTML consumer. Canonical token files unchanged.`
  );
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}
