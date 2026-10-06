#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs'),
  path = require('path'),
  vm = require('vm');
const context = { module: { exports: {} } };
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, '../kit-native-collections.js'), 'utf8'),
  context
);
const helper = context.module.exports;
const prior = require('./mock-native-collections.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
function document() {
  const d = prior.document(),
    values = x =>
      Object.fromEntries(
        d.modes.map((m, i) => [m.id, typeof x === 'function' ? x(i) : copy(x)])
      );
  d.collection = 'Partition text foundation';
  d.nativeCollections = {
    ...d.nativeCollections,
    version: 2,
    profile: 'plain-text-instances-v1',
    planId: 'isolated-text-instance-v2',
    collections: d.nativeCollections.collections.map(c => ({
      ...c,
      name: c.id === 'foundation' ? d.collection : 'Partition text helpers',
    })),
  };
  for (const [id, name, type, v] of [
    ['base.font', 'fixture/font-family', 'STRING', 'Roboto'],
    ['base.size', 'fixture/font-size', 'FLOAT', i => 16 + i],
    [
      'layout.font',
      'fixture/text-family',
      'STRING',
      { alias: 'fixture/font-family' },
    ],
    [
      'layout.size',
      'fixture/text-size',
      'FLOAT',
      { alias: 'fixture/font-size' },
    ],
    ['neutral-0', 'color/neutral-0', 'COLOR', { r: 1, g: 1, b: 1, a: 1 }],
  ]) {
    d.variables.push({
      id,
      name,
      type,
      values: values(v),
      scopes: ['ALL_SCOPES'],
    });
    d.nativeCollections.collections[
      id.startsWith('layout') ? 1 : 0
    ].variableIds.push(id);
  }
  for (const v of d.variables) v.scopes = ['ALL_SCOPES'];
  d.styles = {
    text: [
      {
        id: 'plain.label',
        name: 'Partition plain label',
        bindings: {
          fontFamily: 'fixture/text-family',
          fontSize: 'fixture/text-size',
        },
        values: values(i => ({
          fontName: { family: 'Roboto', style: 'Regular' },
          fontSize: 16 + i,
          lineHeight: { unit: 'PIXELS', value: 24 },
        })),
      },
    ],
    effect: [],
  };
  const family = (id, tree) => ({
    id,
    name: 'Partition ' + id,
    kind: 'component-set',
    variants: [
      {
        id: id + '.default',
        name: 'State=Default',
        properties: { State: 'Default' },
        tree,
      },
    ],
  });
  d.components = {
    version: 1,
    families: [
      family('label', {
        id: 'root',
        name: 'Label root',
        type: 'FRAME',
        layout: { mode: 'HORIZONTAL', width: 'fixture/width', height: 'HUG' },
        children: [
          {
            id: 'copy',
            name: 'Label copy',
            type: 'TEXT',
            characters: 'Actual logical label',
            textStyle: 'plain.label',
            textProperty: 'Label/default/Copy',
            layout: { width: 'HUG', height: 'HUG' },
            fill: 'fixture/fill',
          },
        ],
      }),
      family('wrapper', {
        id: 'root',
        name: 'Wrapper root',
        type: 'FRAME',
        layout: { mode: 'VERTICAL', width: 'fixture/width', height: 'HUG' },
        children: [
          {
            id: 'linked-label',
            name: 'Linked label',
            type: 'INSTANCE',
            family: 'label',
            variant: { State: 'Default' },
            overrides: { 'Label/default/Copy': 'Nested source label' },
            expose: true,
            layout: { width: 'FILL', height: 'HUG' },
          },
        ],
      }),
    ],
  };
  return d;
}
function snapshot(d) {
  const s = prior.snapshot(d),
    p = helper.mgNativeCollectionsSourcePlan(d);
  for (const c of s.collections)
    c.ledger = helper.mgNativeCollectionsCollectionLedger(
      p,
      c.ledger.collectionId
    );
  return s;
}
function main() {
  const d = document(),
    before = copy(d),
    p = helper.mgNativeCollectionsSourceCapability(d);
  assert.equal(p.version, 2);
  assert.equal(p.profile, 'plain-text-instances-v1');
  assert.throws(() => (p.version = 1));
  assert.throws(() => (p.profile = 'other'));
  assert.deepStrictEqual([...p.familyOrder], ['label', 'wrapper']);
  assert.deepStrictEqual(copy(p.sourceFonts), [
    { family: 'Roboto', style: 'Regular' },
  ]);
  assert.equal(p.runtimeRoles.get('fixture/text-family'), 'STRING');
  assert(p.runtimeConstraints.get('fixture/text-size').exclusiveMin);
  const s = snapshot(d),
    state = helper.mgNativeCollectionsPreflight(p, s, prior.identity);
  helper.mgNativeCollectionsValidateValues(p, state);
  assert.deepStrictEqual(copy(helper.mgNativeCollectionsFontPlan(p, state)), [
    { family: 'Roboto', style: 'Regular' },
  ]);
  assert.deepStrictEqual(d, before);
  function bad(mut, re) {
    const x = copy(d);
    mut(x);
    const b = copy(x);
    assert.throws(() => helper.mgNativeCollectionsSourceCapability(x), re);
    assert.deepStrictEqual(x, b);
  }
  bad(x => (x.nativeCollections.profile = 'unsupported'), /versioned/);
  bad(
    x =>
      (x.styles.text[0].values.mcr.fontName.variationSettings = { wght: 400 }),
    /font template/
  );
  bad(
    x => (x.styles.text[0].values.mcr.lineHeight.value = 25),
    /differs across/
  );
  bad(x => (x.styles.text[0].values.mcr.fontSize = 0), /font template/);
  bad(
    x => (x.styles.text[0].values.mcr.fontName.family = 'Inter'),
    /disagrees/
  );
  bad(
    x => (x.components.families[1].variants[0].tree.children[0].variant = {}),
    /INSTANCE/
  );
  bad(
    x =>
      (x.components.families[1].variants[0].tree.children[0].overrides.Missing =
        'bad'),
    /override absent/
  );
  bad(
    x =>
      (x.components.families[1].variants[0].tree.children[0].family =
        'wrapper'),
    /cycle/
  );
  bad(
    x =>
      x.components.families[0].variants[0].tree.children.push({
        ...copy(x.components.families[0].variants[0].tree.children[0]),
        id: 'another',
        characters: 'Different source label',
      }),
    /differing text property/
  );
  bad(x => {
    const f = x.components.families[0],
      v = copy(f.variants[0]);
    v.id = 'label.other';
    v.name = 'State=Other';
    v.properties = { State: 'Other' };
    v.tree.children[0].characters = 'Different variant default';
    f.variants.push(v);
  }, /differing text property/);
  bad(
    x => (x.components.families[0].variants[0].tree.children[0].textRuns = []),
    /plain TEXT/
  );
  bad(
    x =>
      (x.components.families[0].variants[0].tree.children[0].layout.height = 20),
    /height must be HUG/
  );
  bad(
    x => (x.variables.find(v => v.id === 'layout.size').values.mcr = 19),
    /invariant alias/
  );
  // Each paired-brand graph is acyclic, while independent collection modes could form a cycle.
  bad(x => {
    const a = x.variables.find(v => v.id === 'base.width'),
      b = x.variables.find(v => v.id === 'layout.width');
    a.values.undrr = { alias: b.name };
    b.values.undrr = 100;
  }, /invariant alias/);
  for (const mutate of [
    x =>
      (x.variables.find(v => v.sourceId === 'base.size').valuesByMode[
        'foundation:mcr'
      ] = -1),
    x =>
      (x.variables.find(v => v.sourceId === 'base.font').valuesByMode[
        'foundation:mcr'
      ] = ''),
  ]) {
    const n = snapshot(d);
    mutate(n);
    const st = helper.mgNativeCollectionsPreflight(p, n, prior.identity);
    assert.throws(
      () => helper.mgNativeCollectionsFontPlan(p, st),
      /minimum|font family/
    );
  }
  const drift = snapshot(d);
  drift.collections[0].ledger.profile = 'foreign';
  assert.throws(
    () => helper.mgNativeCollectionsPreflight(p, drift, prior.identity),
    /ledger/
  );
  const missing = snapshot(d);
  delete missing.collections[0].ledger.profile;
  assert.throws(
    () => helper.mgNativeCollectionsPreflight(p, missing, prior.identity),
    /ledger/
  );
  assert.deepStrictEqual(
    copy(
      helper.mgNativeCollectionsCollectionLedger(
        helper.mgNativeCollectionsSourcePlan(prior.document()),
        'foundation'
      )
    ),
    { version: 1, planId: 'isolated-fixture-v1', collectionId: 'foundation' }
  );
  console.log(
    'Partition v2 plain style/whole TEXT/INSTANCE graph, immutable profile, exact ledgers, all-mode font/size values, source aliases and staged source refusals pass. No native acceptance.'
  );
}
if (require.main === module) main();
module.exports = { document, snapshot, main };
