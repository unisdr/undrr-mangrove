#!/usr/bin/env node
/** Bounded editorial source/API contracts. Does not establish visual parity. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment } = require('./mock-kit.cjs');
const {
  buildEditorialRecipes,
} = require('../../../scripts/figma-editorial-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = v => JSON.parse(JSON.stringify(v));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  doc.components.families = buildEditorialRecipes({ root, ...doc });
  return doc;
}
async function main() {
  const doc = document(),
    familyIds = doc.components.families.map(f => f.id),
    assets = copy({ variables: doc.variables, styles: doc.styles });
  assert.deepStrictEqual(
    buildEditorialRecipes({ root, ...doc }),
    doc.components.families
  );
  assert.deepStrictEqual(
    copy({ variables: doc.variables, styles: doc.styles }),
    assets
  );
  assert.deepStrictEqual(
    doc.components.families.map(f => f.variants.length),
    [2, 3, 4]
  );
  for (const mode of doc.modes) {
    const env = environment(doc, { sharedOnly: true });
    const imported = await env.call(
      'importVariables',
      doc,
      [mode.id],
      false,
      [],
      true
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const report = await env.call(
      'buildMangroveComponents',
      doc,
      mode.id,
      familyIds
    );
    assert.deepStrictEqual(copy(report.errors), []);
    const consumers = [];
    for (const f of report.families)
      for (const entry of f.variantIds) {
        const main = env.state.nodes.get(entry.nodeId);
        if (f.id === 'embed-container') {
          assert.strictEqual(main.width, 336);
          assert.strictEqual(main.clipsContent, true);
          assert.strictEqual(main.children.length, 0);
          const ratio = entry.id.split('.').pop();
          assert.strictEqual(
            main.height,
            { '16x9': 189, '4x3': 252, '1x1': 336, '21x9': 144 }[ratio]
          );
        }
        if (f.id === 'section-header') {
          assert.strictEqual(main.width, 600);
          assert.strictEqual(main.paddingTop, 10);
          assert.strictEqual(
            main.itemSpacing,
            entry.id.endsWith('.withdescription') ? 10 : 0
          );
          assert.strictEqual(main.children[0].fontName.style, 'Bold');
          if (entry.id.endsWith('.withdescription'))
            assert.strictEqual(main.children[1].lineHeight.value, 115);
          else assert.strictEqual(main.children.length, 1);
        }
        if (f.id === 'image-caption') {
          assert.strictEqual(main.width, 600);
          assert.strictEqual(main.paddingBottom, 15);
          assert.strictEqual(main.strokeBottomWeight, 2);
          if (entry.id.endsWith('.both')) {
            assert.strictEqual(main.children[1].strokeLeftWeight, 1);
            assert.strictEqual(main.children[1].paddingLeft, 15);
            assert.strictEqual(main.children[1].strokesIncludedInLayout, true);
            assert.strictEqual(main.children[1].layoutSizingVertical, 'FILL');
            assert.strictEqual(main.itemSpacing, 15);
          }
        }
        const instance = main.createInstance();
        instance.x = 171;
        instance.y = 283;
        const keys = Object.keys(instance.componentProperties).filter(
          k => instance.componentProperties[k].type === 'TEXT'
        );
        for (const key of keys)
          instance.setProperties({
            [key]: `Edited ${key.replace(/#[^#]+$/, '')}`,
          });
        consumers.push({ instance, keys });
      }
    const owned = () =>
      [...env.state.nodes.values()]
        .filter(n => identity(n))
        .map(n => [identity(n), n.id, n.width, n.height]);
    const before = owned();
    for (let i = 0; i < 2; i++) {
      const repeat = await env.call(
        'buildMangroveComponents',
        doc,
        mode.id,
        familyIds
      );
      assert.deepStrictEqual(copy(repeat.errors), []);
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assert.deepStrictEqual(owned(), before);
      for (const { instance, keys } of consumers) {
        assert(!instance.removed);
        assert.strictEqual(instance.x, 171);
        assert.strictEqual(instance.y, 283);
        for (const key of keys)
          assert.strictEqual(
            instance.componentProperties[key].value,
            `Edited ${key.replace(/#[^#]+$/, '')}`
          );
      }
    }
  }
  console.log(
    'ok  nine bounded editorial variants, all-five-brand construction and two zero-create repeats retaining supported text'
  );
  const read = fs.readFileSync;
  for (const [suffix, from, to] of [
    ['SectionHeader.jsx', 'type="2"', 'type="3"'],
    ['section-header.scss', '--mg-spacing-100', '--mg-spacing-150'],
    ['image-caption.scss', 'border-bottom: 2px', 'border-bottom: 3px'],
    ['ImageCaption.jsx', 'caption = true', 'caption = false'],
    ['embed-container.scss', 'aspect-ratio: 4 / 3', 'aspect-ratio: 5 / 3'],
    ['_foundational.scss', 'line-height: 1.1', 'line-height: 1.2'],
  ]) {
    fs.readFileSync = function (file, ...args) {
      const text = read.call(this, file, ...args);
      return typeof file === 'string' && file.endsWith(suffix)
        ? text.replace(from, to)
        : text;
    };
    try {
      assert.throws(document, /recipe needs updating/);
    } finally {
      fs.readFileSync = read;
    }
  }
  for (const [kind, key] of [
    ['variables', 'component/editorial/header-width'],
    ['styles', 'component.editorial.heading'],
  ]) {
    const broken = document();
    const list = kind === 'variables' ? broken.variables : broken.styles.text;
    const item = list.find(v => v.name === key || v.id === key);
    item.name = 'Foreign owner';
    assert.throws(
      () => buildEditorialRecipes({ root, ...broken }),
      /Foreign identity/
    );
  }
  const absent = environment(doc, {
    sharedOnly: true,
    rejectedFonts: ['Roboto Bold'],
  });
  const imported = await absent.call(
    'importVariables',
    doc,
    ['undrr'],
    false,
    [],
    true
  );
  assert.deepStrictEqual(copy(imported.errors), []);
  const snapshot = () =>
    [...absent.state.nodes.values()].map(n => [n.id, identity(n)]);
  const baseline = snapshot();
  const refusal = await absent.call('buildMangroveComponents', doc, 'undrr', [
    'section-header',
  ]);
  assert(refusal.errors.length);
  assert.deepStrictEqual(snapshot(), baseline);
  assert.strictEqual(refusal.families.length, 0);
  console.log(
    'ok  anatomy/style/cascade source mutations and foreign helper identities fail closed; missing font refuses before canvas mutation; browser/native pending'
  );
}
module.exports = { document };
if (require.main === module)
  main().catch(error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
