#!/usr/bin/env node
/** Lossless scoped connector/preflight checks. No native geometry or raster proof. */
'use strict';
const assert = require('assert');
const { buildFigmaVariables } = require('./build-figma-tokens.cjs');
const {
  buildConnector,
  subsetDocument,
  compressJSON,
  decompressJSON,
} = require('./build-figma-connector.cjs');
const {
  environment,
  importFoundation,
} = require('../examples/figma-plugin/dev/mock-kit.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const familyId = 'segmented-control.segment';
const familyOf = doc =>
  doc.components.families.find(family => family.id === familyId);
const scope = (doc, ids, brandId = 'undrr') => ({
  doc,
  operation: 'build',
  brandId,
  familyIds: [familyId],
  variantIds: ids,
});
const identity = (node, key = 'mgKitId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
function snapshot(env) {
  return copy({
    nodes: [...env.state.nodes.values()].map(node => [
      node.id,
      identity(node),
      node.parent?.id,
      node.children.map(child => child.id),
      node.name,
      node.fills,
      node.strokes,
      node.boundVariables,
    ]),
    styles: env.state.styles.map(style => [
      style.id,
      style.fontName,
      style.fontSize,
      style.lineHeight,
      style.boundVariables,
    ]),
  });
}
async function main() {
  const doc = buildFigmaVariables();
  const family = familyOf(doc);
  assert.strictEqual(family.variants.length, 30);
  const focus = family.variants.filter(variant => variant.tree.focusRing);
  const one = [focus[0].id];
  const selected = subsetDocument(doc, 'build', 'undrr', [familyId], one);
  assert.deepStrictEqual(decompressJSON(compressJSON(selected)), selected);
  const names = new Set();
  function independentlyInclude(name) {
    if (names.has(name)) return;
    names.add(name);
    const definition = doc.variables.find(value => value.name === name);
    assert(definition);
    for (const mode of doc.modes)
      if (definition.values[mode.id]?.alias)
        independentlyInclude(definition.values[mode.id].alias);
  }
  const ring = focus[0].tree.focusRing;
  [
    ring.color,
    ring.separatorColor,
    ring.offset,
    ring.width,
    ring.outerStroke,
    ...Object.values(ring.cornerBindings),
  ].forEach(independentlyInclude);
  assert.deepStrictEqual(
    selected.variables.map(value => value.name).sort(),
    [...names].sort()
  );
  for (const value of selected.variables) {
    const original = doc.variables.find(source => source.id === value.id);
    assert.deepStrictEqual(value, {
      ...copy(original),
      values: { undrr: copy(original.values.undrr) },
    });
  }
  assert.deepStrictEqual(selected.components.families[0].variants, [focus[0]]);
  assert.deepStrictEqual(selected.styles.text[0], {
    ...copy(
      doc.styles.text.find(
        style => style.id === 'component.segmented-control.segment'
      )
    ),
    values: {
      undrr: copy(
        doc.styles.text.find(
          style => style.id === 'component.segmented-control.segment'
        ).values.undrr
      ),
    },
  });
  // A dependency used only in another brand is still explicitly included.
  const otherModeAlias = copy(doc);
  otherModeAlias.variables.find(
    value => value.name === 'focus-ring/offset'
  ).values.delta = { alias: 'spacing/50' };
  const dependency = otherModeAlias.variables.find(
    value => value.name === 'spacing/50'
  );
  assert.strictEqual(typeof dependency.values.delta, 'number');
  otherModeAlias.variables.find(
    value => value.name === 'effect-size/focus-ring/outer-spread'
  ).values.delta = dependency.values.delta + 2;
  const otherSubset = subsetDocument(
    otherModeAlias,
    'build',
    'undrr',
    [familyId],
    one
  );
  assert(otherSubset.variables.some(value => value.id === dependency.id));
  assert.deepStrictEqual(
    decompressJSON(compressJSON(otherSubset)),
    otherSubset
  );
  console.log(
    'ok lossless normalized focus DTO, exact typed-role closure and aliases in every source mode'
  );

  const env = environment(doc);
  await importFoundation(env, doc);
  const bytes = [];
  for (const variant of focus) {
    const payload = await buildConnector(scope(doc, [variant.id]));
    assert.strictEqual(payload.coincidentFocusEnabled, true);
    assert(payload.bytes <= 50000 && payload.characters <= 50000);
    assert(
      payload.code.includes('COINCIDENT_SCALE requires one exact imported')
    );
    const first = await env.runCode(payload.code);
    assert.deepStrictEqual(copy(first.errors), []);
    assert.strictEqual(first.families[0].variantIds.length, 1);
    const main = env.state.nodes.get(first.families[0].variantIds[0].nodeId);
    const label = main.children.find(node => node.type === 'TEXT');
    const style = env.state.styles.find(
      value =>
        identity(value, 'mgStyleId') === 'component.segmented-control.segment'
    );
    assert.strictEqual(label.textStyleId, style.id);
    assert.deepStrictEqual(copy(style.lineHeight), {
      unit: 'PERCENT',
      value: 120,
    });
    const outlines = main.children.filter(node => node.type === 'RECTANGLE');
    assert.strictEqual(outlines.length, 2);
    const roles = new Map(
      env.state.variables.map(variable => [variable.name, variable])
    );
    assert.strictEqual(
      outlines[0].boundVariables.strokeWeight.id,
      roles.get(ring.outerStroke).id
    );
    assert.strictEqual(
      outlines[1].boundVariables.strokeWeight.id,
      roles.get(ring.offset).id
    );
    assert.deepStrictEqual(copy(outlines[0].constraints), {
      horizontal: 'SCALE',
      vertical: 'SCALE',
    });
    const before = snapshot(env);
    for (let pass = 0; pass < 2; pass++) {
      const repeated = await env.runCode(payload.code);
      assert.deepStrictEqual(copy(repeated.errors), []);
      assert.strictEqual(repeated.createdNodeIds.length, 0);
      assert.deepStrictEqual(snapshot(env), before);
    }
    bytes.push(payload.bytes);
  }
  assert.strictEqual(
    new Set(
      focus.map(
        variant =>
          env.state.nodes.get(
            [...env.state.nodes.values()].find(
              node =>
                identity(node) === `family/${familyId}/variant/${variant.id}`
            ).id
          ).id
      )
    ).size,
    12
  );
  console.log(
    `ok12 single-focus compiled scopes ${Math.min(...bytes)}–${Math.max(...bytes)} bytes, enabled native-role guards, styles and two zero-create mock repeats`
  );

  const focusPayload = await buildConnector(scope(doc, one));
  const outerRole = env.state.variables.find(
    value => value.name === ring.outerStroke
  );
  const originalType = outerRole.resolvedType;
  outerRole.resolvedType = 'STRING';
  const before = snapshot(env);
  const invalidNative = await env.runCode(focusPayload.code);
  assert(
    invalidNative.errors.some(error => error.includes('COINCIDENT_SCALE'))
  );
  assert.strictEqual(invalidNative.createdNodeIds.length, 0);
  assert.deepStrictEqual(snapshot(env), before);
  outerRole.resolvedType = originalType;
  for (const mode of doc.modes.filter(value => value.id !== 'undrr')) {
    const branded = environment(doc);
    const imported = await branded.call(
      'importVariables',
      doc,
      [mode.id],
      false,
      [],
      true
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const payload = await buildConnector(scope(doc, one, mode.id));
    const result = await branded.runCode(payload.code);
    assert.deepStrictEqual(copy(result.errors), [], mode.id);
  }
  console.log(
    'ok true-feature native type refusal precedes writes; selected templates/aliases execute in all five mock brands'
  );

  for (const state of ['Default', 'Hover', 'Disabled']) {
    const ids = family.variants
      .filter(value => value.properties.State === state)
      .map(value => value.id);
    const payload = await buildConnector(scope(doc, ids));
    assert.strictEqual(payload.coincidentFocusEnabled, false);
    assert(payload.bytes <= 48000 && payload.characters <= 48000);
    assert(
      !payload.code.includes('COINCIDENT_SCALE requires one exact imported')
    );
    const report = await env.runCode(payload.code);
    assert.deepStrictEqual(copy(report.errors), []);
  }
  const checkbox = doc.components.families.find(
    value => value.id === 'checkbox'
  );
  const checked = await buildConnector({
    doc,
    familyIds: ['checkbox'],
    variantIds: [
      checkbox.variants.find(
        value => value.id === 'checkbox.true.default.after.short'
      ).id,
    ],
  });
  assert.strictEqual(checked.coincidentFocusEnabled, false);
  assert(checked.bytes <= 48000 && checked.characters <= 48000);
  assert.strictEqual(checked.svgEnabled, true);
  const checkedEnv = environment(doc);
  await importFoundation(checkedEnv, doc);
  assert.deepStrictEqual(
    copy((await checkedEnv.runCode(checked.code)).errors),
    []
  );
  console.log(
    `ok extension-free compiler proof removes dormant focus guard; existing checked-SVG48000 safety gate remains ${checked.bytes} bytes`
  );

  for (const [name, mutate] of [
    [
      'unknown renderer',
      bad => {
        familyOf(bad).variants.find(
          value => value.id === one[0]
        ).tree.focusRing.renderer = 'OTHER';
      },
    ],
    [
      'missing renderer',
      bad => {
        delete familyOf(bad).variants.find(value => value.id === one[0]).tree
          .focusRing.renderer;
      },
    ],
    [
      'missing ring',
      bad => {
        delete familyOf(bad).variants.find(value => value.id === one[0]).tree
          .focusRing;
      },
    ],
    [
      'wrong source type',
      bad => {
        bad.variables.find(value => value.name === ring.outerStroke).type =
          'STRING';
      },
    ],
    [
      'duplicate role',
      bad => {
        bad.variables.push(
          copy(bad.variables.find(value => value.name === ring.color))
        );
      },
    ],
    [
      'duplicate source ID',
      bad => {
        bad.variables.push({
          ...copy(bad.variables.find(value => value.name === ring.color)),
          name: 'other/duplicate-source',
        });
      },
    ],
    [
      'cyclic alias',
      bad => {
        bad.variables.find(value => value.name === ring.offset).values.delta = {
          alias: ring.offset,
        };
      },
    ],
    [
      'wrong other-mode sum',
      bad => {
        bad.variables.find(
          value => value.name === ring.outerStroke
        ).values.delta = 99;
      },
    ],
    [
      'malformed other-mode alias',
      bad => {
        bad.variables.find(value => value.name === ring.offset).values.delta = {
          alias: ring.width,
          extra: true,
        };
      },
    ],
  ]) {
    const bad = copy(doc);
    mutate(bad);
    const before = snapshot(env);
    await assert.rejects(
      buildConnector(scope(bad, one)),
      /COINCIDENT_SCALE/,
      name
    );
    assert.deepStrictEqual(snapshot(env), before);
  }
  const defaultUnknown = copy(doc);
  familyOf(defaultUnknown).variants[0].tree.focusRing = { renderer: 'OTHER' };
  await assert.rejects(
    buildConnector(scope(defaultUnknown, [family.variants[0].id])),
    /unknown or missing COINCIDENT_SCALE/
  );
  const six = focus
    .filter(value => value.properties.State === 'Focus')
    .map(value => value.id);
  await assert.rejects(
    buildConnector(scope(doc, six)),
    /Connector payload exceeds 50000.*explicit variantIds/
  );
  await assert.rejects(
    buildConnector({ doc, familyIds: [familyId] }),
    /Connector payload exceeds 50000.*explicit variantIds/
  );
  const fs = require('fs'),
    originalRead = fs.readFileSync;
  for (const anchor of [
    '  const coincidentFocus = MG_COINCIDENT_FOCUS_ENABLED ? new Map() : null;',
    '  const svgPlans = new Map();',
  ]) {
    try {
      // Source drift must refuse specialization before producing a payload.
      fs.readFileSync = function (file, ...args) {
        const value = originalRead.call(this, file, ...args);
        return typeof file === 'string' && file.endsWith('/kit-builder.js')
          ? value.replace(anchor, anchor.replace(';', ' /* drift */ ;'))
          : value;
      };
      await assert.rejects(
        buildConnector(scope(doc, one)),
        /COINCIDENT_SCALE specialization boundary changed/
      );
    } finally {
      fs.readFileSync = originalRead;
    }
  }
  console.log(
    'ok compile-before-VM mismatch/type/alias/all-mode guards and honest six-focus/full30 transport refusal'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { main };
