#!/usr/bin/env node
/** Prepare reversible style-only DTO fixtures. Does not import or publish them. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');
const { execFileSync } = require('child_process');
const {
  buildFigmaMaintenance,
} = require('../../../scripts/build-figma-maintenance-tokens.cjs');
const ROOT = path.resolve(__dirname, '../../..');
const output = path.resolve(process.argv[2] || '');
if (!process.argv[2] || fs.existsSync(output))
  throw new Error('Supply a new output directory.');
if (output === ROOT || output.startsWith(`${ROOT}${path.sep}`))
  throw new Error('Fixtures must stay outside source.');
const inputStatus = execFileSync(
  'git',
  [
    'status',
    '--porcelain',
    '--untracked-files=all',
    '--',
    'tokens',
    'scripts',
    'stories',
  ],
  { cwd: ROOT }
).toString();
if (inputStatus.trim())
  throw new Error(
    'Commit or restore token/exporter/SCSS input changes before recording HEAD provenance.'
  );
const baseline = buildFigmaMaintenance();
const copy = value => JSON.parse(JSON.stringify(value));
const text = copy(baseline);
const effect = copy(baseline);
const textIndex = baseline.styles.text.findIndex(
  s => s.id === 'text.text.300.regular'
);
const effectIndex = baseline.styles.effect.findIndex(
  s => s.id === 'shadow.raised'
);
assert(textIndex >= 0 && effectIndex >= 0);
assert.deepStrictEqual(
  baseline.styles.text[textIndex].values.undrr.lineHeight,
  { unit: 'AUTO' }
);
assert.strictEqual(
  baseline.styles.effect[effectIndex].values.undrr[0].effect.spread,
  1
);
text.styles.text[textIndex].values.undrr.lineHeight = {
  unit: 'PIXELS',
  value: 24,
};
effect.styles.effect[effectIndex].values.undrr[0].effect.spread = 2;
// Remove the intended paths and require every remaining DTO record to match.
const restoredText = copy(text);
restoredText.styles.text[textIndex].values.undrr.lineHeight = { unit: 'AUTO' };
const restoredEffect = copy(effect);
restoredEffect.styles.effect[effectIndex].values.undrr[0].effect.spread = 1;
assert.deepStrictEqual(restoredText, baseline);
assert.deepStrictEqual(restoredEffect, baseline);
fs.mkdirSync(output, { recursive: true });
const hashes = {};
for (const [name, doc] of Object.entries({
  'source-restoration.json': baseline,
  'text-line-height-24.json': text,
  'effect-spread-2.json': effect,
})) {
  const bytes = `${JSON.stringify(doc, null, 2)}\n`;
  fs.writeFileSync(path.join(output, name), bytes);
  hashes[name] = crypto.createHash('sha256').update(bytes).digest('hex');
}
fs.writeFileSync(
  path.join(output, 'fixture-manifest.json'),
  `${JSON.stringify(
    {
      sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT })
        .toString()
        .trim(),
      status:
        'Prepared only; native changed-style publication remains unverified',
      text: {
        id: 'text.text.300.regular',
        name: baseline.styles.text[textIndex].name,
        path: `styles.text[${textIndex}].values.undrr.lineHeight`,
        before: { unit: 'AUTO' },
        after: { unit: 'PIXELS', value: 24 },
      },
      effect: {
        id: 'shadow.raised',
        name: baseline.styles.effect[effectIndex].name,
        path: `styles.effect[${effectIndex}].values.undrr[0].effect.spread`,
        before: 1,
        after: 2,
      },
      unchanged: 'Every variable, other style record and other brand value',
      precondition:
        'Native baseline must agree with source restoration before either import. Cloud raised spread readback is 0, so exact native restoration is not yet established.',
      sha256: hashes,
    },
    null,
    2
  )}\n`
);
console.log(
  `Prepared two isolated changed-style fixtures and exact source restoration: ${output}`
);
