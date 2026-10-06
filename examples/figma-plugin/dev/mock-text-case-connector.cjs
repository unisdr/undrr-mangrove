#!/usr/bin/env node
/** Selected connector opt-in and all-source case validation. No native glyph simulation. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const { environment } = require('./mock-kit.cjs');
const { installTextCaseFixture } = require('./mock-text-case.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const {
  buildConnector,
} = require('../../../scripts/build-figma-connector.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
function fixture() {
  const d = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  for (const v of Object.values(
    d.styles.text.find(s => s.id === 'component.body').values
  ))
    v.textCase = 'UPPER';
  d.components = {
    version: 1,
    families: [
      {
        id: 'text-case-fixture',
        name: 'Authored upper-case style fixture',
        kind: 'component-set',
        review: { genericLabels: false },
        variants: [
          {
            id: 'text-case-fixture.default',
            name: 'State=Default',
            properties: { State: 'Default' },
            tree: {
              type: 'FRAME',
              id: 'root',
              name: 'Ordinary source label owner',
              layout: { mode: 'VERTICAL', width: 200, height: 'HUG' },
              children: [
                {
                  type: 'TEXT',
                  id: 'label',
                  name: 'Raw editable source label',
                  characters: 'Target A',
                  textProperty: 'Label',
                  textStyle: 'component.body',
                  fill: 'color/neutral-900',
                  layout: { width: 'HUG', height: 'HUG' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  return d;
}
const snapshot = env =>
  JSON.stringify({
    styles: env.state.styles,
    variables: env.state.variables,
    collections: env.state.collections,
    nodes: [...env.state.nodes.values()].map(n => ({
      id: n.id,
      parent: n.parent?.id,
      type: n.type,
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
      characters: n.type === 'TEXT' ? n.characters : undefined,
      textCase: n.type === 'TEXT' ? n.textCase : undefined,
      textStyleId: n.type === 'TEXT' ? n.textStyleId : undefined,
      properties: n.type === 'INSTANCE' ? n.componentProperties : undefined,
    })),
  });
async function main() {
  for (const mode of fixture().modes) {
    const doc = fixture(),
      env = environment(doc, { sharedOnly: true });
    installTextCaseFixture(env);
    installNativeTextPropertyDefaultFixture(env);
    const imported = await env.call(
      'importVariables',
      doc,
      [mode.id],
      false,
      [],
      false
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const p = await buildConnector({
      operation: 'import',
      brandId: mode.id,
      doc,
      styleIds: ['component.body'],
      variableIds: [],
    });
    assert(p.textCaseEnabled && p.bytes <= 50000);
    const i = await env.runCode(p.code);
    assert.deepStrictEqual(copy(i.result.errors), []);
    const b = await buildConnector({
      operation: 'build',
      brandId: mode.id,
      doc,
      familyIds: ['text-case-fixture'],
    });
    assert(b.textCaseEnabled && b.bytes <= 50000);
    const first = await env.runCode(b.code);
    assert.deepStrictEqual(copy(first.errors), []);
    const text = [...env.state.nodes.values()].find(
      n =>
        n.type === 'TEXT' &&
        n.getSharedPluginData('orgundrrmangrove', 'mgKitId') ===
          'family/text-case-fixture/variant/text-case-fixture.default/label' &&
        !n.id.startsWith('I')
    );
    assert(text);
    assert.strictEqual(text.characters, 'Target A');
    assert.strictEqual(text.textCase, 'UPPER');
    const consumer = text.parent.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const reference = text.componentPropertyReferences.characters;
    const linked = consumer
      .findAllWithCriteria({ types: ['TEXT'] })
      .find(n => n.componentPropertyReferences.characters === reference);
    const descriptor = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(linked),
      'characters'
    );
    Object.defineProperty(linked, 'characters', {
      configurable: true,
      get() {
        return consumer.componentProperties[reference].value;
      },
      set(v) {
        descriptor.set.call(this, v);
      },
    });
    consumer.setProperties({ [reference]: 'Edited raw consumer label' });
    assert.strictEqual(linked.characters, 'Edited raw consumer label');
    const before = snapshot(env);
    for (let n = 0; n < 2; n++) {
      const r = await env.runCode(b.code);
      assert.deepStrictEqual(copy(r.errors), []);
      assert.strictEqual(r.createdNodeIds.length, 0);
      assert.strictEqual(snapshot(env), before);
    }
    const reset = copy(doc);
    for (const v of Object.values(
      reset.styles.text.find(s => s.id === 'component.body').values
    ))
      v.textCase = 'ORIGINAL';
    const resetCode = await buildConnector({
      operation: 'import',
      brandId: mode.id,
      doc: reset,
      styleIds: ['component.body'],
      variableIds: [],
    });
    const resetResult = await env.runCode(resetCode.code);
    assert.deepStrictEqual(copy(resetResult.result.errors), []);
    assert.strictEqual(
      env.state.styles.find(
        s =>
          s.getSharedPluginData('orgundrrmangrove', 'mgStyleId') ===
          'component.body'
      ).textCase,
      'ORIGINAL'
    );
    const absent = copy(doc);
    for (const s of absent.styles.text)
      for (const v of Object.values(s.values)) delete v.textCase;
    const a = await buildConnector({
      operation: 'build',
      brandId: mode.id,
      doc: absent,
      familyIds: ['text-case-fixture'],
    });
    assert.strictEqual(a.textCaseEnabled, false);
  }
  for (const operation of ['build', 'import']) {
    const d = fixture();
    d.styles.text.find(s => s.id === 'component.body').values.mcr.textCase =
      'LOWER';
    await assert.rejects(
      () =>
        buildConnector({
          operation,
          brandId: 'undrr',
          doc: d,
          familyIds: ['text-case-fixture'],
          ...(operation === 'import'
            ? { styleIds: ['component.body'], variableIds: [] }
            : {}),
        }),
      /identical ORIGINAL or UPPER/
    );
    const unused = fixture();
    const s = copy(unused.styles.text.find(s => s.id === 'component.body'));
    s.id = 'case.unselected';
    s.name = 'Unselected malformed case';
    s.values.delta.textCase = 'LOWER';
    unused.styles.text.push(s);
    await assert.rejects(
      () =>
        buildConnector({
          operation,
          brandId: 'undrr',
          doc: unused,
          familyIds: ['text-case-fixture'],
          ...(operation === 'import'
            ? { styleIds: ['component.body'], variableIds: [] }
            : {}),
        }),
      /identical ORIGINAL or UPPER/
    );
  }
  console.log(
    'Text case connector: allfive compiled imports/builds, raw owning/consumer copy retained over two zero-create repeats, explicit reset, absent flag and full-source nonselected-mode/style negatives pass. Glyph parity remains open.'
  );
}
module.exports = { fixture };
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
