#!/usr/bin/env node
/** Experimental HighlightBox offline lifecycle. No source/native pixel claims. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { environment, importFoundation } = require('./mock-kit.cjs');
const {
  buildHighlightBoxRecipes,
} = require('../../../scripts/figma-highlight-box-recipes.cjs');
const root = path.resolve(__dirname, '../../..');
const copy = v => JSON.parse(JSON.stringify(v));
const identity = n => n.getSharedPluginData('orgundrrmangrove', 'mgKitId');
const identities = env =>
  [...env.state.nodes.values()]
    .filter(identity)
    .map(n => [identity(n), n.id])
    .sort();
function document() {
  const doc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../mangrove-variables.json'), 'utf8')
  );
  doc.components.families = buildHighlightBoxRecipes({ root, ...doc });
  return doc;
}
function changed(file, transform) {
  const read = fs.readFileSync;
  fs.readFileSync = function (filename, ...args) {
    const result = read.call(this, filename, ...args);
    return typeof filename === 'string' && filename.endsWith(file)
      ? transform(result)
      : result;
  };
  try {
    assert.throws(document, /needs updating/);
  } finally {
    fs.readFileSync = read;
  }
}
async function main() {
  const doc = document(),
    family = doc.components.families[0];
  assert.deepStrictEqual(
    family.variants.map(v => v.properties.Tone),
    ['Default', 'Primary', 'Secondary']
  );
  const before = copy({ variables: doc.variables, styles: doc.styles });
  assert.deepStrictEqual(buildHighlightBoxRecipes({ root, ...doc }), [family]);
  assert.deepStrictEqual(
    copy({ variables: doc.variables, styles: doc.styles }),
    before
  );
  for (const [file, transform] of [
    [
      '/stories/assets/fonts/roboto/roboto.scss',
      s => s.replace('@import "sass/Regular";', ''),
    ],
    [
      '/stories/assets/fonts/roboto/sass/_Bold.scss',
      s => s.replace('font-weight: 700;', 'font-weight: 600;'),
    ],
    [
      '/stories/assets/fonts/roboto/sass/_Medium.scss',
      s => s.replace('font-weight: 500;', 'font-weight: 600;'),
    ],
    [
      '/stories/Components/HighlightBox/highlight-box.scss',
      s =>
        s.replace('padding-bottom: mg-rem(20);', 'padding-bottom: mg-rem(21);'),
    ],
    [
      '/stories/Components/HighlightBox/highlight-box.scss',
      s => s.replace('inset 0 -8px', 'inset 0 -9px'),
    ],
    [
      '/stories/Components/HighlightBox/highlight-box.scss',
      s => `${s}\n.mg-highlight-box { color: red; }`,
    ],
    [
      '/stories/Components/HighlightBox/HighlightBox.jsx',
      s =>
        s.replace('<div className={classes}>', '<section className={classes}>'),
    ],
    [
      '/stories/assets/scss/_foundational.scss',
      s => s.replace('line-height: 1.15;', 'line-height: 1.2;'),
    ],
    [
      '/stories/assets/scss/_variables.scss',
      s =>
        s.replace(
          '--sendai-purple: var(--sendai-purple-900);',
          '--sendai-purple: var(--sendai-purple-800);'
        ),
    ],
  ])
    changed(file, transform);
  for (const mutate of [
    packet => {
      packet.variables.find(
        v => v.name === 'component/highlight-box/padding-top'
      ).id = 'foreign.variable';
    },
    packet => {
      packet.styles.text.find(
        s => s.id === 'component.highlight-box.title'
      ).name = 'Foreign text style';
    },
    packet => {
      packet.styles.effect.find(
        s => s.id === 'component.highlight-box.default-shadow'
      ).name = 'Foreign effect style';
    },
    packet => {
      packet.variables.push(
        copy(
          packet.variables.find(
            v => v.name === 'component/highlight-box/padding-top'
          )
        )
      );
    },
  ]) {
    const foreign = document();
    mutate(foreign);
    assert.throws(
      () => buildHighlightBoxRecipes({ root, ...foreign }),
      /Foreign or duplicate identity/
    );
  }
  const value = (name, mode) => {
    const entry = doc.variables.find(v => v.name === name).values[mode.id];
    return entry.alias ? value(entry.alias, mode) : entry;
  };
  for (const mode of doc.modes) {
    assert.deepStrictEqual(
      value('component/highlight-box/secondary-background', mode),
      { r: 150 / 255, g: 41 / 255, b: 135 / 255, a: 1 }
    );
    assert.strictEqual(
      value('component/highlight-box/paragraph-end-margin', mode),
      value('font-size/300', mode)
    );
    assert.strictEqual(value('component/highlight-box/inset-y', mode), -8);
    const title = doc.styles.text.find(
      s => s.id === 'component.highlight-box.title'
    );
    assert.strictEqual(
      title.values[mode.id].fontName.family,
      value('font-family/text', mode)
    );
    assert.strictEqual(
      title.values[mode.id].fontSize,
      value('font-size/400', mode)
    );
    assert.strictEqual(title.values[mode.id].lineHeight.value, 115);
    const env = environment(doc);
    const imported = await env.call(
      'importVariables',
      doc,
      [mode.id],
      false,
      [],
      true
    );
    assert.deepStrictEqual(copy(imported.errors), []);
    const built = await env.call('buildMangroveComponents', doc, mode.id, [
      'highlight-box',
    ]);
    assert.deepStrictEqual(copy(built.errors), []);
    const result = built.families.find(f => f.id === 'highlight-box');
    assert.strictEqual(result.variantIds.length, 3);
    const variableIds = new Map(env.state.variables.map(v => [v.name, v.id]));
    const find = (n, name) => n.findAll(child => child.name === name)[0];
    for (const variant of result.variantIds) {
      const master = env.state.nodes.get(variant.nodeId);
      const source = family.variants.find(v => v.id === variant.id);
      assert.strictEqual(master.width, 480);
      assert.strictEqual(master.paddingTop, 10);
      assert.strictEqual(master.paddingBottom, 20);
      assert.strictEqual(master.paddingLeft, 15);
      assert.strictEqual(master.paddingRight, 15);
      assert.strictEqual(
        master.boundVariables.paddingBottom.id,
        variableIds.get('component/highlight-box/padding-bottom')
      );
      if (source.properties.Tone === 'Default') {
        assert.deepStrictEqual(copy(master.fills), []);
        assert.strictEqual(master.strokeWeight, 1);
        assert.strictEqual(
          master.strokes[0].boundVariables.color.id,
          variableIds.get('component/highlight-box/default-border-shadow')
        );
      } else {
        assert.deepStrictEqual(copy(master.strokes), []);
        assert.strictEqual(
          master.fills[0].boundVariables.color.id,
          variableIds.get(source.tree.fill)
        );
      }
      const effect = master.effects[0];
      assert.strictEqual(effect.type, 'INNER_SHADOW');
      assert.strictEqual(effect.offset.y, -8);
      assert.strictEqual(effect.radius, 0);
      assert.strictEqual(effect.spread, 0);
      assert.strictEqual(
        effect.boundVariables.color.id,
        variableIds.get(
          source.properties.Tone === 'Default'
            ? 'component/highlight-box/default-border-shadow'
            : 'component/highlight-box/coloured-shadow'
        )
      );
      const heading = find(master, 'Plain source h3'),
        body = find(master, 'Plain source paragraph');
      assert.strictEqual(
        heading.fontName.family,
        value('font-family/text', mode)
      );
      assert.strictEqual(heading.textWrapStyle, 'BALANCE');
      assert.strictEqual(body.fontSize, value('font-size/300', mode));
      assert.strictEqual(
        body.fills[0].boundVariables.color.id,
        variableIds.get(
          source.properties.Tone === 'Default' ? 'color/text' : 'color/white'
        )
      );
    }
    const instance = [...env.state.nodes.values()].find(
      n =>
        n.type === 'INSTANCE' &&
        identity(n)?.startsWith('review/highlight-box/')
    );
    assert(instance);
    const property = name =>
      Object.keys(instance.componentProperties).find(
        k => k.replace(/#[^#]+$/, '') === name
      );
    assert(property('Title') && property('Body'));
    instance.setProperties({
      [property('Title')]: 'Edited heading',
      [property('Body')]: 'Edited plain paragraph',
    });
    instance.resize(500, instance.height);
    const ids = identities(env);
    const repeat = await env.call('buildMangroveComponents', doc, mode.id, [
      'highlight-box',
    ]);
    assert.deepStrictEqual(copy(repeat.errors), []);
    assert.strictEqual(repeat.createdNodeIds.length, 0);
    assert.deepStrictEqual(identities(env), ids);
    assert.strictEqual(instance.width, 500);
    assert.strictEqual(
      instance.componentProperties[property('Title')].value,
      'Edited heading'
    );
    assert.strictEqual(
      instance.componentProperties[property('Body')].value,
      'Edited plain paragraph'
    );
  }
  const font = doc.styles.text.find(
    s => s.id === 'component.highlight-box.title'
  ).values.undrr.fontName;
  const rejectedName = `${font.family} ${font.style}`,
    env = environment(doc, { rejectedFonts: [rejectedName] });
  await importFoundation(env, doc);
  const ids = identities(env);
  const failed = await env.call('buildMangroveComponents', doc, 'undrr', [
    'highlight-box',
  ]);
  assert.strictEqual(failed.families.length, 0);
  assert(failed.errors.some(error => error.includes(rejectedName)));
  assert.deepStrictEqual(identities(env), ids);
  console.log(
    'ok  HighlightBox source drift guards, three fallback tones, inherited text typography/inset bindings, all-five-mode actual builder repeat and plain content retention; font failure blocks mutation'
  );
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
