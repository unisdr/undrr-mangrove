#!/usr/bin/env node
'use strict';
const assert = require('assert'),
  fs = require('fs'),
  path = require('path');
const { environment } = require('./mock-kit.cjs');
const {
  buildConnector,
} = require('../../../scripts/build-figma-connector.cjs');
const vm = require('vm');
const helper = vm.createContext({});
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '../kit-text-thickness.js'), 'utf8'),
  helper
);
const copy = x => JSON.parse(JSON.stringify(x));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
/** Documented native-field adapter only. Font metrics/rendering are not simulated. */
function installTextThicknessFixture(env) {
  const create = env.figma.createText.bind(env.figma);
  let installed = false;
  env.figma.createText = () => {
    const node = create();
    if (!installed) {
      Object.defineProperty(
        Object.getPrototypeOf(node),
        'textDecorationThickness',
        {
          configurable: true,
          get() {
            this.requireFont();
            if (this.textDecoration !== 'UNDERLINE') return null;
            if (this._thicknessProfile !== undefined)
              return this._thicknessProfile;
            if (this._textRangeSource)
              return this._textRangeSource.textDecorationThickness;
            return { unit: 'AUTO' };
          },
          set(value) {
            this.requireFont();
            this._thicknessProfile = copy(value);
          },
        }
      );
      installed = true;
    }
    return node;
  };
  return env.runCode(
    fs.readFileSync(path.join(__dirname, '../kit-text-thickness.js'), 'utf8') +
      '\nglobalThis.mgTextThicknessPlan=mgTextThicknessPlan;globalThis.mgNativeTextThicknessPlan=mgNativeTextThicknessPlan;globalThis.mgApplyTextThickness=mgApplyTextThickness;'
  );
}
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
  doc.components.families = [
    {
      id: 'text-thickness-test',
      name: 'Text thickness test',
      kind: 'component-set',
      review: { genericLabels: false, preserveVariantSizing: true },
      variants: [
        {
          id: 'text-thickness-test.default',
          name: 'State=Default',
          properties: { State: 'Default' },
          tree: {
            id: 'root',
            type: 'FRAME',
            layout: { mode: 'VERTICAL', width: 400, height: 100 },
            children: [
              {
                id: 'title',
                type: 'TEXT',
                characters: 'Editable underlined title',
                textProperty: 'Title',
                textStyle: 'component.body',
                fill: 'color/text',
                textDecoration: 'UNDERLINE',
                textDecorationOffset: { unit: 'PIXELS', value: 6.4 },
                textDecorationThickness: { unit: 'PIXELS', value: 2.5 },
                layout: { width: 350, height: 40 },
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
    nodes: [...env.state.nodes.values()].map(n => [
      n.id,
      identity(n),
      n.x,
      n.y,
      n.width,
      n.height,
      n.type === 'TEXT' ? n.characters : null,
    ]),
    styles: env.state.styles,
    variables: env.state.variables,
    collections: env.state.collections,
  });
const build = (env, doc, mode = 'undrr') =>
  env.call('buildMangroveComponents', doc, mode, ['text-thickness-test']);
async function main() {
  for (const mode of document().modes) {
    const doc = document(),
      env = environment(doc, { sharedOnly: true });
    await installTextThicknessFixture(env);
    await env.call('importVariables', doc, [mode.id], false, [], false);
    const first = await build(env, doc, mode.id);
    assert.deepStrictEqual(copy(first.errors), []);
    const text = [...env.state.nodes.values()].find(
      n =>
        identity(n) ===
        'family/text-thickness-test/variant/text-thickness-test.default/title'
    );
    assert(text);
    assert.deepStrictEqual(copy(text.textDecorationThickness), {
      unit: 'PIXELS',
      value: 2.5,
    });
    const consumer = text.parent.createInstance();
    env.figma.currentPage.appendChild(consumer);
    const property = Object.keys(consumer.componentProperties).find(k =>
      k.startsWith('Title#')
    );
    consumer.setProperties({ [property]: 'Short edited title' });
    consumer.x = 823;
    consumer.y = 617;
    const before = snapshot(env),
      link = consumer.main.id;
    for (let i = 0; i < 2; i++) {
      const repeat = await build(env, doc, mode.id);
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assert.strictEqual(snapshot(env), before);
      assert.strictEqual(
        consumer.componentProperties[property].value,
        'Short edited title'
      );
      assert.strictEqual(consumer.main.id, link);
      assert.deepStrictEqual(copy(text.textDecorationThickness), {
        unit: 'PIXELS',
        value: 2.5,
      });
    }
    for (const bad of [
      Symbol('mixed'),
      { unit: 'PIXELS', value: -1 },
      { unit: 'PIXELS', value: Infinity },
      { unit: 'AUTO', value: 2 },
      '2.5',
    ]) {
      text._thicknessProfile = bad;
      const before = snapshot(env);
      const r = await build(env, doc, mode.id);
      assert(r.errors.length);
      assert.strictEqual(snapshot(env), before);
    }
    text._thicknessProfile = { unit: 'PIXELS', value: 2.5 };
    Object.defineProperty(text, 'textDecorationThickness', {
      configurable: true,
      get() {
        return undefined;
      },
    });
    const unavailableBefore = snapshot(env),
      unavailable = await build(env, doc, mode.id);
    assert(unavailable.errors.length);
    assert.strictEqual(snapshot(env), unavailableBefore);
    delete text.textDecorationThickness;
    env.state.rejectedFonts.add(
      text.fontName.family + ' ' + text.fontName.style
    );
    const fontBefore = snapshot(env),
      fontFailure = await build(env, doc, mode.id);
    assert(fontFailure.errors.length);
    assert.strictEqual(snapshot(env), fontBefore);
    env.state.rejectedFonts.clear();
  }
  const mutations = [
    t => (t.textDecorationThickness = { unit: 'AUTO' }),
    t => (t.textDecorationThickness = { unit: 'PERCENT', value: 2.5 }),
    t => (t.textDecorationThickness.value = 0),
    t => (t.textDecorationThickness.value = -1),
    t => (t.textDecorationThickness.value = NaN),
    t => (t.textDecorationThickness.value = Infinity),
    t => (t.textDecorationThickness.value = '2.5'),
    t => (t.textDecorationThickness.extra = true),
    t => (t.type = 'FRAME'),
    t => delete t.textDecoration,
    t => (t.textRuns = []),
    t => (t.bindings = { textDecorationThickness: 'spacing/300' }),
  ];
  for (const mutate of mutations) {
    const doc = document(),
      env = environment(doc, { sharedOnly: true });
    await installTextThicknessFixture(env);
    await env.call('importVariables', doc, ['undrr'], false, [], false);
    mutate(doc.components.families[0].variants[0].tree.children[0]);
    const before = snapshot(env),
      r = await build(env, doc);
    assert(r.errors.length);
    assert.strictEqual(snapshot(env), before);
    await assert.rejects(() =>
      buildConnector({
        doc,
        operation: 'build',
        brandId: 'undrr',
        familyIds: ['text-thickness-test'],
      })
    );
  }
  const native = {
    type: 'TEXT',
    textDecoration: 'UNDERLINE',
    textDecorationThickness: { unit: 'AUTO' },
  };
  helper.mgApplyTextThickness(
    helper.mgNativeTextThicknessPlan(native, { unit: 'PIXELS', value: 2.5 })
  );
  assert.strictEqual(native.textDecorationThickness.value, 2.5);
  assert.throws(
    () =>
      helper.mgNativeTextThicknessPlan(
        { type: 'TEXT' },
        { unit: 'PIXELS', value: 2.5 }
      ),
    /unavailable/
  );
  const doc = document(),
    env = environment(doc, { sharedOnly: true });
  await installTextThicknessFixture(env);
  await env.call('importVariables', doc, ['undrr'], false, [], false);
  const compiled = await buildConnector({
    doc,
    operation: 'build',
    brandId: 'undrr',
    familyIds: ['text-thickness-test'],
  });
  const result = await env.runCode(compiled.code);
  assert.deepStrictEqual(copy(result.errors), []);
  assert(
    [...env.state.nodes.values()].some(
      n => n.type === 'TEXT' && n.textDecorationThickness?.value === 2.5
    )
  );
  console.log(
    'Plain TEXT underline thickness: all five brands, two zero-create repeats, editable consumer/link retention, source/native premutation negatives and actual compiled builder pass. Native rendering remains open.'
  );
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { installTextThicknessFixture };
