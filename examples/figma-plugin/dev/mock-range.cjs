#!/usr/bin/env node
/** Source-only static Range contracts. This mock cannot establish browser/native visual parity. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment } = require('./mock-kit.cjs');
const {
  buildRangeRecipes,
} = require('../../../scripts/figma-range-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = value => JSON.parse(JSON.stringify(value));
const identity = node =>
  node.getSharedPluginData('orgundrrmangrove', 'mgKitId');
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  doc.components.families = buildRangeRecipes({
    root,
    modes: doc.modes,
    variables: doc.variables,
    styles: doc.styles,
  });
  return doc;
}
async function main() {
  const doc = document();
  const assets = JSON.stringify({
    variables: doc.variables,
    styles: doc.styles,
  });
  assert.deepStrictEqual(
    buildRangeRecipes({
      root,
      modes: doc.modes,
      variables: doc.variables,
      styles: doc.styles,
    }),
    doc.components.families
  );
  assert.strictEqual(
    JSON.stringify({ variables: doc.variables, styles: doc.styles }),
    assets
  );
  assert.strictEqual(doc.components.families[0].variants.length, 4);
  for (const variant of doc.components.families[0].variants) {
    const width = Number(variant.properties.Width);
    const disabled = variant.properties.State === 'Disabled';
    const [track, thumbSlot] = variant.tree.children[0].children;
    const thumb = thumbSlot.children[0];
    assert.strictEqual(
      track.fill,
      disabled ? 'color/neutral-200' : 'color/neutral-300'
    );
    assert.strictEqual(
      thumb.fill,
      disabled ? 'color/neutral-400' : 'color/interactive'
    );
    assert.strictEqual(
      thumb.stroke,
      disabled ? 'color/neutral-200' : 'color/neutral-0'
    );
    assert.deepStrictEqual(thumbSlot.position, { x: (width - 24) / 2, y: 0 });
    assert.strictEqual(track.position.y, 10);
    assert.strictEqual(
      thumb.effectStyle,
      disabled ? null : 'range.thumb-shadow'
    );
    assert.deepStrictEqual(
      variant.tree.children[0].children.map(n => n.id),
      ['track', 'thumb-slot']
    );
    assert.strictEqual(thumb.id, 'thumb');
    for (const mode of doc.modes) {
      for (const [name, value] of [
        ['thumb-size', 24],
        ['thumb-border', 2],
        ['track-size', 4],
        [`width-${width}`, width],
      ])
        assert.strictEqual(
          doc.variables.find(v => v.name === `component/range/${name}`).values[
            mode.id
          ],
          value
        );
      const effect = doc.styles.effect.find(s => s.id === 'range.thumb-shadow')
        .values[mode.id][0].effect;
      assert.deepStrictEqual(effect.offset, { x: 0, y: 1 });
      assert.strictEqual(effect.radius, 3);
      assert.strictEqual(effect.color.a, 0.3);
    }
  }
  console.log(
    'ok  four static source presets, all five mode helpers/paints/shadows and idempotent recipe generation'
  );
  for (const mode of doc.modes) {
    const env = environment(doc, { sharedOnly: true });
    env.state.modeLimit = 5;
    const importedFoundation = await env.call(
      'importVariables',
      doc,
      doc.modes.map(m => m.id),
      false,
      [],
      true
    );
    assert.strictEqual(
      importedFoundation.errors.length,
      0,
      importedFoundation.errors.join('\n')
    );
    const first = await env.call('buildMangroveComponents', doc, mode.id, [
      'range',
    ]);
    assert.strictEqual(first.errors.length, 0, first.errors.join('\n'));
    assert.strictEqual(first.families[0].variantIds.length, 4);
    for (const entry of first.families[0].variantIds) {
      const main = env.state.nodes.get(entry.nodeId);
      const spec = doc.components.families[0].variants.find(
        v => v.id === entry.id
      );
      const width = Number(spec.properties.Width),
        disabled = spec.properties.State === 'Disabled';
      assert.strictEqual(main.width, width);
      assert.strictEqual(
        main.paddingTop,
        doc.variables.find(v => v.name === 'spacing/200').values[mode.id]
      );
      const [track, thumbSlot] = main.children[0].children;
      const thumb = thumbSlot.children[0];
      assert.strictEqual(thumb.type, 'ELLIPSE');
      assert.strictEqual(thumb.width, 24);
      assert.strictEqual(thumb.height, 24);
      assert.strictEqual(thumb.strokeWeight, 2);
      assert.strictEqual(thumbSlot.x, (width - 24) / 2);
      assert.strictEqual(track.height, 4);
      assert.strictEqual(track.y, 10);
      assert.strictEqual(Boolean(thumb.effectStyleId), !disabled);
      const roleName = disabled ? 'color/neutral-400' : 'color/interactive';
      const imported = env.state.variables.find(v => v.name === roleName);
      assert.strictEqual(thumb.fills[0].boundVariables.color.id, imported.id);
      const instance = main.createInstance();
      assert.strictEqual(instance.children[0].children[1].x, thumbSlot.x);
      // Unowned consumer placement is independent of builder-owned masters.
      instance.x = 71;
      instance.y = 89;
    }
    const owned = () =>
      [...env.state.nodes.values()]
        .filter(n => !n.removed && identity(n))
        .map(n => [identity(n), n.id])
        .sort();
    const before = owned();
    const consumers = [...env.state.nodes.values()].filter(
      n => !n.removed && n.type === 'INSTANCE' && n.x === 71 && n.y === 89
    );
    const consumerIds = consumers.map(n => n.id);
    for (let i = 0; i < 2; i++) {
      const repeat = await env.call('buildMangroveComponents', doc, mode.id, [
        'range',
      ]);
      assert.strictEqual(repeat.errors.length, 0, repeat.errors.join('\n'));
      assert.strictEqual(repeat.createdNodeIds.length, 0);
      assert.deepStrictEqual(owned(), before);
      assert.deepStrictEqual(
        consumers.map(n => n.id),
        consumerIds
      );
      for (const consumer of consumers) {
        assert(!consumer.removed);
        assert.strictEqual(consumer.x, 71);
        assert.strictEqual(consumer.y, 89);
      }
    }
  }
  console.log(
    'ok  supported native primitives, mode-bound paint, two zero-create repeats and independent consumer placement in every brand mock'
  );
  const read = fs.readFileSync;
  for (const [suffix, mutate] of [
    [
      'range.scss',
      text => text.replace('block-size: 1.5rem', 'block-size: 1.6rem'),
    ],
    ['Range.jsx', text => text.replace('type="range"', 'type="number"')],
  ]) {
    fs.readFileSync = function (file, ...args) {
      const text = read.call(this, file, ...args);
      return typeof file === 'string' && file.endsWith(suffix)
        ? mutate(text)
        : text;
    };
    try {
      assert.throws(() => document(), /recipe needs updating/);
    } finally {
      fs.readFileSync = read;
    }
  }
  const broken = copy(doc);
  delete broken.variables.find(v => v.name === 'color/interactive').values
    .delta;
  assert.throws(
    () =>
      buildRangeRecipes({
        root,
        modes: broken.modes,
        variables: broken.variables,
        styles: broken.styles,
      }),
    /all-brand COLOR/
  );
  console.log(
    'ok  source anatomy/geometry drift and missing brand values fail closed'
  );
}
if (require.main === module)
  main().catch(error => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
