#!/usr/bin/env node
'use strict';
const assert = require('assert');
const { environment } = require('./mock-kit.cjs');
const {
  document: importDocument,
  installCollectionFixture,
} = require('./mock-native-collections-import.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
function document() {
  const doc = importDocument();
  doc.variables.push({
    id: 'neutral-0',
    name: 'color/neutral-0',
    type: 'COLOR',
    values: Object.fromEntries(
      doc.modes.map(mode => [mode.id, { r: 1, g: 1, b: 1, a: 1 }])
    ),
  });
  doc.nativeCollections.collections[0].variableIds.push('neutral-0');
  for (const variable of doc.variables)
    variable.scopes =
      variable.type === 'COLOR' ? ['FRAME_FILL'] : ['WIDTH_HEIGHT'];
  const family = doc.components.families[0];
  family.name = 'Partition fixture';
  family.kind = 'component-set';
  family.variants[0].name = 'State=Default';
  family.variants[0].properties = { State: 'Default' };
  family.variants[0].tree.layout.mode = 'HORIZONTAL';
  family.variants[0].tree.children = [
    {
      id: 'box',
      name: 'Bound box',
      type: 'FRAME',
      layout: { width: 'fixture/width', height: 20 },
      fill: 'fixture/fill',
    },
  ];
  const compact = copy(family.variants[0]);
  compact.id = 'compact';
  compact.name = 'State=Compact';
  compact.properties = { State: 'Compact' };
  compact.tree.layout.height = 24;
  family.variants.push(compact);
  return doc;
}
function snapshot(env) {
  return copy({
    currentPageId: env.figma.currentPage.id,
    nodes: [...env.state.nodes.values()].map(node => ({
      id: node.id,
      type: node.type,
      parent: node.parent?.id,
      width: node.width,
      height: node.height,
      x: node.x,
      y: node.y,
      fills: node.fills,
      modes: node.explicitVariableModes,
      bound: node.boundVariables,
      kitKey: node.getSharedPluginData('orgundrrmangrove', 'mgKitId'),
      sceneLedger: node.getSharedPluginData(
        'orgundrrmangrove',
        'mgNativeScenePlan'
      ),
    })),
    variables: env.state.variables.map(v => ({
      id: v.id,
      collection: v.variableCollectionId,
      values: v.valuesByMode,
    })),
    collections: env.state.collections.map(c => ({
      id: c.id,
      modes: c.modes,
      variables: c.variableIds,
    })),
  });
}
async function setup(doc) {
  const env = environment(doc, {
    sharedOnly: true,
    nativeCollections: true,
    experimentTargetGuard: () => {},
  });
  env.state.modeLimit = 10;
  installCollectionFixture(env);
  const imported = await env.call(
    'importVariables',
    doc,
    doc.modes.map(m => m.id),
    false,
    undefined,
    true
  );
  assert.deepStrictEqual(copy(imported.errors), []);
  return env;
}
async function main() {
  const doc = document(),
    env = await setup(doc);
  for (const mode of doc.modes) {
    const first = await env.call('buildMangroveComponents', doc, mode.id, [
      'fixture',
    ]);
    assert.deepStrictEqual(copy(first.errors), []);
    assert.strictEqual(first.families[0].variantIds.length, 2);
    const index = doc.modes.findIndex(item => item.id === mode.id);
    for (const entry of first.families[0].variantIds) {
      const master = env.state.nodes.get(entry.nodeId);
      assert.strictEqual(master.width, 100 + index * 10);
      assert.strictEqual(master.children[0].width, 100 + index * 10);
      const fill = env.state.variables.find(v => v.name === 'fixture/fill');
      assert.deepStrictEqual(
        copy(fill.resolveForConsumer(master.children[0]).value),
        { r: index / 5, g: 0.25, b: 0.75, a: 1 }
      );
    }
    assert.strictEqual(
      env.state.loadedFonts.size,
      0,
      'Font-free partition must not prepare review fonts'
    );
    const baseline = snapshot(env);
    for (let n = 0; n < 2; n++) {
      const repeated = await env.call('buildMangroveComponents', doc, mode.id, [
        'fixture',
      ]);
      assert.deepStrictEqual(copy(repeated.errors), []);
      assert.strictEqual(repeated.createdNodeIds.length, 0);
      assert.deepStrictEqual(snapshot(env), baseline);
    }
    const main = [...env.state.nodes.values()].find(
      node => node.type === 'COMPONENT'
    );
    const instance = main.createInstance();
    env.figma.currentPage.appendChild(instance);
    const state = await env.call(
      'mgNativeCollectionsPreflight',
      await env.call('mgNativeCollectionsSourcePlan', doc),
      { collections: env.state.collections, variables: env.state.variables },
      {
        readCollection: c =>
          JSON.parse(
            c.getSharedPluginData('orgundrrmangrove', 'mgNativeCollectionPlan')
          ),
        readVariable: v => v.getSharedPluginData('orgundrrmangrove', 'mgId'),
      }
    );
    await env.call(
      'mgNativeCollectionsApplyModes',
      instance,
      state,
      mode.id,
      doc.nativeCollections.collections.map(c => c.id)
    );
    const modeBaseline = copy(instance.explicitVariableModes);
    instance.visible = false;
    for (let n = 0; n < 2; n++) {
      const repeated = await env.call('buildMangroveComponents', doc, mode.id, [
        'fixture',
      ]);
      assert.deepStrictEqual(copy(repeated.errors), []);
      assert.strictEqual(repeated.createdNodeIds.length, 0);
      assert.strictEqual(instance.visible, false);
      assert.deepStrictEqual(
        copy(instance.explicitVariableModes),
        modeBaseline
      );
      assert.strictEqual((await instance.getMainComponentAsync()).id, main.id);
    }
    instance.remove();
  }
  for (const mutate of [
    d => {
      d.components.families[0].variants[0].tree.type = 'TEXT';
    },
    d => {
      d.components.families[0].review = {};
    },
    d => {
      d.components.families[0].variants[0].tree.absolute = {
        horizontal: 'START',
      };
    },
  ]) {
    const bad = copy(doc);
    mutate(bad);
    const baseline = snapshot(env);
    await assert.rejects(
      () => env.call('buildMangroveComponents', bad, 'undrr', ['fixture']),
      /v1/
    );
    assert.deepStrictEqual(snapshot(env), baseline);
  }
  const main = [...env.state.nodes.values()].find(
    node => node.type === 'COMPONENT'
  );
  main.setSharedPluginData('orgundrrmangrove', 'mgNativeScenePlan', '');
  const baseline = snapshot(env);
  await assert.rejects(
    () => env.call('buildMangroveComponents', doc, 'undrr', ['fixture']),
    /scene ownership/
  );
  assert.deepStrictEqual(snapshot(env), baseline);
  for (const scenario of ['late-ledger', 'late-page', 'native-width']) {
    const d = document(),
      e = await setup(d);
    const built = await e.call('buildMangroveComponents', d, 'undrr', [
      'fixture',
    ]);
    assert.deepStrictEqual(copy(built.errors), []);
    let expected;
    if (scenario === 'native-width') {
      const width = e.state.variables.find(
        v => v.name === 'fixture/base-width'
      );
      const collection = e.state.collections.find(
        c => c.id === width.variableCollectionId
      );
      width.setValueForMode(
        collection.modes.find(m => m.name === d.modes[0].name).modeId,
        -1
      );
      expected = snapshot(e);
    } else {
      const original = e.figma.variables.getLocalVariableCollectionsAsync;
      let changed = false;
      e.figma.variables.getLocalVariableCollectionsAsync = async () => {
        if (!changed) {
          changed = true;
          if (scenario === 'late-ledger') {
            const master = e.state.nodes.get(
              built.families[0].variantIds[0].nodeId
            );
            master.setSharedPluginData(
              'orgundrrmangrove',
              'mgNativeScenePlan',
              ''
            );
          } else {
            e.figma.currentPage = { id: 'other-page', type: 'PAGE' };
          }
          expected = snapshot(e);
        }
        return original.call(e.figma.variables);
      };
    }
    await assert.rejects(
      () => e.call('buildMangroveComponents', d, 'undrr', ['fixture']),
      /ownership|current page|constraint|nonpositive|runtime minimum/
    );
    assert(expected, scenario + ' test hook executed');
    assert.deepStrictEqual(
      snapshot(e),
      expected,
      scenario + ' made no operation mutation'
    );
  }
  const {
    buildConnector,
  } = require('../../../scripts/build-figma-connector.cjs');
  const compiledDoc = document(),
    compiledEnv = environment(compiledDoc, { sharedOnly: true });
  compiledEnv.state.modeLimit = 10;
  compiledEnv.figma.fileKey = '3PbB1KO6fY7vdYLvHsQdXP';
  installCollectionFixture(compiledEnv);
  const compileOptions = {
    doc: compiledDoc,
    experimentFileKey: compiledEnv.figma.fileKey,
  };
  const compiledImport = await buildConnector({
    ...compileOptions,
    operation: 'import',
  });
  const imported = await compiledEnv.runCode(compiledImport.code);
  assert.deepStrictEqual(copy(imported.errors), []);
  assert.strictEqual(imported.nativeCollections.completed, true);
  for (const mode of compiledDoc.modes) {
    const compiled = await buildConnector({
      ...compileOptions,
      operation: 'build',
      brandId: mode.id,
      familyIds: ['fixture'],
    });
    const first = await compiledEnv.runCode(compiled.code);
    assert.deepStrictEqual(copy(first.errors), []);
    assert.strictEqual(first.nativeCollections.reviewSpecimensDisabled, true);
    const baseline = snapshot(compiledEnv);
    for (let n = 0; n < 2; n++) {
      const repeat = await compiledEnv.runCode(compiled.code);
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assert.deepStrictEqual(snapshot(compiledEnv), baseline);
    }
    console.log(
      mode.id +
        ' actual compiled production profile ' +
        compiled.bytes +
        ' bytes, two exact repeats'
    );
  }
  assert.strictEqual(compiledEnv.state.loadedFonts.size, 0);
  for (const options of [
    { operation: 'build', familyIds: ['fixture'], variantIds: ['default'] },
    { operation: 'import', variableIds: ['base-width'] },
    { operation: 'inspect' },
  ])
    await assert.rejects(
      () => buildConnector({ ...compileOptions, ...options }),
      /Partition v1|Experiment target guard/
    );
  console.log(
    'Partition builder all-five mode maps, font-free FRAME closure, two exact zero-create repeats, true consumer visibility/modes/links and atomic capability/scene-owner refusals pass. Native fields/pixels/publication remain unverified.'
  );
}
module.exports = { document, setup, snapshot };
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
