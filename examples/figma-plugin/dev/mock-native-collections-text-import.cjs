#!/usr/bin/env node
'use strict';
const assert = require('assert');
const { environment } = require('./mock-kit.cjs');
const {
  document: frameDocument,
  installCollectionFixture,
} = require('./mock-native-collections-import.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
function document() {
  const d = frameDocument();
  d.nativeCollections.version = 2;
  d.nativeCollections.profile = 'plain-text-instances-v1';
  d.nativeCollections.planId = 'isolated-plain-text-import-v2';
  const values = fn => Object.fromEntries(d.modes.map((m, i) => [m.id, fn(i)]));
  for (const [id, name, type, fn, owner] of [
    [
      'base-family',
      'fixture/base-family',
      'STRING',
      () => 'Roboto',
      'foundation',
    ],
    ['base-size', 'fixture/base-size', 'FLOAT', i => 14 + i, 'foundation'],
    [
      'text-family',
      'fixture/text-family',
      'STRING',
      () => ({ alias: 'fixture/base-family' }),
      'layout',
    ],
    [
      'text-size',
      'fixture/text-size',
      'FLOAT',
      () => ({ alias: 'fixture/base-size' }),
      'layout',
    ],
  ]) {
    d.variables.push({ id, name, type, values: values(fn) });
    d.nativeCollections.collections
      .find(c => c.id === owner)
      .variableIds.push(id);
  }
  d.styles.text = [
    {
      id: 'plain-text',
      name: 'Isolated native plain text',
      bindings: {
        fontFamily: 'fixture/text-family',
        fontSize: 'fixture/text-size',
      },
      values: values(i => ({
        fontName: { family: 'Roboto', style: 'Regular' },
        fontSize: 14 + i,
        lineHeight: { unit: 'PIXELS', value: 24 },
        letterSpacing: { unit: 'PIXELS', value: 0 },
        textDecoration: 'NONE',
        textWrapStyle: 'AUTO',
      })),
    },
  ];
  d.components = {
    version: 1,
    families: [
      {
        id: 'label',
        name: 'Isolated Label',
        kind: 'component-set',
        variants: [
          {
            id: 'label.default',
            name: 'State=Default',
            properties: { State: 'Default' },
            tree: {
              id: 'root',
              type: 'FRAME',
              layout: { mode: 'VERTICAL', width: 180, height: 'HUG' },
              children: [
                {
                  id: 'label',
                  type: 'TEXT',
                  characters: 'Editable whole label',
                  textStyle: 'plain-text',
                  textProperty: 'Label',
                  textAlign: 'LEFT',
                  fill: 'fixture/fill',
                  layout: { width: 160, height: 'HUG' },
                },
              ],
            },
          },
        ],
      },
      {
        id: 'wrapper',
        name: 'Isolated Wrapper',
        kind: 'component-set',
        variants: [
          {
            id: 'wrapper.default',
            name: 'State=Default',
            properties: { State: 'Default' },
            tree: {
              id: 'root',
              type: 'FRAME',
              layout: { mode: 'VERTICAL', width: 200, height: 'HUG' },
              children: [
                {
                  id: 'nested-label',
                  type: 'INSTANCE',
                  family: 'label',
                  variant: { State: 'Default' },
                  expose: true,
                  overrides: { Label: 'Authored wrapper label' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  return d;
}
function setup(d, guard = () => {}) {
  const e = environment(d, {
    sharedOnly: true,
    nativeCollections: true,
    experimentTargetGuard: guard,
  });
  e.state.modeLimit = 10;
  installCollectionFixture(e);
  return e;
}
function assets(e) {
  return JSON.stringify({
    collections: e.state.collections.map(c => ({
      id: c.id,
      name: c.name,
      modes: c.modes,
      ids: c.variableIds,
      ledger: c.getSharedPluginData(
        'orgundrrmangrove',
        'mgNativeCollectionPlan'
      ),
    })),
    variables: e.state.variables.map(v => ({
      id: v.id,
      name: v.name,
      type: v.resolvedType,
      owner: v.variableCollectionId,
      values: v.valuesByMode,
    })),
    styles: e.state.styles,
  });
}
async function main() {
  const d = document(),
    source = copy(d),
    e = setup(d),
    trace = [];
  const create = e.figma.variables.createVariableCollection.bind(
    e.figma.variables
  );
  const load = e.figma.loadFontAsync.bind(e.figma);
  e.figma.variables.createVariableCollection = n => {
    trace.push('collection');
    return create(n);
  };
  e.figma.loadFontAsync = async f => {
    trace.push('font:' + f.family + '/' + f.style);
    await load(f);
  };
  const run = () =>
    e.call(
      'importVariables',
      d,
      d.modes.map(m => m.id),
      false
    );
  let r = await run();
  assert.deepStrictEqual(copy(r.errors), []);
  assert.equal(r.nativeCollections.version, 2);
  assert.equal(r.nativeCollections.profile, d.nativeCollections.profile);
  assert.deepStrictEqual(copy(r.nativeCollections.sourceFontsLoaded), [
    { family: 'Roboto', style: 'Regular' },
  ]);
  assert.equal(r.styles, null);
  assert.equal(trace[0], 'font:Roboto/Regular');
  assert.equal(r.counts.created, 8);
  for (const c of e.state.collections) {
    const ledger = JSON.parse(
      c.getSharedPluginData('orgundrrmangrove', 'mgNativeCollectionPlan')
    );
    assert.equal(ledger.version, 2);
    assert.equal(ledger.profile, d.nativeCollections.profile);
    assert.equal(ledger.planId, d.nativeCollections.planId);
    assert.equal(c.modes.length, 5);
  }
  for (const spec of d.variables) {
    const native = e.state.variables.find(
      v => v.getSharedPluginData('orgundrrmangrove', 'mgId') === spec.id
    );
    const owner = d.nativeCollections.collections.find(c =>
      c.variableIds.includes(spec.id)
    );
    for (const m of d.modes) {
      const id = r.nativeCollections.modeIdsByCollectionId[owner.id][m.id],
        actual = native.valuesByMode[id],
        value = spec.values[m.id];
      if (value?.alias) {
        const target = d.variables.find(v => v.name === value.alias);
        const targetNative = e.state.variables.find(
          v => v.getSharedPluginData('orgundrrmangrove', 'mgId') === target.id
        );
        assert.equal(actual.type, 'VARIABLE_ALIAS');
        assert.equal(actual.id, targetNative.id);
      } else assert.deepStrictEqual(copy(actual), value);
    }
  }
  const baseline = assets(e);
  for (let i = 0; i < 2; i++) {
    r = await run();
    assert.deepStrictEqual(copy(r.errors), []);
    assert.equal(r.counts.created, 0);
    assert.equal(r.nativeCollections.createdCollectionIds.length, 0);
    assert.equal(assets(e), baseline);
  }
  assert.deepStrictEqual(d, source);
  // Repair old unavailable font literals from valid source without requiring that face.
  const base = e.state.variables.find(
    v => v.getSharedPluginData('orgundrrmangrove', 'mgId') === 'base-family'
  );
  for (const mode of Object.values(
    r.nativeCollections.modeIdsByCollectionId.foundation
  ))
    base.valuesByMode[mode] = 'Uninstalled old native family';
  r = await run();
  assert.deepStrictEqual(copy(r.errors), []);
  assert.equal(assets(e), baseline);
  for (const badMode of d.modes) {
    const missing = copy(d);
    missing.variables.find(v => v.id === 'base-family').values[badMode.id] =
      'Missing declared family';
    missing.styles.text[0].values[badMode.id].fontName.family =
      'Missing declared family';
    const env = setup(missing);
    env.figma.loadFontAsync = async f => {
      if (f.family === 'Missing declared family')
        throw Error('Required source font unavailable');
    };
    const before = assets(env);
    await assert.rejects(
      () =>
        env.call(
          'importVariables',
          missing,
          missing.modes.map(m => m.id),
          false
        ),
      /source font unavailable/
    );
    assert.equal(assets(env), before);
  }
  const drift = setup(d);
  drift.figma.loadFontAsync = async () => {
    drift.figma.currentPage = { id: 'changed-page' };
  };
  const before = assets(drift);
  await assert.rejects(
    () =>
      drift.call(
        'importVariables',
        d,
        d.modes.map(m => m.id),
        false
      ),
    /page changed/
  );
  assert.equal(assets(drift), before);
  let changed = false;
  const target = setup(d, () => {
    if (changed) throw Error('Target changed');
  });
  target.figma.loadFontAsync = async () => {
    changed = true;
  };
  const targetBefore = assets(target);
  await assert.rejects(
    () =>
      target.call(
        'importVariables',
        d,
        d.modes.map(m => m.id),
        false
      ),
    /Target changed/
  );
  assert.equal(assets(target), targetBefore);
  const copyCheck = setup(d),
    mutable = copy(d);
  copyCheck.figma.loadFontAsync = async () => {
    mutable.variables.find(v => v.id === 'base-family').values.mcr =
      'Late caller mutation';
  };
  r = await copyCheck.call(
    'importVariables',
    mutable,
    mutable.modes.map(m => m.id),
    false
  );
  assert.deepStrictEqual(copy(r.errors), []);
  assert.equal(
    copyCheck.state.variables.find(
      v => v.getSharedPluginData('orgundrrmangrove', 'mgId') === 'base-family'
    ).valuesByMode[r.nativeCollections.modeIdsByCollectionId.foundation.mcr],
    'Roboto'
  );
  for (const mutate of [
    x => {
      x.styles.text[0].values.mcr.fontName.variationSettings = { wght: 400 };
    },
    x => {
      x.variables.find(v => v.id === 'text-size').values.mcr = {
        alias: 'fixture/base-width',
      };
      x.styles.text[0].values.mcr.fontSize = 130;
    },
    x => {
      x.nativeCollections.profile = 'unknown';
    },
  ]) {
    const x = copy(d);
    mutate(x);
    const env = setup(x);
    let loads = 0;
    env.figma.loadFontAsync = async () => {
      loads++;
    };
    const prior = assets(env);
    await assert.rejects(() =>
      env.call(
        'importVariables',
        x,
        x.modes.map(m => m.id),
        false
      )
    );
    assert.equal(assets(env), prior);
    assert.equal(loads, 0);
  }
  console.log(
    'V2 source fonts precede all COL/VAR writes; exact all-five owner/alias/ledger imports, two zero-create repeats, repair and source/await/target/mixed-topology refusals pass. Styles and native rendering remain separate.'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { document, setup, assets };
