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
  assert.strictEqual(checked.payload.directTextEnabled, false);
  assert.strictEqual(checked.payload.letterSpacingEnabled, false);
  assert.strictEqual(checked.payload.focusEnabled, false);
  assert(checked.payload.bytes <= 48000, checked.payload.bytes);
  assert(checked.payload.code.includes('SVG'));
  for (const marker of [
    'Absolute recipes require',
    'Review preserveVariantSizing must',
    'Review variantSurfaces must',
    'TEXT textDecorationOffset requires',
    'Review nodes must',
    'Ellipse arcData requires',
    'textStyleApplication DIRECT is restricted',
    'DIRECT typography needs',
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
  const loader = await execute(doc, 'loader', 'loader.below-medium');
  assert(loader.payload.code.includes('Ellipse arcData requires'));
  const loaderMain = loader.env.state.nodes.get(
    loader.report.families[0].variantIds[0].nodeId
  );
  const loaderBody = loaderMain.children.find(
    node => node.type === 'ELLIPSE' && node.name === 'Blue border'
  );
  assert.deepStrictEqual(copy(loaderBody.arcData), {
    startingAngle: (7 * Math.PI) / 4,
    endingAngle: (13 * Math.PI) / 4,
    innerRadius: 0.6,
  });
  const loaderRepeat = await loader.env.runCode(loader.payload.code);
  assert.strictEqual(
    loaderRepeat.errors.length,
    0,
    loaderRepeat.errors.join('\n')
  );
  assert.strictEqual(loaderRepeat.createdNodeIds.length, 0);
  console.log(
    `ok scoped Loader retains native arc validation and positive clockwise sweep at ${loader.payload.bytes} bytes`
  );

  for (const payload of [
    unchecked.payload,
    chips.payload,
    cta.payload,
    table.payload,
    loader.payload,
  ]) {
    const expectedDirect = payload === cta.payload;
    assert.strictEqual(payload.directTextEnabled, expectedDirect);
    // The two larger source packets retain at least 1,000 bytes of headroom
    // below the unchanged 50,000-byte connector limit.
    const budget = payload.families.some(id =>
      ['table', 'editorial-cta'].includes(id)
    )
      ? 49000
      : 48000;
    assert(
      payload.bytes <= budget && payload.characters <= budget,
      `${payload.families}: ${payload.bytes}`
    );
    assert.strictEqual(
      payload.code.includes('DIRECT typography needs'),
      expectedDirect
    );
  }
  const spacingDoc = copy(doc);
  const plainIdForSpacing = 'checkbox.false.default.after.short';
  const spacingStyleId = subsetDocument(
    doc,
    'build',
    'undrr',
    ['checkbox'],
    [plainIdForSpacing]
  ).styles.text[0].id;
  const sourceStyle = spacingDoc.styles.text.find(
    style => style.id === spacingStyleId
  );
  sourceStyle.values.undrr.letterSpacing = { unit: 'PERCENT', value: 2 };
  const spaced = await execute(spacingDoc, 'checkbox', plainIdForSpacing);
  assert.strictEqual(spaced.payload.letterSpacingEnabled, true);
  const nativeStyle = spaced.env.state.styles.find(
    style =>
      style.getSharedPluginData('orgundrrmangrove', 'mgStyleId') ===
      spacingStyleId
  );
  assert(nativeStyle);
  assert.deepStrictEqual(copy(nativeStyle.letterSpacing), {
    unit: 'PERCENT',
    value: 2,
  });
  const spacingIds = [...spaced.env.state.nodes.values()]
    .filter(identity)
    .map(node => [identity(node), node.id]);
  const plainSpacingBuild = await buildConnector(
    scope(doc, 'checkbox', plainIdForSpacing)
  );
  assert.strictEqual(plainSpacingBuild.letterSpacingEnabled, false);
  const zeroBuild = await spaced.env.runCode(plainSpacingBuild.code);
  assert.strictEqual(zeroBuild.errors.length, 0);
  assert.strictEqual(zeroBuild.createdNodeIds.length, 0);
  assert.deepStrictEqual(copy(nativeStyle.letterSpacing), {
    unit: 'PIXELS',
    value: 0,
  });
  assert.deepStrictEqual(
    [...spaced.env.state.nodes.values()]
      .filter(identity)
      .map(node => [identity(node), node.id]),
    spacingIds
  );
  const importSpacing = fixture =>
    buildConnector({
      operation: 'import',
      brandId: 'undrr',
      styleIds: [spacingStyleId],
      variableIds: [],
      doc: fixture,
    });
  const spacedImport = await importSpacing(spacingDoc);
  assert.strictEqual(spacedImport.letterSpacingEnabled, true);
  assert(spacedImport.code.includes('invalid text style letter spacing'));
  const importedP2 = await spaced.env.runCode(spacedImport.code);
  assert.strictEqual(importedP2.result.errors.length, 0);
  assert.deepStrictEqual(copy(nativeStyle.letterSpacing), {
    unit: 'PERCENT',
    value: 2,
  });
  const zeroImportPayload = await importSpacing(doc);
  assert.strictEqual(zeroImportPayload.letterSpacingEnabled, false);
  assert(!zeroImportPayload.code.includes('invalid text style letter spacing'));
  const zeroImport = await spaced.env.runCode(zeroImportPayload.code);
  assert.strictEqual(zeroImport.result.errors.length, 0);
  assert.deepStrictEqual(copy(nativeStyle.letterSpacing), {
    unit: 'PIXELS',
    value: 0,
  });
  assert.strictEqual(zeroImport.createdStyleIds.length, 0);
  for (const value of [
    null,
    { unit: 'EMS', value: 2 },
    { unit: 'PERCENT', value: Infinity },
    { unit: 'PIXELS', value: 2, extra: true },
  ]) {
    const bad = copy(spacingDoc);
    bad.styles.text.find(
      style => style.id === spacingStyleId
    ).values.undrr.letterSpacing = value;
    const before = snapshot(spaced.env);
    await assert.rejects(
      buildConnector(scope(bad, 'checkbox', plainIdForSpacing)),
      /invalid text style letter spacing/
    );
    await assert.rejects(
      importSpacing(bad),
      /invalid text style letter spacing/
    );
    assert.strictEqual(snapshot(spaced.env), before);
  }
  console.log(
    `ok compiled PERCENT2 spacing and omitted PIXELS0 reset on build/import; invalid profiles refuse before compilation (${spaced.payload.bytes}/${spacedImport.bytes} bytes)`
  );
  const unrelatedSpacingDoc = copy(doc);
  unrelatedSpacingDoc.styles.text.find(
    style => style.id !== spacingStyleId
  ).values.undrr.letterSpacing = { unit: 'PERCENT', value: 2 };
  const unrelatedSpacing = await buildConnector(
    scope(unrelatedSpacingDoc, 'checkbox', plainIdForSpacing)
  );
  assert.strictEqual(unrelatedSpacing.letterSpacingEnabled, false);

  const focusId = 'checkbox.false.focus.after.short';
  const focused = await execute(doc, 'checkbox', focusId);
  assert.strictEqual(focused.payload.focusEnabled, true);
  assert(
    focused.payload.code.includes('Invalid native focus outline dimensions')
  );
  const focusMain = find(focused.env, `family/checkbox/variant/${focusId}`);
  assert.strictEqual(focusMain.type, 'COMPONENT');
  const outlines = focusMain.findAll(
    node => node.type === 'RECTANGLE' && identity(node)?.includes('/focus/')
  );
  assert.strictEqual(outlines.length, 2);
  const outer = outlines.find(node => identity(node).endsWith('/focus/outer'));
  const separator = outlines.find(node =>
    identity(node).endsWith('/focus/separator')
  );
  const variableByName = new Map(
    focused.env.state.variables.map(variable => [variable.name, variable])
  );
  const offset = variableByName
    .get('focus-ring/offset')
    .resolveForConsumer(outer.parent).value;
  assert.strictEqual(outer.x, -offset);
  assert.strictEqual(outer.y, -offset);
  assert.strictEqual(outer.width, outer.parent.width + 2 * offset);
  assert.strictEqual(
    outer.boundVariables.strokeWeight.id,
    variableByName.get('focus-ring/width').id
  );
  assert.strictEqual(
    separator.boundVariables.strokeWeight.id,
    variableByName.get('focus-ring/offset').id
  );
  assert.deepStrictEqual(copy(outer.constraints), {
    horizontal: 'STRETCH',
    vertical: 'STRETCH',
  });
  const obsoleteFocusDoc = copy(doc);
  for (const node of nodes(
    obsoleteFocusDoc.components.families
      .find(f => f.id === 'checkbox')
      .variants.find(v => v.id === focusId).tree
  ))
    delete node.focusRing;
  const noFocus = await buildConnector(
    scope(obsoleteFocusDoc, 'checkbox', focusId)
  );
  assert.strictEqual(noFocus.focusEnabled, false);
  assert(!noFocus.code.includes('Invalid native focus outline dimensions'));
  const outlineIds = outlines.map(node => node.id);
  const hidden = await focused.env.runCode(noFocus.code);
  assert.strictEqual(hidden.errors.length, 0);
  assert.strictEqual(hidden.createdNodeIds.length, 0);
  assert(outlines.every(node => !node.removed && !node.visible));
  const restored = await focused.env.runCode(focused.payload.code);
  assert.strictEqual(restored.errors.length, 0);
  assert.strictEqual(restored.createdNodeIds.length, 0);
  assert.deepStrictEqual(
    outlines.map(node => node.id),
    outlineIds
  );
  assert(outlines.every(node => node.visible));
  console.log(
    `ok enabled focus geometry/bindings and absent-focus owned-outline cleanup (${focused.payload.bytes} bytes)`
  );
  const directDoc = copy(doc);
  const directFamily = directDoc.components.families.find(
    family => family.id === 'toc-link'
  );
  for (const variant of directFamily.variants)
    nodes(variant.tree).find(
      node => node.type === 'TEXT' && node.name === 'Link label'
    ).textStyleApplication = 'DIRECT';
  const directVariant = directFamily.variants.find(
    variant => variant.id === 'toc-link.240.default'
  );
  assert(directVariant);
  const directSubset = subsetDocument(
    directDoc,
    'build',
    'undrr',
    ['toc-link'],
    [directVariant.id]
  );
  assert.deepStrictEqual(
    decompressJSON(compressJSON(directSubset)),
    directSubset
  );
  assert.deepStrictEqual(
    directSubset.variables.map(variable => variable.name).sort(),
    ['font-family/text', 'font-size/300']
  );
  for (const variable of directSubset.variables) {
    const original = doc.variables.find(item => item.id === variable.id);
    assert.deepStrictEqual(variable, {
      ...original,
      values: { undrr: original.values.undrr },
    });
  }
  const aliasDoc = copy(directDoc);
  const sourceSize = aliasDoc.variables.find(
    variable => variable.name === 'font-size/300'
  );
  sourceSize.values.undrr = { alias: 'font-size/direct-transport-fixture' };
  const aliasPrimitive = {
    ...copy(sourceSize),
    id: 'font-size.direct-transport-fixture',
    name: 'font-size/direct-transport-fixture',
    description: 'Synthetic transport alias fixture, not a source token.',
    values: { ...sourceSize.values, undrr: 16 },
  };
  aliasDoc.variables.push(aliasPrimitive);
  const aliasSubset = subsetDocument(
    aliasDoc,
    'build',
    'undrr',
    ['toc-link'],
    [directVariant.id]
  );
  assert.deepStrictEqual(
    aliasSubset.variables.map(variable => variable.name).sort(),
    ['font-family/text', 'font-size/300', 'font-size/direct-transport-fixture']
  );
  assert.deepStrictEqual(
    decompressJSON(compressJSON(aliasSubset)),
    aliasSubset
  );
  const aliased = await execute(aliasDoc, 'toc-link', directVariant.id);
  assert.strictEqual(aliased.payload.directTextEnabled, true);
  const aliasedMain = find(
    aliased.env,
    `family/toc-link/variant/${directVariant.id}`
  );
  assert.strictEqual(
    aliasedMain.findAll(node => node.type === 'TEXT')[0].fontSize,
    16
  );
  const direct = await execute(directDoc, 'toc-link', directVariant.id);
  assert.strictEqual(direct.payload.directTextEnabled, true);
  assert(
    direct.payload.bytes <= 48000 && direct.payload.characters <= 48000,
    direct.payload.bytes
  );
  assert(
    direct.payload.code.includes(
      'DIRECT typography needs its exact source template'
    )
  );
  const directMain = find(
    direct.env,
    `family/toc-link/variant/${directVariant.id}`
  );
  const directLabel = directMain.findAll(node => node.type === 'TEXT')[0];
  assert.strictEqual(directLabel.textStyleId, '');
  assert.strictEqual(directLabel.fontName.family, 'Roboto');
  assert.strictEqual(directLabel.fontSize, 16);
  assert.deepStrictEqual(copy(directLabel.lineHeight), {
    unit: 'PERCENT',
    value: 150,
  });
  for (const [field, role] of [
    ['fontFamily', 'font-family/text'],
    ['fontSize', 'font-size/300'],
  ]) {
    const native = direct.env.state.variables.find(
      variable => variable.name === role
    );
    assert.strictEqual(directLabel.boundVariables[field].id, native.id);
  }
  const directStyles = direct.env.state.styles.map(style => style.id);
  const directIds = [...direct.env.state.nodes.values()]
    .filter(identity)
    .map(node => [identity(node), node.id]);
  const directReview = [...direct.env.state.nodes.values()].find(
    node =>
      node.type === 'INSTANCE' && identity(node)?.startsWith('review/toc-link/')
  );
  const directKey = Object.keys(directReview.componentProperties).find(key =>
    key.startsWith('Label#')
  );
  directReview.setProperties({
    [directKey]: 'Edited source-direct TOC consumer',
  });
  const directRepeat = await direct.env.runCode(direct.payload.code);
  assert.strictEqual(
    directRepeat.errors.length,
    0,
    directRepeat.errors.join('\n')
  );
  assert.strictEqual(directRepeat.createdNodeIds.length, 0);
  assert.strictEqual(
    directReview.componentProperties[directKey].value,
    'Edited source-direct TOC consumer'
  );
  assert.deepStrictEqual(
    [...direct.env.state.nodes.values()]
      .filter(identity)
      .map(node => [identity(node), node.id]),
    directIds
  );
  assert.deepStrictEqual(
    direct.env.state.styles.map(style => style.id),
    directStyles
  );
  for (const value of [null, false, 0, 'INVALID', 'DIRECT'])
    await malformed(
      doc,
      (_family, variant) => {
        nodes(variant.tree).find(
          node => node.type === 'TEXT'
        ).textStyleApplication = value;
      },
      'textStyleApplication DIRECT is restricted'
    );
  console.log(
    `ok DIRECT TOC ${direct.payload.bytes} bytes retains exact source templates/bindings, empty association and edited IDs; malformed declarations enable strict preflight`
  );

  for (const value of [null, false, 0]) {
    await malformed(
      doc,
      (_family, variant) => {
        variant.tree.children[0].arcData = value;
      },
      'Ellipse arcData requires'
    );
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
    'if (MG_DIRECT_TEXT_ENABLED) {',
    'if (tree.absolute !== undefined) {',
    'if (family.review?.preserveVariantSizing !== undefined) {',
    'if (family.review?.variantSurfaces !== undefined) {',
    'if (specimen.surface !== undefined)',
    'if (tree.textDecorationOffset !== undefined) {',
    'spec.textDecorationOffset !== undefined &&\n        node.textDecoration ===',
    'if (specimen.nodes !== undefined) {',
    'if (specimen.nodes?.length && (fresh || refreshNarrowReview)) {',
    'if (tree.focusRing) {',
    'if (!spec.focusRing) {',
    'const surface =\n          specimen.surface ??\n          reviewOptions.variantSurfaces?.[specimen.variant.recipe.id];',
  ];
  const boundaries = [
    ...anchors.map(anchor => ({ file: 'kit-builder.js', anchor })),
    ...[
      'if (value.letterSpacing !== undefined) {',
      'style.letterSpacing = value.letterSpacing || {',
    ].map(anchor => ({ file: 'code.js', anchor })),
  ];
  for (const { file, anchor } of boundaries) {
    const read = fs.readFileSync;
    let matched = false;
    fs.readFileSync = function (filename, ...args) {
      const result = read.call(this, filename, ...args);
      if (typeof filename !== 'string' || !filename.endsWith(`/${file}`))
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
    `ok obsolete owned surface cleanup retained; all ${boundaries.length} changed source anchors fail closed`
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(`FAIL ${error.stack || error}`);
    process.exitCode = 1;
  });
