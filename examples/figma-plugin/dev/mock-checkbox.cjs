#!/usr/bin/env node
/** Source and native API-contract checks. Real SVG paint still needs Figma review. */
'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const {
  buildCheckboxRecipes,
} = require('../../../scripts/figma-checkbox-recipes.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const families = buildCheckboxRecipes({
    root,
    modes: doc.modes,
    variables: doc.variables,
    styles: doc.styles,
  });
  doc.components.families = [
    ...doc.components.families.filter(f => f.id !== 'checkbox'),
    ...families,
  ];
  return doc;
}
function sourceChange(file, change, check) {
  const original = fs.readFileSync;
  fs.readFileSync = function (filename, ...args) {
    const result = original.call(this, filename, ...args);
    return typeof filename === 'string' && filename.endsWith(file)
      ? change(result)
      : result;
  };
  try {
    check();
  } finally {
    fs.readFileSync = original;
  }
}
function walk(node, call) {
  call(node);
  for (const child of node.children || []) walk(child, call);
}
const id = node => node.getSharedPluginData('orgundrrmangrove', 'mgKitId');
async function main() {
  const doc = document();
  const recipe = doc.components.families.find(f => f.id === 'checkbox');
  assert.equal(recipe.variants.length, 30);
  const initialCount = doc.variables.length;
  assert.deepEqual(
    buildCheckboxRecipes({
      root,
      modes: doc.modes,
      variables: doc.variables,
      styles: doc.styles,
    }),
    [recipe]
  );
  assert.equal(doc.variables.length, initialCount);
  const form = 'stories/Components/Forms/_form-base.scss';
  for (const change of [
    text =>
      text.replace(
        'border: 2px solid rgb(var(--mg-color-form-check));',
        'border: 3px solid rgb(var(--mg-color-form-check));'
      ),
    text => text.replace("d='M3.5 8l3 3 6-6'", "d='M3 8l3 3 6-6'"),
    text =>
      text.replace(
        '.mg-form-check__input--checkbox:checked {',
        '.mg-form-check__input--checkbox:checked {\n background-size: 24px;'
      ),
    text =>
      text.replace(
        '&__input {\n    appearance: none;',
        '&__input {\n    appearance: none;\n    flex-shrink: 0;'
      ),
    text =>
      text.replace(
        '&--checkbox {\n      border-radius: var(--mg-radius-form-input);',
        '&--checkbox {\n      border-radius: 0;'
      ),
    text =>
      text.replaceAll(
        'background-image: url("data:image/svg+xml,',
        'background-image: url("data:application/octet-stream,'
      ),
  ])
    sourceChange(form, change, () =>
      assert.throws(document, /Figma Checkbox recipe needs updating/)
    );
  sourceChange(
    'stories/Components/Forms/Checkbox/Checkbox.jsx',
    text => text.replace('type="checkbox"', 'type="radio"'),
    () => assert.throws(document, /anatomy changed/)
  );
  console.log(
    'ok  Checkbox source SVG/cascade/geometry guards and repeated exporter identity'
  );

  for (const variant of recipe.variants) {
    const controls = [];
    walk(variant.tree, node => {
      if (node.name === 'mg-form-check__input--checkbox') controls.push(node);
    });
    assert.equal(controls.length, 1);
    const input = controls[0],
      { Checked, State, Content } = variant.properties;
    assert.equal(
      input.stroke,
      Checked === 'True'
        ? 'color/form-check--checked'
        : State.startsWith('Invalid')
          ? 'color/red-900'
          : State === 'Disabled'
            ? 'color/neutral-400'
            : State === 'Hover'
              ? 'color/form-check--hover'
              : 'color/form-check'
    );
    assert.equal(
      input.children.length,
      Checked === 'False'
        ? 0
        : Content === 'Short'
          ? 1
          : State === 'Default'
            ? 3
            : 5
    );
    assert.equal(input.layout.clipsContent, true);
    for (const [index, tile] of input.children.entries()) {
      assert.equal(tile.type, 'SVG');
      assert.equal(tile.svg.assetId, 'form-check-checkbox-checkmark');
      assert.equal(tile.position.x, 2);
      assert.equal(tile.position.y, 2 + index * tile.layout.height);
      assert.equal(tile.layout.width, tile.layout.height);
      assert.match(tile.svg.markup, /stroke='#fff' stroke-width='2.5'/);
    }
  }
  console.log(
    'ok  Checkbox checked border precedence, exact SVG tiles and rounded clipping recipe'
  );

  const { svgEnvironment } = require('./mock-svg.cjs');
  const env = svgEnvironment(doc);
  const imported = await env.call(
    'importVariables',
    doc,
    ['undrr'],
    false,
    [],
    false
  );
  assert.deepEqual(copy(imported.errors), []);
  const built = await env.call('buildMangroveComponents', doc, 'undrr', [
    'checkbox',
  ]);
  assert.deepEqual(copy(built.errors), []);
  assert.equal(built.families.length, 1);
  const wrappers = [...env.state.nodes.values()].filter(
    n =>
      id(n).includes('family/checkbox/') &&
      n.type === 'FRAME' &&
      n.name.startsWith('Source checkmark tile')
  );
  assert(wrappers.length > 0);
  const short = wrappers.find(n =>
    id(n).includes('checkbox.true.default.after.short')
  );
  assert(short);
  assert.equal(short.width, 20);
  assert.equal(short.height, 20);
  assert.equal(short.x, 2);
  assert.equal(short.y, 2);
  assert.equal(short.children[0].strokeWeight, 3.125);
  const baseline = [...env.state.nodes.values()]
    .filter(n => id(n))
    .map(n => [id(n), n.id]);
  const set = env.state.nodes.get(built.families[0].setId);
  const properties = copy(set.componentPropertyDefinitions);
  const edited = [...env.state.nodes.values()].find(
    n =>
      n.type === 'INSTANCE' &&
      id(n).includes('review/checkbox/') &&
      n.componentProperties
  );
  assert(edited);
  const labelKey = Object.keys(edited.componentProperties).find(
    key => key.replace(/#[^#]+$/, '') === 'Label'
  );
  const visibilityKey = Object.keys(edited.componentProperties).find(
    key => key.replace(/#[^#]+$/, '') === 'Show label'
  );
  edited.setProperties({
    [labelKey]: 'Retain the edited choice',
    [visibilityKey]: false,
  });
  const repeat = await env.call('buildMangroveComponents', doc, 'undrr', [
    'checkbox',
  ]);
  assert.deepEqual(copy(repeat.errors), []);
  assert.equal(repeat.createdNodeIds.length, 0);
  for (const [key, nodeId] of baseline)
    assert.equal(id(env.state.nodes.get(nodeId)), key);
  assert.deepEqual(copy(set.componentPropertyDefinitions), properties);
  assert.equal(
    edited.componentProperties[labelKey].value,
    'Retain the edited choice'
  );
  assert.equal(edited.componentProperties[visibilityKey].value, false);
  assert.equal(short.children[0].strokeWeight, 3.125);
  console.log(
    'ok  native Checkbox SVG scale/position, stable wrapper/vector/component/property IDs and retained edits on repeat'
  );

  const {
    buildConnector,
  } = require('../../../scripts/build-figma-connector.cjs');
  const nonSvgFamily = doc.components.families.find(
    family => family.id === 'button'
  );
  assert(nonSvgFamily, 'Non-SVG Button connector fixture is missing');
  const nonSvg = await buildConnector({
    operation: 'build',
    doc,
    familyIds: ['button'],
    variantIds: [nonSvgFamily.variants[0].id],
  });
  assert.equal(nonSvg.svgEnabled, false);
  assert(
    !nonSvg.code.includes('createNodeFromSvg'),
    'Non-SVG connector retained the native SVG importer'
  );
  const connected = svgEnvironment(doc, { sharedOnly: true });
  const connectedImport = await connected.call(
    'importVariables',
    doc,
    ['undrr'],
    false,
    [],
    false
  );
  assert.deepEqual(copy(connectedImport.errors), []);
  const plainBuilt = await connected.runCode(nonSvg.code);
  assert.deepEqual(copy(plainBuilt.errors), []);
  assert.equal(connected.state.svgImportCalls.length, 0);
  const checked = recipe.variants.find(
    variant => variant.id === 'checkbox.true.default.after.short'
  );
  assert(checked, 'Checked Default Checkbox connector fixture is missing');
  const svgPayload = await buildConnector({
    operation: 'build',
    doc,
    familyIds: ['checkbox'],
    variantIds: [checked.id],
  });
  assert.equal(svgPayload.svgEnabled, true);
  assert(
    svgPayload.code.includes('createNodeFromSvg'),
    'Checked Checkbox connector removed its required SVG importer'
  );
  assert(svgPayload.characters <= 50000 && svgPayload.bytes <= 50000);
  const svgBuilt = await connected.runCode(svgPayload.code);
  assert.deepEqual(copy(svgBuilt.errors), []);
  assert.deepEqual(copy(svgBuilt.scope), {
    familyIds: ['checkbox'],
    variantIds: [checked.id],
  });
  const sourceSvg = [...connected.state.nodes.values()].find(
    node =>
      node.getSharedPluginData('orgundrrmangrove', 'mgSvgAsset') &&
      node.parent?.name === 'mg-form-check__input--checkbox'
  );
  assert(sourceSvg, 'Scoped Checkbox connector did not create its source SVG');
  // Geometry snapshots deliberately include the imported vector's ID, path,
  // position, stroke width, cap and join, not only the component wrapper ID.
  const vectorGeometry = () =>
    copy({
      wrapperId: sourceSvg.id,
      width: sourceSvg.width,
      height: sourceSvg.height,
      x: sourceSvg.x,
      y: sourceSvg.y,
      vectors: sourceSvg.children.map(node => ({
        id: node.id,
        type: node.type,
        paths: node.vectorPaths,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        strokeWeight: node.strokeWeight,
        strokeCap: node.strokeCap,
        strokeJoin: node.strokeJoin,
        strokes: node.strokes,
      })),
    });
  assert.equal(sourceSvg.width, 20);
  assert.equal(sourceSvg.children[0].strokeWeight, 3.125);
  assert.equal(sourceSvg.children[0].strokeCap, 'ROUND');
  assert.equal(sourceSvg.children[0].strokeJoin, 'ROUND');
  const firstGeometry = vectorGeometry();
  const nativeIds = [...connected.state.nodes.values()]
    .filter(node => !node.removed)
    .map(node => node.id)
    .sort();
  const imports = connected.state.svgImportCalls.length,
    scales = connected.state.svgScaleCalls.length;
  const svgRepeated = await connected.runCode(svgPayload.code);
  assert.deepEqual(copy(svgRepeated.errors), []);
  assert.equal(svgRepeated.createdNodeIds.length, 0);
  assert.deepEqual(
    [...connected.state.nodes.values()]
      .filter(node => !node.removed)
      .map(node => node.id)
      .sort(),
    nativeIds
  );
  assert.deepEqual(vectorGeometry(), firstGeometry);
  assert.equal(connected.state.svgImportCalls.length, imports);
  assert.equal(connected.state.svgScaleCalls.length, scales);
  console.log(
    `ok  scoped connector SVG capability excludes unused importer, checked Checkbox executes and repeats preserve native SVG IDs/geometry (${svgPayload.bytes} bytes)`
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
module.exports = { document };
