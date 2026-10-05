#!/usr/bin/env node
/** Experimental Tag source/builder checks. The mock does not render text or CSS. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const { environment, importFoundation } = require('./mock-kit.cjs');
const { buildTagRecipes } = require('../../../scripts/figma-tag-recipes.cjs');
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
  doc.components.families = buildTagRecipes({ root, ...doc });
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
    assert.throws(document, /Tag recipe needs updating/);
    assert(matched, `Missed source mutation ${file}`);
  } finally {
    fs.readFileSync = read;
  }
}
async function main() {
  const doc = document(),
    family = doc.components.families[0];
  const counts = [doc.variables.length, doc.styles.text.length];
  assert.deepStrictEqual(buildTagRecipes({ root, ...doc }), [family]);
  assert.deepStrictEqual(
    [doc.variables.length, doc.styles.text.length],
    counts
  );
  assert.deepStrictEqual(
    family.variants.map(v => v.properties),
    ['Default', 'Secondary', 'Outline', 'Accent', 'Subtle'].map(Tone => ({
      Tone,
    }))
  );
  assert.strictEqual(family.variants.length, 5);
  const vars = new Map(doc.variables.map(v => [v.name, v]));
  const value = (name, mode) => {
    const v = vars.get(name).values[mode];
    return v.alias ? value(v.alias, mode) : v;
  };
  for (const mode of doc.modes) {
    assert.strictEqual(value('tag/min-height', mode.id), 28);
    assert.strictEqual(value('tag/min-width', mode.id), 24);
    assert.strictEqual(value('tag/border-width', mode.id), 1);
    assert.strictEqual(value('tag/accent-edge-width', mode.id), 4);
    assert.strictEqual(
      value('radius/tag', mode.id),
      mode.id === 'mcr' ? 10 : 5
    );
    assert.strictEqual(value('color/tag', mode.id).a, 1);
    assert.deepStrictEqual(vars.get('color/tag').values[mode.id], {
      alias: 'color/interactive',
    });
    assert.deepStrictEqual(vars.get('color/tag-accent').values[mode.id], {
      alias: 'color/orange-900',
    });
    const style = doc.styles.text.find(s => s.id === 'component.tag.label');
    assert.deepStrictEqual(style.bindings, {
      fontFamily: 'font-family/ui',
      fontSize: 'font-size/250',
    });
    assert.strictEqual(style.typography.fontWeightRequested, 500);
    assert.strictEqual(style.typography.fontWeightBundled, 400);
    assert.deepStrictEqual(style.values[mode.id].fontName, {
      family: 'Roboto Condensed',
      style: 'Regular',
    });
    assert.strictEqual(style.values[mode.id].fontSize, 14);
    assert.deepStrictEqual(style.values[mode.id].lineHeight, {
      unit: 'PERCENT',
      value: 150,
    });
  }
  for (const v of family.variants) {
    assert.strictEqual(v.tree.id, 'root');
    assert.strictEqual(v.tree.children[0].id, 'label');
    assert.strictEqual(v.tree.children[0].textProperty, 'Label');
    assert.strictEqual(v.tree.children[0].textDecoration, 'NONE');
    assert.strictEqual(v.tree.focusRing, undefined);
    assert.strictEqual(v.tree.layout.width, 'HUG');
    assert.strictEqual(v.tree.layout.height, 'HUG');
    assert.strictEqual(v.tree.bindings.paddingTop, 'spacing/25');
    assert.strictEqual(v.tree.bindings.paddingLeft, 'spacing/100');
  }
  const outline = family.variants.find(v => v.id === 'tag.outline');
  assert.strictEqual(outline.tree.fill, null);
  assert.strictEqual(outline.tree.stroke, outline.tree.children[0].fill);
  const accent = family.variants.find(v => v.id === 'tag.accent');
  assert.strictEqual(accent.tree.fill, 'color/orange-50');
  assert.strictEqual(accent.tree.stroke, 'color/tag-accent');
  assert.strictEqual(accent.tree.children[0].fill, 'color/text');
  for (const [file, before, after] of [
    ['/stories/Atom/Tag/tag.scss', 'font-weight: 500;', 'font-weight: 600;'],
    [
      '/stories/Atom/Tag/tag.scss',
      'border-inline-start-width: mg-rem(4);',
      'border-inline-start-width: mg-rem(3);',
    ],
    [
      '/stories/Atom/Tag/tag.scss',
      '--mg-color-orange-50',
      '--mg-color-orange-100',
    ],
    [
      '/stories/Atom/Tag/Tag.stories.jsx',
      '<span className="mg-tag">Organization</span>',
      '<button className="mg-tag">Organization</button>',
    ],
    [
      '/stories/assets/fonts/roboto-condensed/roboto-condensed.scss',
      '@import "sass/Bold";',
      '@import "sass/Medium";',
    ],
    [
      '/stories/assets/fonts/roboto-condensed/sass/_Regular.scss',
      'font-weight: 400;',
      'font-weight: 500;',
    ],
    [
      '/stories/assets/scss/_variables.scss',
      '$mg-html-font-size: 16;',
      '$mg-html-font-size: 20;',
    ],
  ])
    changed(file, before, after);
  const bad = document();
  bad.variables.find(v => v.name === 'font-family/ui').values.delta = 'Inter';
  assert.throws(
    () => buildTagRecipes({ root, ...bad }),
    /Latin UI family changed in delta/
  );
  console.log(
    'ok  five bounded static tones, guarded source/font matching, idempotent roles and all-brand aliases'
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
    const build = await env.call('buildMangroveComponents', doc, mode.id, [
      'tag',
    ]);
    assert.deepStrictEqual(copy(build.errors), []);
    assert.strictEqual(build.families[0].variantIds.length, 5);
    const native = new Map(env.state.variables.map(v => [v.name, v]));
    for (const variant of build.families[0].variantIds) {
      const n = env.state.nodes.get(variant.nodeId),
        spec = family.variants.find(v => v.id === variant.id);
      const label = n.findAll(c => c.name === 'Tag label')[0];
      assert.strictEqual(n.minHeight, 28);
      assert.strictEqual(n.minWidth, 24);
      assert.strictEqual(n.cornerRadius, mode.id === 'mcr' ? 10 : 5);
      assert.strictEqual(n.strokeWeight, 1);
      if (spec.properties.Tone === 'Accent')
        assert.strictEqual(n.strokeLeftWeight, 4);
      assert.strictEqual(n.strokesIncludedInLayout, true);
      assert.strictEqual(n.paddingTop, 2.5);
      assert.strictEqual(n.paddingLeft, 10);
      assert.deepStrictEqual(copy(label.fontName), {
        family: 'Roboto Condensed',
        style: 'Regular',
      });
      assert.strictEqual(
        label.fills[0].boundVariables.color.id,
        native.get(spec.tree.children[0].fill).id
      );
      if (spec.tree.fill)
        assert.strictEqual(
          n.fills[0].boundVariables.color.id,
          native.get(spec.tree.fill).id
        );
      else assert.deepStrictEqual(copy(n.fills), []);
      assert.strictEqual(
        n.strokes[0].boundVariables.color.id,
        native.get(spec.tree.stroke).id
      );
      if (['Default', 'Secondary'].includes(spec.properties.Tone))
        assert.strictEqual(n.strokes[0].opacity, 0);
    }
    const consumer = [...env.state.nodes.values()].find(
      n =>
        n.type === 'INSTANCE' &&
        identity(n) === 'review/tag/specimen/source-default/instance'
    );
    assert(consumer);
    consumer.setProperties({
      [property(consumer, 'Label')]: 'Edited taxonomy label',
    });
    const ids = () =>
      [...env.state.nodes.values()]
        .filter(identity)
        .map(n => [identity(n), n.id])
        .sort((a, b) => a[0].localeCompare(b[0]));
    const before = ids();
    const repeat = await env.call('buildMangroveComponents', doc, mode.id, [
      'tag',
    ]);
    assert.deepStrictEqual(copy(repeat.errors), []);
    assert.strictEqual(repeat.createdNodeIds.length, 0);
    assert.deepStrictEqual(ids(), before);
    assert.strictEqual(
      consumer.componentProperties[property(consumer, 'Label')].value,
      'Edited taxonomy label'
    );
  }
  console.log(
    'ok  five-mode current-builder builds/repeats retain stable shared identities, paints, asymmetric accent edge and edited Label'
  );
  const absent = environment(doc, {
    rejectedFonts: ['Roboto Condensed Regular'],
  });
  await importFoundation(absent, doc);
  const refused = await absent.call('buildMangroveComponents', doc, 'undrr', [
    'tag',
  ]);
  assert(refused.errors.length);
  assert(
    ![...absent.state.nodes.values()].some(n =>
      identity(n).startsWith('family/tag')
    )
  );
  console.log(
    'ok  missing exact Condensed Regular refuses the family without partial canonical nodes'
  );
  console.log(
    'Tag mock passed. Source-only; browser/native fonts, geometry, publication and consumer acceptance remain pending.'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
