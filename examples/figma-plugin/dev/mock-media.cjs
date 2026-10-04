#!/usr/bin/env node
'use strict';
// Actual importer control flow for embedded media. No raster/layout claims.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const base = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
);
function fixture() {
  const doc = copy(base);
  const family = doc.components.families.find(f => f.id === 'button');
  family.variants = [family.variants[0]];
  const root = family.variants[0].tree;
  const media = {
    type: 'FRAME',
    id: 'media',
    name: 'Source media',
    image: {
      assetId: 'repo-card-sample',
      base64: fs
        .readFileSync(
          path.resolve(
            __dirname,
            '../../../stories/assets/images/card-image.png'
          )
        )
        .toString('base64'),
      scaleMode: 'FILL',
    },
    layout: { width: 100, height: 60 },
    children: [],
  };
  const veil = {
    type: 'FRAME',
    id: 'veil',
    name: 'Source veil',
    gradient: {
      layers: [
        {
          transform: [
            [1, 0, 0],
            [0, 1, 0],
          ],
          stops: [
            { position: 0, color: 'color/neutral-900' },
            { position: 1, color: 'color/neutral-0' },
          ],
        },
      ],
    },
    layout: { width: 100, height: 60 },
    children: [],
  };
  root.children.push(media, veil);
  return { doc, media, veil };
}
async function main() {
  const { doc } = fixture();
  const env = environment(doc);
  await importFoundation(env, doc);
  const first = await env.call('buildMangroveComponents', doc, 'undrr', [
    'button',
  ]);
  assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
  const image = [...env.state.nodes.values()].find(
    n => n.name === 'Source media' && n.type === 'FRAME'
  );
  assert.strictEqual(image.fills[0].type, 'IMAGE');
  assert(env.state.images.has(image.fills[0].imageHash));
  const gradient = [...env.state.nodes.values()].find(
    n => n.name === 'Source veil' && n.type === 'FRAME'
  );
  assert.strictEqual(gradient.fills[0].type, 'GRADIENT_LINEAR');
  for (const stop of gradient.fills[0].gradientStops) {
    assert.strictEqual(stop.boundVariables.color.type, 'VARIABLE_ALIAS');
    assert(
      env.state.variables.some(v => v.id === stop.boundVariables.color.id)
    );
  }
  const original = image.id,
    hash = image.fills[0].imageHash;
  const repeat = await env.call('buildMangroveComponents', doc, 'undrr', [
    'button',
  ]);
  assert.strictEqual(repeat.errors.length, 0, repeat.errors.join('\n'));
  assert.strictEqual(repeat.createdNodeIds.length, 0);
  assert.strictEqual(image.id, original);
  assert.strictEqual(image.fills[0].imageHash, hash);
  assert.strictEqual(env.state.images.size, 1);
  console.log(
    'ok embedded image reuse, native gradient-stop aliases and zero-create repeat'
  );
  for (const corrupt of [
    f => {
      f.media.image.base64 = 'not-an-image';
    },
    f => {
      f.media.image.assetId = '../bad';
    },
    f => {
      f.veil.gradient.layers[0].stops[0].position = 2;
    },
  ]) {
    const f = fixture();
    corrupt(f);
    const rejected = environment(f.doc);
    await importFoundation(rejected, f.doc);
    const before = rejected.state.nodes.size;
    const result = await rejected.call(
      'buildMangroveComponents',
      f.doc,
      'undrr',
      ['button']
    );
    assert(result.errors.length);
    assert.strictEqual(rejected.state.nodes.size, before);
    assert.strictEqual(rejected.state.images.size, 0);
  }
  console.log('ok malformed media refuses before canvas or image writes');
  const connector = require('../../../scripts/build-figma-connector.cjs');
  const packet = await connector.buildConnector({
    operation: 'build',
    familyIds: ['button'],
    doc,
  });
  assert(packet.bytes <= 50000 && packet.characters <= 50000);
  const compiled = await env.runCode(packet.code);
  assert.strictEqual(compiled.errors.length, 0, compiled.errors.join('\n'));
  assert.strictEqual(compiled.createdNodeIds.length, 0);
  assert.strictEqual(image.fills[0].imageHash, hash);
  assert.strictEqual(
    gradient.fills[0].gradientStops[0].boundVariables.color.type,
    'VARIABLE_ALIAS'
  );
  const malformed = copy(base);
  const table = malformed.components.families.find(f => f.id === 'table');
  const findInstance = tree =>
    tree.type === 'INSTANCE'
      ? tree
      : (tree.children || []).map(findInstance).find(Boolean);
  findInstance(table.variants[0].tree).properties = {};
  assert.throws(
    () =>
      connector.subsetDocument(
        malformed,
        'build',
        'undrr',
        ['table'],
        [table.variants[0].id]
      ),
    /must use overrides/
  );
  console.log(
    'ok bounded compiled media branch preserves image/gradient aliases; malformed nested properties refuse during connector preflight'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
