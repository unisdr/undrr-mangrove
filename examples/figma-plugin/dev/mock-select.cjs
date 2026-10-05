#!/usr/bin/env node
/** Closed Select contracts with an exact bounded SVG fixture; no native rendering claim. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildSelectRecipes,
} = require('../../../scripts/figma-select-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = value => JSON.parse(JSON.stringify(value));
const id = (node, key = 'mgKitId') =>
  node.getSharedPluginData('orgundrrmangrove', key);
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  const families = buildSelectRecipes({
    root,
    modes: doc.modes,
    variables: doc.variables,
    styles: doc.styles,
  });
  doc.components.families = [
    ...doc.components.families.filter(f => f.id !== 'select'),
    ...families,
  ];
  return doc;
}
const find = (node, name) => node.findAll(child => child.name === name)[0];
function property(instance, name) {
  const key = Object.keys(instance.componentProperties).find(
    k => k.replace(/#[^#]+$/, '') === name
  );
  assert(key, `Missing actual ${name} property`);
  return key;
}
function installChevronFixture(env) {
  env.state.selectSvgCalls = [];
  env.figma.createNodeFromSvg = markup => {
    assert(
      /viewBox=['"]0 0 12 8['"]/.test(markup),
      'Mock only supports the source Select viewport'
    );
    assert(
      /d='M1.41 0L6 4.58 10.59 0 12 1.41l-6 6-6-6z'/.test(markup),
      'Mock only supports the exact source Select path'
    );
    assert(/fill='#1a1a1a'/.test(markup), 'Source colour must remain literal');
    env.state.selectSvgCalls.push(markup);
    const frame = env.figma.createFrame();
    frame.resize(12, 8);
    const vector = new frame.constructor('VECTOR');
    vector.resize(12, 7.41);
    vector.x = vector.y = 0;
    vector.vectorPaths = [
      {
        windingRule: 'NONZERO',
        data: 'M1.41 0L6 4.58 10.59 0 12 1.41l-6 6-6-6z',
      },
    ];
    vector.fills = [
      {
        type: 'SOLID',
        color: { r: 26 / 255, g: 26 / 255, b: 26 / 255 },
        opacity: 1,
        visible: true,
      },
    ];
    vector.strokes = [];
    frame.appendChild(vector);
    return frame;
  };
}
function create(doc, options) {
  const env = environment(doc, options);
  installChevronFixture(env);
  return env;
}
const identities = env =>
  [...env.state.nodes.values()]
    .filter(n => id(n))
    .map(n => [id(n), n.id])
    .sort((a, b) => a[0].localeCompare(b[0]));
function changedSource(file, replace, check) {
  const original = fs.readFileSync;
  fs.readFileSync = function (filename, ...args) {
    const result = original.call(this, filename, ...args);
    return typeof filename === 'string' && filename.endsWith(file)
      ? replace(result)
      : result;
  };
  try {
    check();
  } finally {
    fs.readFileSync = original;
  }
}
async function main() {
  const doc = document();
  const family = doc.components.families.find(f => f.id === 'select');
  const oldVariables = doc.variables.map(v => v.id);
  const oldStyles = doc.styles.text.map(s => s.id);
  const repeated = buildSelectRecipes({
    root,
    modes: doc.modes,
    variables: doc.variables,
    styles: doc.styles,
  });
  assert.deepStrictEqual(repeated, [family]);
  assert.deepStrictEqual(
    doc.variables.map(v => v.id),
    oldVariables
  );
  assert.deepStrictEqual(
    doc.styles.text.map(s => s.id),
    oldStyles
  );
  assert.deepStrictEqual(
    family.variants.map(v => v.properties.State),
    ['Default', 'Focus', 'Invalid', 'InvalidFocus', 'Disabled']
  );
  const opacityName = 'component/select/browser-disabled-opacity';
  const opacity = doc.variables.find(variable => variable.name === opacityName);
  assert.deepStrictEqual(opacity.scopes, ['OPACITY']);
  assert.strictEqual(opacity.observation.computedValue, 0.7);
  assert.strictEqual(opacity.observation.origin, 'user-agent');
  assert.strictEqual(opacity.observation.authoredInSource, false);
  assert.strictEqual(opacity.observation.version, '153.0.8010.47');
  assert.strictEqual(opacity.observation.platform, 'macOS');
  assert.strictEqual(
    opacity.source.file,
    'stories/Components/Forms/Select/Select.jsx'
  );
  assert(opacity.source.line > 0);
  for (const mode of doc.modes) assert.strictEqual(opacity.values[mode.id], 70);
  for (const variant of family.variants) {
    const control = variant.tree.children.find(n => n.id === 'control');
    assert.strictEqual(control.children[0].characters, 'Select an option');
    assert(!control.children[0].characters.includes('\n'));
    assert.strictEqual(control.children[0].textStyle, 'component.input');
    assert.strictEqual(
      control.children[1].children[0].svg.monochrome,
      undefined
    );
    assert.strictEqual(control.children[1].children[0].layout.width, 12);
    assert.strictEqual(control.children[1].children[0].layout.height, 8);
  }
  for (const [file, replace] of [
    [
      '/stories/Components/Forms/_form-base.scss',
      s => s.replace('M1.41 0L6 4.58', 'M1.41 0L6 4.59'),
    ],
    [
      '/stories/Components/Forms/_form-base.scss',
      s =>
        s.replace(
          'background-position: right mg-rem(6.25) center;',
          'background-position: right mg-rem(7) center;'
        ),
    ],
    [
      '/stories/Components/Forms/Select/Select.jsx',
      s =>
        s.replace(
          "error && 'mg-form-select--error'",
          "error && 'mg-form-select--invalid'"
        ),
    ],
  ])
    changedSource(file, replace, () =>
      assert.throws(document, /needs updating/)
    );
  const incompatible = copy(doc);
  incompatible.styles.text.find(
    s => s.id === 'component.input'
  ).values.undrr.lineHeight.value = 150;
  assert.throws(
    () => buildSelectRecipes({ root, ...incompatible }),
    /differs from Select source/
  );
  console.log(
    'ok  five short-value source states, exact SVG/source guards, exact shared typography and repeat exporter identities'
  );

  const env = create(doc, {
    rejectedFonts: ['Roboto Condensed Regular', 'Roboto Condensed Bold'],
  });
  await importFoundation(env, doc);
  const built = await env.call('buildMangroveComponents', doc, 'undrr', [
    'select',
  ]);
  assert.deepStrictEqual(copy(built.errors), []);
  const result = built.families.find(f => f.id === 'select');
  assert.strictEqual(result.variantIds.length, 5);
  assert.strictEqual(env.state.selectSvgCalls.length, 5);
  const variables = new Map(env.state.variables.map(v => [v.name, v]));
  const paint = (node, field, name) =>
    assert.strictEqual(
      node[field][0].boundVariables.color.id,
      variables.get(name).id
    );
  for (const variant of result.variantIds) {
    const component = env.state.nodes.get(variant.nodeId);
    const state = family.variants.find(v => v.id === variant.id).properties
      .State;
    const disabled = state === 'Disabled',
      focused = state.endsWith('Focus'),
      invalid = state.startsWith('Invalid');
    const control = find(component, 'mg-form-select');
    assert.strictEqual(component.width, 320);
    // The shared mock has no auto-layout engine. Verify the native sizing
    // contract and endpoint equation; rendered320/240 widths need Figma.
    assert.strictEqual(control.layoutSizingHorizontal, 'FILL');
    assert.strictEqual(control.height, 46);
    assert.strictEqual(component.opacity, 1);
    assert.strictEqual(control.opacity, disabled ? 0.7 : 1);
    assert.strictEqual(
      control.boundVariables.opacity?.id,
      disabled ? variables.get(opacityName).id : undefined
    );
    for (const child of control.findAll(() => true)) {
      assert.strictEqual(
        child.opacity,
        1,
        'Control opacity must compose once over its descendants'
      );
      assert.strictEqual(child.boundVariables.opacity, undefined);
    }
    for (const name of ['mg-form-label', 'mg-form-label__text', 'mg-form-help'])
      assert.strictEqual(
        find(component, name).opacity,
        1,
        'Sibling label/help must not be dimmed'
      );
    const value = find(component, 'mg-form-select__value');
    assert.deepStrictEqual(copy(value.fontName), {
      family: 'Roboto',
      style: 'Regular',
    });
    assert.strictEqual(value.fontSize, 16);
    assert.deepStrictEqual(copy(value.lineHeight), {
      unit: 'PERCENT',
      value: 115,
    });
    paint(
      value,
      'fills',
      disabled ? 'color/neutral-400' : 'component/text-input/browser-fieldtext'
    );
    paint(
      control,
      'fills',
      disabled
        ? 'color/white'
        : focused
          ? 'form-input/background--focus'
          : 'form-input/background'
    );
    paint(
      control,
      'strokes',
      disabled
        ? 'color/neutral-400'
        : focused
          ? 'color/form-focus'
          : invalid
            ? 'color/red-900'
            : 'form-input/border-color'
    );
    assert.strictEqual(Boolean(control.effectStyleId), focused);
    assert.strictEqual(control.paddingRight, 20);
    const chevron = find(component, 'Source Select chevron viewport');
    assert.strictEqual(chevron.width, 12);
    assert.strictEqual(chevron.height, 8);
    assert.strictEqual(chevron.x, control.width - 12 - 7.25);
    assert.strictEqual(chevron.y, (46 - 8) / 2);
    assert.deepStrictEqual(copy(chevron.constraints), {
      horizontal: 'MAX',
      vertical: 'CENTER',
    });
    assert.strictEqual(chevron.layoutPositioning, 'ABSOLUTE');
    const svg = find(component, 'Source inline chevron');
    const meta = JSON.parse(id(svg, 'mgSvgAsset'));
    assert.strictEqual(meta.assetId, 'form-select-chevron');
    assert.deepStrictEqual(meta.paintPolicy, {});
    assert.strictEqual(svg.width, 12);
    assert.strictEqual(svg.height, 8);
    const vector = svg.children[0];
    assert.strictEqual(vector.type, 'VECTOR');
    assert.deepStrictEqual(copy(vector.fills[0].color), {
      r: 26 / 255,
      g: 26 / 255,
      b: 26 / 255,
    });
    assert.strictEqual(vector.fills[0].boundVariables, undefined);
    assert.strictEqual(
      find(component, 'Invalid message source state').visible,
      invalid
    );
    assert.strictEqual(
      find(component, 'mg-form-label--required').visible,
      false
    );
  }
  console.log(
    'ok  five native mock faces retain source paints, Regular115% type, guarded InvalidFocus, exact original-colour SVG and absolute geometry'
  );

  const review = [...env.state.nodes.values()].find(
    n => id(n) === 'review/select/specimen/closed-240/instance'
  );
  assert(review);
  assert.strictEqual(review.width, 240);
  assert.strictEqual(
    review.componentProperties[property(review, 'Value')].value,
    'Depth'
  );
  for (const name of [
    'Label',
    'Value',
    'Help text',
    'Error message',
    'Show label',
    'Show help',
    'Required',
    'Show error',
  ])
    assert(property(review, name));
  const narrowControl = find(review, 'mg-form-select');
  assert.strictEqual(narrowControl.layoutSizingHorizontal, 'FILL');
  const narrowChevron = find(review, 'Source Select chevron viewport');
  assert.strictEqual(narrowChevron.x, narrowControl.width - 12 - 7.25);
  assert.strictEqual(narrowChevron.y, 19);
  console.log(
    'ok  fresh240 consumer uses short selected Value and exposed TEXT/BOOLEAN property IDs without adding a Filled paint variant'
  );

  review.setProperties({
    [property(review, 'Label')]: 'My category',
    [property(review, 'Value')]: 'Exposure',
    [property(review, 'Help text')]: 'My help',
    [property(review, 'Error message')]: 'My error',
    [property(review, 'Show help')]: false,
    [property(review, 'Required')]: true,
  });
  review.resize(260, review.height);
  const originalIds = identities(env);
  const defs = copy(
    env.state.nodes.get(result.setId).componentPropertyDefinitions
  );
  const styleIds = env.state.styles.map(s => [id(s, 'mgStyleId'), s.id]);
  const svgIds = result.variantIds.map(
    v => find(env.state.nodes.get(v.nodeId), 'Source inline chevron').id
  );
  const changed = copy(doc);
  for (const variant of changed.components.families.find(f => f.id === 'select')
    .variants)
    variant.tree.children.find(n => n.id === 'control').children[0].characters =
      'Depth';
  const repeat = await env.call('buildMangroveComponents', changed, 'undrr', [
    'select',
  ]);
  assert.deepStrictEqual(copy(repeat.errors), []);
  assert.strictEqual(repeat.createdNodeIds.length, 0);
  assert.deepStrictEqual(identities(env), originalIds);
  assert.deepStrictEqual(
    copy(env.state.nodes.get(result.setId).componentPropertyDefinitions),
    defs
  );
  assert.deepStrictEqual(
    env.state.styles.map(s => [id(s, 'mgStyleId'), s.id]),
    styleIds
  );
  assert.deepStrictEqual(
    result.variantIds.map(
      v => find(env.state.nodes.get(v.nodeId), 'Source inline chevron').id
    ),
    svgIds
  );
  for (const [name, value] of Object.entries({
    Label: 'My category',
    Value: 'Exposure',
    'Help text': 'My help',
    'Error message': 'My error',
    'Show help': false,
    Required: true,
  }))
    assert.strictEqual(
      review.componentProperties[property(review, name)].value,
      value
    );
  assert.strictEqual(review.width, 260);
  assert.strictEqual(env.state.selectSvgCalls.length, 5);
  const disabledMain = env.state.nodes.get(
    result.variantIds.find(v => v.id === 'select.disabled').nodeId
  );
  assert.strictEqual(find(disabledMain, 'mg-form-select').opacity, 0.7);
  assert.strictEqual(
    find(disabledMain, 'Source inline chevron').children[0].opacity,
    1
  );
  for (const variant of result.variantIds)
    assert.strictEqual(
      find(env.state.nodes.get(variant.nodeId), 'mg-form-select__value')
        .characters,
      'Depth'
    );
  console.log(
    'ok  changed short seed updates mains while retaining set/variant/property/vector/style identities and edited consumer content/booleans/width'
  );

  const missing = create(doc);
  await importFoundation(missing, doc);
  missing.state.rejectedFonts.add('Roboto Regular');
  const before = [...missing.state.nodes.keys()];
  const blocked = await missing.call('buildMangroveComponents', doc, 'undrr', [
    'select',
  ]);
  assert(blocked.errors.some(e => e.includes('Roboto Regular')));
  assert.deepStrictEqual([...missing.state.nodes.keys()], before);
  assert.strictEqual(missing.state.selectSvgCalls.length, 0);
  console.log(
    'ok  unavailable exact Regular blocks before canvas/SVG mutation; unrelated Condensed failure does not block Select'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
module.exports = { document, main };
