#!/usr/bin/env node
'use strict';
// Synthetic API/identity/control-flow proof only. No native constraints or pixels.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const DIR = path.resolve(__dirname, '..');
const { environment, importFoundation } = require(
  path.join(DIR, 'dev/mock-kit.cjs')
);
const doc = JSON.parse(
  fs.readFileSync(path.join(DIR, 'mangrove-variables.json'), 'utf8')
);
const copy = value => JSON.parse(JSON.stringify(value));
const sources = [
  path.join(DIR, 'kit-segmented-capabilities.js'),
  path.join(DIR, 'kit-capabilities.js'),
  path.join(DIR, 'kit-segmented-focus-capabilities.js'),
]
  .map(file => fs.readFileSync(file, 'utf8'))
  .join('\n');
const run = (env, document = doc) =>
  env.runCode(
    `${sources}\nreturn runMangroveCapabilityProbes(${JSON.stringify(document)},"undrr","segmented-focus-sizing");`
  );
const cleanup = (env, report) =>
  env.runCode(
    `${sources}\nreturn removeMangroveCapabilityProbes(${JSON.stringify(report)});`
  );
const identity = (node, key = 'mgCapabilityProbeId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
async function setup() {
  const env = environment(doc);
  await importFoundation(env, doc);
  await env.call(
    'importVariables',
    doc,
    ['undrr'],
    false,
    ['component.button', 'component.segmented-control.segment'],
    false
  );
  const scratch = env.figma.createText(),
    proto = Object.getPrototypeOf(scratch);
  scratch.remove();
  const sizeProperty = Object.getOwnPropertyDescriptor(proto, 'fontSize');
  Object.defineProperty(proto, 'fontSize', {
    configurable: true,
    get: sizeProperty.get,
    set(value) {
      sizeProperty.set.call(this, value);
      if (this.type === 'TEXT') this.textStyleId = '';
    },
  });
  env.focusConsumerOutlineWrites = [];
  for (const field of [
    'x',
    'y',
    'width',
    'height',
    'constraints',
    'strokeWeight',
    'topLeftRadius',
    'topRightRadius',
    'bottomLeftRadius',
    'bottomRightRadius',
  ])
    Object.defineProperty(proto, field, {
      configurable: true,
      get() {
        return this['_focus_' + field];
      },
      set(value) {
        if (
          this.type === 'RECTANGLE' &&
          this.parent?.type === 'INSTANCE' &&
          !env.focusModelingClone
        ) {
          env.focusConsumerOutlineWrites.push([this.id, field]);
          throw new Error('Inherited outline write is forbidden');
        }
        this['_focus_' + field] = value;
      },
    });
  const bound = proto.setBoundVariable;
  proto.setBoundVariable = function (field, variable) {
    if (
      this.type === 'RECTANGLE' &&
      this.parent?.type === 'INSTANCE' &&
      !env.focusModelingClone
    ) {
      env.focusConsumerOutlineWrites.push([this.id, field]);
      throw new Error('Inherited outline binding write is forbidden');
    }
    return bound.call(this, field, variable);
  };
  const setStyle = proto.setTextStyleIdAsync;
  proto.setTextStyleIdAsync = async function (id) {
    await setStyle.call(this, id);
    if (id)
      Object.assign(
        this.boundVariables,
        copy(env.state.styles.find(value => value.id === id).boundVariables)
      );
  };
  const instantiate = proto.createInstance;
  proto.createInstance = function () {
    const result = instantiate.call(this);
    env.focusModelingClone = true;
    const visit = (source, target) => {
      for (const field of [
        'topLeftRadius',
        'topRightRadius',
        'bottomLeftRadius',
        'bottomRightRadius',
        '_strokesIncludedInLayout',
        'itemReverseZIndex',
      ])
        target[field] = source[field];
      target.boundVariables = copy(source.boundVariables);
      // Synthetic cloning writes fontSize after the style ID. Native cloning
      // preserves the association without an explicit typography override.
      if (source.type === 'TEXT') target.textStyleId = source.textStyleId;
      source.children.forEach((child, index) =>
        visit(child, target.children[index])
      );
    };
    try {
      visit(this, result);
    } finally {
      env.focusModelingClone = false;
    }
    return result;
  };
  const setProperties = proto.setProperties;
  proto.setProperties = function (values) {
    setProperties.call(this, values);
    for (const child of this.children) {
      const key = child.componentPropertyReferences?.characters;
      if (key && key in values) child.characters = values[key];
    }
  };
  return env;
}
const foundation = env =>
  JSON.stringify({
    variables: env.state.variables.map(value => [
      value.id,
      value.valuesByMode,
      value.scopes,
    ]),
    styles: env.state.styles.map(value => [
      value.id,
      value.fontName,
      value.fontSize,
      value.lineHeight,
      value.boundVariables,
    ]),
  });
async function main() {
  const env = await setup();
  const styleProbe = env.figma.createText();
  const nativeStyle = env.state.styles.find(
    value =>
      identity(value, 'mgStyleId') === 'component.segmented-control.segment'
  );
  await env.figma.loadFontAsync(nativeStyle.fontName);
  styleProbe.fontName = nativeStyle.fontName;
  await styleProbe.setTextStyleIdAsync(nativeStyle.id);
  assert.strictEqual(styleProbe.textStyleId, nativeStyle.id);
  styleProbe.fontSize = 14;
  assert.strictEqual(styleProbe.textStyleId, '');
  await styleProbe.setTextStyleIdAsync(nativeStyle.id);
  assert.strictEqual(styleProbe.textStyleId, nativeStyle.id);
  styleProbe.remove();
  const before = foundation(env),
    report = await run(env);
  assert.deepStrictEqual(copy(report.errors), []);
  assert.strictEqual(report.ledger.length, 103);
  assert.strictEqual(new Set(report.ledger.map(value => value.id)).size, 103);
  for (const item of report.ledger)
    assert.strictEqual(identity(env.state.nodes.get(item.id)), report.runId);
  for (const result of Object.values(report.tests)) {
    assert.strictEqual(
      result.status,
      'observed',
      JSON.stringify(result.errors)
    );
    assert.deepStrictEqual(copy(result.errors), []);
    assert.strictEqual(result.affectedNodeIds.length, 51);
    assert.strictEqual(result.observations.length, 11);
    assert.strictEqual(
      result.findings.sourceAndIdentity,
      true,
      JSON.stringify(
        result.observations.map(value =>
          value.samples.map(sample => sample.findings)
        )
      )
    );
    assert.strictEqual(result.findings.editedAndFreshBaselines, true);
    assert.strictEqual(result.findings.nativeFractionalSizing, false);
    assert.strictEqual(result.sizingCandidateSatisfied, false);
    assert.strictEqual(result.supported, false);
    assert.strictEqual(result.findings.visualBandsVerified, false);
    assert.strictEqual(result.findings.middleOcclusionVerified, false);
    const initial = result.observations[0],
      final = result.observations.at(-1);
    assert.deepStrictEqual(
      copy(final.samples.map(value => value.text.characters)),
      doc.capabilities.segmentedJoining.labels.default
    );
    assert.deepStrictEqual(
      final.samples.map(value => value.body.id),
      initial.samples.map(value => value.body.id)
    );
    assert(
      result.observations
        .filter(value => 'exactEditedBaselinePreserved' in value)
        .every(value => value.exactEditedBaselinePreserved)
    );
    for (const observation of result.observations)
      for (const sample of observation.samples) {
        assert.strictEqual(
          sample.text.textStyleId,
          report.preflight.segmentedFocusSizing.styleId
        );
        assert(sample.rings.every(value => value.visible));
        assert(sample.rings.every(value => value.strokeJoin === 'MITER'));
      }
  }
  assert.strictEqual(foundation(env), before);
  assert.deepStrictEqual(env.focusConsumerOutlineWrites, []);
  const removed = await cleanup(env, report);
  assert.deepStrictEqual(copy(removed.errors), []);
  assert.strictEqual(removed.removedNodeIds.length, 103);
  assert(
    report.ledger.every(
      value =>
        !env.state.nodes.has(value.id) || env.state.nodes.get(value.id).removed
    )
  );
  assert.strictEqual(foundation(env), before);
  console.log(
    'PASS two policies, exact103-node ledger, two reapplications/fresh cohorts, shared120% aliases and honest unsupported native geometry'
  );
  for (const [name, mutate] of [
    [
      'sum source',
      value =>
        (value.variables.find(
          item => item.id === 'effect-size.focus-ring.outer-spread'
        ).values.mcr = 5),
    ],
    [
      'sum type',
      value =>
        (value.variables.find(
          item => item.id === 'effect-size.focus-ring.outer-spread'
        ).type = 'STRING'),
    ],
    [
      'duplicate sum',
      value =>
        value.variables.push(
          copy(
            value.variables.find(
              item => item.id === 'effect-size.focus-ring.outer-spread'
            )
          )
        ),
    ],
    [
      'template percent',
      value =>
        (value.styles.text.find(
          item => item.id === 'component.segmented-control.segment'
        ).values.undrr.lineHeight.value = 100),
    ],
  ]) {
    const env2 = await setup(),
      changed = copy(doc);
    mutate(changed);
    const size = env2.state.nodes.size,
      assets = foundation(env2),
      failed = await run(env2, changed);
    assert.strictEqual(failed.rootId, null, name);
    assert.strictEqual(failed.ledger.length, 0, name);
    assert(failed.errors.length, name);
    assert.strictEqual(env2.state.nodes.size, size, name);
    assert.strictEqual(foundation(env2), assets, name);
  }
  console.log(
    'PASS source sum/type/duplicate/template negative preflight without canvas or foundation writes'
  );
  const env3 = await setup(),
    nativeSum = env3.state.variables.find(
      value => identity(value, 'mgId') === 'effect-size.focus-ring.outer-spread'
    );
  nativeSum.resolvedType = 'STRING';
  const count = env3.state.nodes.size;
  const failed = await run(env3);
  assert(failed.errors.length);
  assert.strictEqual(failed.rootId, null);
  assert.strictEqual(env3.state.nodes.size, count);
  const env4 = await setup();
  env4.state.rejectedFonts.add('Roboto Bold');
  const fontFailed = await run(env4);
  assert(fontFailed.errors.length);
  assert.strictEqual(fontFailed.rootId, null);
  assert.strictEqual(fontFailed.ledger.length, 0);
  console.log(
    'PASS incompatible native type and unavailable font fail before creating root'
  );
  const env5 = await setup(),
    make = env5.figma.createRectangle;
  let calls = 0;
  env5.figma.createRectangle = () => {
    if (++calls === 2)
      throw new Error('synthetic rectangle allocation failure');
    return make();
  };
  const partial = await run(env5);
  assert(
    Object.values(partial.tests).some(value =>
      value.errors.some(message => message.includes('allocation failure'))
    )
  );
  assert(partial.ledger.length > 1);
  const recovery = await cleanup(env5, partial);
  assert.deepStrictEqual(copy(recovery.errors), []);
  assert.strictEqual(recovery.removedNodeIds.length, partial.ledger.length);
  console.log('PASS partial allocation failure exact owned cleanup');
  const env6 = await setup(),
    held = await run(env6),
    foreign = env6.figma.createFrame();
  env6.state.nodes.get(held.rootId).appendChild(foreign);
  const refused = await cleanup(env6, held);
  assert(refused.errors.length);
  assert.strictEqual(refused.removedNodeIds.length, 0);
  assert(!foreign.removed);
  foreign.remove();
  const exact = await cleanup(env6, held);
  assert.deepStrictEqual(copy(exact.errors), []);
  assert.strictEqual(exact.removedNodeIds.length, 103);
  console.log(
    'PASS foreign child refuses cleanup before deletion, exact recovery after removal'
  );
  if (process.env.MANGROVE_FOCUS_SYNTHETIC_REPORT)
    fs.writeFileSync(
      process.env.MANGROVE_FOCUS_SYNTHETIC_REPORT,
      JSON.stringify(
        {
          kind: 'synthetic-only',
          nativeExecution: false,
          claims: {
            controlFlow: true,
            sourcePreflight: true,
            exactOwnership: true,
            sharedStyleAndAliasFixtures: true,
            geometry: false,
            pixels: false,
            occlusion: false,
          },
          ledgerCount: report.ledger.length,
          tests: report.tests,
        },
        null,
        2
      )
    );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { setup, run, cleanup, doc };
