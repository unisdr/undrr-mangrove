#!/usr/bin/env node
/** Source cascade, native shape and identity checks. This mock does not render. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = value => JSON.parse(JSON.stringify(value));
const identity = (asset, key = 'mgKitId') =>
  asset.getSharedPluginData('orgundrrmangrove', key);
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const {
    buildChoiceRecipes,
  } = require('../../../scripts/figma-choice-recipes.cjs');
  const families = buildChoiceRecipes({
    root,
    modes: doc.modes,
    variables: doc.variables,
    styles: doc.styles,
  });
  const ids = new Set(families.map(family => family.id));
  doc.components.families = [
    ...doc.components.families.filter(family => !ids.has(family.id)),
    ...families,
  ];
  return doc;
}
const recipe = doc =>
  doc.components.families.find(family => family.id === 'radio');
function walk(node, callback) {
  callback(node);
  for (const child of node.children || []) walk(child, callback);
}
function leaf(component, property) {
  const nodes = component.findAll(
    node =>
      node.type === 'TEXT' &&
      node.componentPropertyReferences?.characters?.replace(/#[^#]+$/, '') ===
        property
  );
  assert.strictEqual(
    nodes.length,
    1,
    `${property} must have exactly one text node`
  );
  return nodes[0];
}
function branch(node, component) {
  while (node.parent !== component) node = node.parent;
  return node;
}
function owned(env) {
  return [...env.state.nodes.values()]
    .filter(node => identity(node))
    .map(node => [identity(node), node.id])
    .sort((a, b) => a[0].localeCompare(b[0]));
}
function property(node, name) {
  const key = Object.keys(node.componentProperties).find(
    key => key.replace(/#[^#]+$/, '') === name
  );
  assert(key, `Missing ${name} on ${node.name}`);
  return key;
}
function changedSource(file, change, check) {
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
async function build(doc, brand = 'undrr') {
  const env = environment(doc);
  const imported = await env.call(
    'importVariables',
    doc,
    [brand],
    false,
    [],
    false
  );
  assert.strictEqual(imported.errors.length, 0, imported.errors.join('\n'));
  const result = await env.call('buildMangroveComponents', doc, brand, [
    'radio',
  ]);
  assert.strictEqual(result.errors.length, 0, result.errors.join('\n'));
  return { env, result };
}
async function main() {
  const doc = document();
  assert.strictEqual(recipe(doc).variants.length, 30);
  const counts = [
    doc.variables.length,
    doc.styles.text.length,
    doc.styles.effect.length,
  ];
  const {
    buildChoiceRecipes,
  } = require('../../../scripts/figma-choice-recipes.cjs');
  assert.deepStrictEqual(
    buildChoiceRecipes({
      root,
      modes: doc.modes,
      variables: doc.variables,
      styles: doc.styles,
    }),
    [recipe(doc)]
  );
  assert.deepStrictEqual(counts, [
    doc.variables.length,
    doc.styles.text.length,
    doc.styles.effect.length,
  ]);
  const form = '/stories/Components/Forms/_form-base.scss';
  changedSource(
    form,
    text =>
      text.replace(
        'border: 2px solid rgb(var(--mg-color-form-check));',
        'border: 4px solid rgb(var(--mg-color-form-check));'
      ),
    () => assert.throws(document, /needs updating|no longer matches|changed/i)
  );
  changedSource(
    form,
    text =>
      text.replace(
        'inset 0 0 0 3px rgb(var(--mg-color-white));',
        'inset 0 0 0 5px rgb(var(--mg-color-white));'
      ),
    () => assert.throws(document, /needs updating|no longer matches|changed/i)
  );
  changedSource(
    '/stories/Components/Forms/Radio/Radio.jsx',
    text => text.replace('{error && errorText && (', '{errorText && ('),
    () => assert.throws(document, /needs updating|no longer matches|changed/i)
  );
  changedSource(
    form,
    text => {
      const start = text.indexOf('.mg-form-check {');
      const prefix = text.slice(0, start);
      const radio = text.slice(start);
      return (
        prefix +
        radio.replace(
          /(    &--disabled \{[\s\S]*?\n    \})\s*(    &--error \{[\s\S]*?\n    \})/,
          '$2\n\n$1'
        )
      );
    },
    () => assert.throws(document, /source-order cascade changed/)
  );
  changedSource(
    form,
    text =>
      text.replace(
        'inset 0 0 0 3px rgb(var(--mg-color-white)),\n    0 0 0 var(--mg-focus-ring-offset)',
        'inset 0 0 0 3px rgb(var(--mg-color-white)),\n    0 0 0 var(--mg-focus-ring-width)'
      ),
    () => assert.throws(document, /checked-focus inset\/separator changed/)
  );
  changedSource(
    form,
    text => text.replace('padding: 0 7px;', 'padding: 0 9px;'),
    () => assert.throws(document, /label typography, colour or padding changed/)
  );
  changedSource(
    form,
    text =>
      text.replace(
        'appearance: none;\n    border: 2px solid rgb(var(--mg-color-form-check));',
        'appearance: none;\n    flex-shrink: 0;\n    border: 2px solid rgb(var(--mg-color-form-check));'
      ),
    () => assert.throws(document, /flex sizing changed/)
  );
  console.log(
    'ok  Radio source geometry, invalid/disabled cascade order, checked-focus separator, label padding, flex sizing and conditional error guards'
  );
  const { env, result } = await build(doc);
  const family = result.families.find(family => family.id === 'radio');
  assert.strictEqual(family.variantIds.length, 30);
  const variables = new Map(
    env.state.variables.map(variable => [variable.name, variable])
  );
  const paint = (node, field, name) =>
    assert.strictEqual(
      node[field][0].boundVariables.color.id,
      variables.get(name).id,
      `${node.name} ${field} must bind ${name}`
    );
  const byId = new Map(
    recipe(doc).variants.map(variant => [variant.id, variant])
  );
  for (const entry of family.variantIds) {
    const spec = byId.get(entry.id);
    const { Checked, State, LabelPosition, Content } = spec.properties;
    const checked = Checked === 'True';
    const invalid = State.startsWith('Invalid');
    const disabled = State.includes('Disabled');
    const focused = State.includes('Focus');
    const hovered = State === 'Hover';
    const narrow = Content === 'LongNarrow';
    const component = env.state.nodes.get(entry.nodeId);
    assert.strictEqual(component.layoutMode, 'HORIZONTAL');
    assert.strictEqual(component.counterAxisAlignItems, 'CENTER');
    assert.strictEqual(component.minHeight, 40);
    const ellipses = component.findAll(node => node.type === 'ELLIPSE');
    assert.strictEqual(ellipses.length, 1);
    const input = ellipses[0];
    assert.strictEqual(input.children.length, 0);
    assert.strictEqual(input.layoutMode, 'NONE');
    assert.strictEqual(input.height, 24);
    assert.strictEqual(
      input.width,
      narrow ? (invalid ? 8.484375 : 11.140625) : 24
    );
    assert.strictEqual(input.strokeWeight, 2);
    assert.strictEqual(input.strokeAlign, 'INSIDE');
    paint(
      input,
      'strokes',
      invalid
        ? 'color/red-900'
        : disabled
          ? 'color/neutral-400'
          : hovered
            ? 'color/form-check--hover'
            : 'color/form-check'
    );
    if (checked) {
      paint(input, 'fills', 'color/form-check--checked');
      const style = env.state.styles.find(
        style => style.id === input.effectStyleId
      );
      assert.strictEqual(
        identity(style, 'mgStyleId'),
        'component.radio.checked-inset'
      );
      assert.strictEqual(input.effects.length, 1);
      const effect = input.effects[0];
      assert.strictEqual(effect.type, 'INNER_SHADOW');
      assert.strictEqual(effect.radius, 0);
      assert.strictEqual(effect.spread, 5);
      assert.strictEqual(
        variables.get('component/radio/checked-inset').resolveForConsumer(input)
          .value,
        3
      );
      assert.strictEqual(
        effect.boundVariables.spread.id,
        variables.get('component/radio/native-checked-inset-spread').id
      );
      assert.deepStrictEqual(effect.offset, { x: 0, y: 0 });
      assert.strictEqual(
        effect.boundVariables.color.id,
        variables.get('color/white').id
      );
    } else {
      assert.strictEqual(input.effectStyleId, '');
      assert.strictEqual(input.effects.length, 0);
      assert(
        input.fills.length === 0 ||
          input.fills.every(fill => fill.opacity === 0)
      );
    }
    const label = leaf(component, 'Label');
    const error = leaf(component, 'Error');
    assert.strictEqual(label.fontName.family, 'Roboto');
    assert.strictEqual(label.fontName.style, 'Regular');
    assert.strictEqual(label.fontSize, 16);
    assert.strictEqual(label.lineHeight.value, 24);
    paint(label, 'fills', 'color/text');
    paint(error, 'fills', 'color/red-900');
    assert.strictEqual(error.fontSize, 16);
    assert.strictEqual(error.lineHeight.value, 24);
    const labelBranch = branch(label, component);
    const inputBranch = branch(input, component);
    const errorBranch = branch(error, component);
    assert.strictEqual(labelBranch.paddingLeft, 7);
    assert.strictEqual(labelBranch.paddingRight, 7);
    const labelIndex = component.children.indexOf(labelBranch);
    const inputIndex = component.children.indexOf(inputBranch);
    assert.strictEqual(labelIndex < inputIndex, LabelPosition === 'Before');
    assert(component.children.indexOf(errorBranch) > labelIndex);
    assert(component.children.indexOf(errorBranch) > inputIndex);
    assert.strictEqual(errorBranch.visible, invalid);
    assert.strictEqual(errorBranch.paddingTop, 2.5);
    assert.strictEqual(labelBranch.visible, true);
    if (narrow) {
      assert.strictEqual(component.width, 240);
      assert.strictEqual(labelBranch.width, invalid ? 148.921875 : 228.859375);
      assert.strictEqual(label.textAutoResize, 'HEIGHT');
      assert.strictEqual(label.layoutSizingHorizontal, 'FILL');
    }
    const rings = inputBranch.findAll(node =>
      node.name.startsWith('mg-focus-ring /')
    );
    assert.strictEqual(
      rings.filter(node => node.visible).length,
      focused ? 2 : 0
    );
    if (focused) {
      assert.strictEqual(inputBranch.clipsContent, false);
      const outer = rings.find(node => node.name.endsWith('coloured outline'));
      const separator = rings.find(node =>
        node.name.endsWith('neutral separator')
      );
      paint(outer, 'strokes', 'color/focus-ring');
      paint(separator, 'strokes', 'color/neutral-0');
      assert.strictEqual(outer.layoutPositioning, 'ABSOLUTE');
      assert.strictEqual(separator.layoutPositioning, 'ABSOLUTE');
      assert.strictEqual(outer.strokeWeight, 2);
      assert.strictEqual(separator.strokeWeight, 2);
      assert.strictEqual(input.effectStyleId !== '', checked);
    }
  }
  console.log(
    'ok  Radio checked/state/label-order cascade, native leaf ellipses, independent white inset and outward focus, horizontal error and bounded narrow masters'
  );
  const review = [...env.state.nodes.values()].find(
    node =>
      node.type === 'INSTANCE' &&
      identity(node).startsWith('review/radio/specimen/') &&
      Object.keys(node.componentProperties).some(key =>
        key.startsWith('Label#')
      )
  );
  assert(review);
  review.setProperties({
    [property(review, 'Label')]: 'Keep the designer label',
    [property(review, 'Error')]: 'Keep the designer error',
    [property(review, 'Show label')]: false,
    [property(review, 'Show error')]: false,
  });
  const ids = owned(env);
  const definitions = copy(
    env.state.nodes.get(family.setId).componentPropertyDefinitions
  );
  const second = await env.call('buildMangroveComponents', doc, 'undrr', [
    'radio',
  ]);
  assert.strictEqual(second.errors.length, 0, second.errors.join('\n'));
  assert.strictEqual(second.createdNodeIds.length, 0);
  assert.deepStrictEqual(owned(env), ids);
  assert.deepStrictEqual(second.families, result.families);
  assert.deepStrictEqual(
    env.state.nodes.get(family.setId).componentPropertyDefinitions,
    definitions
  );
  for (const [name, value] of [
    ['Label', 'Keep the designer label'],
    ['Error', 'Keep the designer error'],
    ['Show label', false],
    ['Show error', false],
  ])
    assert.strictEqual(
      review.componentProperties[property(review, name)].value,
      value
    );
  console.log(
    'ok  repeated Radio set/variant/child/property identities retain edited text and visibility properties'
  );
  const mcr = await build(doc, 'mcr');
  const branded = mcr.result.families.find(family => family.id === 'radio');
  const brandedInput = mcr.env.state.nodes
    .get(branded.variantIds[0].nodeId)
    .findAll(node => node.type === 'ELLIPSE')[0];
  assert.strictEqual(brandedInput.strokeWeight, 2);
  const border = mcr.env.state.variables.find(
    variable => variable.id === brandedInput.strokes[0].boundVariables.color.id
  );
  assert.strictEqual(border.name, 'color/form-check');
  const brandMode = mcr.env.state.collections[0].modes[0].modeId;
  assert.strictEqual(
    mcr.env.state.nodes.get(branded.setId).parent.explicitVariableModes[
      mcr.env.state.collections[0].id
    ],
    brandMode
  );
  console.log(
    'ok  alternate brand binds Radio form-check roles while retaining source literal 2px border'
  );
  for (const mutate of [
    node => {
      node.children = [
        {
          type: 'FRAME',
          id: 'illegal-child',
          name: 'Illegal child',
          children: [],
        },
      ];
    },
    node => {
      node.layout.mode = 'HORIZONTAL';
    },
    node => {
      node.layout.padding = { block: 'spacing/0', inline: 'spacing/0' };
    },
    node => {
      node.bindings.cornerRadius = 'radius/form-input';
    },
    node => {
      node.layout.gap = 'spacing/100';
    },
    node => {
      node.layout.wrap = 'WRAP';
    },
    node => {
      node.layout.width = 'HUG';
    },
  ]) {
    const bad = copy(doc);
    let ellipse;
    walk(recipe(bad).variants[0].tree, node => {
      if (node.type === 'ELLIPSE') ellipse = node;
    });
    mutate(ellipse);
    const blocked = environment(bad);
    await importFoundation(blocked, bad);
    const before = {
      nodes: blocked.state.nodes.size,
      styles: blocked.state.styles.length,
    };
    const failure = await blocked.call(
      'buildMangroveComponents',
      bad,
      'undrr',
      ['radio']
    );
    assert(
      failure.errors.some(error => /Ellipse recipes are leaf/.test(error)),
      failure.errors.join('\n')
    );
    assert.strictEqual(failure.families.length, 0);
    assert.strictEqual(blocked.state.nodes.size, before.nodes);
    assert.strictEqual(blocked.state.styles.length, before.styles);
  }
  console.log(
    'ok  invalid Ellipse children, frame layout, padding, gap, wrap, HUG sizing and radius bindings block before styles or nodes mutate'
  );
  // FILL is valid on a leaf that is a child of auto layout; unlike HUG it must
  // not be rejected merely because this shape cannot own an auto layout.
  const fill = copy(doc);
  walk(recipe(fill).variants[0].tree, node => {
    if (node.type === 'ELLIPSE') node.layout.width = 'FILL';
  });
  const filled = await build(fill);
  const fillFamily = filled.result.families.find(
    family => family.id === 'radio'
  );
  const fillShape = filled.env.state.nodes
    .get(fillFamily.variantIds[0].nodeId)
    .findAll(node => node.type === 'ELLIPSE')[0];
  assert.strictEqual(fillShape.layoutSizingHorizontal, 'FILL');
  assert.strictEqual(fillShape.parent.layoutMode, 'VERTICAL');
  const mismatch = environment(doc);
  await importFoundation(mismatch, doc);
  const size = mismatch.state.variables.find(
    variable => variable.name === 'component/radio/control-size'
  );
  assert(size);
  size.resolvedType = 'COLOR';
  const old = {
    nodes: mismatch.state.nodes.size,
    styles: mismatch.state.styles.length,
  };
  const typeFailure = await mismatch.call(
    'buildMangroveComponents',
    doc,
    'undrr',
    ['radio']
  );
  assert(
    typeFailure.errors.some(error => /FLOAT/.test(error)),
    typeFailure.errors.join('\n')
  );
  assert.strictEqual(typeFailure.families.length, 0);
  assert.strictEqual(mismatch.state.nodes.size, old.nodes);
  assert.strictEqual(mismatch.state.styles.length, old.styles);
  console.log(
    'ok  an existing wrong-type geometry variable blocks Radio before style or canvas writes'
  );
  const missing = environment(doc);
  await importFoundation(missing, doc);
  missing.state.rejectedFonts.add('Roboto Regular');
  const before = {
    nodes: missing.state.nodes.size,
    styles: missing.state.styles.length,
  };
  const failure = await missing.call('buildMangroveComponents', doc, 'undrr', [
    'radio',
  ]);
  assert(failure.errors.some(error => error.includes('Roboto Regular')));
  assert.strictEqual(failure.families.length, 0);
  assert.strictEqual(missing.state.nodes.size, before.nodes);
  assert.strictEqual(missing.state.styles.length, before.styles);
  console.log(
    'ok  exact Radio Regular font failure prevents partial component creation'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
module.exports = { main };
