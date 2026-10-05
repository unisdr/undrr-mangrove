#!/usr/bin/env node
'use strict';
// Explicit synthetic layout/property inheritance, never native rendering proof.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const DIR = path.resolve(__dirname, '..');
const {
  setup: setupLeaves,
} = require('./mock-segmented-leaves-capabilities.cjs');
const doc = require(
  path.join(ROOT, 'scripts/build-figma-tokens.cjs')
).buildFigmaVariables();
const copy = value => JSON.parse(JSON.stringify(value));
const family = 'segmented-control.full-width-below-medium';
const sources = [
  'kit-segmented-capabilities.js',
  'kit-segmented-canonical-capabilities.js',
  'kit-segmented-focus-capabilities.js',
  'kit-segmented-leaves-capabilities.js',
  'kit-segmented-wrapper-capabilities.js',
  'kit-capabilities.js',
]
  .map(file => fs.readFileSync(path.join(DIR, file), 'utf8'))
  .join('\n');
const identity = (node, key = 'mgKitId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
function syntheticLayout(node) {
  const main = node.type === 'INSTANCE' ? node.main : node;
  if (
    !identity(main).startsWith(`family/${family}/variant/`) ||
    node.children.length !== 2 ||
    node.children[1].children.length !== 3
  )
    return;
  const [legend, rail] = node.children;
  legend.x = legend.y = 0;
  legend.width = node.width;
  legend.height = Math.max(
    24,
    Math.ceil((legend.characters.length * 8) / node.width) * 24
  );
  rail.x = 0;
  rail.y = legend.visible ? legend.height + 2.5 : 0;
  rail.width = node.width;
  const side = (node.width + 2) / 3,
    padding = 11,
    inner = side - 32;
  const heights = rail.children.map(child => {
    const text = child.children[0];
    text.x = 16;
    text.width = inner;
    text.height = Math.ceil(
      Math.max(1, Math.ceil((text.characters.length * 6.72) / inner)) * 16.8
    );
    return Math.max(44, text.height + 2 * padding);
  });
  rail.height = Math.max(...heights);
  rail.children.forEach((child, i) => {
    child.x = i * (side - 1);
    child.y = 0;
    child.width = side;
    child.height = rail.height;
    child.children[0].y = (rail.height - child.children[0].height) / 2;
  });
  node.height = rail.y + rail.height;
}
async function setup(options = {}) {
  const env = await setupLeaves();
  // Reproduce the saved native Roboto variable Regular descriptor. The
  // importer may assign a plain family/style object again during rebuild;
  // this synthetic native getter keeps the standard actual axis readback.
  const regularAxes = options.regularAxes || { wdth: 100, wght: 400 };
  const variableRegular = style => {
    let assignedFont = copy(style.fontName);
    Object.defineProperty(style, 'fontName', {
      configurable: true,
      get() {
        return identity(style, 'mgStyleId') === 'component.body' &&
          assignedFont.family === 'Roboto' &&
          assignedFont.style === 'Regular'
          ? { ...copy(assignedFont), variationSettings: copy(regularAxes) }
          : copy(assignedFont);
      },
      set(value) {
        assignedFont = copy(value);
      },
    });
    return style;
  };
  for (const style of env.state.styles.filter(value => value.type === 'TEXT'))
    variableRegular(style);
  const createTextStyle = env.figma.createTextStyle;
  env.figma.createTextStyle = () => variableRegular(createTextStyle());
  const scratch = env.figma.createText(),
    proto = Object.getPrototypeOf(scratch);
  scratch.remove();
  const create = proto.createInstance;
  proto.createInstance = function () {
    const node = create.call(this);
    const visit = (source, target) => {
      if (source.layoutWrap !== undefined)
        target.layoutWrap = source.layoutWrap;
      source.children.forEach((child, i) => visit(child, target.children[i]));
    };
    visit(this, node);
    syntheticLayout(node);
    return node;
  };
  const set = proto.setProperties;
  proto.setProperties = function (values) {
    set.call(this, values);
    for (const child of this.children) {
      const key = child.componentPropertyReferences?.visible;
      if (key && key in values) {
        child.visible = values[key];
        if (values[key] === false) this._wrapperWasHidden = true;
      }
    }
    for (let parent = this; parent; parent = parent.parent)
      syntheticLayout(parent);
  };
  const resize = proto.resize;
  proto.resize = function (width, height) {
    resize.call(this, width, height);
    syntheticLayout(this);
  };
  const get = env.figma.getNodeByIdAsync;
  env.figma.getNodeByIdAsync = async id => {
    const node = await get(id);
    if (
      options.hiddenWidthFailure &&
      node?.type === 'TEXT' &&
      node.parent?.type === 'INSTANCE' &&
      node.parent._wrapperWasHidden &&
      identity(node).includes('mg-segmented-control__legend') &&
      node.visible
    )
      node.width = 0;
    return node;
  };
  env.syntheticRelayout = () => {
    for (const node of env.state.nodes.values()) syntheticLayout(node);
  };
  await build(env);
  return env;
}
async function build(env) {
  const result = await env.call('buildMangroveComponents', doc, 'undrr', [
    family,
  ]);
  env.syntheticRelayout?.();
  assert.deepStrictEqual(copy(result.errors), []);
  return result;
}
const prepare = (env, document = doc, scope = 'segmented-wrapper') =>
  env.runCode(
    `${sources}\nreturn runMangroveCapabilityProbes(${JSON.stringify(document)},'undrr',${JSON.stringify(scope)});`
  );
const advance = (env, report, built) =>
  env.runCode(
    `${sources}\nreturn advanceMangroveSegmentedWrapperProbes(${JSON.stringify(doc)},'undrr',${JSON.stringify(report)},${JSON.stringify(built)});`
  );
const cleanup = (env, report) =>
  env.runCode(
    `${sources}\nreturn removeMangroveCapabilityProbes(${JSON.stringify(report)});`
  );
async function main() {
  assert.strictEqual(
    doc.components.families.find(value => value.id === family).variants.length,
    4
  );
  const env = await setup();
  let report = await prepare(env);
  assert.deepStrictEqual(
    copy(report.errors),
    [],
    JSON.stringify(report.errors)
  );
  assert.strictEqual(report.ledger.length, 73);
  assert(report.segmentedWrapper.initialVerified);
  const nativeRegular = {
    family: 'Roboto',
    style: 'Regular',
    variationSettings: { wdth: 100, wght: 400 },
  };
  assert(
    report.fonts.loaded.some(
      value => JSON.stringify(value) === JSON.stringify(nativeRegular)
    )
  );
  assert(
    report.segmentedWrapper.canonicalBaseline.every(
      value =>
        JSON.stringify(value.snapshot.legend.fontName) ===
        JSON.stringify(nativeRegular)
    )
  );
  const originalIds = report.segmentedWrapper.cohorts.flatMap(cohort =>
    cohort.members.flatMap(member => member.topologyIds)
  );
  for (let pass = 1; pass <= 2; pass++) {
    const built = await build(env);
    assert.strictEqual(built.createdNodeIds.length, 0);
    report = await advance(env, report, built);
    assert.deepStrictEqual(
      copy(report.errors),
      [],
      JSON.stringify(report.errors)
    );
    assert.strictEqual(report.segmentedWrapper.completedAdvances, pass);
    assert.strictEqual(report.ledger.length, pass === 1 ? 109 : 145);
  }
  assert.strictEqual(
    report.segmentedWrapper.verdict,
    'rebuild-fields-verified'
  );
  for (const id of originalIds) assert(env.state.nodes.has(id));
  const removed = await cleanup(env, report);
  assert.deepStrictEqual(copy(removed.errors), []);
  assert.strictEqual(removed.removedNodeIds.length, 145);
  console.log(
    'ok synthetic73/109/145 topology, source shared styles/full ranges/aliases, edited width/Legend cycles, two ACTUAL builder zero-create repeats/fresh cohorts and exact cleanup'
  );

  for (const mutate of [
    d =>
      (d.components.families.find(
        value => value.id === family
      ).variants[0].tree.children[1].children[0].variant.State = 'Hover'),
    d =>
      (d.styles.text.find(
        value => value.id === 'component.body'
      ).values.undrr.lineHeight.value = 25),
    d =>
      (d.variables.find(
        value => value.name === 'component/segmented-control/seam'
      ).values.undrr = -2),
  ]) {
    const e = await setup(),
      malformed = copy(doc);
    mutate(malformed);
    const before = e.state.nodes.size,
      failed = await prepare(e, malformed);
    assert(failed.errors.length);
    assert.strictEqual(failed.rootId, null);
    assert.strictEqual(e.state.nodes.size, before);
  }
  const unknownEnv = await setup();
  const unknownBefore = unknownEnv.state.nodes.size;
  const unknown = await prepare(unknownEnv, doc, 'segmented-wrapper-unknown');
  assert(unknown.errors.length);
  assert.strictEqual(unknown.rootId, null);
  assert.strictEqual(unknownEnv.state.nodes.size, unknownBefore);
  console.log(
    'ok source/template/seam and unknown controller scope reject before canvas writes'
  );

  const failedEnv = await setup({ hiddenWidthFailure: true }),
    failed = await prepare(failedEnv);
  assert(failed.errors.length);
  assert(failed.rootId);
  assert.strictEqual(failed.ledger.length, 10);
  const partial = await cleanup(failedEnv, failed);
  assert.deepStrictEqual(copy(partial.errors), []);
  assert.strictEqual(partial.removedNodeIds.length, 10);
  console.log(
    'ok synthetic visible-Legend WIDTH0 failure preserves partial exact10-node cleanup'
  );

  const foreignEnv = await setup(),
    good = await prepare(foreignEnv),
    foreign = foreignEnv.figma.createFrame(),
    root = foreignEnv.state.nodes.get(good.rootId);
  root.appendChild(foreign);
  const refused = await cleanup(foreignEnv, good);
  assert(refused.errors.length);
  assert(foreignEnv.state.nodes.has(foreign.id));
  const ledgerBefore = copy(good.ledger);
  const audit = await foreignEnv.runCode(
    `${sources}\nreturn refreshMangroveCapabilityProbeLedger(${JSON.stringify(good)});`
  );
  assert(audit.errors.length);
  assert.strictEqual(audit.addedNodeIds.length, 0);
  assert.deepStrictEqual(copy(good.ledger), ledgerBefore);
  foreign.remove();
  assert.deepStrictEqual(copy((await cleanup(foreignEnv, good)).errors), []);
  const movedEnv = await setup(),
    moved = await prepare(movedEnv),
    child = movedEnv.state.nodes.get(
      moved.segmentedWrapper.cohorts[0].members[0].textIds[0]
    ),
    parent = child.parent;
  parent.parent.appendChild(child);
  assert((await cleanup(movedEnv, moved)).errors.length);
  parent.appendChild(child);
  assert.deepStrictEqual(copy((await cleanup(movedEnv, moved)).errors), []);
  console.log(
    'ok foreign/moved cleanup and real controller ledger audit refuse without adoption'
  );

  const tamperEnv = await setup(),
    saved = await prepare(tamperEnv),
    tampered = copy(saved);
  tampered.segmentedWrapper.canonicalBaseline[0].snapshot.legend.fontSize = 17;
  const ownedRoot = tamperEnv.state.nodes.get(saved.rootId),
    stored = identity(ownedRoot, 'mgSegmentedWrapperManifest');
  const failAdvance = await advance(
    tamperEnv,
    tampered,
    await build(tamperEnv)
  );
  assert(failAdvance.errors.length);
  assert.strictEqual(identity(ownedRoot, 'mgSegmentedWrapperManifest'), stored);
  assert.deepStrictEqual(copy((await cleanup(tamperEnv, saved)).errors), []);
  console.log(
    'ok tampered saved baseline cannot replace authoritative manifest or gain ownership'
  );
  const wrongRegular = await setup({ regularAxes: { wdth: 100, wght: 700 } });
  const beforeWrongRegular = wrongRegular.state.nodes.size;
  const wrongDescriptor = await prepare(wrongRegular);
  assert.strictEqual(wrongDescriptor.rootId, null);
  assert(
    wrongDescriptor.errors.some(value =>
      value.includes('native shared Legend typography/aliases changed')
    )
  );
  assert.strictEqual(wrongRegular.state.nodes.size, beforeWrongRegular);
  console.log(
    'ok native-like Regular400/100 full descriptor retained across repeats; wrong700 weight refuses before canvas writes'
  );
  console.log(
    'LIMIT synthetic text measurement/property mirroring/inheritance only, not native geometry, visibility reappearance, font cache, range propagation or pixels.'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { setup, prepare, advance, cleanup, build };
