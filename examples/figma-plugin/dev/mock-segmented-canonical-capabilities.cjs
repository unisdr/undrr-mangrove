#!/usr/bin/env node
/** Explicit synthetic inheritance fixtures. No native style cache, layout or pixel acceptance. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const doc = buildFigmaVariables();
const family = 'segmented-control.segment';
const DIR = path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
const sources = [
  'kit-segmented-capabilities.js',
  'kit-segmented-canonical-capabilities.js',
  'kit-capabilities.js',
]
  .map(file => fs.readFileSync(path.join(DIR, file), 'utf8'))
  .join('\n');
const prepare = (env, document = doc) =>
  env.runCode(
    `${sources}\nreturn runMangroveCapabilityProbes(${JSON.stringify(document)},'undrr','segmented-canonical');`
  );
const advance = (env, report, built) =>
  env.runCode(
    `${sources}\nreturn advanceMangroveSegmentedCanonicalProbes(${JSON.stringify(doc)},'undrr',${JSON.stringify(report)},${JSON.stringify(built)});`
  );
const cleanup = (env, report) =>
  env.runCode(
    `${sources}\nreturn removeMangroveCapabilityProbes(${JSON.stringify(report)});`
  );
const identity = (node, key = 'mgCapabilityProbeId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
async function setup(options = {}) {
  const env = environment(doc);
  await importFoundation(env, doc);
  const scratch = env.figma.createText(),
    prototype = Object.getPrototypeOf(scratch);
  scratch.remove();
  const setStyle = prototype.setTextStyleIdAsync;
  prototype.setTextStyleIdAsync = async function (id) {
    await setStyle.call(this, id);
    if (id) {
      const style = env.state.styles.find(value => value.id === id);
      Object.assign(this.boundVariables, copy(style.boundVariables));
    }
  };
  Object.defineProperty(prototype, 'variantProperties', {
    get() {
      const source = this.type === 'INSTANCE' ? this.main : this;
      return source && ['COMPONENT', 'INSTANCE'].includes(this.type)
        ? Object.fromEntries(
            source.name.split(',').map(part => part.trim().split('='))
          )
        : null;
    },
    configurable: true,
  });
  const instantiate = prototype.createInstance;
  prototype.createInstance = function () {
    const instance = instantiate.call(this);
    // Explicitly model only this source's native alias/corner/property contract.
    // Preserve the inherited root mgKitId, matching the observed native collision.
    assert.strictEqual(
      identity(instance, 'mgKitId'),
      identity(this, 'mgKitId')
    );
    for (const field of [
      'topLeftRadius',
      'topRightRadius',
      'bottomLeftRadius',
      'bottomRightRadius',
      '_strokesIncludedInLayout',
    ])
      instance[field] = this[field];
    instance.children[0].boundVariables = copy(this.children[0].boundVariables);
    return instance;
  };
  const setProperties = prototype.setProperties;
  prototype.setProperties = function (properties) {
    setProperties.call(this, properties);
    for (const child of this.children) {
      const key = child.componentPropertyReferences?.characters;
      if (key && key in properties) child.characters = properties[key];
    }
  };
  await env.call(
    'importVariables',
    doc,
    ['undrr'],
    false,
    ['component.button'],
    false
  );
  const built = await env.call('buildMangroveComponents', doc, 'undrr', [
    family,
  ]);
  assert.deepStrictEqual(copy(built.errors), []);
  if (options.noFont) env.state.rejectedFonts.add('Roboto Bold');
  return { env, built };
}
const build = env =>
  env.call('buildMangroveComponents', doc, 'undrr', [family]);
async function main() {
  const { env } = await setup();
  const canonicalBefore = [...env.state.nodes.values()]
    .filter(node => node.type === 'COMPONENT' || node.type === 'COMPONENT_SET')
    .map(node => [node.id, node.name, node.boundVariables]);
  const originalMaster = [...env.state.nodes.values()].find(
    node =>
      node.type === 'COMPONENT' &&
      identity(node, 'mgKitId').includes(`family/${family}/variant/`)
  );
  const originalClone = originalMaster.createInstance();
  env.figma.currentPage.appendChild(originalClone);
  assert.strictEqual(
    identity(originalClone, 'mgKitId'),
    identity(originalMaster, 'mgKitId')
  );
  const countBeforeCollision = env.state.nodes.size;
  const fieldsBeforeCollision = copy(canonicalBefore);
  await assert.rejects(() => build(env), /Duplicate Mangrove ownership key/);
  assert.strictEqual(env.state.nodes.size, countBeforeCollision);
  assert.deepStrictEqual(
    [...env.state.nodes.values()]
      .filter(
        node => node.type === 'COMPONENT' || node.type === 'COMPONENT_SET'
      )
      .map(node => [node.id, node.name, node.boundVariables]),
    fieldsBeforeCollision
  );
  originalClone.remove();
  const prepared = await prepare(env);
  assert.deepStrictEqual(copy(prepared.errors), []);
  assert.strictEqual(prepared.ledger.length, 13);
  assert.strictEqual(prepared.segmentedCanonical.verdict, 'pending');
  assert.strictEqual(prepared.segmentedCanonical.completedAdvances, 0);
  assert.strictEqual(prepared.segmentedCanonical.cohorts.length, 2);
  for (const cohort of prepared.segmentedCanonical.cohorts)
    assert.strictEqual(cohort.members.length, 3);
  const firstBuild = await build(env);
  assert.deepStrictEqual(copy(firstBuild.errors), []);
  assert.deepStrictEqual(copy(firstBuild.createdNodeIds), []);
  const first = await advance(env, copy(prepared), firstBuild);
  assert.deepStrictEqual(copy(first.errors), []);
  assert.strictEqual(first.ledger.length, 19);
  assert.strictEqual(first.segmentedCanonical.verdict, 'pending');
  assert.strictEqual(first.segmentedCanonical.completedAdvances, 1);
  const secondBuild = await build(env);
  assert.deepStrictEqual(copy(secondBuild.errors), []);
  assert.deepStrictEqual(copy(secondBuild.createdNodeIds), []);
  const second = await advance(env, copy(first), secondBuild);
  assert.deepStrictEqual(copy(second.errors), []);
  assert.strictEqual(second.ledger.length, 25);
  assert.strictEqual(second.segmentedCanonical.completedAdvances, 2);
  assert.strictEqual(second.segmentedCanonical.verdict, 'accepted');
  assert.strictEqual(second.segmentedCanonical.advances.length, 2);
  assert.strictEqual(second.segmentedCanonical.advances[0].cohorts.length, 2);
  assert.strictEqual(second.segmentedCanonical.advances[1].cohorts.length, 3);
  const members = second.segmentedCanonical.cohorts.flatMap(
    cohort => cohort.members
  );
  assert.strictEqual(
    new Set(members.map(member => member.instanceId)).size,
    12
  );
  assert.strictEqual(new Set(members.map(member => member.textId)).size, 12);
  assert.strictEqual(new Set(members.map(member => member.probeId)).size, 12);
  for (const member of members) {
    assert.strictEqual(
      identity(env.state.nodes.get(member.instanceId), 'mgKitId'),
      member.probeId
    );
    assert.strictEqual(member.snapshot.key, member.probeId);
    assert.strictEqual(
      identity(env.state.nodes.get(member.textId), 'mgKitId'),
      member.snapshot.text.key
    );
    assert(member.snapshot.text.key.startsWith(`family/${family}/variant/`));
    assert.strictEqual(
      identity(env.state.nodes.get(member.instanceId)),
      second.runId
    );
    assert.strictEqual(
      identity(env.state.nodes.get(member.textId)),
      second.runId
    );
    assert(Object.values(member.findings).every(Boolean));
    assert(member.snapshot.text.textStyleId);
  }
  assert.deepStrictEqual(
    [...env.state.nodes.values()]
      .filter(
        node => node.type === 'COMPONENT' || node.type === 'COMPONENT_SET'
      )
      .map(node => [node.id, node.name, node.boundVariables]),
    canonicalBefore
  );
  const capped = await advance(env, copy(second), await build(env));
  assert.strictEqual(capped.segmentedCanonical.verdict, 'failed');
  assert.strictEqual(capped.ledger.length, 25);
  assert(capped.errors.some(message => message.includes('already completed')));
  const removed = await cleanup(env, copy(second));
  assert.deepStrictEqual(copy(removed.errors), []);
  assert.strictEqual(removed.removedNodeIds.length, 25);
  console.log(
    'ok  inherited-root collision rejected before writes; unique probe identities and real zero-create13/19-live rebuilds; synthetic13/19/25 ledger, pending/two-repeat state machine, existing plus NEW fresh cohorts, exact fields/source style/aliases/ranges and restart cleanup; no native acceptance claim'
  );

  for (const mutate of [
    report => {
      report.ledger.push(copy(report.ledger[1]));
    },
    report => {
      report.segmentedCanonical.cohorts[0].members[0].expectedLabel =
        'Forged label';
    },
    report => {
      report.segmentedCanonical.cohorts[0].members[0].textId = 'foreign-text';
    },
  ]) {
    const { env } = await setup();
    const report = await prepare(env);
    const forged = copy(report);
    mutate(forged);
    const count = env.state.nodes.size;
    const nativeManifest = env.state.nodes
      .get(report.rootId)
      .getSharedPluginData('orgundrrmangrove', 'mgSegmentedCanonicalManifest');
    const failed = await advance(env, forged, await build(env));
    assert.strictEqual(
      env.state.nodes
        .get(report.rootId)
        .getSharedPluginData(
          'orgundrrmangrove',
          'mgSegmentedCanonicalManifest'
        ),
      nativeManifest
    );
    assert(failed.errors.length);
    assert.strictEqual(env.state.nodes.size, count);
    assert.strictEqual(failed.segmentedCanonical.verdict, 'failed');
  }
  for (const mutate of [
    (env, report) => {
      const member = report.segmentedCanonical.cohorts[0].members[0];
      env.state.nodes
        .get(member.instanceId)
        .setSharedPluginData('orgundrrmangrove', 'mgKitId', 'foreign-probe');
    },
    (env, report) => {
      const member = report.segmentedCanonical.cohorts[0].members[0];
      env.figma.currentPage.appendChild(env.state.nodes.get(member.instanceId));
    },
    (env, report) => {
      const member = report.segmentedCanonical.cohorts[0].members[0];
      env.state.nodes.get(member.instanceId).main = null;
    },
    (env, report) => {
      const user = env.figma.createRectangle();
      env.state.nodes.get(report.rootId).appendChild(user);
    },
  ]) {
    const { env } = await setup();
    const report = await prepare(env);
    const buildResult = await build(env);
    mutate(env, report);
    const count = env.state.nodes.size;
    const failed = await advance(env, report, buildResult);
    assert(failed.errors.length);
    assert.strictEqual(env.state.nodes.size, count);
    const refused = await cleanup(env, report);
    assert(refused.errors.length || env.state.nodes.has(report.rootId));
  }
  console.log(
    'ok  forged/duplicate manifests, moved/detached consumers and foreign descendants refuse advancement before new nodes'
  );

  const { env: cached } = await setup();
  const baseline = await prepare(cached);
  const result = await build(cached);
  const member = baseline.segmentedCanonical.cohorts[1].members[0],
    label = cached.state.nodes.get(member.textId);
  const hover = cached.state.variables.find(
    variable => variable.name === 'color/button'
  );
  label.setRangeFills(0, label.characters.length, [
    cached.figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: { r: 1, g: 1, b: 1 } },
      'color',
      hover
    ),
  ]);
  const count = cached.state.nodes.size;
  const failed = await advance(cached, baseline, result);
  assert(
    failed.errors.some(message => message.includes('effectiveRangePaint'))
  );
  assert.strictEqual(cached.state.nodes.size, count);
  assert.strictEqual(failed.segmentedCanonical.completedAdvances, 0);
  const { env: source } = await setup();
  const state = await prepare(source);
  const invalidBuild = await build(source);
  invalidBuild.createdNodeIds = ['unexpected-new'];
  const rejected = await advance(source, state, invalidBuild);
  assert(rejected.errors.some(message => message.includes('zero-create')));
  assert.strictEqual(rejected.ledger.length, 13);
  const wrongStyle = copy(doc);
  wrongStyle.styles.text.find(
    style => style.id === 'component.segmented-control.segment'
  ).values.undrr.lineHeight.value = 100;
  const { env: preflight } = await setup();
  const rejectedStyle = await prepare(preflight, wrongStyle);
  assert.strictEqual(rejectedStyle.rootId, null);
  assert(rejectedStyle.errors.length);
  const { env: unavailable } = await setup({ noFont: true });
  const noFont = await prepare(unavailable);
  assert.strictEqual(noFont.rootId, null);
  assert.strictEqual(noFont.ledger.length, 0);
  console.log(
    'ok  effective cached ranges, unsuccessful/new-node rebuild evidence, style drift and exact unavailable font fail closed'
  );

  for (const change of [
    value => {
      value.components.families.find(
        f => f.id === family
      ).variants[0].properties.Selected = 'True';
    },
    value => {
      value.components.families.find(
        f => f.id === family
      ).variants[0].tree.children[0].fill = 'color/button';
    },
  ]) {
    const { env } = await setup();
    const wrong = copy(doc);
    change(wrong);
    const count = env.state.nodes.size;
    const refused = await prepare(env, wrong);
    assert.strictEqual(refused.rootId, null);
    assert(refused.errors.some(message => message.includes('guarded packet')));
    assert.strictEqual(env.state.nodes.size, count);
  }
  for (const change of [
    master => {
      master.opacity = 0.5;
    },
    master => {
      master.children[0].visible = false;
    },
    master => {
      master.children[0].fills[0].opacity = 0.5;
    },
    master => {
      master.children[0].fontName = {
        family: 'Roboto',
        style: 'Bold',
        variationSettings: { wght: 400 },
      };
    },
  ]) {
    const { env, built } = await setup();
    change(env.state.nodes.get(built.families[0].variantIds[0].nodeId));
    const count = env.state.nodes.size;
    const refused = await prepare(env);
    assert.strictEqual(refused.rootId, null);
    assert(refused.errors.length);
    assert.strictEqual(env.state.nodes.size, count);
  }
  console.log(
    'ok  exact source DTO axes/paints, full native font object, visible source labels and node/paint opacity block false initial acceptance'
  );

  const { env: rootFailure } = await setup();
  const createFrame = rootFailure.figma.createFrame;
  rootFailure.figma.createFrame = () => {
    const node = createFrame();
    node.resize = () => {
      throw new Error('Synthetic root resize failure');
    };
    return node;
  };
  const partialRoot = await prepare(rootFailure);
  assert.strictEqual(partialRoot.ledger.length, 1);
  assert.strictEqual(partialRoot.segmentedCanonical, undefined);
  assert(partialRoot.errors.some(message => message.includes('root resize')));
  const rootRemoved = await cleanup(rootFailure, copy(partialRoot));
  assert.deepStrictEqual(copy(rootRemoved.errors), []);
  assert.strictEqual(rootRemoved.removedNodeIds.length, 1);
  const { env: omitted } = await setup();
  const complete = await prepare(omitted);
  const forged = copy(complete);
  delete forged.segmentedCanonical;
  const missingManifest = await cleanup(omitted, forged);
  assert(missingManifest.errors.length);
  assert(omitted.state.nodes.has(complete.rootId));
  console.log(
    'ok  exact pre-manifest singleton root failure cleans safely; omitting an existing canonical manifest cannot authorise cleanup'
  );

  const { env: partial } = await setup();
  const partialBase = await prepare(partial);
  const partialBuild = await build(partial);
  let calls = 0;
  for (const master of partialBase.segmentedCanonical.canonicalBaseline) {
    const node = partial.state.nodes.get(master.masterId),
      original = node.createInstance;
    node.createInstance = function () {
      if (++calls === 2)
        throw new Error('Synthetic second fresh clone failure');
      return original.call(this);
    };
  }
  const partialReport = await advance(partial, partialBase, partialBuild);
  assert(
    partialReport.errors.some(message => message.includes('second fresh'))
  );
  assert.strictEqual(partialReport.ledger.length, 15);
  assert.strictEqual(partialReport.segmentedCanonical.verdict, 'failed');
  assert.strictEqual(partialReport.segmentedCanonical.completedAdvances, 0);
  const partialRemoved = await cleanup(partial, copy(partialReport));
  assert.deepStrictEqual(copy(partialRemoved.errors), []);
  assert.strictEqual(partialRemoved.removedNodeIds.length, 15);
  console.log(
    'ok  partial fresh-cohort API failure retains exact created identities and cleanup evidence'
  );
}
main().catch(error => {
  console.error(`FAIL ${error.stack || error}`);
  process.exitCode = 1;
});
