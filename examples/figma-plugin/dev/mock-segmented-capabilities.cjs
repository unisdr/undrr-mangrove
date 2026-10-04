#!/usr/bin/env node
/** Synthetic control flow only. No native wrapping, font metrics or pixels are simulated. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildSegmentedJoiningCapability,
} = require('../../../scripts/figma-segmented-probe.cjs');
const DIR = path.resolve(__dirname, '..');
const ROOT = path.resolve(DIR, '../..');
const copy = value => JSON.parse(JSON.stringify(value));
const original = JSON.parse(
  fs.readFileSync(path.join(DIR, 'mangrove-variables.json'), 'utf8')
);
const doc = copy(original);
doc.capabilities = {
  ...doc.capabilities,
  segmentedJoining: buildSegmentedJoiningCapability({ root: ROOT, ...doc }),
};
const runtime = ['kit-segmented-capabilities.js', 'kit-capabilities.js']
  .map(file => fs.readFileSync(path.join(DIR, file), 'utf8'))
  .join('\n');
const run = (env, document = doc, brand = 'undrr') =>
  env.runCode(
    `${runtime}\nreturn runMangroveCapabilityProbes(${JSON.stringify(document)},${JSON.stringify(brand)},'segmented-joining');`
  );
const cleanup = (env, report) =>
  env.runCode(
    `${runtime}\nreturn removeMangroveCapabilityProbes(${JSON.stringify(report)});`
  );
const identity = node =>
  node.getSharedPluginData('orgundrrmangrove', 'mgCapabilityProbeId');
async function setup(options = {}) {
  const env = environment(doc, options);
  await importFoundation(env, doc);
  const imported = await env.call(
    'importVariables',
    doc,
    ['undrr'],
    false,
    ['component.button'],
    false
  );
  assert.deepStrictEqual(copy(imported.errors), []);
  return env;
}
async function main() {
  const env = await setup();
  const assetsBefore = JSON.stringify({
    variables: env.state.variables.map(value => [value.id, value.valuesByMode]),
    styles: env.state.styles.map(value => [
      value.id,
      value.fontName,
      value.fontSize,
      value.effects,
    ]),
  });
  const report = await run(env);
  assert.deepStrictEqual(copy(report.errors), []);
  assert.strictEqual(report.scope, 'segmented-joining');
  assert.strictEqual(report.segmentedJoining.fixtureCount, 4);
  assert.strictEqual(
    report.segmentedJoining.sharedStyleAssociationSatisfied,
    false
  );
  assert.strictEqual(report.ledger.length, 101);
  assert.strictEqual(new Set(report.ledger.map(entry => entry.id)).size, 101);
  for (const entry of report.ledger)
    assert.strictEqual(identity(env.state.nodes.get(entry.id)), report.runId);
  for (const test of Object.values(report.tests)) {
    assert.strictEqual(test.status, 'observed', JSON.stringify(test.errors));
    assert.deepStrictEqual(copy(test.errors), []);
    assert.strictEqual(test.affectedNodeIds.length, 25);
    assert(test.observations.every(value => value.semanticOrderPreserved));
    for (const observation of test.observations)
      assert(
        observation.segments.every(
          segment => segment.mainComponentId === segment.expectedMainComponentId
        )
      );
    for (const observation of test.observations)
      for (const segment of observation.segments) {
        assert(/Label#/.test(segment.propertyId));
        assert.strictEqual(segment.text.fontName.family, 'Roboto');
        assert.strictEqual(segment.text.fontName.style, 'Bold');
        assert.strictEqual(segment.text.lineHeight.value, 120);
        assert(!segment.text.textStyleId);
        assert(segment.text.boundVariables.fontFamily);
        assert(segment.mainText.boundVariables.fontSize); // Synthetic clone clears fontSize aliases while replaying literals.
        assert(segment.text.rangePaints[0].variableId);
        assert.strictEqual(segment.rings.length, 2);
      }
  }
  assert.strictEqual(report.tests.segmentedStacking.supported, false);
  assert.strictEqual(
    report.tests.segmentedStacking.findings.middleCanBeAboveBothNeighbours,
    false
  );
  assert.deepStrictEqual(
    copy(
      report.tests.segmentedFullWidth.observations.map(value => value.phase)
    ),
    [
      'short240',
      'edited long240',
      'edited long390',
      'edited long240',
      'edited long240 after partial private-master update',
      'restored short240',
      'restored short after partial private-master update',
    ]
  );
  assert.strictEqual(report.tests.segmentedFullWidth.identityPreserved, true);
  assert.strictEqual(
    report.tests.segmentedFullWidth.editedLabelsPreserved,
    false // Shared mock stores property overrides but does not mirror them into cloned TEXT.
  );
  assert.strictEqual(report.tests.segmentedFullWidth.findings.length, 7);
  for (const observation of report.tests.segmentedFullWidth.observations.filter(
    value => value.phase.startsWith('edited long')
  ))
    for (const [index, segment] of observation.segments.entries())
      assert.strictEqual(
        segment.properties[segment.propertyId].value,
        doc.capabilities.segmentedJoining.labels.long[index]
      );

  assert(
    report.tests.segmentedFullWidth.findings.every(
      value => value.segments.length === 3
    )
  );
  const firstFull = report.tests.segmentedFullWidth.observations[0];
  const lastFull = report.tests.segmentedFullWidth.observations.at(-1);
  assert.deepStrictEqual(
    copy(firstFull.row.childIds),
    copy(lastFull.row.childIds)
  );
  assert.deepStrictEqual(
    copy(lastFull.segments.map(value => value.text.characters)),
    doc.capabilities.segmentedJoining.labels.default
  );
  assert.strictEqual(
    assetsBefore,
    JSON.stringify({
      variables: env.state.variables.map(value => [
        value.id,
        value.valuesByMode,
      ]),
      styles: env.state.styles.map(value => [
        value.id,
        value.fontName,
        value.fontSize,
        value.effects,
      ]),
    })
  );
  const cleaned = await cleanup(env, report);
  assert.deepStrictEqual(copy(cleaned.errors), []);
  assert.strictEqual(cleaned.removedNodeIds.length, 101);
  assert(report.ledger.every(entry => !env.state.nodes.has(entry.id)));
  console.log(
    'ok  four101-node exact-owned procedures, native property keys, source fonts/range roles, semantic order and restart cleanup; geometry remains synthetic'
  );

  for (const change of [
    value => {
      value.capabilities.segmentedJoining.version = 2;
    },
    value => {
      value.capabilities.segmentedJoining.cases.short390.widths = [
        'wrong',
        97,
        90,
      ];
    },
    value => {
      value.capabilities.segmentedJoining.cases.default240.thirdX = 0;
    },
    value => {
      value.capabilities.segmentedJoining.roles.border.type = 'STRING';
    },
    value => {
      value.capabilities.segmentedJoining.geometry = {};
      value.capabilities.segmentedJoining.brands.undrr.geometry.seam = -2;
    },
    value => {
      value.capabilities.segmentedJoining.brands.undrr.geometry.focusOuterCorners.First =
        [7, 2, 7, 0];
    },
    value => {
      value.capabilities.segmentedJoining.brands.undrr.paints.hover.text =
        'color/missing';
    },
  ]) {
    const malformed = copy(doc);
    change(malformed);
    const before = env.state.nodes.size;
    const rejected = await run(env, malformed);
    assert.strictEqual(rejected.rootId, null);
    assert.strictEqual(rejected.ledger.length, 0);
    assert(rejected.errors[0].startsWith('Preflight:'));
    assert.strictEqual(env.state.nodes.size, before);
  }
  const wrongBrand = await run(env, doc, 'mcr');
  assert.strictEqual(wrongBrand.rootId, null);
  assert(wrongBrand.errors.length);
  const sourcePacket = doc.capabilities.segmentedJoining;
  assert.strictEqual(Object.keys(sourcePacket.brands).length, 5);
  assert.strictEqual(sourcePacket.brands.mcr.geometry.border, 2);
  assert.strictEqual(sourcePacket.brands.mcr.typography.segment.fontSize, 18);
  console.log(
    'ok  malformed schema, roles, seam, focus corners, paints and unavailable measured brand reject before canvas; five-brand packet retained'
  );

  const aliasEnv = await setup();
  const border = aliasEnv.state.variables.find(
    value => value.name === 'border-width/button'
  );
  const mode = aliasEnv.state.collections[0].modes[0].modeId;
  border.valuesByMode[mode] = { type: 'VARIABLE_ALIAS', id: border.id };
  const rejectedAlias = await run(aliasEnv);
  assert.strictEqual(rejectedAlias.rootId, null);
  assert(rejectedAlias.errors[0].includes('alias cycle'));
  const fontEnv = await setup();
  fontEnv.state.rejectedFonts.add('Roboto Bold');
  const rejectedFont = await run(fontEnv);
  assert.strictEqual(rejectedFont.rootId, null);
  assert.strictEqual(rejectedFont.ledger.length, 0);
  assert(rejectedFont.errors.length);
  console.log(
    'ok  native alias cycle and exact unavailable Bold font block before root creation'
  );

  const partialEnv = await setup();
  const createRectangle = partialEnv.figma.createRectangle;
  let count = 0;
  partialEnv.figma.createRectangle = () => {
    if (++count === 2) throw new Error('Synthetic rectangle API failure');
    return createRectangle();
  };
  const partial = await run(partialEnv);
  assert(
    partial.tests.segmentedSeamsCorners.errors.some(value =>
      value.includes('Synthetic rectangle')
    )
  );
  assert(partial.ledger.length > 0);
  assert.strictEqual(partial.unrecordedDescendantIds.length, 0);
  const partialCleanup = await cleanup(partialEnv, partial);
  assert.deepStrictEqual(copy(partialCleanup.errors), []);
  assert.strictEqual(
    partialCleanup.removedNodeIds.length,
    partial.ledger.length
  );
  const foreignEnv = await setup();
  const owned = await run(foreignEnv);
  const userNode = foreignEnv.figma.createRectangle();
  foreignEnv.state.nodes.get(owned.rootId).appendChild(userNode);
  const refused = await cleanup(foreignEnv, owned);
  assert(refused.errors.length);
  assert(foreignEnv.state.nodes.has(owned.rootId));
  assert(foreignEnv.state.nodes.has(userNode.id));
  console.log(
    'ok  partial failure ledger is exact and recoverable; user additions refuse cleanup without deletion'
  );
}
main().catch(error => {
  console.error(`FAIL ${error.stack || error}`);
  process.exitCode = 1;
});
