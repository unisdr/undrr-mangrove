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
const {
  mgNativeCollectionsSourcePlan: sourcePlan,
  mgNativeCollectionsSourceCapability: sourceCapability,
  mgNativeCollectionsPreflight: preflight,
  mgNativeCollectionsResolve: resolve,
  mgNativeCollectionsValidateValues: validateValues,
  mgNativeCollectionsApplyModes: applyModes,
} = context.module.exports;
const clone = x => JSON.parse(JSON.stringify(x));
function document() {
  const modes = ['undrr', 'delta', 'irp', 'mcr', 'preventionweb'].map(
      (id, i) => ({ id, name: 'Brand ' + i })
    ),
    values = fn => Object.fromEntries(modes.map((m, i) => [m.id, fn(i)]));
  return {
    collection: 'Partition foundation',
    modes,
    variables: [
      {
        id: 'base.color',
        name: 'fixture/base-color',
        type: 'COLOR',
        values: values(i => ({ r: i / 5, g: 0.25, b: 0.75, a: 1 })),
      },
      {
        id: 'base.width',
        name: 'fixture/base-width',
        type: 'FLOAT',
        values: values(i => 100 + i * 10),
      },
      {
        id: 'layout.color',
        name: 'fixture/fill',
        type: 'COLOR',
        values: values(() => ({ alias: 'fixture/base-color' })),
      },
      {
        id: 'layout.width',
        name: 'fixture/width',
        type: 'FLOAT',
        values: values(() => ({ alias: 'fixture/base-width' })),
      },
    ],
    styles: { text: [], effect: [] },
    nativeCollections: {
      version: 1,
      planId: 'isolated-fixture-v1',
      primary: 'foundation',
      collections: [
        {
          id: 'foundation',
          name: 'Partition foundation',
          variableIds: ['base.color', 'base.width'],
        },
        {
          id: 'layout',
          name: 'Partition layout',
          variableIds: ['layout.color', 'layout.width'],
        },
      ],
    },
  };
}
const identity = {
  readCollection: c => c.ledger || null,
  readVariable: v => v.sourceId || '',
};
function snapshot(doc) {
  const p = sourcePlan(doc),
    collections = [...p.collectionById.values()].map(c => ({
      id: 'native:' + c.id,
      name: c.name,
      ledger: { version: 1, planId: p.planId, collectionId: c.id },
      modes: doc.modes.map(m => ({ modeId: c.id + ':' + m.id, name: m.name })),
      variableIds: c.variableIds.map(id => 'native:' + id),
    })),
    variables = doc.variables.map(v => ({
      id: 'native:' + v.id,
      sourceId: v.id,
      name: v.name,
      resolvedType: v.type,
      variableCollectionId: 'native:' + p.ownerBySourceId.get(v.id),
      valuesByMode: Object.fromEntries(
        doc.modes.map(m => [
          p.ownerBySourceId.get(v.id) + ':' + m.id,
          v.values[m.id]?.alias
            ? {
                type: 'VARIABLE_ALIAS',
                id: 'native:' + p.sourceByName.get(v.values[m.id].alias).id,
              }
            : clone(v.values[m.id]),
        ])
      ),
    }));
  return { collections, variables };
}
function main() {
  const doc = document(),
    before = clone(doc),
    plan = sourcePlan(doc),
    fresh = preflight(plan, { collections: [], variables: [] }, identity);
  assert.equal(plan.counts.get('foundation'), 2);
  assert.equal(plan.counts.get('layout'), 2);
  assert.equal(fresh.neededCollections.length, 2);
  assert.equal(fresh.neededVariables.length, 4);
  assert.deepStrictEqual(clone(fresh.neededModes.get('foundation')), doc.modes);
  const capable = clone(doc);
  capable.components = {
    version: 1,
    families: [
      {
        id: 'fixture',
        name: 'Partition fixture',
        kind: 'component-set',
        variants: [
          {
            id: 'fixture.default',
            name: 'State=Default',
            properties: { State: 'Default' },
            tree: {
              id: 'root',
              type: 'FRAME',
              layout: {
                mode: 'VERTICAL',
                width: 'fixture/width',
                height: 50,
                padding: { block: 4, inline: 'fixture/base-width' },
              },
              fill: 'fixture/fill',
              children: [
                {
                  id: 'child',
                  type: 'FRAME',
                  layout: { width: 10, height: 10 },
                  fill: 'fixture/base-color',
                },
              ],
            },
          },
        ],
      },
    ],
  };
  assert.doesNotThrow(() => sourceCapability(capable));
  const overlapping = clone(capable);
  overlapping.components.families[0].variants[0].tree.layout.gap = -4;
  assert.doesNotThrow(() => sourceCapability(overlapping));
  const constrainedPlan = sourceCapability(capable),
    constrainedSnapshot = snapshot(capable);
  assert.doesNotThrow(() =>
    validateValues(
      constrainedPlan,
      preflight(constrainedPlan, constrainedSnapshot, identity)
    )
  );
  for (const [mode, value] of [
    ['foundation:undrr', -1],
    ['foundation:mcr', 0],
  ]) {
    const s = clone(constrainedSnapshot);
    s.variables.find(v => v.sourceId === 'base.width').valuesByMode[mode] =
      value;
    const saved = clone(s),
      state = preflight(constrainedPlan, s, identity);
    assert.throws(
      () => validateValues(constrainedPlan, state),
      /native runtime minimum/
    );
    assert.deepStrictEqual(s, saved);
  }
  const maintained = clone(constrainedSnapshot);
  maintained.variables.find(v => v.sourceId === 'base.width').valuesByMode[
    'foundation:mcr'
  ] = 155;
  assert.doesNotThrow(() =>
    validateValues(
      constrainedPlan,
      preflight(constrainedPlan, maintained, identity)
    )
  );
  const opacityDoc = clone(capable);
  opacityDoc.variables[1].values = Object.fromEntries(
    opacityDoc.modes.map(m => [m.id, 50])
  );
  opacityDoc.components.families[0].variants[0].tree.bindings = {
    opacity: 'fixture/width',
  };
  const opacityPlan = sourceCapability(opacityDoc),
    opacitySnapshot = snapshot(opacityDoc);
  opacitySnapshot.variables.find(v => v.sourceId === 'base.width').valuesByMode[
    'foundation:preventionweb'
  ] = 101;
  assert.throws(
    () =>
      validateValues(
        opacityPlan,
        preflight(opacityPlan, opacitySnapshot, identity)
      ),
    /native runtime maximum/
  );

  for (const mutate of [
    d => d.styles.text.push({ id: 'style' }),
    d => (d.components.families[0].variants[0].tree.opacity = 1),
    d => (d.components.families[0].variants[0].tree.strokeWeight = 1),
    d => (d.components.families[0].variants[0].tree.layout.padding.block = -1),
    d =>
      (d.components.families[0].variants[0].tree.bindings = {
        opacity: 'fixture/width',
      }),
    d => delete d.components.families[0].kind,
    d => delete d.components.families[0].name,
    d => delete d.components.families[0].variants[0].name,
    d => (d.components.families[0].variants[0].properties = { State: 1 }),
    d =>
      d.components.families[0].variants.push({
        ...clone(d.components.families[0].variants[0]),
        id: 'fixture.copy',
        name: 'State=Copy',
      }),
    d =>
      d.components.families[0].variants[0].tree.children.push(
        clone(d.components.families[0].variants[0].tree.children[0])
      ),
    d => (d.components.families[0].review = {}),
    d => (d.components.families[0].variants[0].tree.type = 'RECTANGLE'),
    d => (d.components.families[0].variants[0].tree.absolute = {}),
    d =>
      (d.components.families[0].variants[0].tree.fill = 'fixture/base-width'),
    d => (d.components.families[0].variants[0].tree.layout.width = 'missing'),
    d =>
      (d.components.families[0].variants[0].tree.layout.padding.block =
        'fixture/base-color'),
    d => (d.components.families[0].variants[0].tree.children = {}),
    d =>
      (d.components.families[0].variants[0].tree.bindings = {
        visible: 'fixture/base-width',
      }),
    d => (d.variables[1].values.mcr = 0),
  ]) {
    const d = clone(capable);
    mutate(d);
    const saved = clone(d);
    assert.throws(() => sourceCapability(d), /Native collection plan:/);
    assert.deepStrictEqual(d, saved);
  }
  const native = snapshot(doc),
    nativeBefore = clone(native),
    state = preflight(plan, native, identity);
  assert.equal(state.neededCollections.length, 0);
  assert.equal(state.neededVariables.length, 0);
  assert.notEqual(
    state.modeIdsByCollectionId.get('foundation').get('mcr'),
    state.modeIdsByCollectionId.get('layout').get('mcr')
  );
  for (const m of doc.modes) {
    assert.deepStrictEqual(
      resolve(plan, state, 'fixture/fill', m.id),
      doc.variables[0].values[m.id]
    );
    assert.equal(
      resolve(plan, state, 'fixture/width', m.id),
      doc.variables[1].values[m.id]
    );
    const calls = [],
      node = {
        explicitVariableModes: { unrelated: 'retained' },
        setExplicitVariableModeForCollection(c, id) {
          calls.push([c.id, id]);
          this.explicitVariableModes[c.id] = id;
        },
      };
    applyModes(node, state, m.id, ['foundation', 'layout']);
    assert.equal(calls.length, 2);
    const recorded = clone(node.explicitVariableModes);
    for (let repeat = 0; repeat < 2; repeat++) {
      applyModes(node, state, m.id, ['foundation', 'layout']);
      assert.deepStrictEqual(node.explicitVariableModes, recorded);
      assert.equal(calls.length, 2);
    }
    assert.equal(node.explicitVariableModes.unrelated, 'retained');
  }
  const reordered = clone(doc);
  reordered.nativeCollections.collections.reverse();
  reordered.variables.reverse();
  reordered.modes.reverse();
  reordered.nativeCollections.collections.forEach(c => c.variableIds.reverse());
  const reorderedPlan = sourcePlan(reordered),
    reorderedState = preflight(reorderedPlan, native, identity);
  assert.equal(
    resolve(reorderedPlan, reorderedState, 'fixture/width', 'mcr'),
    130
  );
  assert.deepStrictEqual(doc, before);
  assert.deepStrictEqual(native, nativeBefore);
  const geometryDoc = clone(capable),
    allValues = value =>
      Object.fromEntries(geometryDoc.modes.map(m => [m.id, value]));
  for (const [id, value] of [
    ['padding', 10],
    ['radius', 0],
    ['stroke', 1],
    ['opacity', 50],
    ['gap', -3],
  ]) {
    geometryDoc.variables.push({
      id: 'geometry.' + id,
      name: 'fixture/' + id,
      type: 'FLOAT',
      values: allValues(value),
    });
    geometryDoc.nativeCollections.collections[1].variableIds.push(
      'geometry.' + id
    );
  }
  geometryDoc.components.families[0].variants[0].tree.bindings = {
    paddingLeft: 'fixture/padding',
    cornerRadius: 'fixture/radius',
    strokeWeight: 'fixture/stroke',
    opacity: 'fixture/opacity',
    itemSpacing: 'fixture/gap',
  };
  const geometryPlan = sourceCapability(geometryDoc),
    geometrySnapshot = snapshot(geometryDoc);
  assert.doesNotThrow(() =>
    validateValues(
      geometryPlan,
      preflight(geometryPlan, geometrySnapshot, identity)
    )
  );
  for (const [roleName, value] of [
    ['padding', -1],
    ['radius', -1],
    ['stroke', -1],
    ['opacity', 101],
    ['opacity', -1],
  ]) {
    const s = clone(geometrySnapshot);
    s.variables.find(v => v.sourceId === 'geometry.' + roleName).valuesByMode[
      'layout:mcr'
    ] = value;
    const state = preflight(geometryPlan, s, identity),
      before = clone(s);
    assert.throws(
      () => validateValues(geometryPlan, state),
      /native runtime (minimum|maximum)/
    );
    assert.deepStrictEqual(s, before);
  }
  const negativeGap = clone(geometrySnapshot);
  negativeGap.variables.find(v => v.sourceId === 'geometry.gap').valuesByMode[
    'layout:mcr'
  ] = -8;
  assert.doesNotThrow(() =>
    validateValues(geometryPlan, preflight(geometryPlan, negativeGap, identity))
  );
  for (const [roleName, value] of [
    ['padding', -1],
    ['radius', -1],
    ['stroke', -1],
    ['opacity', 101],
  ]) {
    const d = clone(geometryDoc);
    d.variables.find(v => v.id === 'geometry.' + roleName).values.mcr = value;
    assert.throws(() => sourceCapability(d), /runtime (minimum|maximum)/);
  }
  const sourceNegatives = [
    d => (d.nativeCollections.version = 2),
    d => (d.nativeCollections.primary = 'missing'),
    d => (d.nativeCollections.extra = true),
    d => (d.nativeCollections.collections[1].name = d.collection),
    d => (d.nativeCollections.collections[1].variableIds[0] = 'missing'),
    d => (d.nativeCollections.collections[1].variableIds[0] = 'base.color'),
    d => d.nativeCollections.collections[0].variableIds.pop(),
    d => (d.variables[1].id = d.variables[0].id),
    d => (d.variables[1].name = d.variables[0].name),
    d => (d.variables[0].values.mcr = { r: NaN, g: 0, b: 0 }),
    d => (d.variables[0].values.preventionweb.a = 1.1),
    d => delete d.variables[0].values.mcr,
    d => (d.variables[0].values.extra = { r: 0, g: 0, b: 0 }),
    d => (d.variables[2].values.mcr = { alias: 'missing' }),
    d => (d.variables[2].values.mcr = { alias: 'fixture/base-width' }),
    d => (d.variables[0].values.mcr = { alias: 'fixture/fill' }),
    d =>
      (d.variables[2].values.mcr = {
        alias: 'fixture/base-color',
        extra: true,
      }),
    d => (d.modes[1].name = d.modes[0].name),
  ];
  for (const mutate of sourceNegatives) {
    const d = clone(doc);
    mutate(d);
    const saved = clone(d);
    assert.throws(() => sourcePlan(d), /Native collection plan:/);
    assert.deepStrictEqual(clone(d), saved);
  }
  assert.throws(() => sourcePlan(doc, ['base.color']), /whole document/);
  assert.doesNotThrow(() =>
    sourcePlan(
      doc,
      doc.variables.map(v => v.id)
    )
  );
  const nativeNegatives = [
    n => delete n.collections[0].ledger,
    n => (n.collections[0].remote = true),
    n => (n.collections[0].isExtension = true),
    n => (n.variables[0].remote = true),
    n => (n.collections[0].ledger.planId = 'foreign'),
    n => (n.collections[0].ledger.collectionId = 'unknown'),
    n => (n.collections[0].ledger.extra = true),
    n => (n.collections[1].name = n.collections[0].name),
    n => (n.collections[1].id = n.collections[0].id),
    n => (n.collections[0].modes[1].modeId = n.collections[0].modes[0].modeId),
    n => (n.collections[0].modes[1].name = n.collections[0].modes[0].name),
    n => n.collections[0].modes.push({ modeId: 'extra', name: 'Foreign mode' }),
    n => (n.variables[0].sourceId = 'foreign-owner'),
    n => delete n.variables[0].sourceId,
    n => (n.variables[1].sourceId = n.variables[0].sourceId),
    n => (n.variables[1].id = n.variables[0].id),
    n => (n.variables[0].resolvedType = 'FLOAT'),
    n => (n.variables[0].variableCollectionId = n.collections[1].id),
    n => n.collections[0].variableIds.pop(),
    n => (n.variables[2].valuesByMode['layout:mcr'].id = 'foreign-target'),
    n => (n.variables[1].valuesByMode['foundation:mcr'] = Infinity),
    n => (n.variables[2].valuesByMode['layout:mcr'] = { r: 0, g: 0, b: 0 }),
    n => delete n.variables[1].valuesByMode['foundation:mcr'],
  ];
  for (const mutate of nativeNegatives) {
    const n = clone(native);
    mutate(n);
    const saved = clone(n);
    assert.throws(
      () => preflight(plan, n, identity),
      /Native collection plan:/
    );
    assert.deepStrictEqual(clone(n), saved);
  }
  const missingMode = clone(native);
  missingMode.collections[0].modes.pop();
  const missing = preflight(plan, missingMode, identity);
  assert.equal(missing.neededModes.get('foundation').length, 1);
  let writes = 0;
  const node = {
    setExplicitVariableModeForCollection() {
      writes++;
    },
  };
  assert.throws(
    () => applyModes(node, missing, 'preventionweb', ['layout', 'foundation']),
    /missing native node mode/
  );
  assert.equal(writes, 0);
  assert.throws(
    () => resolve(plan, missing, 'fixture/width', 'preventionweb'),
    /unmaterialized/
  );
  const capacity = clone(native),
    primary = capacity.collections[0];
  for (let i = 0; i < 4998; i++) {
    const id = 'stale:' + i;
    primary.variableIds.push(id);
    capacity.variables.push({
      id,
      name: 'stale/' + i,
      sourceId: 'stale-source/' + i,
      resolvedType: 'FLOAT',
      variableCollectionId: primary.id,
      valuesByMode: {},
    });
  }
  assert.equal(
    preflight(plan, capacity, identity).occupancy.get('foundation').resulting,
    5000
  );
  primary.variableIds.push('overflow');
  capacity.variables.push({
    id: 'overflow',
    name: 'overflow',
    sourceId: 'old-overflow',
    resolvedType: 'FLOAT',
    variableCollectionId: primary.id,
    valuesByMode: {},
  });
  assert.throws(() => preflight(plan, capacity, identity), /capacity exceeded/);
  const drift = preflight(plan, clone(native), identity);
  drift.variablesBySourceId.get('layout.width').valuesByMode['layout:mcr'].id =
    'wrong';
  assert.throws(
    () => resolve(plan, drift, 'fixture/width', 'mcr'),
    /alias ownership drift/
  );
  drift.variablesBySourceId.get('layout.width').valuesByMode['layout:mcr'] =
    130;
  assert.throws(
    () => resolve(plan, drift, 'fixture/width', 'mcr'),
    /invalid resolved native value/
  );
  const modeDrift = preflight(plan, clone(native), identity);
  modeDrift.collectionsBySourceId
    .get('foundation')
    .modes.find(m => m.modeId === 'foundation:mcr').name = 'Changed brand';
  assert.throws(
    () => resolve(plan, modeDrift, 'fixture/width', 'mcr'),
    /unmaterialized or drifted/
  );
  let modeWrites = 0;
  assert.throws(
    () =>
      applyModes(
        {
          setExplicitVariableModeForCollection() {
            modeWrites++;
          },
        },
        modeDrift,
        'mcr',
        ['layout', 'foundation']
      ),
    /missing native node mode/
  );
  assert.equal(modeWrites, 0);
  console.log(
    'Native collection pure whole-source/all-mode plans, five-brand qualified aliases/modes, exact repeats, occupancy5000/5001 and ownership/type/alias/capacity refusals pass. No importer/builder/native execution acceptance.'
  );
}
if (require.main === module) main();
module.exports = { document, snapshot, identity, main };
