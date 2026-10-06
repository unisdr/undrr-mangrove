#!/usr/bin/env node
'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert');
const { environment } = require('./mock-kit.cjs');
const {
  installNativeTextPropertyDefaultFixture,
} = require('./mock-search-results.cjs');
const clone = x => JSON.parse(JSON.stringify(x));
const base = () =>
  JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'))
  );
function installTextCaseFixture(env) {
  const create = env.figma.createTextStyle;
  env.figma.createTextStyle = function () {
    const style = create.call(this);
    let value = 'ORIGINAL';
    Object.defineProperty(style, 'textCase', {
      configurable: true,
      enumerable: true,
      get() {
        return value;
      },
      set(next) {
        assert(
          env.state.loadedFonts.has(
            style.fontName.family + ' ' + style.fontName.style
          ),
          'Text case setter requires loaded source font'
        );
        assert(
          [
            'ORIGINAL',
            'UPPER',
            'LOWER',
            'TITLE',
            'SMALL_CAPS',
            'SMALL_CAPS_FORCED',
          ].includes(next)
        );
        value = next;
      },
    });
    return style;
  };
  // The base mock's shared style attachment omits this documented native field.
  // Model attachment only; characters stay raw and no rendered glyph claim is made.
  const probe = env.figma.createText(),
    proto = Object.getPrototypeOf(probe),
    original = proto.setTextStyleIdAsync;
  proto.setTextStyleIdAsync = async function (id) {
    await original.call(this, id);
    const style = env.state.styles.find(s => s.id === id);
    if (style?.textCase !== undefined) this.textCase = style.textCase;
  };
  probe.remove();
}
const snapshot = env =>
  clone({
    styles: env.state.styles,
    variables: env.state.variables,
    collections: env.state.collections,
    nodes: [...env.state.nodes.keys()],
  });
async function main() {
  for (const brand of ['undrr', 'delta', 'irp', 'mcr', 'preventionweb']) {
    const d = base(),
      spec = d.styles.text.find(s => s.id === 'component.body');
    for (const value of Object.values(spec.values)) value.textCase = 'UPPER';
    const env = environment(d, { sharedOnly: true });
    installTextCaseFixture(env);
    const imported = await env.call(
      'importVariables',
      d,
      [brand],
      false,
      [spec.id],
      false
    );
    assert.deepStrictEqual(clone(imported.errors), []);
    const style = env.state.styles.find(s => s.type === 'TEXT'),
      styleId = style.id;
    assert.equal(style.textCase, 'UPPER');
    for (let i = 0; i < 2; i++) {
      const r = await env.call(
        'importVariables',
        d,
        [brand],
        false,
        [spec.id],
        false
      );
      assert.deepStrictEqual(clone(r.errors), []);
      assert.equal(style.id, styleId);
      assert.equal(style.textCase, 'UPPER');
    }
    const text = env.figma.createText();
    await env.figma.loadFontAsync(text.fontName);
    await text.setTextStyleIdAsync(style.id);
    text.characters = 'Target A';
    assert.equal(text.textCase, 'UPPER');
    assert.equal(text.characters, 'Target A');
    for (const value of Object.values(spec.values)) value.textCase = 'ORIGINAL';
    const reset = await env.call(
      'importVariables',
      d,
      [brand],
      false,
      [spec.id],
      false
    );
    assert.deepStrictEqual(clone(reset.errors), []);
    assert.equal(style.textCase, 'ORIGINAL');
    style.textCase = 'LOWER';
    for (const value of Object.values(spec.values)) delete value.textCase;
    const absent = await env.call(
      'importVariables',
      d,
      [brand],
      false,
      [spec.id],
      false
    );
    assert.deepStrictEqual(clone(absent.errors), []);
    assert.equal(style.textCase, 'LOWER');
    for (const invalid of [null, 'LOWER', 'upper', 1, {}, undefined]) {
      const bad = clone(d),
        s = bad.styles.text.find(s => s.id === spec.id);
      for (const value of Object.values(s.values)) value.textCase = 'UPPER';
      s.values[brand === 'delta' ? 'undrr' : 'delta'].textCase = invalid;
      const before = snapshot(env);
      await assert.rejects(
        () =>
          env.call('importVariables', bad, [brand], false, [spec.id], false),
        /text case/
      );
      assert.deepStrictEqual(snapshot(env), before);
      await assert.rejects(
        () => env.call('importStyles', bad, new Map(), brand, [spec.id], false),
        /text case/
      );
      assert.deepStrictEqual(snapshot(env), before);
    }
    for (const change of [
      s => delete s.values.delta,
      s => {
        s.values.foreign = clone(s.values.undrr);
      },
      s => {
        s.values.delta.textCase = 'ORIGINAL';
      },
    ]) {
      const bad = clone(d),
        s = bad.styles.text.find(s => s.id === spec.id);
      for (const value of Object.values(s.values)) value.textCase = 'UPPER';
      change(s);
      const before = snapshot(env);
      await assert.rejects(
        () =>
          env.call('importVariables', bad, [brand], false, [spec.id], false),
        /text case|unknown mode/
      );
      assert.deepStrictEqual(snapshot(env), before);
    }
    for (const native of [undefined, null, 'not-case', Symbol('mixed')]) {
      const opted = clone(d);
      for (const value of Object.values(
        opted.styles.text.find(s => s.id === spec.id).values
      ))
        value.textCase = 'UPPER';
      const descriptor = Object.getOwnPropertyDescriptor(style, 'textCase');
      Object.defineProperty(style, 'textCase', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: native,
      });
      const before = snapshot(env);
      // Changed variable values make a late native check detectable before collection/variable writes.
      opted.variables.find(
        v => v.type === 'FLOAT' && typeof v.values[brand] === 'number'
      ).values[brand] += 1;
      await assert.rejects(
        () =>
          env.call(
            'importVariables',
            opted,
            [brand],
            false,
            [d.styles.text[0].id, spec.id],
            false
          ),
        /native text case/
      );
      assert.deepStrictEqual(snapshot(env), before);
      await assert.rejects(
        () =>
          env.call(
            'importStyles',
            opted,
            new Map(),
            brand,
            [d.styles.text[0].id, spec.id],
            false
          ),
        /native text case/
      );
      assert.deepStrictEqual(snapshot(env), before);
      assert.strictEqual(style.textCase, native);
      Object.defineProperty(style, 'textCase', descriptor);
    }
    for (const value of Object.values(spec.values)) value.textCase = 'UPPER';
    d.components.families = [
      {
        id: 'text-case-probe',
        name: 'Source text case probe',
        kind: 'component-set',
        review: { genericLabels: false, preserveVariantSizing: true },
        variants: [
          {
            id: 'text-case-probe.upper',
            name: 'Case=Upper',
            properties: { Case: 'Upper' },
            tree: {
              id: 'root',
              type: 'FRAME',
              layout: { mode: 'VERTICAL', width: 240, height: 44, gap: 0 },
              children: [
                {
                  id: 'label',
                  type: 'TEXT',
                  characters: 'Target A',
                  textProperty: 'Source label',
                  textStyle: spec.id,
                  fill: 'color/neutral-900',
                  layout: { width: 'FILL', height: 'HUG' },
                },
              ],
            },
          },
        ],
      },
    ];
    installNativeTextPropertyDefaultFixture(env);
    const run = () =>
      env.call('buildMangroveComponents', d, brand, ['text-case-probe']);
    assert.deepStrictEqual(clone((await run()).errors), []);
    const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId'),
      master = [...env.state.nodes.values()].find(
        n =>
          identity(n) === 'family/text-case-probe/variant/text-case-probe.upper'
      );
    assert(master);
    const label = master.findAll(n => n.type === 'TEXT')[0];
    assert.equal(label.characters, 'Target A');
    assert.equal(label.textCase, 'UPPER');
    const ref = label.componentPropertyReferences.characters;
    assert(ref);
    const consumer = master.createInstance();
    env.figma.currentPage.appendChild(consumer);
    consumer.setProperties({ [ref]: 'Priority A' });
    const stable = () =>
      clone(
        [...env.state.nodes.values()].map(n => ({
          id: n.id,
          parent: n.parent?.id,
          width: n.width,
          height: n.height,
          key: identity(n),
          characters: n.type === 'TEXT' ? n.characters : null,
          textCase: n.textCase,
          properties: n.type === 'INSTANCE' ? n.componentProperties : null,
        }))
      );
    const recorded = stable();
    assert(recorded.length > 5);
    for (let i = 0; i < 2; i++) {
      const result = await run();
      assert.deepStrictEqual(clone(result.errors), []);
      assert.equal(result.createdNodeIds.length, 0);
      assert.deepStrictEqual(stable(), recorded);
      assert.equal(label.characters, 'Target A');
      assert.equal(label.textCase, 'UPPER');
      assert.equal(consumer.componentProperties[ref].value, 'Priority A');
    }
    // A present valid getter cannot prove a setter will succeed. Existing importer
    // reports its touched existing style ID; it does not claim rollback.
    const originalCase = Object.getOwnPropertyDescriptor(style, 'textCase');
    Object.defineProperty(style, 'textCase', {
      configurable: true,
      enumerable: true,
      get: () => 'UPPER',
      set: () => {
        throw Error('Injected native text case setter failure');
      },
    });
    const vars = new Map(env.state.variables.map(v => [v.name, v]));
    const setterFailure = await env.call(
      'importStyles',
      d,
      vars,
      brand,
      [spec.id],
      false
    );
    assert(setterFailure.errors.some(e => /setter failure/.test(e)));
    assert(setterFailure.touchedStyleIds.includes(style.id));
    Object.defineProperty(style, 'textCase', originalCase);
    text.remove();
    console.log(
      brand +
        ' opt-in text case raw copy/font-loaded writes/stable IDs/two repeats/reset/absent parity/all-mode and native premutation negatives passed'
    );
  }
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { installTextCaseFixture };
