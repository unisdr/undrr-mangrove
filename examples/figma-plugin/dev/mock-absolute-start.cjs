#!/usr/bin/env node
/** Fixed source glyph START/START tests. Native rendering remains open. */
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const { environment } = require('./mock-kit.cjs'),
  { buildConnector } = require('../../../scripts/build-figma-connector.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const identity = node =>
  node.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  for (const [name, value] of [
    ['x', 0],
    ['y', -10],
  ])
    doc.variables.push({
      id: 'component.absolute-start.' + name,
      name: 'component/absolute-start/' + name,
      type: 'FLOAT',
      scopes: ['ALL_SCOPES'],
      values: Object.fromEntries(doc.modes.map(mode => [mode.id, value])),
    });
  const base = copy(
    doc.styles.text.find(
      style =>
        style.values.undrr.fontName.family === 'Roboto' &&
        style.values.undrr.fontName.style === 'Bold'
    )
  );
  base.id = 'component.absolute-start.mark';
  base.name = 'Mangrove/test/absolute-start/mark';
  for (const value of Object.values(base.values)) {
    value.fontName.style = 'Bold Italic';
    value.fontSize = 48;
    value.lineHeight = { unit: 'PERCENT', value: 115 };
  }
  base.bindings.fontSize = 'font-size/1000';
  doc.styles.text.push(base);
  doc.components.families = [
    {
      id: 'absolute-start-test',
      name: 'Absolute START test',
      kind: 'component-set',
      review: { genericLabels: false, preserveVariantSizing: true },
      variants: [
        {
          id: 'absolute-start-test.default',
          name: 'State=Default',
          properties: { State: 'Default' },
          tree: {
            id: 'root',
            type: 'FRAME',
            layout: { mode: 'VERTICAL', width: 200, height: 100 },
            children: [
              {
                id: 'mark',
                type: 'TEXT',
                characters: '“',
                textProperty: 'Opening mark',
                textStyle: base.id,
                fill: 'color/text',
                layout: { width: 19.125, height: 55.2 },
                absolute: {
                  horizontal: 'START',
                  vertical: 'START',
                  offsetX: 'component/absolute-start/x',
                  offsetY: 'component/absolute-start/y',
                },
              },
            ],
          },
        },
      ],
    },
  ];
  return doc;
}
const snapshot = env =>
  JSON.stringify({
    nodes: [...env.state.nodes.values()].map(node => [
      node.id,
      identity(node),
      node.x,
      node.y,
      node.width,
      node.height,
      node.constraints,
    ]),
    styles: env.state.styles.map(style => [
      style.id,
      style.name,
      style.fontName,
    ]),
  });
async function main() {
  for (const mode of document().modes) {
    const doc = document(),
      env = environment(doc, { sharedOnly: true });
    await env.call('importVariables', doc, [mode.id], false, [], false);
    let report = await env.call('buildMangroveComponents', doc, mode.id, [
      'absolute-start-test',
    ]);
    assert.strictEqual(report.errors.length, 0, report.errors.join('\n'));
    const mark = [...env.state.nodes.values()].find(
      node =>
        identity(node) ===
        'family/absolute-start-test/variant/absolute-start-test.default/mark'
    );
    assert(mark);
    assert.strictEqual(mark.x, 0);
    assert.strictEqual(mark.y, -10);
    assert.deepStrictEqual(copy(mark.constraints), {
      horizontal: 'MIN',
      vertical: 'MIN',
    });
    assert.strictEqual(mark.characters, '“');
    assert.strictEqual(mark.width, 19.125);
    assert.strictEqual(mark.height, 55.2);
    const consumer = mark.parent.createInstance(),
      key = Object.keys(consumer.componentProperties).find(key =>
        key.startsWith('Opening mark')
      );
    consumer.setProperties({ [key]: '!' });
    const before = snapshot(env);
    for (let i = 0; i < 2; i++) {
      report = await env.call('buildMangroveComponents', doc, mode.id, [
        'absolute-start-test',
      ]);
      assert.strictEqual(report.errors.length, 0, report.errors.join('\n'));
      assert.strictEqual(report.createdNodeIds.length, 0);
      assert.strictEqual(snapshot(env), before);
      assert.strictEqual(consumer.componentProperties[key].value, '!');
    }
  }
  for (const mutate of [
    d =>
      (d.variables.find(
        v => v.name === 'component/absolute-start/y'
      ).values.delta = NaN),
    d =>
      (d.variables.find(v => v.name === 'component/absolute-start/y').type =
        'STRING'),
    d =>
      (d.variables.find(
        v => v.name === 'component/absolute-start/y'
      ).values.delta = { alias: 'component/absolute-start/y' }),
    d =>
      (d.variables = d.variables.filter(
        v => v.name !== 'component/absolute-start/y'
      )),
    d =>
      (d.components.families[0].variants[0].tree.children[0].absolute.vertical =
        'CENTER'),
  ]) {
    const doc = document(),
      env = environment(doc, { sharedOnly: true });
    await env.call('importVariables', doc, ['undrr'], false, [], false);
    mutate(doc);
    const before = snapshot(env),
      report = await env.call('buildMangroveComponents', doc, 'undrr', [
        'absolute-start-test',
      ]);
    assert(report.errors.length);
    assert.strictEqual(snapshot(env), before);
  }
  const doc = document(),
    env = environment(doc, { sharedOnly: true });
  env.state.modeLimit = 5;
  await env.call(
    'importVariables',
    doc,
    doc.modes.map(mode => mode.id),
    false,
    [],
    false
  );
  const variable = env.state.variables.find(
      v => v.name === 'component/absolute-start/y'
    ),
    mode = env.state.collections[0].modes.find(
      mode => mode.name === 'DELTA Resilience'
    );
  variable.valuesByMode[mode.modeId] = {
    type: 'VARIABLE_ALIAS',
    id: variable.id,
  };
  const before = snapshot(env),
    report = await env.call('buildMangroveComponents', doc, 'undrr', [
      'absolute-start-test',
    ]);
  assert(report.errors.length);
  assert.strictEqual(snapshot(env), before);
  const invalid = document();
  invalid.variables.find(
    v => v.name === 'component/absolute-start/y'
  ).values.delta = Infinity;
  await assert.rejects(
    () =>
      buildConnector({
        doc: invalid,
        operation: 'build',
        brandId: 'undrr',
        familyIds: ['absolute-start-test'],
      }),
    /finite/
  );
  const wrongPair = document();
  wrongPair.components.families[0].variants[0].tree.children[0].absolute.vertical =
    'CENTER';
  await assert.rejects(
    () =>
      buildConnector({
        doc: wrongPair,
        operation: 'build',
        brandId: 'undrr',
        familyIds: ['absolute-start-test'],
      }),
    /START\/START/
  );
  console.log(
    'Absolute START/START: five brands, signed offsets, editable TEXT, native MIN/MIN, two zero-create repeats and source/native all-mode missing/type/cycle/nonfinite/unsupported-pair refusal pass. END/CENTER remains covered by SearchControls.'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
