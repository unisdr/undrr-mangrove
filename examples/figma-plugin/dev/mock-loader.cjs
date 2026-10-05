#!/usr/bin/env node
/** Bounded ellipse arc API contracts, not browser/native rasterization proof. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildLoaderRecipes,
} = require('../../../scripts/figma-loader-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = value => JSON.parse(JSON.stringify(value));
const identity = node =>
  node.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  doc.components.families = buildLoaderRecipes({
    root,
    modes: doc.modes,
    variables: doc.variables,
  });
  return doc;
}
async function main() {
  const doc = document();
  const count = doc.variables.length;
  assert.deepStrictEqual(
    buildLoaderRecipes({ root, modes: doc.modes, variables: doc.variables }),
    doc.components.families
  );
  assert.strictEqual(doc.variables.length, count);
  assert.strictEqual(doc.components.families[0].variants.length, 2);
  for (const [index, side, border] of [
    [0, 40, 8],
    [1, 96, 14],
  ]) {
    const tree = doc.components.families[0].variants[index].tree;
    for (const mode of doc.modes) {
      assert.strictEqual(
        doc.variables.find(v => v.name === tree.layout.width).values[mode.id],
        side
      );
      assert.strictEqual(
        doc.components.families[0].variants[index].sourceGeometry.borderWidth,
        border
      );
    }
    assert.strictEqual(
      tree.children[1].arcData.innerRadius,
      (side - 2 * border) / side
    );
  }
  console.log(
    'ok  two guarded static source presets, all-brand fixed size/border helpers and stable exporter identities'
  );
  const env = environment(doc, {
    sharedOnly: true,
    rejectedFonts: ['Roboto Condensed Regular', 'Roboto Condensed Bold'],
  });
  await importFoundation(env, doc);
  const first = await env.call('buildMangroveComponents', doc, 'undrr', [
    'loader',
  ]);
  assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
  for (const v of first.families[0].variantIds) {
    const node = env.state.nodes.get(v.nodeId);
    const spec = doc.components.families[0].variants.find(s => s.id === v.id);
    assert.strictEqual(node.children.length, 2);
    assert.strictEqual(node.children[0].type, 'ELLIPSE');
    assert.strictEqual(node.children[0].strokes.length, 0);
    assert.strictEqual(node.children[0].fills.length, 1);
    assert.strictEqual(node.children[1].strokes.length, 0);
    assert.deepStrictEqual(
      copy(node.children[1].arcData),
      spec.tree.children[1].arcData
    );
    const instance = node.createInstance();
    assert.deepStrictEqual(
      copy(instance.children[1].arcData),
      copy(node.children[1].arcData)
    );
    instance.remove();
  }
  const owned = () =>
    [...env.state.nodes.values()]
      .filter(n => !n.removed && identity(n))
      .map(n => [identity(n), n.id])
      .sort();
  const before = owned();
  const generic = [...env.state.nodes.values()].filter(
    node =>
      node.type === 'INSTANCE' &&
      /^review\/loader\/specimen\/loader\.(below-medium|medium-up)\/instance$/.test(
        identity(node) || ''
      )
  );
  assert.strictEqual(generic.length, 2);
  for (const instance of generic) {
    const side = identity(instance).includes('below-medium') ? 40 : 96;
    assert.strictEqual(instance.width, side);
    assert.strictEqual(instance.height, side);
    assert.strictEqual(instance.layoutSizingVertical, 'FIXED');
    assert.strictEqual(instance.layoutSizingHorizontal, 'FIXED');
  }
  const repeat = await env.call('buildMangroveComponents', doc, 'undrr', [
    'loader',
  ]);
  assert.strictEqual(repeat.errors.length, 0, repeat.errors.join('\n'));
  assert.strictEqual(repeat.createdNodeIds.length, 0);
  assert.deepStrictEqual(owned(), before);
  console.log(
    'ok  native leaf rings, complementary source fills, copied arc geometry and unchanged repeat identities without Condensed'
  );
  for (const bad of [
    null,
    false,
    0,
    {},
    { startingAngle: 0, endingAngle: 1, innerRadius: 1 },
    { startingAngle: 0, endingAngle: 0, innerRadius: 0.6 },
    { startingAngle: -1, endingAngle: 1, innerRadius: 0.6 },
    { startingAngle: 0, endingAngle: 7, innerRadius: 0.6 },
    { startingAngle: 0, endingAngle: 1, innerRadius: 0.6, extra: 1 },
  ]) {
    const broken = copy(doc);
    broken.components.families[0].variants[0].tree.children[1].arcData = bad;
    const snapshot = JSON.stringify({
      nodes: owned(),
      styles: env.state.styles,
    });
    const result = await env.call('buildMangroveComponents', broken, 'undrr', [
      'loader',
    ]);
    assert(result.errors.some(e => e.includes('arcData')));
    assert.strictEqual(result.createdNodeIds.length, 0);
    assert.strictEqual(
      JSON.stringify({ nodes: owned(), styles: env.state.styles }),
      snapshot
    );
  }
  const wrong = copy(doc);
  wrong.components.families[0].variants[0].tree.arcData = {
    startingAngle: 0,
    endingAngle: 1,
    innerRadius: 0.6,
  };
  assert(
    (
      await env.call('buildMangroveComponents', wrong, 'undrr', ['loader'])
    ).errors.some(e => e.includes('arcData'))
  );
  console.log(
    'ok  malformed and non-ellipse arc declarations refuse before style/canvas mutation'
  );
  const reset = copy(doc);
  delete reset.components.families[0].variants[0].tree.children[1].arcData;
  assert.strictEqual(
    (await env.call('buildMangroveComponents', reset, 'undrr', ['loader']))
      .errors.length,
    0
  );
  const resetNode = [...env.state.nodes.values()].find(
    n => identity(n) === 'family/loader/variant/loader.below-medium/top'
  );
  assert.deepStrictEqual(copy(resetNode.arcData), {
    startingAngle: 0,
    endingAngle: 2 * Math.PI,
    innerRadius: 0,
  });
  assert.strictEqual(
    (await env.call('buildMangroveComponents', doc, 'undrr', ['loader'])).errors
      .length,
    0
  );
  assert.deepStrictEqual(
    copy(resetNode.arcData),
    doc.components.families[0].variants[0].tree.children[1].arcData
  );
  console.log(
    'ok  removing a declared arc resets an existing ellipse, restoring its declaration keeps node identity'
  );
  const read = fs.readFileSync;
  fs.readFileSync = function (file, ...args) {
    const text = read.call(this, file, ...args);
    return typeof file === 'string' && file.endsWith('loader.scss')
      ? text.replace('border: 8px', 'border: 9px')
      : text;
  };
  try {
    assert.throws(
      () =>
        buildLoaderRecipes({
          root,
          modes: doc.modes,
          variables: doc.variables,
        }),
      /recipe needs updating/
    );
  } finally {
    fs.readFileSync = read;
  }
  console.log(
    'ok  source border geometry changes demand a new guarded exporter/browser baseline'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
