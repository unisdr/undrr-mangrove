#!/usr/bin/env node
/** Integration checks for the isolated source-only packet. No native rendering. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  buildDraftPacket,
  validateDrafts,
} = require('../../../scripts/build-figma-component-drafts.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const { environment, importFoundation } = require('./mock-kit.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = value => JSON.parse(JSON.stringify(value));
const identity = node =>
  node.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const property = (node, name) =>
  Object.keys(node.componentProperties).find(
    key => key.replace(/#[^#]+$/, '') === name
  );
function cli(args) {
  return spawnSync(
    process.execPath,
    [path.join(root, 'scripts/build-figma-component-drafts.cjs'), ...args],
    { cwd: root, encoding: 'utf8' }
  );
}
async function main() {
  const dtoFile = path.join(
    root,
    'examples/figma-plugin/mangrove-variables.json'
  );
  const originalBytes = fs.readFileSync(dtoFile);
  const original = buildFigmaVariables();
  const originalSnapshot = copy(original);
  const packet = buildDraftPacket();
  assert.deepStrictEqual(
    packet,
    buildDraftPacket(),
    'Packet generation must be deterministic with unchanged inputs'
  );
  assert.deepStrictEqual(
    copy(buildFigmaVariables()),
    originalSnapshot,
    'Draft build must not change the full exporter JSON output'
  );
  assert.deepStrictEqual(
    fs.readFileSync(dtoFile),
    originalBytes,
    'Canonical DTO bytes must remain untouched'
  );
  assert.strictEqual(packet.kind, 'mangrove-component-source-drafts');
  assert.deepStrictEqual(
    packet.draftFamilies.map(f => [f.id, f.variants.length]),
    [
      ['range', 4],
      ['tag', 5],
      ['notice', 4],
      ['breadcrumbs', 2],
      ['skip-link', 1],
      ['highlight-box', 3],
      ['accordion', 4],
      ['pager', 3],
      ['user-feedback', 2],
    ]
  );
  assert.strictEqual(
    packet.draftFamilies.reduce((n, f) => n + f.variants.length, 0),
    28
  );
  for (const field of [
    'collection',
    'modes',
    'variables',
    'styles',
    'components',
  ])
    assert.strictEqual(packet[field], undefined);
  for (const [old, expanded] of [
    [original.variables, packet.foundationCatalogue.variables],
    [original.styles.text, packet.foundationCatalogue.styles.text],
    [original.styles.effect, packet.foundationCatalogue.styles.effect],
  ])
    for (const entry of old)
      assert.deepStrictEqual(
        expanded.find(v => v.id === entry.id),
        entry
      );
  const foundation = packet.foundationCatalogue;
  validateDrafts(packet.draftFamilies, foundation);
  const missing = copy(packet.draftFamilies);
  missing[0].variants[0].tree.fill = 'color/nonexistent-draft-test';
  assert.throws(
    () => validateDrafts(missing, foundation),
    /Missing variable color\/nonexistent-draft-test/
  );
  const cycle = copy(foundation);
  const badSvg = copy(packet.draftFamilies);
  const icon = badSvg.find(f => f.id === 'notice').variants[0].tree.children[0]
    .children[0];
  assert.strictEqual(icon.type, 'SVG');
  icon.svg.monochrome = { strokes: 'color/missing-svg-role' };
  assert.throws(
    () => validateDrafts(badSvg, foundation),
    /Missing variable color\/missing-svg-role/
  );
  const duplicateStyleName = copy(foundation);
  duplicateStyleName.styles.text[1].name =
    duplicateStyleName.styles.text[0].name;
  assert.throws(
    () => validateDrafts(packet.draftFamilies, duplicateStyleName),
    /Duplicate name/
  );
  const a = cycle.variables.find(v => v.name === 'color/tag');
  const b = cycle.variables.find(v => v.name === 'color/interactive');
  a.values.undrr = { alias: b.name };
  b.values.undrr = { alias: a.name };
  assert.throws(
    () => validateDrafts(packet.draftFamilies, cycle),
    /Alias cycle/
  );
  const duplicate = copy(packet.draftFamilies);
  const tree = duplicate[0].variants[0].tree;
  tree.children[0].id = tree.id;
  assert.throws(
    () => validateDrafts(duplicate, foundation),
    /Missing\/duplicate anatomy ID/
  );
  console.log(
    'ok  isolated deterministic nine-family/28-variant packet retains full DTO and rejects missing roles, alias cycles and duplicate anatomy'
  );

  // Use the actual importer entry, not a duplicated preflight. The packet must
  // refuse before any variable/style/collection/node mutation takes place.
  const rejected = environment(original, { sharedOnly: true });
  const state = () =>
    copy({
      collections: rejected.state.collections.map(v => [v.id, v.name]),
      variables: rejected.state.variables.map(v => [v.id, v.name]),
      styles: rejected.state.styles.map(v => [v.id, v.name]),
      nodes: [...rejected.state.nodes.keys()],
      loadedFonts: [...rejected.state.loadedFonts],
    });
  const beforeReject = state();
  await assert.rejects(
    rejected.call('importVariables', packet, ['undrr'], false, [], true),
    /Import preflight: collection must have a name/
  );
  assert.deepStrictEqual(state(), beforeReject);
  console.log(
    'ok  actual importer refuses the source-only packet before mutation'
  );

  // Only the offline harness adapts to the regular DTO shape. The deliverable
  // keeps its deliberately incompatible packet structure.
  const doc = copy(original);
  doc.variables = copy(foundation.variables);
  doc.styles = copy(foundation.styles);
  doc.components.families = copy(packet.draftFamilies);
  const env = environment(doc, { sharedOnly: true });
  const expectedSvg = packet.draftFamilies
    .find(f => f.id === 'notice')
    .variants.map(v => v.tree.children[0].children[0].svg.markup);
  env.figma.createNodeFromSvg = markup => {
    // Exact four-asset fixture for API lifecycle only. This does not model
    // native path bounds, strokes, joins or pixel rendering.
    assert(expectedSvg.includes(markup.replace(/ width="24" height="24"/, '')));
    const frame = env.figma.createFrame();
    frame.resize(24, 24);
    Object.getPrototypeOf(frame).rescale = function (scale) {
      this.resizeWithoutConstraints(this.width * scale, this.height * scale);
      for (const child of this.children || [])
        child.resizeWithoutConstraints(
          child.width * scale,
          child.height * scale
        );
    };
    const vector = new frame.constructor('VECTOR');
    vector.resize(24, 24);
    vector.vectorPaths = [{ windingRule: 'NONZERO', data: 'M0 0' }];
    const paint = [
      { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
    ];
    vector.fills = markup.includes('fill="#000000"') ? copy(paint) : [];
    vector.strokes = markup.includes('stroke="#000000"') ? copy(paint) : [];
    frame.appendChild(vector);
    return frame;
  };
  require('./mock-breadcrumbs.cjs').installBreadcrumbSvgFixture(
    env,
    packet.draftFamilies.find(f => f.id === 'breadcrumbs')
  );
  require('./mock-accordion.cjs').installAccordionSvgFixture(
    env,
    packet.draftFamilies.find(f => f.id === 'accordion')
  );
  require('./mock-pager.cjs').installPagerSvgFixture(env, packet.draftFamilies);
  await importFoundation(env, doc);
  const selected = packet.draftFamilies.map(f => f.id);
  const first = await env.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    selected
  );
  assert.deepStrictEqual(copy(first.errors), []);
  assert.strictEqual(first.families.length, 9);
  assert.strictEqual(
    first.families.reduce((n, f) => n + f.variantIds.length, 0),
    28
  );
  const consumer = [...env.state.nodes.values()].find(
    n =>
      n.type === 'INSTANCE' &&
      identity(n) === 'review/tag/specimen/source-default/instance'
  );
  assert(consumer, 'Combined build must retain Tag review consumer');
  consumer.setProperties({
    [property(consumer, 'Label')]: 'Combined build edited label',
  });
  const ids = () =>
    [...env.state.nodes.values()]
      .filter(identity)
      .map(n => [identity(n), n.id])
      .sort((a, b) => a[0].localeCompare(b[0]));
  const beforeRepeat = ids();
  const repeated = await env.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    selected
  );
  assert.deepStrictEqual(copy(repeated.errors), []);
  assert.strictEqual(repeated.createdNodeIds.length, 0);
  assert.deepStrictEqual(ids(), beforeRepeat);
  assert.strictEqual(
    consumer.componentProperties[property(consumer, 'Label')].value,
    'Combined build edited label'
  );
  console.log(
    'ok  combined shared-identity builder constructs all28 variants and repeats without creation or lost Label overrides'
  );

  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mangrove-component-drafts-test-')
  );
  try {
    const output = path.join(temporary, 'nested', 'drafts.json');
    const created = cli(['--output', output]);
    assert.strictEqual(created.status, 0, created.stderr);
    const bytes = fs.readFileSync(output, 'utf8');
    assert.deepStrictEqual(JSON.parse(bytes), packet);
    const checked = cli(['--check', output]);
    assert.strictEqual(checked.status, 0, checked.stderr);
    assert.strictEqual(fs.readFileSync(output, 'utf8'), bytes);
    const overwrite = cli(['--output', output]);
    assert.notStrictEqual(overwrite.status, 0);
    assert.match(overwrite.stderr, /new output path/);
    assert.strictEqual(fs.readFileSync(output, 'utf8'), bytes);
    fs.writeFileSync(output, '{}\n');
    const stale = cli(['--check', output]);
    assert.notStrictEqual(stale.status, 0);
    assert.match(stale.stderr, /Stale draft packet/);
    assert.strictEqual(fs.readFileSync(output, 'utf8'), '{}\n');
    const forbidden = path.join(
      root,
      'examples/figma-plugin/dev/never-create-draft-test.json'
    );
    assert(!fs.existsSync(forbidden));
    for (const action of ['--output', '--check']) {
      const result = cli([action, forbidden]);
      assert.notStrictEqual(result.status, 0);
      assert.match(result.stderr, /must stay outside source/);
      assert(!fs.existsSync(forbidden));
    }
    const invalid = cli([]);
    assert.notStrictEqual(invalid.status, 0);
    assert.match(invalid.stderr, /Use --output/);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  assert.deepStrictEqual(fs.readFileSync(dtoFile), originalBytes);
  console.log(
    'ok  CLI output/check, overwrite/staleness/source-path/argument guards with cleaned external temporary files'
  );
  console.log(
    'Component drafts integration passed. Native/browser acceptance and publication remain unverified.'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
