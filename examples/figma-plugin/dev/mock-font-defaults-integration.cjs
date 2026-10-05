#!/usr/bin/env node
/** Real builder with explicit native-shaped probe fixtures, not native acceptance. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  document,
  rangeEnvironment,
} = require('./mock-rich-text-integration.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const preparationSource = fs.readFileSync(
  path.join(__dirname, '../kit-font-defaults.js'),
  'utf8'
);
async function environment(options = {}) {
  const doc = document();
  const env = await rangeEnvironment(doc, { nativeVariableFonts: true });
  const inventory = env.figma.listAvailableFontsAsync;
  env.figma.listAvailableFontsAsync = async () =>
    (await inventory()).map(entry => ({
      fontName: { family: entry.fontName.family, style: entry.fontName.style },
    }));
  await env.runCode(
    preparationSource +
      '\nglobalThis.mgResolveNamedFontDefaults=mgResolveNamedFontDefaults;'
  );
  if (!options.noHook)
    await env.runCode(
      "globalThis.mgAssertExperimentOperationTarget=()=>{if(figma.fileKey!=='mock-kit')throw Error('changed operation target')};"
    );
  const report = await env.call(
    'importVariables',
    doc,
    [options.brand || 'undrr'],
    false,
    [],
    false
  );
  assert.deepStrictEqual(copy(report.errors), []);
  let probes = 0;
  const createText = env.figma.createText;
  env.figma.createText = () => {
    probes++;
    return createText();
  };
  if (options.changeDuringLoad) {
    const load = env.figma.loadFontAsync;
    env.figma.loadFontAsync = async font => {
      await load(font);
      env.figma.fileKey = 'changed';
    };
  }
  if (options.failCleanupLookup)
    env.figma.getNodeByIdAsync = async () => {
      throw Error('cleanup lookup unavailable');
    };
  return { doc, env, brand: options.brand || 'undrr', probes: () => probes };
}
function snapshot(env) {
  return JSON.stringify({
    nodes: [...env.state.nodes.values()].map(node => [
      node.id,
      node.x,
      node.y,
      node.width,
      node.height,
      node.characters,
    ]),
    styles: env.state.styles.map(style => [style.id, style.fontName]),
    collections: env.state.collections.map(c => c.id),
    variables: env.state.variables.map(v => v.id),
  });
}
async function build(fixture) {
  return fixture.env.call(
    'buildMangroveComponents',
    fixture.doc,
    fixture.brand,
    ['rich-test']
  );
}
async function main() {
  const f = await environment();
  const first = await build(f);
  assert.deepStrictEqual(copy(first.errors), []);
  const receipt = first.fontPreparation;
  assert(receipt.recordedSceneExact && receipt.recordedAssetsExact);
  assert.strictEqual(receipt.createdNodeIds.length, 3);
  assert.deepStrictEqual(
    copy(receipt.createdNodeIds),
    copy(receipt.removedNodeIds)
  );
  assert.deepStrictEqual(copy(receipt.residualNodeIds), []);
  const target = [...f.env.state.nodes.values()].find(
    node =>
      node.getSharedPluginData('orgundrrmangrove', 'mgKitId') ===
      'family/rich-test/variant/rich-test.default/body'
  );
  target.editRich(0, 5, 'Many thanks');
  const retained = target.characters;
  const before = snapshot(f.env);
  const initialTextCreates = f.probes();
  for (let i = 0; i < 2; i++) {
    const report = await build(f);
    assert.deepStrictEqual(copy(report.errors), []);
    assert.strictEqual(report.createdNodeIds.length, 0);
    assert.strictEqual(report.fontPreparation.createdNodeIds.length, 3);
    assert.strictEqual(snapshot(f.env), before);
    assert.strictEqual(target.characters, retained);
  }
  assert.strictEqual(
    f.probes(),
    initialTextCreates + 6,
    'each repeat adds only three disposable operation-local probes'
  );
  for (const options of [
    { noHook: true },
    { changeDuringLoad: true },
    { failCleanupLookup: true },
  ]) {
    const n = await environment(options),
      before = snapshot(n.env),
      result = await build(n);
    assert(result.errors.length);
    assert.strictEqual(
      snapshot(n.env),
      before,
      'failed preparation must leave existing recorded scene/styles unchanged'
    );
    assert.strictEqual(result.createdNodeIds.length, 0);
    if (options.noHook) assert.strictEqual(n.probes(), 0);
    else {
      assert(result.fontPreparation);
      assert(result.fontPreparation.errors.length);
      assert.strictEqual(result.fontPreparation.residualNodeIds.length, 0);
      if (options.failCleanupLookup)
        assert(result.fontPreparation.unverifiedRemovalNodeIds.length);
    }
  }
  for (const brand of ['delta', 'irp', 'mcr', 'preventionweb']) {
    const branded = await environment({ brand });
    const initial = await build(branded);
    assert.deepStrictEqual(copy(initial.errors), []);
    const exact = snapshot(branded.env);
    for (let i = 0; i < 2; i++) {
      const repeat = await build(branded);
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assert.strictEqual(repeat.fontPreparation.createdNodeIds.length, 3);
      assert.strictEqual(snapshot(branded.env), exact);
    }
  }
  console.log(
    'Guarded operation-local font preparation builder integration passed across five brands.'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
