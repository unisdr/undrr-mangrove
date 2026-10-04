#!/usr/bin/env node
/** Source and ordinary-build control flow only. No native shared-style propagation or raster proof. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildSegmentedRecipes,
} = require('../../../scripts/figma-segmented-recipes.cjs');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = value => JSON.parse(JSON.stringify(value));
const sourceDoc = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
);
const id = (node, key = 'mgKitId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
const owned = env =>
  [...env.state.nodes.values()]
    .filter(node => id(node))
    .map(node => [id(node), node.id])
    .sort((a, b) => a[0].localeCompare(b[0]));
function document() {
  const doc = copy(sourceDoc);
  const families = buildSegmentedRecipes({ root, ...doc });
  doc.components.families = [
    ...doc.components.families.filter(
      family => family.id !== 'segmented-control.segment'
    ),
    ...families,
  ];
  return doc;
}
function mutation(file, before, after, check) {
  const read = fs.readFileSync;
  let matched = false;
  fs.readFileSync = function (filename, ...args) {
    const value = read.call(this, filename, ...args);
    if (typeof filename !== 'string' || !filename.endsWith(file)) return value;
    const next = value.replace(before, after);
    matched = next !== value;
    return next;
  };
  try {
    check();
    assert(matched);
  } finally {
    fs.readFileSync = read;
  }
}
async function main() {
  const doc = document();
  const family = doc.components.families.find(
    value => value.id === 'segmented-control.segment'
  );
  assert.strictEqual(family.variants.length, 3);
  assert.deepStrictEqual(
    family.variants.map(value => value.id),
    [
      'segmented-control.segment.false.default.first',
      'segmented-control.segment.true.default.first',
      'segmented-control.segment.false.hover.first',
    ]
  );
  const before = copy({ variables: doc.variables, styles: doc.styles });
  assert.deepStrictEqual(buildSegmentedRecipes({ root, ...doc }), [family]);
  assert.deepStrictEqual(
    { variables: doc.variables, styles: doc.styles },
    before
  );
  const template = doc.styles.text.find(
    value => value.id === 'component.segmented-control.segment'
  );
  for (const mode of doc.modes) {
    assert.strictEqual(template.values[mode.id].fontName.style, 'Bold');
    assert.deepStrictEqual(template.values[mode.id].lineHeight, {
      unit: 'PERCENT',
      value: 120,
    });
    assert.strictEqual(
      doc.variables.find(
        value => value.name === 'component/segmented-control/minimum-height'
      ).values[mode.id],
      44
    );
  }
  assert.strictEqual(template.values.mcr.fontSize, 18);
  assert.strictEqual(template.bindings.fontFamily, 'font-family/text');
  assert.strictEqual(template.bindings.fontSize, 'font-size/button');
  assert(
    family.variants.every(
      value => value.tree.children[0].textStyleApplication === undefined
    )
  );
  const malformed = copy(sourceDoc);
  malformed.styles.text.find(
    value => value.id === 'component.button'
  ).values.undrr.fontSize = 15;
  const unchanged = copy({
    variables: malformed.variables,
    styles: malformed.styles,
  });
  assert.throws(
    () => buildSegmentedRecipes({ root, ...malformed }),
    /source font or geometry/
  );
  assert.deepStrictEqual(
    { variables: malformed.variables, styles: malformed.styles },
    unchanged
  );
  for (const [beforeText, afterText] of [
    ['line-height: 1.2;', 'line-height: 1.3;'],
    ['font-weight: 600;', 'font-weight: 500;'],
    ['text-align: center;', 'text-align: left;'],
    ['#{mg-rem(44)}', '#{mg-rem(45)}'],
  ])
    mutation(
      '/stories/Components/Forms/SegmentedControl/segmented-control.scss',
      beforeText,
      afterText,
      () => assert.throws(document, /probe needs updating/)
    );
  const wrongRole = copy(sourceDoc);
  wrongRole.variables.find(
    value => value.name === 'padding/button/block'
  ).type = 'STRING';
  assert.throws(
    () => buildSegmentedRecipes({ root, ...wrongRole }),
    /wrong-typed/
  );
  console.log(
    'ok  exact guarded source, idempotent3 final identities, all-brand120% Bold template, typed roles and mutation-free source/template drift rejection'
  );
  // Real exporter registry and normalization. Do not replace its families with raw source trees.
  const nativeDoc = buildFigmaVariables();
  const nativeFamily = nativeDoc.components.families.find(
    value => value.id === family.id
  );
  assert(nativeFamily);
  assert(
    nativeFamily.variants.every(
      value =>
        value.tree.children[0].id ===
        'mg-segmented-control__label/Segment label'
    )
  );
  assert.deepStrictEqual(
    nativeFamily.variants.map(value => value.id),
    family.variants.map(value => value.id)
  );
  assert.strictEqual(
    nativeDoc.styles.text.filter(value => value.id === template.id).length,
    1
  );
  const env = environment(nativeDoc);
  await importFoundation(env, nativeDoc);
  const report = await env.call('buildMangroveComponents', nativeDoc, 'undrr', [
    family.id,
  ]);
  assert.deepStrictEqual(copy(report.errors), []);
  assert.strictEqual(report.families.length, 1);
  assert.strictEqual(report.families[0].variantIds.length, 3);
  const variables = new Map(
    env.state.variables.map(value => [value.name, value])
  );
  const style = env.state.styles.find(
    value => id(value, 'mgStyleId') === template.id
  );
  assert(style);
  assert.deepStrictEqual(copy(style.fontName), {
    family: 'Roboto',
    style: 'Bold',
  });
  assert.strictEqual(style.fontSize, 14);
  assert.deepStrictEqual(copy(style.lineHeight), {
    unit: 'PERCENT',
    value: 120,
  });
  for (const [field, role] of Object.entries(template.bindings))
    assert.strictEqual(style.boundVariables[field].id, variables.get(role).id);
  const set = env.state.nodes.get(report.families[0].setId);
  const labelKeys = Object.keys(set.componentPropertyDefinitions).filter(
    key => key.replace(/#[^#]+$/, '') === 'Label'
  );
  assert.strictEqual(labelKeys.length, 1);
  assert.strictEqual(
    set.componentPropertyDefinitions[labelKeys[0]].defaultValue,
    'Depth'
  );
  for (const variant of report.families[0].variantIds) {
    const main = env.state.nodes.get(variant.nodeId);
    const recipe = nativeFamily.variants.find(value => value.id === variant.id);
    const label = main.findAll(value => value.type === 'TEXT')[0];
    assert.strictEqual(label.textStyleId, style.id);
    assert.strictEqual(
      id(label),
      `family/${nativeFamily.id}/variant/${variant.id}/${recipe.tree.children[0].id}`
    );
    assert.deepStrictEqual(copy(label.lineHeight), {
      unit: 'PERCENT',
      value: 120,
    });
    assert.strictEqual(
      label.componentPropertyReferences.characters,
      labelKeys[0]
    );
    assert.strictEqual(
      label.fills[0].boundVariables.color.id,
      variables.get(recipe.tree.children[0].fill).id
    );
    assert.deepStrictEqual(
      copy(label.getRangeFills(0, label.characters.length)),
      copy(label.fills)
    );
    assert.strictEqual(main.strokeAlign, 'INSIDE');
    assert.strictEqual(main.strokesIncludedInLayout, true);
    assert.strictEqual(main.clipsContent, false);
    assert.strictEqual(main.layoutSizingHorizontal, 'HUG');
    assert.strictEqual(
      main.boundVariables.minHeight.id,
      variables.get('component/segmented-control/minimum-height').id
    );
    for (const [field, role] of Object.entries(recipe.tree.bindings))
      assert.strictEqual(main.boundVariables[field].id, variables.get(role).id);
  }
  const main = env.state.nodes.get(report.families[0].variantIds[0].nodeId);
  const consumer = main.createInstance();
  // Shared mock copies the master root ownership tag into new instances.
  // Native user consumers are not importer construction roots. Clear only this synthetic root tag.
  consumer.setSharedPluginData('orgundrrmangrove', 'mgKitId', '');
  consumer.setPluginData('mgKitId', '');
  env.figma.currentPage.appendChild(consumer);
  const label = consumer.findAll(value => value.type === 'TEXT')[0];
  await env.figma.loadFontAsync(label.fontName);
  consumer.setProperties({ [labelKeys[0]]: 'Edited consumer label' });
  label.textAlignHorizontal = 'RIGHT';
  consumer.resize(217, consumer.height);
  const consumerId = consumer.id,
    textId = label.id,
    masterIds = owned(env),
    definitions = copy(set.componentPropertyDefinitions);
  for (let pass = 0; pass < 2; pass++) {
    const repeat = await env.call(
      'buildMangroveComponents',
      nativeDoc,
      'undrr',
      [family.id]
    );
    assert.deepStrictEqual(copy(repeat.errors), []);
    assert.strictEqual(repeat.createdNodeIds.length, 0);
    assert.deepStrictEqual(owned(env), masterIds);
    assert.deepStrictEqual(copy(set.componentPropertyDefinitions), definitions);
    assert.strictEqual(consumer.id, consumerId);
    assert.strictEqual(label.id, textId);
    assert.strictEqual(
      consumer.componentProperties[labelKeys[0]].value,
      'Edited consumer label'
    );
    assert.strictEqual(label.textAlignHorizontal, 'RIGHT');
    assert.strictEqual(consumer.width, 217);
    assert.strictEqual(label.textStyleId, style.id);
    for (const variant of report.families[0].variantIds) {
      const main = env.state.nodes.get(variant.nodeId);
      const source = nativeFamily.variants.find(
        value => value.id === variant.id
      );
      const mainLabel = main.findAll(node => node.type === 'TEXT')[0];
      assert.strictEqual(mainLabel.textStyleId, style.id);
      assert.strictEqual(
        mainLabel.componentPropertyReferences.characters,
        labelKeys[0]
      );
      assert.strictEqual(
        mainLabel.fills[0].boundVariables.color.id,
        variables.get(source.tree.children[0].fill).id
      );
      assert.deepStrictEqual(
        copy(mainLabel.getRangeFills(0, mainLabel.characters.length)),
        copy(mainLabel.fills)
      );
      assert.deepStrictEqual(copy(mainLabel.lineHeight), {
        unit: 'PERCENT',
        value: 120,
      });
      const fresh = main.createInstance();
      env.figma.currentPage.appendChild(fresh);
      const freshLabel = fresh.findAll(node => node.type === 'TEXT')[0];
      assert.strictEqual(freshLabel.textStyleId, style.id);
      assert.strictEqual(
        freshLabel.componentPropertyReferences.characters,
        labelKeys[0]
      );
      assert.strictEqual(
        freshLabel.getRangeFills(0, freshLabel.characters.length)[0]
          .boundVariables.color.id,
        variables.get(source.tree.children[0].fill).id
      );
      assert.deepStrictEqual(copy(freshLabel.lineHeight), {
        unit: 'PERCENT',
        value: 120,
      });
      // Only this newly created synthetic consumer is removed, before the next ordinary repeat.
      fresh.remove();
    }
  }
  console.log(
    'ok  real normalized exporter registry, canonical shared style, one suffixed Label key, per-corner/paint/geometry bindings, stable masters/properties and edited consumer control flow through2 ordinary repeats; native shared range/cache propagation remains unverified'
  );
  const unavailable = environment(nativeDoc);
  await importFoundation(unavailable, nativeDoc);
  unavailable.state.rejectedFonts.add('Roboto Bold');
  const initialSize = unavailable.state.nodes.size;
  const failed = await unavailable.call(
    'buildMangroveComponents',
    nativeDoc,
    'undrr',
    [family.id]
  );
  assert(failed.errors.some(value => value.includes('font')));
  assert.strictEqual(failed.createdNodeIds.length, 0);
  assert.strictEqual(unavailable.state.nodes.size, initialSize);
  console.log('ok  exact unavailable Bold font blocks canonical node creation');
}
main().catch(error => {
  console.error(`FAIL ${error.stack || error}`);
  process.exitCode = 1;
});
