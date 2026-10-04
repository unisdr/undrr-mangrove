#!/usr/bin/env node
/** Synthetic constraint/reflow fixture. Never native rendering/typographic acceptance. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const { document } = require('./mock-editorial-cta.cjs');
const DIR = path.resolve(__dirname, '..');
const copy = x => JSON.parse(JSON.stringify(x));
const own = node => node.getSharedPluginData('orgundrrmangrove', 'mgKitId');
async function setup({
  refuseResize = false,
  wrongDecoration = false,
  rejectFont = false,
} = {}) {
  const doc = document();
  const env = environment(doc);
  await importFoundation(env, doc);
  const built = await env.call('buildMangroveComponents', doc, 'undrr', [
    'editorial-cta',
  ]);
  assert.strictEqual(built.errors.length, 0, built.errors.join('\n'));
  const api = await env.runCode(
    fs.readFileSync(path.join(DIR, 'kit-acceptance.js'), 'utf8') +
      '\n' +
      fs.readFileSync(path.join(DIR, 'kit-editorial-acceptance.js'), 'utf8') +
      '\nreturn {prepare:prepareMangroveEditorialProbes,compare:compareMangroveEditorialProbes,remove:removeMangroveEditorialProbes};'
  );
  const stats = { writes: 0, loads: 0 };
  const load = env.figma.loadFontAsync;
  env.figma.loadFontAsync = async font => {
    stats.loads++;
    if (rejectFont) throw new Error('Exact Roboto font rejected');
    return load(font);
  };
  const proto = Object.getPrototypeOf(env.figma.currentPage);
  Object.defineProperty(proto, 'variantProperties', {
    get() {
      return this.type === 'COMPONENT'
        ? Object.fromEntries(
            this.name.split(/,\s*/).map(axis => axis.split('='))
          )
        : null;
    },
  });
  const resize = proto.resize,
    setProps = proto.setProperties,
    createInstance = proto.createInstance;
  const syntheticLayout = node => {
    if (node.type !== 'INSTANCE' || !own(node).includes('editorial')) return;
    const label = node.children.find(c => c.name === 'mg-button-cta / label');
    const badge = node.children.find(c => c.name === 'mg-button-cta / badge');
    if (!label || !badge) return;
    const key = Object.keys(node.componentProperties).find(
      k => k.replace(/#[^#]+$/, '') === 'Label'
    );
    label.characters = node.componentProperties[key].value;
    const long = node.main.variantProperties.Content === 'Long';
    if (!long) node.width = label.characters.length * 7 + 29;
    label.width = node.width - 29;
    label.height =
      Math.ceil((label.characters.length * 7) / Math.max(1, label.width)) * 14;
    node.height = Math.max(44, label.height + 12);
    badge.width = badge.height = 22;
    badge.x =
      node.width - (node.main.variantProperties.State === 'Hover' ? 20 : 23);
    badge.y = (node.height - 22) / 2;
    if (wrongDecoration) label.textDecoration = 'UNDERLINE';
  };
  proto.setProperties = function (values) {
    stats.writes++;
    setProps.call(this, values);
    syntheticLayout(this);
  };
  proto.resize = function (width, height) {
    stats.writes++;
    if (
      refuseResize &&
      this.type === 'INSTANCE' &&
      own(this).startsWith('acceptance-editorial/')
    )
      return;
    resize.call(this, width, height);
    syntheticLayout(this);
  };
  proto.createInstance = function () {
    stats.writes++;
    const node = createInstance.call(this);
    syntheticLayout(node);
    return node;
  };
  return { doc, env, api, stats, built };
}
async function prepared(options = {}) {
  const context = await setup(options);
  const report = await context.api.prepare(context.doc, 'undrr');
  return { ...context, report };
}
function canonical(env) {
  return JSON.stringify(
    [...env.state.nodes.values()]
      .filter(n => {
        for (let p = n; p; p = p.parent)
          if (own(p).startsWith('acceptance-editorial/')) return false;
        return own(n);
      })
      .map(n => [
        n.id,
        n.name,
        own(n),
        n.width,
        n.height,
        n.sharedData,
        n.componentPropertyReferences,
      ])
  );
}
async function main() {
  const envSetup = await setup();
  const before = canonical(envSetup.env);
  const report = await envSetup.api.prepare(envSetup.doc, 'undrr');
  assert.strictEqual(report.errors.length, 0, report.errors.join('\n'));
  assert.strictEqual(report.ledger.complete, true);
  assert.strictEqual(report.ledger.probes.length, 3);
  assert(report.createdNodeIds.length <= 16);
  assert.strictEqual(
    canonical(envSetup.env),
    before,
    'No canonical master/review writes'
  );
  for (const probe of report.ledger.probes) {
    assert.strictEqual(probe.steps.length, probe.content === 'Long' ? 5 : 1);
    assert(probe.steps.every(step => step.assertions.every(a => a.passed)));
    assert.strictEqual(probe.baseline.label.fontName.family, 'Roboto');
    assert.strictEqual(probe.baseline.label.fontName.style, 'Bold');
    assert(probe.baseline.label.lineMetrics.limitation.includes('estimate'));
  }
  assert.strictEqual(report.ledger.probes[0].finalEdit.width, 260);
  assert(report.ledger.probes[0].finalEdit.text.includes('réduction'));
  assert.strictEqual(report.ledger.probes[1].finalEdit.width, 240);
  assert(!report.ledger.probes[1].finalEdit.text.includes(' '));
  console.log(
    'ok  three exact native-source probes exercise edit/width sequences, report fonts/bounds and leave canonical assets unchanged in a synthetic reflow fixture'
  );
  const persisted = JSON.parse(
    envSetup.env.state.nodes
      .get(report.rootId)
      .getSharedPluginData('orgundrrmangrove', 'mgEditorialAcceptanceLedger')
  );
  assert.deepStrictEqual(persisted, copy(report.ledger));
  const repeat = await envSetup.env.call(
    'buildMangroveComponents',
    envSetup.doc,
    'undrr',
    ['editorial-cta']
  );
  assert.strictEqual(repeat.errors.length, 0, repeat.errors.join('\n'));
  const stateBefore = JSON.stringify(
    [...envSetup.env.state.nodes.values()].map(n => [
      n.id,
      n.sharedData,
      n.width,
      n.height,
    ])
  );
  const statsBefore = { ...envSetup.stats };
  const comparison = await envSetup.api.compare(report, repeat);
  assert.strictEqual(comparison.errors.length, 0, comparison.errors.join('\n'));
  assert.strictEqual(comparison.passed, true);
  assert.deepStrictEqual(
    envSetup.stats,
    statsBefore,
    'Comparison loads no fonts and performs no geometry/property writes'
  );
  assert.strictEqual(
    JSON.stringify(
      [...envSetup.env.state.nodes.values()].map(n => [
        n.id,
        n.sharedData,
        n.width,
        n.height,
      ])
    ),
    stateBefore
  );
  const restarted = await envSetup.api.compare(report.rootId, repeat);
  assert.strictEqual(
    restarted.passed,
    true,
    'Shared root ledger recovers comparison without UI memory'
  );
  console.log(
    'ok  successful ordinary rebuild compares exact master/consumer IDs, text, formatting/geometry and shared restart recovery read-only'
  );
  const probe = report.ledger.probes[0];
  const badge = envSetup.env.state.nodes.get(probe.baseline.badge.id);
  badge.x++;
  const drift = await envSetup.api.compare(report, repeat);
  assert.strictEqual(drift.passed, false);
  assert(drift.assertions.some(a => a.name.includes('badge') && !a.passed));
  badge.x--;
  const badBuild = await envSetup.api.compare(report, {
    ...copy(repeat),
    errors: ['Rebuild failed'],
  });
  assert.strictEqual(badBuild.passed, false);
  assert(badBuild.errors.length);
  console.log(
    'ok  geometric drift and failed/missing successful rebuild evidence are reported rather than repaired'
  );
  const counts = envSetup.env.state.nodes.size;
  const outsider = envSetup.env.figma.createFrame();
  envSetup.env.state.nodes.get(report.rootId).appendChild(outsider);
  const rejected = await envSetup.api.remove(report);
  assert(rejected.errors.some(e => e.includes('Cleanup refused')));
  assert.strictEqual(
    envSetup.env.state.nodes.size,
    counts + 1,
    'Foreign child refuses all cleanup'
  );
  envSetup.env.figma.currentPage.appendChild(outsider);
  const moved = envSetup.env.state.nodes.get(report.ledger.probes[1].nodeId);
  envSetup.env.figma.currentPage.appendChild(moved);
  const movedResult = await envSetup.api.remove(report.rootId);
  assert(movedResult.errors.some(e => e.includes('outside its root')));
  assert.strictEqual(envSetup.env.state.nodes.size, counts + 1);
  envSetup.env.state.nodes.get(report.rootId).appendChild(moved);
  const forged = await envSetup.api.remove({
    ...copy(report),
    ledger: { ...copy(report.ledger), runId: 'foreign' },
  });
  assert(forged.errors.length);
  const cleaned = await envSetup.api.remove(report.rootId);
  assert.strictEqual(cleaned.errors.length, 0, cleaned.errors.join('\n'));
  assert.strictEqual(
    cleaned.removedNodeIds.length,
    report.createdNodeIds.length
  );
  assert.strictEqual(canonical(envSetup.env), before);
  assert.strictEqual(envSetup.env.state.nodes.has(outsider.id), true);
  console.log(
    'ok  exact-owned cleanup refuses foreign additions/moved probes/forged run and removes only recorded probes after repair'
  );

  const refusal = await prepared({ refuseResize: true });
  assert(refusal.report.errors.length);
  assert(
    refusal.report.ledger.probes.some(p =>
      p.steps.some(s =>
        s.assertions.some(
          a => a.name === 'requested consumer width' && !a.passed
        )
      )
    )
  );
  assert.strictEqual(refusal.report.ledger.complete, false);
  assert(
    refusal.report.createdNodeIds.length > 0,
    'Partial evidence/IDs retained'
  );
  const decoration = await prepared({ wrongDecoration: true });
  assert(decoration.report.errors.length);
  assert(
    decoration.report.ledger.probes[0].steps.some(s =>
      s.assertions.some(a => a.name === 'Label decoration' && !a.passed)
    )
  );
  const font = await prepared({ rejectFont: true });
  assert(font.report.errors.length);
  assert.strictEqual(
    font.report.createdNodeIds.length,
    0,
    'Font preflight is mutation-free'
  );
  assert.strictEqual(font.report.rootId, null);
  console.log(
    'ok  native resize refusal/incorrect shared decoration retain failed readbacks and exact IDs; unavailable fonts block before probe creation'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
