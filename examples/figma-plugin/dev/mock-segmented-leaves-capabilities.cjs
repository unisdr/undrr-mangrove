#!/usr/bin/env node
'use strict';
// Synthetic source/dispatch/ownership checks; native rendering is a separate gate.
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
const states = ['Default', 'Hover', 'Focus', 'HoverFocus', 'Disabled'];
const sources = [
  'kit-segmented-capabilities.js',
  'kit-segmented-canonical-capabilities.js',
  'kit-segmented-focus-capabilities.js',
  'kit-segmented-leaves-capabilities.js',
  'kit-capabilities.js',
]
  .map(file => fs.readFileSync(path.join(DIR, file), 'utf8'))
  .join('\n');
const prepare = (env, state, document = doc) =>
  env.runCode(
    `${sources}\nreturn runMangroveCapabilityProbes(${JSON.stringify(document)},'undrr','segmented-leaves-${state.toLowerCase()}');`
  );
const advance = (env, report, built) =>
  env.runCode(
    `${sources}\nreturn advanceMangroveSegmentedLeavesProbes(${JSON.stringify(doc)},'undrr',${JSON.stringify(report)},${JSON.stringify(built)});`
  );
const cleanup = (env, report) =>
  env.runCode(
    `${sources}\nreturn removeMangroveCapabilityProbes(${JSON.stringify(report)});`
  );
const identity = (node, key = 'mgCapabilityProbeId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
const build = env =>
  env.call('buildMangroveComponents', doc, 'undrr', [family]);
async function setup() {
  const env = environment(doc);
  await importFoundation(env, doc);
  await env.call(
    'importVariables',
    doc,
    ['undrr'],
    false,
    ['component.button'],
    false
  );
  const scratch = env.figma.createText(),
    proto = Object.getPrototypeOf(scratch);
  scratch.remove();
  const setStyle = proto.setTextStyleIdAsync;
  proto.setTextStyleIdAsync = async function (id) {
    await setStyle.call(this, id);
    if (id)
      Object.assign(
        this.boundVariables,
        copy(env.state.styles.find(style => style.id === id).boundVariables)
      );
  };
  Object.defineProperty(proto, 'variantProperties', {
    configurable: true,
    get() {
      const source = this.type === 'INSTANCE' ? this.main : this;
      return source && ['COMPONENT', 'INSTANCE'].includes(this.type)
        ? Object.fromEntries(
            source.name.split(',').map(part => part.trim().split('='))
          )
        : null;
    },
  });
  const resize = proto.resize;
  proto.resize = function (width, height) {
    resize.call(this, width, height);
    // Synthetic native inheritance model only. SCALE precision was separately
    // observed in the actual103-node diagnostic; this fixture proves dispatch.
    if (this.type === 'INSTANCE')
      for (const child of this.children)
        if (
          child.type === 'RECTANGLE' &&
          child.layoutPositioning === 'ABSOLUTE' &&
          child.constraints.horizontal === 'SCALE' &&
          child.constraints.vertical === 'SCALE'
        )
          resize.call(child, this.width, this.height);
  };
  const instantiate = proto.createInstance;
  proto.createInstance = function () {
    const node = instantiate.call(this);
    assert.strictEqual(identity(node, 'mgKitId'), identity(this, 'mgKitId'));
    const visit = (source, target) => {
      for (const field of [
        'topLeftRadius',
        'topRightRadius',
        'bottomLeftRadius',
        'bottomRightRadius',
        '_strokesIncludedInLayout',
        'itemReverseZIndex',
        'primaryAxisAlignItems',
        'counterAxisAlignItems',
        'strokeJoin',
      ])
        if (source[field] !== undefined) target[field] = copy(source[field]);
      target.boundVariables = copy(source.boundVariables);
      source.children.forEach((child, index) =>
        visit(child, target.children[index])
      );
    };
    visit(this, node);
    return node;
  };
  const setProperties = proto.setProperties;
  proto.setProperties = function (values) {
    setProperties.call(this, values);
    for (const child of this.children) {
      const key = child.componentPropertyReferences?.characters;
      if (key && key in values) child.characters = values[key];
    }
  };
  const result = await build(env);
  assert.deepStrictEqual(copy(result.errors), []);
  return env;
}
async function main() {
  assert.strictEqual(
    doc.components.families.find(item => item.id === family).variants.length,
    30
  );
  for (const state of states) {
    const env = await setup(),
      prepared = await prepare(env, state);
    assert.deepStrictEqual(
      copy(prepared.errors),
      [],
      JSON.stringify(prepared.errors)
    );
    const focused = ['Focus', 'HoverFocus'].includes(state),
      initialCount = focused ? 49 : 25,
      finalCount = focused ? 97 : 49;
    assert.strictEqual(prepared.ledger.length, initialCount);
    assert.strictEqual(prepared.segmentedLeaves.canonicalBaseline.length, 30);
    assert.strictEqual(prepared.segmentedLeaves.cohorts.length, 2);
    assert(
      prepared.segmentedLeaves.cohorts.every(
        cohort => cohort.members.length === 6
      )
    );
    let report = prepared;
    for (let pass = 1; pass <= 2; pass++) {
      const built = await build(env);
      assert.deepStrictEqual(copy(built.errors), []);
      assert.deepStrictEqual(copy(built.createdNodeIds), []);
      assert.strictEqual(built.families[0].variantIds.length, 30);
      report = await advance(env, report, built);
      assert.deepStrictEqual(
        copy(report.errors),
        [],
        JSON.stringify(report.errors)
      );
      assert.strictEqual(report.segmentedLeaves.completedAdvances, pass);
    }
    assert.strictEqual(
      report.segmentedLeaves.verdict,
      'rebuild-fields-verified'
    );
    assert.strictEqual(report.ledger.length, finalCount);
    assert.strictEqual(report.segmentedLeaves.cohorts.length, 4);
    assert(
      report.segmentedLeaves.advances.every(
        pass => pass.canonical.length === 30
      )
    );
    const root = env.state.nodes.get(report.rootId);
    assert(
      Buffer.byteLength(identity(root, 'mgSegmentedLeavesManifest')) < 60000
    );
    const removed = await cleanup(env, report);
    assert.deepStrictEqual(copy(removed.errors), []);
    assert.strictEqual(removed.removedNodeIds.length, finalCount);
    assert(
      report.ledger.every(
        entry =>
          !env.state.nodes.has(entry.id) ||
          env.state.nodes.get(entry.id).removed
      )
    );
  }
  console.log(
    'ok  five explicit six-variant batches, all30 canonical baselines, two actual mocked builds/new fresh cohorts,49/97 exact ledgers; native cache/pixels unverified'
  );
  const env = await setup();
  for (const mutate of [
    value =>
      value.components.families.find(item => item.id === family).variants.pop(),
    value =>
      (value.components.families
        .find(item => item.id === family)
        .variants.find(item => item.properties.State === 'Disabled').tree.fill =
        'color/button-background'),
    value =>
      (value.components.families
        .find(item => item.id === family)
        .variants.find(
          item => item.properties.State === 'Focus'
        ).tree.focusRing.renderer = 'STRETCH'),
  ]) {
    const changed = copy(doc);
    mutate(changed);
    const size = env.state.nodes.size;
    const report = await prepare(env, 'Focus', changed);
    assert(report.errors.length);
    assert.strictEqual(report.rootId, null);
    assert.strictEqual(env.state.nodes.size, size);
  }
  console.log(
    'ok  incomplete matrix, wrong Disabled paint and unsupported focus renderer fail before probe creation'
  );
  const prepared = await prepare(env, 'Default'),
    foreign = env.figma.createFrame();
  env.state.nodes.get(prepared.rootId).appendChild(foreign);
  const refused = await cleanup(env, prepared);
  assert(refused.errors.length);
  assert.strictEqual(refused.removedNodeIds.length, 0);
  assert(!foreign.removed);
  foreign.remove();
  assert.deepStrictEqual(copy((await cleanup(env, prepared)).errors), []);
  console.log(
    'ok  foreign topology conservatively refuses cleanup without deletion'
  );
  const failedEnv = await setup(),
    failed = await prepare(failedEnv, 'Hover');
  const built = await build(failedEnv);
  built.createdNodeIds.push('not-an-ordinary-repeat');
  const advanced = await advance(failedEnv, failed, built);
  assert(advanced.errors.length);
  assert.strictEqual(advanced.segmentedLeaves.cohorts.length, 2);
  assert.deepStrictEqual(copy((await cleanup(failedEnv, advanced)).errors), []);
  console.log(
    'ok  nonzero-create build rejected before new cohort and retained exact cleanup'
  );
  const editedEnv = await setup(),
    edited = await prepare(editedEnv, 'Disabled');
  const member = edited.segmentedLeaves.cohorts[0].members[0];
  editedEnv.state.nodes.get(member.instanceId).setProperties({
    [edited.segmentedLeaves.labelKey]: 'Changed after recorded baseline',
  });
  const changedBuild = await build(editedEnv);
  const changed = await advance(editedEnv, edited, changedBuild);
  assert(changed.errors.length);
  assert.strictEqual(changed.segmentedLeaves.completedAdvances, 0);
  assert.deepStrictEqual(copy((await cleanup(editedEnv, changed)).errors), []);
  console.log(
    'ok  changed edited baseline rejects acceptance while ownership recovery remains exact'
  );
  for (const kind of ['member', 'canonical']) {
    const integrityEnv = await setup(),
      original = await prepare(integrityEnv, 'Default'),
      tampered = copy(original);
    const baseline =
      kind === 'member'
        ? tampered.segmentedLeaves.cohorts[0].members[0].snapshot
        : tampered.segmentedLeaves.canonicalBaseline[0].snapshot;
    baseline.bounds.x += 1;
    const ordinary = await build(integrityEnv);
    const rejected = await advance(integrityEnv, tampered, ordinary);
    assert(rejected.errors.some(error => error.includes('creation manifest')));
    assert.strictEqual(rejected.segmentedLeaves.completedAdvances, 0);
    assert.deepStrictEqual(
      copy((await cleanup(integrityEnv, original)).errors),
      []
    );
  }
  console.log(
    'ok  altered member/canonical saved baselines fail persisted integrity before advance; original ledger remains recoverable'
  );
  const aliasesEnv = await setup();
  const master = [...aliasesEnv.state.nodes.values()].find(
    node =>
      node.type === 'COMPONENT' &&
      identity(node, 'mgKitId') ===
        `family/${family}/variant/${family}.false.focus.first`
  );
  const beforeAliases = copy(master.boundVariables);
  master.boundVariables.strokeTopWeight = {
    type: 'VARIABLE_ALIAS',
    id: 'wrong-side',
  };
  const badAliases = await prepare(aliasesEnv, 'Focus');
  assert.strictEqual(badAliases.rootId, null);
  assert(badAliases.errors.length);
  master.boundVariables = beforeAliases;
  const beforeOrder = [...master.children];
  master.appendChild(master.children[0]);
  const badOrder = await prepare(aliasesEnv, 'Focus');
  assert.strictEqual(badOrder.rootId, null);
  assert(badOrder.errors.length);
  for (const child of beforeOrder) master.appendChild(child);
  const nativeLabel = master.children.find(node => node.type === 'TEXT');
  nativeLabel.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
  const badStroke = await prepare(aliasesEnv, 'Focus');
  assert.strictEqual(badStroke.rootId, null);
  assert(badStroke.errors.length);
  nativeLabel.strokes = [];
  const oldGap = copy(master.boundVariables.itemSpacing);
  master.boundVariables.itemSpacing = {
    type: 'VARIABLE_ALIAS',
    id: 'wrong-gap',
  };
  const badGap = await prepare(aliasesEnv, 'Focus');
  assert.strictEqual(badGap.rootId, null);
  assert(badGap.errors.length);
  master.boundVariables.itemSpacing = oldGap;
  const valid = await prepare(aliasesEnv, 'Focus');
  assert.deepStrictEqual(copy(valid.errors), []);
  assert.deepStrictEqual(copy((await cleanup(aliasesEnv, valid)).errors), []);
  console.log(
    'ok  valid uniform plus wrong side alias and altered complete focus paint order fail before creation'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
