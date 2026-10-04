#!/usr/bin/env node
/** Compiled connector feature scopes and preflight, not native rendering. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildConnector,
  subsetDocument,
  compressJSON,
  decompressJSON,
} = require('../../../scripts/build-figma-connector.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const identity = node =>
  node.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const load = () =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
const find = (env, id) =>
  [...env.state.nodes.values()].find(node => identity(node) === id);
const scope = (doc, family, variant) => ({
  operation: 'build',
  brandId: 'undrr',
  familyIds: [family],
  variantIds: [variant],
  doc,
});
async function execute(doc, family, variant) {
  const payload = await buildConnector(scope(doc, family, variant));
  const env = environment(doc);
  await importFoundation(env, doc);
  const report = await env.runCode(payload.code);
  assert.strictEqual(report.errors.length, 0, report.errors.join('\n'));
  return { payload, env, report };
}
function nodes(tree) {
  return [tree, ...(tree.children || []).flatMap(nodes)];
}
function snapshot(env) {
  return JSON.stringify({
    nodes: [...env.state.nodes.values()].map(node => [
      node.id,
      identity(node),
      node.name,
      node.visible,
      node.width,
      node.height,
    ]),
    styles: env.state.styles.map(style => style.id),
  });
}
async function malformed(doc, change, message, guard = message) {
  const variantId = 'checkbox.false.default.after.short';
  const fixture = copy(doc);
  const family = fixture.components.families.find(f => f.id === 'checkbox');
  const variant = family.variants.find(v => v.id === variantId);
  change(family, variant);
  const payload = await buildConnector(scope(fixture, 'checkbox', variantId));
  assert(payload.code.includes(guard), `Missing enabled guard: ${guard}`);
  const env = environment(fixture);
  await importFoundation(env, fixture);
  const before = snapshot(env);
  const report = await env.runCode(payload.code);
  assert(
    report.errors.some(error => error.includes(message)),
    report.errors
  );
  assert.strictEqual(report.createdNodeIds.length, 0);
  assert.strictEqual(snapshot(env), before, 'Preflight mutated native state');
}
async function main() {
  const doc = load();
  const checkedId = 'checkbox.true.default.after.short';
  const checked = await execute(doc, 'checkbox', checkedId);
  assert(checked.payload.svgEnabled);
  assert(checked.payload.bytes <= 48000, checked.payload.bytes);
  assert(checked.payload.code.includes('SVG'));
  for (const marker of [
    'Absolute recipes require',
    'Review preserveVariantSizing must',
    'Review variantSurfaces must',
    'TEXT textDecorationOffset requires',
    'Review nodes must',
  ])
    assert(
      !checked.payload.code.includes(marker),
      `Absent feature retained: ${marker}`
    );
  const subset = subsetDocument(
    doc,
    'build',
    'undrr',
    ['checkbox'],
    [checkedId]
  );
  assert.deepStrictEqual(decompressJSON(compressJSON(subset)), subset);
  assert.strictEqual(
    JSON.stringify(subset.components),
    JSON.stringify(decompressJSON(compressJSON(subset)).components)
  );
  const unchecked = await execute(
    doc,
    'checkbox',
    'checkbox.false.default.after.short'
  );
  assert.strictEqual(unchecked.payload.svgEnabled, false);
  assert(!unchecked.payload.code.includes('Unsupported SVG'));
  console.log(
    `ok checked SVG ${checked.payload.bytes} bytes; unchecked ${unchecked.payload.bytes}; lossless source metadata`
  );

  const chips = await execute(doc, 'chips', 'chips.linked.default.short');
  assert(
    chips.payload.code.includes(
      'Review preserveVariantSizing must be a boolean.'
    )
  );
  const chipMain = find(
    chips.env,
    'family/chips/variant/chips.linked.default.short'
  );
  const chipReview = [...chips.env.state.nodes.values()].find(
    node =>
      node.type === 'INSTANCE' && identity(node)?.startsWith('review/chips/')
  );
  assert(chipMain && chipReview);
  assert.strictEqual(chipReview.width, chipMain.width);
  assert.strictEqual(
    chipReview.layoutSizingHorizontal,
    chipMain.layoutSizingHorizontal
  );
  const key = Object.keys(chipReview.componentProperties).find(name =>
    name.startsWith('Label#')
  );
  chipReview.setProperties({ [key]: 'Designer edited chip' });
  const beforeIds = [...chips.env.state.nodes.values()]
    .filter(identity)
    .map(node => [identity(node), node.id]);
  const repeat = await chips.env.runCode(chips.payload.code);
  assert.strictEqual(repeat.errors.length, 0);
  assert.strictEqual(repeat.createdNodeIds.length, 0);
  assert.strictEqual(
    chipReview.componentProperties[key].value,
    'Designer edited chip'
  );
  assert.deepStrictEqual(
    [...chips.env.state.nodes.values()]
      .filter(identity)
      .map(node => [identity(node), node.id]),
    beforeIds
  );

  const cta = await execute(
    doc,
    'editorial-cta',
    'editorial-cta.heroprimary.hover.short.nopreference'
  );
  for (const marker of [
    'Absolute recipes require',
    'TEXT textDecorationOffset requires',
    'Review variantSurfaces must',
  ])
    assert(
      cta.payload.code.includes(marker),
      `Enabled CTA guard missing: ${marker}`
    );
  const ctaMain = find(
    cta.env,
    'family/editorial-cta/variant/editorial-cta.heroprimary.hover.short.nopreference'
  );
  const ctaLabel = ctaMain
    .findAll(node => node.type === 'TEXT')
    .find(node => node.characters !== '›');
  assert.strictEqual(ctaLabel.textDecoration, 'UNDERLINE');
  assert.deepStrictEqual(copy(ctaLabel.textDecorationOffset), {
    unit: 'PERCENT',
    value: 20,
  });
  assert(ctaMain.findAll(node => node.layoutPositioning === 'ABSOLUTE').length);
  assert(
    [...cta.env.state.nodes.values()].some(
      node =>
        identity(node)?.endsWith('/surface') &&
        node.visible &&
        node.fills.length
    )
  );

  const table = await execute(doc, 'table', 'table.large.default.story');
  assert(
    table.payload.code.includes(
      'Review nodes must be an array of at most 64 entries.'
    )
  );
  const tableFamily = doc.components.families.find(f => f.id === 'table');
  const expectedText = tableFamily.review.specimens
    .find(s => s.id === 'long-content')
    .nodes.flatMap(n => Object.values(n.properties || {}));
  for (const text of expectedText)
    assert(
      [...table.env.state.nodes.values()].some(
        node =>
          node.type === 'INSTANCE' &&
          Object.values(node.componentProperties).some(
            property => property.value === text
          )
      ),
      `Missing nested seed: ${text}`
    );
  console.log(
    `ok Chips intrinsic ${chips.payload.bytes}, Hero CTA absolute/offset/surface ${cta.payload.bytes}, Table nested seeds ${table.payload.bytes}`
  );

  for (const value of [null, false, 0]) {
    if (value !== false)
      await malformed(
        doc,
        family => {
          family.review.preserveVariantSizing = value;
        },
        'Review preserveVariantSizing must be a boolean.'
      );
    await malformed(
      doc,
      (_family, variant) => {
        variant.tree.children[0].absolute = value;
      },
      'Absolute recipes require'
    );
    await malformed(
      doc,
      (_family, variant) => {
        nodes(variant.tree).find(
          node => node.type === 'TEXT'
        ).textDecorationOffset = value;
      },
      'TEXT textDecorationOffset requires'
    );
    await malformed(
      doc,
      family => {
        family.review.variantSurfaces = value;
      },
      'Review variantSurfaces must map'
    );
    await malformed(
      doc,
      (family, variant) => {
        family.review.specimens = [
          {
            id: 'bad-surface',
            name: 'Malformed surface',
            variant: variant.properties,
            width: 240,
            properties: {},
            surface: value,
          },
        ];
      },
      'Missing COLOR variable',
      'Review variantSurfaces must'
    );
    await malformed(
      doc,
      (family, variant) => {
        family.review.specimens = [
          {
            id: 'bad-nodes',
            name: 'Malformed nodes',
            variant: variant.properties,
            width: 240,
            properties: {},
            nodes: value,
          },
        ];
      },
      'Review nodes must be an array of at most 64 entries.'
    );
  }
  console.log(
    'ok null/false/zero declarations retain their enabled preflight and refuse before native writes'
  );

  for (const value of [[], 'invalid'])
    await malformed(
      doc,
      family => {
        family.review.variantSurfaces = value;
      },
      'Review variantSurfaces must map'
    );

  const falseIntrinsicDoc = copy(doc);
  falseIntrinsicDoc.components.families.find(
    f => f.id === 'checkbox'
  ).review.preserveVariantSizing = false;
  const falseIntrinsic = await execute(
    falseIntrinsicDoc,
    'checkbox',
    'checkbox.false.default.after.short'
  );
  assert(
    falseIntrinsic.payload.code.includes(
      'Review preserveVariantSizing must be a boolean.'
    )
  );

  const surfaceDoc = copy(doc);
  const family = surfaceDoc.components.families.find(f => f.id === 'checkbox');
  const plainId = 'checkbox.false.default.after.short';
  family.review.variantSurfaces = { [plainId]: 'color/hero' };
  const previous = await execute(surfaceDoc, 'checkbox', plainId);
  const surface = [...previous.env.state.nodes.values()].find(node =>
    identity(node)?.endsWith('/surface')
  );
  assert(surface && surface.visible);
  const stableSurfaceId = surface.id;
  const plain = await buildConnector(scope(doc, 'checkbox', plainId));
  const cleaned = await previous.env.runCode(plain.code);
  assert.strictEqual(cleaned.errors.length, 0);
  assert.strictEqual(surface.id, stableSurfaceId);
  assert.strictEqual(surface.visible, false);
  assert.strictEqual(surface.fills.length, 0);

  const anchors = [
    'if (tree.absolute !== undefined) {',
    'if (family.review?.preserveVariantSizing !== undefined) {',
    'if (family.review?.variantSurfaces !== undefined) {',
    'if (specimen.surface !== undefined)',
    'if (tree.textDecorationOffset !== undefined) {',
    'spec.textDecorationOffset !== undefined &&\n        node.textDecoration ===',
    'if (specimen.nodes !== undefined) {',
    'if (specimen.nodes?.length && (fresh || refreshNarrowReview)) {',
    'const surface =\n          specimen.surface ??\n          reviewOptions.variantSurfaces?.[specimen.variant.recipe.id];',
  ];
  for (const anchor of anchors) {
    const read = fs.readFileSync;
    let matched = false;
    fs.readFileSync = function (filename, ...args) {
      const result = read.call(this, filename, ...args);
      if (typeof filename !== 'string' || !filename.endsWith('/kit-builder.js'))
        return result;
      matched = result.includes(anchor);
      return result.replace(anchor, '/* removed specialization boundary */');
    };
    try {
      await assert.rejects(
        buildConnector(scope(doc, 'checkbox', plainId)),
        /Connector specialization boundary changed/
      );
      assert(matched);
    } finally {
      fs.readFileSync = read;
    }
  }
  console.log(
    'ok obsolete owned surface cleanup retained; all nine changed source anchors fail closed'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(`FAIL ${error.stack || error}`);
    process.exitCode = 1;
  });
