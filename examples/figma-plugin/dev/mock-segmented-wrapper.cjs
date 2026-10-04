#!/usr/bin/env node
/** Source/registry/builder contract tests. No native geometry or property propagation claims. */
'use strict';
const assert = require('assert');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const {
  buildFigmaVariables,
} = require('../../../scripts/build-figma-tokens.cjs');
const {
  buildSegmentedWrapperRecipes,
} = require('../../../scripts/figma-segmented-wrapper-recipes.cjs');
const { environment, importFoundation } = require(
  path.join(root, 'examples/figma-plugin/dev/mock-kit.cjs')
);
const copy = value => JSON.parse(JSON.stringify(value));
const id = (node, key = 'mgKitId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
const owned = env =>
  [...env.state.nodes.values()]
    .filter(node => {
      if (!id(node)) return false;
      for (let parent = node.parent; parent; parent = parent.parent)
        if (parent.type === 'INSTANCE') return false;
      return true;
    })
    .map(node => [id(node), node.id])
    .sort((a, b) => a[0].localeCompare(b[0]));
const familyId = 'segmented-control.full-width-below-medium';
function callSource(doc) {
  return buildSegmentedWrapperRecipes({
    root,
    ...doc,
    families: doc.components.families,
  });
}
async function main() {
  const doc = buildFigmaVariables();
  const family = doc.components.families.find(value => value.id === familyId);
  assert.strictEqual(doc.variables.length, 418);
  assert.strictEqual(family.variants.length, 4);
  assert.deepStrictEqual(
    family.variants.map(value => value.properties.Selection),
    ['None', 'Depth', 'Frequency', 'Exposure']
  );
  assert.strictEqual(
    family.variants[0].tree.children[0].id,
    'mg-segmented-control/mg-segmented-control__legend'
  );
  const seam = doc.variables.find(
    value => value.name === 'component/segmented-control/seam'
  );
  assert.deepStrictEqual(seam.scopes, ['GAP']);
  assert.deepStrictEqual(seam.values, {
    undrr: -1,
    delta: -1,
    irp: -1,
    mcr: -2,
    preventionweb: -1,
  });
  const styleCount = doc.styles.text.length,
    variables = copy(doc.variables);
  const repeated = callSource(doc);
  assert.strictEqual(repeated[0].variants.length, 4);
  assert.deepStrictEqual(doc.variables, variables);
  assert.strictEqual(doc.styles.text.length, styleCount);
  assert.strictEqual(
    family.variants[0].tree.children[0].textStyle,
    'component.body'
  );
  console.log(
    'ok source-backed four presets, existing shared body template, all-brand negative seam, idempotent helper and real registry normalization'
  );

  const env = environment(doc);
  await importFoundation(env, doc);
  const leafId = 'segmented-control.segment';
  const leafReport = await env.call('buildMangroveComponents', doc, 'undrr', [
    leafId,
  ]);
  assert.deepStrictEqual(copy(leafReport.errors), []);
  const leafOwned = owned(env);
  const report = await env.call('buildMangroveComponents', doc, 'undrr', [
    familyId,
  ]);
  assert.deepStrictEqual(copy(report.errors), []);
  for (const [key, nodeId] of leafOwned)
    assert.strictEqual(owned(env).find(value => value[0] === key)?.[1], nodeId);
  const wrapperReport = report.families.find(value => value.id === familyId);
  assert(wrapperReport, JSON.stringify(report.families));
  const set = env.state.nodes.get(wrapperReport.setId);
  const definitions = copy(set.componentPropertyDefinitions);
  const legendKey = Object.keys(definitions).find(
    key => key.split('#')[0] === 'Legend'
  );
  const visibleKey = Object.keys(definitions).find(
    key => key.split('#')[0] === 'Show legend'
  );
  assert.strictEqual(definitions[legendKey].type, 'TEXT');
  assert.strictEqual(definitions[visibleKey].type, 'BOOLEAN');
  const style = env.state.styles.find(
    value => id(value, 'mgStyleId') === 'component.body'
  );
  const seamNative = env.state.variables.find(
    value => value.name === seam.name
  );
  const componentSources = [];
  for (const dto of wrapperReport.variantIds) {
    const main = env.state.nodes.get(dto.nodeId),
      recipe = family.variants.find(value => value.id === dto.id);
    componentSources.push(main);
    assert.strictEqual(main.type, 'COMPONENT');
    assert.strictEqual(main.layoutMode, 'VERTICAL');
    assert.strictEqual(main.layoutSizingVertical, 'HUG');
    const [legend, rail] = main.children;
    assert.strictEqual(legend.textStyleId, style.id);
    assert.deepStrictEqual(copy(legend.fontName), {
      family: 'Roboto',
      style: 'Regular',
    });
    assert.deepStrictEqual(copy(legend.lineHeight), {
      unit: 'PIXELS',
      value: 24,
    });
    assert.strictEqual(
      legend.componentPropertyReferences.characters,
      legendKey
    );
    assert.strictEqual(legend.componentPropertyReferences.visible, visibleKey);
    assert.strictEqual(rail.layoutMode, 'HORIZONTAL');
    assert.strictEqual(rail.layoutSizingHorizontal, 'FILL');
    assert.strictEqual(rail.layoutSizingVertical, 'HUG');
    assert.strictEqual(rail.itemSpacing, -1);
    assert.strictEqual(rail.boundVariables.itemSpacing.id, seamNative.id);
    assert.strictEqual(rail.children.length, 3);
    for (let i = 0; i < 3; i++) {
      const nested = rail.children[i],
        expected = recipe.tree.children[1].children[i];
      assert.strictEqual(nested.type, 'INSTANCE');
      assert.strictEqual(nested.isExposedInstance, true);
      assert.strictEqual(nested.layoutSizingHorizontal, 'FILL');
      assert.strictEqual(nested.layoutSizingVertical, 'FILL');
      const mainLeaf = await nested.getMainComponentAsync();
      assert.strictEqual(
        id(mainLeaf),
        `family/${leafId}/variant/${leafId}.${expected.variant.Selected.toLowerCase()}.default.${expected.variant.Position.toLowerCase()}`
      );
      const key = Object.keys(nested.componentProperties).find(
        value => value.split('#')[0] === 'Label'
      );
      assert.strictEqual(
        nested.componentProperties[key].value,
        expected.overrides.Label
      );
      const label = nested.findAll(value => value.type === 'TEXT')[0];
      assert.strictEqual(label.textAutoResize, 'HEIGHT');
      assert.strictEqual(label.layoutSizingHorizontal, 'FILL');
      assert.strictEqual(label.layoutSizingVertical, 'HUG');
      assert.strictEqual(label.textAlignHorizontal, 'CENTER');
    }
  }
  const consumer = componentSources[0].createInstance();
  // Shared mock copies owned root tags into user clones. Clear only this synthetic root tag.
  consumer.setSharedPluginData('orgundrrmangrove', 'mgKitId', '');
  consumer.setPluginData('mgKitId', '');
  env.figma.currentPage.appendChild(consumer);
  consumer.setProperties({
    [legendKey]: 'Edited long legend for the source three-option rail',
    [visibleKey]: false,
  });
  const nested = consumer.children[1].children;
  const labels = ['Precipitation', 'Vulnerability', 'Displacement'];
  const nestedIds = nested.map(value => value.id),
    labelKeys = [];
  for (let i = 0; i < 3; i++) {
    const key = Object.keys(nested[i].componentProperties).find(
      value => value.split('#')[0] === 'Label'
    );
    labelKeys.push(key);
    nested[i].setProperties({ [key]: labels[i] });
  }
  const ownership = owned(env),
    consumerId = consumer.id;
  for (let pass = 0; pass < 2; pass++) {
    consumer.resize(pass === 0 ? 240 : 390, consumer.height);
    const width = consumer.width;
    const repeat = await env.call('buildMangroveComponents', doc, 'undrr', [
      familyId,
    ]);
    assert.deepStrictEqual(copy(repeat.errors), []);
    assert.strictEqual(repeat.createdNodeIds.length, 0);
    assert.deepStrictEqual(owned(env), ownership);
    assert.deepStrictEqual(copy(set.componentPropertyDefinitions), definitions);
    assert.strictEqual(consumer.id, consumerId);
    assert.strictEqual(consumer.width, width);
    assert.strictEqual(
      consumer.componentProperties[legendKey].value,
      'Edited long legend for the source three-option rail'
    );
    assert.strictEqual(consumer.componentProperties[visibleKey].value, false);
    for (let i = 0; i < 3; i++) {
      assert.strictEqual(nested[i].id, nestedIds[i]);
      assert.strictEqual(
        nested[i].componentProperties[labelKeys[i]].value,
        labels[i]
      );
    }
  }
  consumer.setProperties({ [visibleKey]: true });
  assert.strictEqual(consumer.componentProperties[visibleKey].value, true);
  console.log(
    'ok real dependency build, native INSTANCE/exposure/property contracts, shared legend style, inherited FILL/HUG and two zero-create ordinary repeats retain IDs/override values/root width'
  );

  for (const mutate of [
    value =>
      value.components.families.find(f => f.id === leafId).variants.pop(),
    value =>
      (value.components.families.find(
        f => f.id === leafId
      ).variants[0].tree.children[0].textStyleApplication = 'DIRECT'),
    value =>
      (value.styles.text.find(
        s => s.id === 'component.body'
      ).values.undrr.lineHeight.value = 25),
    value =>
      (value.variables.find(
        v => v.name === 'component/segmented-control/seam'
      ).type = 'STRING'),
    value =>
      value.variables.push(
        copy(
          value.variables.find(
            v => v.name === 'component/segmented-control/seam'
          )
        )
      ),
    value =>
      (value.variables.find(v => v.name === 'spacing/25').type = 'STRING'),
    value =>
      (value.components.families.find(
        f => f.id === leafId
      ).variants[0].tree.bindings.topRightRadius = 'radius/button'),
    value =>
      (value.components.families.find(
        f => f.id === leafId
      ).variants[0].tree.fill = 'color/button-background'),
    value =>
      (value.styles.text.find(
        s => s.id === 'component.segmented-control.segment'
      ).values.undrr.lineHeight.value = 100),
  ]) {
    const malformed = copy(doc);
    mutate(malformed);
    const before = copy({
      variables: malformed.variables,
      styles: malformed.styles,
      families: malformed.components.families,
    });
    assert.throws(
      () => callSource(malformed),
      /wrapper needs updating|probe needs updating/
    );
    assert.deepStrictEqual(
      {
        variables: malformed.variables,
        styles: malformed.styles,
        families: malformed.components.families,
      },
      before
    );
  }
  console.log(
    'ok nine source/shape/template/typed-role/duplicate guards reject before foundation mutations'
  );
  const { buildConnector, subsetDocument } = require(
    path.join(root, 'scripts/build-figma-connector.cjs')
  );
  const scopedEnv = environment(doc);
  await importFoundation(scopedEnv, doc);
  const bytes = [];
  for (const variant of family.variants) {
    const subset = subsetDocument(
      doc,
      'build',
      'undrr',
      [familyId],
      [variant.id]
    );
    const dependency = subset.components.families.find(
      value => value.id === leafId
    );
    assert.strictEqual(dependency.variants.length, 3);
    assert(
      dependency.variants.every(value => value.properties.State === 'Default')
    );
    const payload = await buildConnector({
      doc,
      operation: 'build',
      brandId: 'undrr',
      familyIds: [familyId],
      variantIds: [variant.id],
    });
    assert.strictEqual(payload.coincidentFocusEnabled, false);
    assert(payload.bytes <= 50000 && payload.characters <= 50000);
    bytes.push(payload.bytes);
    const first = await scopedEnv.runCode(payload.code);
    assert.deepStrictEqual(copy(first.errors), []);
    const repeat = await scopedEnv.runCode(payload.code);
    assert.deepStrictEqual(copy(repeat.errors), []);
    assert.strictEqual(repeat.createdNodeIds.length, 0);
  }
  console.log(
    `ok four explicit lossless wrapper batches ${Math.min(...bytes)}–${Math.max(...bytes)} bytes, exact three Default dependency leaves, false focus flag and zero-create VM repeats`
  );
  console.log(
    'LIMIT: shared mock does not measure text, run auto layout, mirror property values into text/visibility, regenerate nested topology on swaps or propagate later master edits. Native width/height/reappearance/paint/edited-fresh acceptance remains required.'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
module.exports = { main };
