#!/usr/bin/env node
'use strict';
const assert = require('assert');
const { environment } = require('./mock-kit.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
// Models documented collection inventory and shared identity only. No rendering proof.
function installCollectionFixture(env) {
  const create = env.figma.variables.createVariableCollection.bind(
    env.figma.variables
  );
  env.figma.variables.createVariableCollection = name => {
    const collection = create(name),
      data = new Map();
    Object.defineProperties(collection, {
      defaultModeId: { get: () => collection.modes[0].modeId },
      variableIds: {
        get: () =>
          env.state.variables
            .filter(v => !v.removed && v.variableCollectionId === collection.id)
            .map(v => v.id),
      },
    });
    collection.getSharedPluginData = (namespace, key) =>
      data.get(namespace + ':' + key) || '';
    collection.setSharedPluginData = (namespace, key, value) =>
      data.set(namespace + ':' + key, value);
    collection.getPluginData = collection.setPluginData = () => {
      throw new Error('Private collection data unsupported');
    };
    return collection;
  };
}
function document() {
  const modes = ['undrr', 'delta', 'irp', 'mcr', 'preventionweb'].map(
    (id, i) => ({ id, name: 'Brand ' + i })
  );
  const values = fn => Object.fromEntries(modes.map((m, i) => [m.id, fn(i)]));
  return {
    collection: 'Import foundation',
    modes,
    variables: [
      {
        id: 'base-width',
        name: 'fixture/base-width',
        type: 'FLOAT',
        values: values(i => 100 + i * 10),
      },
      {
        id: 'base-color',
        name: 'fixture/base-color',
        type: 'COLOR',
        values: values(i => ({ r: i / 5, g: 0.25, b: 0.75, a: 1 })),
      },
      {
        id: 'layout-width',
        name: 'fixture/width',
        type: 'FLOAT',
        values: values(() => ({ alias: 'fixture/base-width' })),
      },
      {
        id: 'layout-color',
        name: 'fixture/fill',
        type: 'COLOR',
        values: values(() => ({ alias: 'fixture/base-color' })),
      },
    ],
    styles: { text: [], effect: [] },
    components: {
      version: 1,
      families: [
        {
          id: 'fixture',
          name: 'Fixture',
          kind: 'component-set',
          variants: [
            {
              id: 'default',
              name: 'State=Default',
              properties: { State: 'Default' },
              tree: {
                id: 'root',
                type: 'FRAME',
                layout: { width: 'fixture/width', height: 40 },
                fill: 'fixture/fill',
              },
            },
          ],
        },
      ],
    },
    nativeCollections: {
      version: 1,
      planId: 'import-fixture-v1',
      primary: 'foundation',
      collections: [
        {
          id: 'foundation',
          name: 'Import foundation',
          variableIds: ['base-width', 'base-color'],
        },
        {
          id: 'layout',
          name: 'Import layout',
          variableIds: ['layout-width', 'layout-color'],
        },
      ],
    },
  };
}
function setup(doc, guard = () => {}) {
  const env = environment(doc, {
    sharedOnly: true,
    nativeCollections: true,
    experimentTargetGuard: guard,
  });
  env.state.modeLimit = 10;
  installCollectionFixture(env);
  return env;
}
const snapshot = env =>
  JSON.stringify({
    collections: env.state.collections.map(c => ({
      id: c.id,
      name: c.name,
      modes: c.modes,
      variables: c.variableIds,
      ledger: c.getSharedPluginData(
        'orgundrrmangrove',
        'mgNativeCollectionPlan'
      ),
    })),
    variables: env.state.variables.map(v => ({
      id: v.id,
      name: v.name,
      owner: v.variableCollectionId,
      values: v.valuesByMode,
      identity: v.getSharedPluginData('orgundrrmangrove', 'mgId'),
    })),
    styles: env.state.styles,
  });
async function main() {
  const doc = document(),
    modes = doc.modes.map(m => m.id),
    env = setup(doc);
  const run = (d = doc, selected = modes, prune = false, styles, effects) =>
    env.call('importVariables', d, selected, prune, styles, effects);
  let result = await run();
  assert.deepStrictEqual(Array.from(result.errors), []);
  assert.strictEqual(result.counts.created, 4);
  assert.strictEqual(result.nativeCollections.createdCollectionIds.length, 2);
  assert.strictEqual(result.nativeCollections.createdModeIds.length, 10);
  for (const c of env.state.collections) assert.strictEqual(c.modes.length, 5);
  const baseline = snapshot(env);
  for (let repeat = 0; repeat < 2; repeat++) {
    result = await run();
    assert.strictEqual(result.counts.created, 0);
    assert.strictEqual(result.nativeCollections.createdCollectionIds.length, 0);
    assert.strictEqual(result.nativeCollections.createdModeIds.length, 0);
    assert.deepStrictEqual(Array.from(result.errors), []);
    assert.strictEqual(snapshot(env), baseline);
  }
  for (const mode of modes) {
    const maps = result.nativeCollections.modeIdsByCollectionId;
    assert.notStrictEqual(maps.foundation[mode], maps.layout[mode]);
    const alias = env.state.variables.find(v => v.name === 'fixture/width');
    assert.strictEqual(
      alias.valuesByMode[maps.layout[mode]].id,
      env.state.variables.find(v => v.name === 'fixture/base-width').id
    );
  }
  for (const [d, selected, prune, styles, effects] of [
    [doc, [modes[0]]],
    [doc, modes, true],
    [doc, modes, false, []],
    [doc, modes, false, undefined, false],
    [
      { ...copy(doc), styles: { text: [{ id: 'foreign' }], effect: [] } },
      modes,
    ],
    (() => {
      const d = copy(doc);
      d.components.families[0].variants[0].tree.type = 'TEXT';
      return [d, modes];
    })(),
    (() => {
      const d = copy(doc);
      d.variables[0].values.mcr = -1;
      return [d, modes];
    })(),
  ]) {
    await assert.rejects(() => run(d, selected, prune, styles, effects));
    assert.strictEqual(snapshot(env), baseline);
  }
  for (const mutate of [
    d => {
      delete d.components.families[0].kind;
    },
    d => {
      d.components.families[0].variants[0].properties.State = 1;
    },
    d => {
      const tree = d.components.families[0].variants[0].tree;
      tree.children = [
        { id: 'same', type: 'FRAME' },
        { id: 'same', type: 'FRAME' },
      ];
    },
  ]) {
    const invalid = copy(doc);
    mutate(invalid);
    await assert.rejects(() => run(invalid));
    assert.strictEqual(snapshot(env), baseline);
  }
  const foreign = setup(doc);
  foreign.figma.variables.createVariableCollection(doc.collection);
  await assert.rejects(
    () => foreign.call('importVariables', doc, modes, false),
    /owner conflict/
  );
  assert.strictEqual(foreign.state.variables.length, 0);
  let checks = 0;
  const changed = setup(doc, () => {
    if (++checks === 3) throw new Error('Changed target');
  });
  await assert.rejects(
    () => changed.call('importVariables', doc, modes, false),
    /Changed target/
  );
  assert.strictEqual(changed.state.collections.length, 0);
  const missingGuard = environment(doc, {
    sharedOnly: true,
    nativeCollections: true,
  });
  installCollectionFixture(missingGuard);
  await assert.rejects(
    () => missingGuard.call('importVariables', doc, modes, false),
    /trusted experiment/
  );
  assert.strictEqual(missingGuard.state.collections.length, 0);
  const mutable = copy(doc),
    frozen = setup(mutable);
  const inventory =
    frozen.figma.variables.getLocalVariableCollectionsAsync.bind(
      frozen.figma.variables
    );
  frozen.figma.variables.getLocalVariableCollectionsAsync = async () => {
    mutable.variables[0].values.undrr = 999;
    return inventory();
  };
  const frozenResult = await frozen.call(
    'importVariables',
    mutable,
    modes,
    false
  );
  assert.strictEqual(frozenResult.errors.length, 0);
  assert.strictEqual(
    frozen.state.variables.find(v => v.name === 'fixture/base-width')
      .valuesByMode[
      frozenResult.nativeCollections.modeIdsByCollectionId.foundation.undrr
    ],
    100
  );
  // A valid literal replacing an owned alias must refuse before any writes.
  const alias = env.state.variables.find(v => v.name === 'fixture/width');
  const ownedMode = result.nativeCollections.modeIdsByCollectionId.layout.undrr;
  const originalAlias = alias.valuesByMode[ownedMode];
  alias.valuesByMode[ownedMode] = 100;
  const drift = snapshot(env);
  await assert.rejects(() => run(), /invalid native value/);
  assert.strictEqual(snapshot(env), drift);
  alias.valuesByMode[ownedMode] = originalAlias;
  const failure = setup(doc);
  failure.state.modeLimit = 2;
  result = await failure.call('importVariables', doc, modes, false);
  assert.strictEqual(result.nativeCollections.completed, false);
  assert.strictEqual(result.nativeCollections.createdCollectionIds.length, 1);
  assert.strictEqual(result.nativeCollections.partialAssetIds.length, 1);
  assert.strictEqual(result.errors.length, 1);
  assert.strictEqual(failure.state.variables.length, 0);
  const retry = await failure.call('importVariables', doc, modes, false);
  assert.strictEqual(retry.nativeCollections.completed, false);
  assert.strictEqual(retry.errors.length, 1);
  assert.strictEqual(retry.nativeCollections.createdCollectionIds.length, 0);
  console.log(
    'Native collection importer: all five modes, two exact repeats, scoped premutation refusals and partial creation journal passed. Native acceptance pending.'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { installCollectionFixture, document };
