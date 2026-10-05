#!/usr/bin/env node
/** SkipLink source candidate and actual mock builder lifecycle, without rendering. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildSkipLinkRecipes,
} = require('../../../scripts/figma-skip-link-recipes.cjs');
const copy = v => JSON.parse(JSON.stringify(v));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const property = (n, name) =>
  Object.keys(n.componentProperties).find(
    k => k.replace(/#[^#]+$/, '') === name
  );
function document() {
  const doc = JSON.parse(
    fs.readFileSync(
      path.join(root, 'examples/figma-plugin/mangrove-variables.json'),
      'utf8'
    )
  );
  doc.components.families = buildSkipLinkRecipes({ root, ...doc });
  return doc;
}
function changed(file, before, after) {
  const read = fs.readFileSync;
  let matched = false;
  fs.readFileSync = function (filename, ...args) {
    const result = read.call(this, filename, ...args);
    if (typeof filename !== 'string' || !filename.endsWith(file)) return result;
    const next = result.replace(before, after);
    matched = next !== result;
    return next;
  };
  try {
    assert.throws(document, /SkipLink recipe needs updating/);
    assert(matched);
  } finally {
    fs.readFileSync = read;
  }
}
async function main() {
  const doc = document(),
    family = doc.components.families[0];
  const counts = [
    doc.variables.length,
    doc.styles.text.length,
    doc.styles.effect.length,
  ];
  assert.deepStrictEqual(buildSkipLinkRecipes({ root, ...doc }), [family]);
  assert.deepStrictEqual(
    [doc.variables.length, doc.styles.text.length, doc.styles.effect.length],
    counts
  );
  assert.strictEqual(family.variants.length, 1);
  assert.deepStrictEqual(family.variants[0].properties, { State: 'Focused' });
  const tree = family.variants[0].tree;
  assert.strictEqual(tree.id, 'root');
  assert.strictEqual(tree.children[0].id, 'label');
  assert.strictEqual(tree.children[0].textProperty, 'Label');
  assert.strictEqual(tree.children[0].textDecoration, 'UNDERLINE');
  assert.strictEqual(tree.layout.width, 390);
  assert.strictEqual(tree.effectStyle, 'focus-ring-inset');
  for (const mode of doc.modes) {
    const style = doc.styles.text.find(
      s => s.id === 'component.skip-link.label'
    );
    assert.deepStrictEqual(style.values[mode.id].fontName, {
      family: 'Roboto Condensed',
      style: 'Regular',
    });
    assert.strictEqual(style.values[mode.id].fontSize, 16);
    assert.deepStrictEqual(style.values[mode.id].lineHeight, {
      unit: 'PIXELS',
      value: 24,
    });
    assert.strictEqual(
      doc.variables.find(
        v => v.name === 'component/skip-link/border-bottom-width'
      ).values[mode.id],
      2
    );
  }
  for (const args of [
    [
      '/stories/Utilities/SkipLink/skip-link.scss',
      'border-block-end: 2px solid',
      'border-block-end: 3px solid',
    ],
    [
      '/stories/Utilities/SkipLink/skip-link.scss',
      'clip-path: inset(50%);',
      'clip-path: none;',
    ],
    [
      '/stories/Utilities/SkipLink/SkipLink.jsx',
      "label = 'Skip to main content'",
      "label = 'Skip navigation'",
    ],
    [
      '/stories/Utilities/SkipLink/SkipLink.jsx',
      'target.focus();',
      'target.blur();',
    ],
    [
      '/stories/assets/scss/_foundational.scss',
      'line-height: var(--mg-font-line-height-700);',
      'line-height: 2;',
    ],
    [
      '/stories/assets/fonts/roboto-condensed/sass/_Regular.scss',
      'font-weight: 400;',
      'font-weight: 500;',
    ],
    ['/stories/assets/scss/_mixins.scss', 'outline: 0;', 'outline: 1px;'],
  ])
    changed(...args);
  console.log(
    'ok  visible Focused-only contract, guarded source/inheritance, finite390px candidate and all-five-mode font/style values'
  );
  const env = environment(doc, { sharedOnly: true });
  await importFoundation(env, doc);
  const first = await env.call('buildMangroveComponents', doc, 'undrr', [
    'skip-link',
  ]);
  assert.deepStrictEqual(copy(first.errors), []);
  assert.strictEqual(first.families[0].variantIds.length, 1);
  const n = env.state.nodes.get(first.families[0].variantIds[0].nodeId);
  const label = n.findAll(c => c.name === 'Skip link label')[0];
  assert.strictEqual(n.width, 390);
  assert.strictEqual(n.strokeWeight, 0);
  assert.strictEqual(n.strokeBottomWeight, 2);
  assert.strictEqual(n.paddingTop, 10);
  assert.strictEqual(n.paddingBottom, 10);
  assert.strictEqual(n.paddingLeft, 20);
  assert.strictEqual(n.paddingRight, 20);
  assert.strictEqual(n.strokesIncludedInLayout, true);
  assert.strictEqual(n.effects.length, 2);
  assert(n.effects.every(e => e.type === 'INNER_SHADOW'));
  assert.deepStrictEqual(
    n.effects.map(e => e.spread),
    [4, 2]
  );
  assert.deepStrictEqual(copy(label.fontName), {
    family: 'Roboto Condensed',
    style: 'Regular',
  });
  assert.strictEqual(label.textDecoration, 'UNDERLINE');
  assert.strictEqual(label.layoutSizingHorizontal, 'FILL');
  const vars = new Map(env.state.variables.map(v => [v.name, v]));
  assert.strictEqual(
    n.strokes[0].boundVariables.color.id,
    vars.get('color/interactive').id
  );
  assert.strictEqual(
    n.fills[0].boundVariables.color.id,
    vars.get('color/neutral-0').id
  );
  assert.strictEqual(
    label.fills[0].boundVariables.color.id,
    vars.get('color/text').id
  );
  const consumer = [...env.state.nodes.values()].find(
    n =>
      n.type === 'INSTANCE' &&
      identity(n) === 'review/skip-link/specimen/source-focused/instance'
  );
  assert(consumer);
  consumer.setProperties({
    [property(consumer, 'Label')]: 'Go directly to article content',
  });
  const ids = () =>
    [...env.state.nodes.values()]
      .filter(identity)
      .map(n => [identity(n), n.id])
      .sort((a, b) => a[0].localeCompare(b[0]));
  const before = ids();
  const repeat = await env.call('buildMangroveComponents', doc, 'undrr', [
    'skip-link',
  ]);
  assert.deepStrictEqual(copy(repeat.errors), []);
  assert.strictEqual(repeat.createdNodeIds.length, 0);
  assert.deepStrictEqual(ids(), before);
  assert.strictEqual(
    consumer.componentProperties[property(consumer, 'Label')].value,
    'Go directly to article content'
  );
  const absent = environment(doc, {
    rejectedFonts: ['Roboto Condensed Regular'],
  });
  await importFoundation(absent, doc);
  const refused = await absent.call('buildMangroveComponents', doc, 'undrr', [
    'skip-link',
  ]);
  assert(refused.errors.length);
  assert(
    ![...absent.state.nodes.values()].some(n =>
      identity(n).startsWith('family/skip-link')
    )
  );
  console.log(
    'ok  shared-identity builder binds focused appearance and repeats zero-create with edited Label; missing font refuses partial family'
  );
  console.log(
    'SkipLink source-only mock passed. Native geometry, focus ring/border painting, browser keyboard/navigation and publication are unverified.'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
